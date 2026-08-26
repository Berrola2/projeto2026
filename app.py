import os
import io
import csv
import uuid
from datetime import datetime, date, time
from calendar import monthrange
from flask import (
    Flask, render_template, request, redirect, url_for,
    flash, session, jsonify, abort, send_file, send_from_directory, g
)
from werkzeug.utils import secure_filename
from sqlalchemy import func, extract

from config import Config
from models import db, User, Arena, Student, ClassSession, Attendance, ClassPhoto
from auth import (
    validate_email_domain, hash_password, verify_password,
    login_user, logout_user, get_current_user,
    login_required, role_required
)
from seed_data import seed_database

def create_app(config_class=Config, testing=False):
    static_folder_path = os.path.join(Config.BASE_DIR, 'static')
    app = Flask(__name__, static_folder=static_folder_path, static_url_path='/static')
    app.config.from_object(config_class)
    if testing:
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'

    # Inicializa banco de dados
    db.init_app(app)

    # Garante diretórios
    try:
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    except Exception:
        pass

    # Cria tabelas e popula o banco de dados automaticamente se estiver vazio
    with app.app_context():
        db.create_all()
        if not app.config.get('TESTING'):
            try:
                seed_database(app)
            except Exception as e:
                print(f"Aviso ao popular banco: {e}")



    # ----------------------------------------------------
    # FILTROS E PROCESSADORES DE CONTEXTO JINJA2 (PT-BR)
    # ----------------------------------------------------
    @app.context_processor
    def inject_globals():
        return {
            'current_user': get_current_user(),
            'now': datetime.now(),
            'today': date.today()
        }

    @app.template_filter('data_br')
    def filter_data_br(value):
        if not value:
            return '-'
        if isinstance(value, str):
            try:
                value = datetime.strptime(value, '%Y-%m-%d').date()
            except Exception:
                return value
        return value.strftime('%d/%m/%Y')

    @app.template_filter('hora_br')
    def filter_hora_br(value):
        if not value:
            return '-'
        if isinstance(value, str):
            return value[:5]
        return value.strftime('%H:%M')

    @app.template_filter('data_hora_br')
    def filter_data_hora_br(value):
        if not value:
            return '-'
        return value.strftime('%d/%m/%Y às %H:%M')

    @app.template_filter('mes_nome_br')
    def filter_mes_nome_br(month_num):
        meses = [
            '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ]
        try:
            return meses[int(month_num)]
        except Exception:
            return str(month_num)

    # ----------------------------------------------------
    # SERVIÇO DE FOTOS E UPLOADS (SUPORTE VERCEL / LOCAL)
    # ----------------------------------------------------
    @app.route('/static/uploads/photos/<filename>')
    @app.route('/uploads/photos/<filename>')
    def serve_class_photo(filename):
        # Tenta no diretório de upload configurado (ex: /tmp na Vercel)
        upload_folder = app.config.get('UPLOAD_FOLDER')
        if upload_folder and os.path.exists(os.path.join(upload_folder, filename)):
            return send_from_directory(upload_folder, filename)
        
        # Fallback para o diretório static do projeto
        static_folder = os.path.join(Config.BASE_DIR, 'static', 'uploads', 'photos')
        if os.path.exists(os.path.join(static_folder, filename)):
            return send_from_directory(static_folder, filename)
            
        return abort(404)

    # ----------------------------------------------------
    # ROTAS GERAIS E AUTENTICAÇÃO
    # ----------------------------------------------------
    @app.route('/')
    def index():
        user = get_current_user()
        if not user:
            return redirect(url_for('login'))
        if user.is_admin:
            return redirect(url_for('admin_dashboard'))
        return redirect(url_for('professor_dashboard'))

    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if get_current_user():
            return redirect(url_for('index'))

        if request.method == 'POST':
            email = request.form.get('email', '').strip().lower()
            password = request.form.get('password', '')

            # Validação do domínio do e-mail
            is_valid_domain, _, domain_error = validate_email_domain(email)
            if not is_valid_domain:
                flash(domain_error or "Este e-mail não possui permissão para acessar o sistema.", "danger")
                return render_template('auth/login.html', email=email)

            user = User.query.filter_by(email=email).first()
            if not user or not verify_password(user.password_hash, password):
                flash("E-mail ou senha incorretos. Verifique suas credenciais.", "danger")
                return render_template('auth/login.html', email=email)

            login_user(user)
            flash(f"Bem-vindo(a), {user.name}!", "success")
            
            next_url = request.args.get('next')
            if next_url and next_url.startswith('/'):
                return redirect(next_url)

            if user.is_admin:
                return redirect(url_for('admin_dashboard'))
            return redirect(url_for('professor_dashboard'))

        return render_template('auth/login.html')

    @app.route('/cadastro', methods=['GET', 'POST'])
    def register():
        if get_current_user():
            return redirect(url_for('index'))

        if request.method == 'POST':
            name = request.form.get('name', '').strip()
            email = request.form.get('email', '').strip().lower()
            phone = request.form.get('phone', '').strip()
            password = request.form.get('password', '')
            password_confirm = request.form.get('password_confirm', '')

            if not name or not email or not password:
                flash("Por favor, preencha todos os campos obrigatórios.", "warning")
                return render_template('auth/register.html', name=name, email=email, phone=phone)

            if password != password_confirm:
                flash("As senhas informadas não coincidem.", "danger")
                return render_template('auth/register.html', name=name, email=email, phone=phone)

            if len(password) < 6:
                flash("A senha deve conter no mínimo 6 caracteres.", "warning")
                return render_template('auth/register.html', name=name, email=email, phone=phone)

            # Validação estrita de domínio
            is_valid_domain, role, domain_error = validate_email_domain(email)
            if not is_valid_domain:
                flash(domain_error or "Este e-mail não possui permissão para acessar o sistema.", "danger")
                return render_template('auth/register.html', name=name, email=email, phone=phone)

            existing = User.query.filter_by(email=email).first()
            if existing:
                flash("Este e-mail já está cadastrado no sistema. Faça login.", "info")
                return redirect(url_for('login'))

            new_user = User(
                name=name,
                email=email,
                password_hash=hash_password(password),
                role=role,
                phone=phone
            )
            db.session.add(new_user)
            db.session.commit()

            login_user(new_user)
            flash(f"Conta criada com sucesso! Papel atribuído: {'Professor' if role == 'PROFESSOR' else 'Administrador'}.", "success")
            
            if new_user.is_admin:
                return redirect(url_for('admin_dashboard'))
            return redirect(url_for('professor_dashboard'))

        return render_template('auth/register.html')

    @app.route('/logout')
    def logout():
        logout_user()
        flash("Sessão encerrada com sucesso.", "info")
        return redirect(url_for('login'))

    # ----------------------------------------------------
    # API ENDPOINTS (MOBILE UX ÁGIL)
    # ----------------------------------------------------
    @app.route('/api/arena/<int:arena_id>/alunos')
    @login_required
    def api_arena_students(arena_id):
        group = request.args.get('turma')
        query = Student.query.filter_by(arena_id=arena_id)
        if group and group != 'TODAS':
            query = query.filter_by(group_name=group)
        students = query.order_by(Student.name.asc()).all()
        return jsonify([
            {
                'id': s.id,
                'name': s.name,
                'phone': s.phone or '',
                'group_name': s.group_name or 'Geral'
            } for s in students
        ])

    # ----------------------------------------------------
    # FLUXO DO PROFESSOR (MEU PAINEL)
    # ----------------------------------------------------
    @app.route('/professor')
    @login_required
    @role_required('PROFESSOR')
    def professor_dashboard():
        user = get_current_user()
        today = date.today()

        # Isolamento de dados: apenas aulas deste professor
        today_classes = ClassSession.query.filter_by(
            professor_id=user.id,
            date=today
        ).order_by(ClassSession.time.asc()).all()

        recent_classes = ClassSession.query.filter_by(
            professor_id=user.id
        ).order_by(ClassSession.date.desc(), ClassSession.time.desc()).limit(10).all()

        # Métricas do dia
        classes_today_count = len(today_classes)
        students_today_count = sum(c.present_count for c in today_classes)
        pending_photos_count = ClassSession.query.filter_by(
            professor_id=user.id,
            photo_status='PENDING'
        ).count()

        # Taxa de presença média do dia
        total_slots_today = sum(c.total_students for c in today_classes)
        rate_today = round((students_today_count / total_slots_today * 100)) if total_slots_today > 0 else 100

        # Arenas disponíveis para atalho
        arenas = Arena.query.order_by(Arena.name.asc()).all()

        return render_template(
            'professor/dashboard.html',
            today_classes=today_classes,
            recent_classes=recent_classes,
            classes_today_count=classes_today_count,
            students_today_count=students_today_count,
            pending_photos_count=pending_photos_count,
            rate_today=rate_today,
            arenas=arenas
        )

    @app.route('/professor/aula/nova', methods=['GET', 'POST'])
    @login_required
    @role_required('PROFESSOR')
    def professor_quick_class():
        user = get_current_user()
        arenas = Arena.query.order_by(Arena.name.asc()).all()

        if not arenas:
            flash("Nenhuma arena cadastrada no sistema. Contate a administração.", "warning")
            return redirect(url_for('professor_dashboard'))

        if request.method == 'POST':
            arena_id = request.form.get('arena_id', type=int)
            class_date_str = request.form.get('date')
            class_time_str = request.form.get('time')
            group_name = request.form.get('group_name', '').strip()
            observations = request.form.get('observations', '').strip()

            try:
                class_date = datetime.strptime(class_date_str, '%Y-%m-%d').date() if class_date_str else date.today()
            except ValueError:
                class_date = date.today()

            try:
                class_time = datetime.strptime(class_time_str, '%H:%M').time() if class_time_str else datetime.now().time()
            except ValueError:
                class_time = datetime.now().time()

            if not arena_id or not group_name:
                flash("Por favor, selecione a Arena e a Turma.", "warning")
                return redirect(url_for('professor_quick_class'))

            arena = db.session.get(Arena, arena_id)
            if not arena:
                flash("Arena inválida selecionada.", "danger")
                return redirect(url_for('professor_quick_class'))

            # Cria a sessão da aula
            new_session = ClassSession(
                professor_id=user.id,
                arena_id=arena_id,
                date=class_date,
                time=class_time,
                group_name=group_name,
                observations=observations,
                photo_status='PENDING'
            )
            db.session.add(new_session)
            db.session.flush()

            # Processa presença dos alunos da arena
            # Os inputs de presença são enviados como present_student_<id>
            # Se for selecionado 'presence_all' ou individualmente
            arena_students = Student.query.filter_by(arena_id=arena_id).all()
            for st in arena_students:
                # Aluno está presente se o checkbox correspondente foi marcado
                field_name = f"present_student_{st.id}"
                is_present = request.form.get(field_name) == '1'
                attendance = Attendance(
                    class_session_id=new_session.id,
                    student_id=st.id,
                    present=is_present
                )
                db.session.add(attendance)

            # Processa upload de foto (se fornecida)
            photo_file = request.files.get('class_photo')
            photo_uploaded = False
            if photo_file and photo_file.filename:
                ext = photo_file.filename.rsplit('.', 1)[-1].lower()
                if ext in Config.ALLOWED_EXTENSIONS:
                    filename = f"aula_{new_session.id}_{uuid.uuid4().hex[:8]}.{ext}"
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    photo_file.save(filepath)

                    class_photo = ClassPhoto(
                        class_session_id=new_session.id,
                        photo_path=filename
                    )
                    db.session.add(class_photo)
                    new_session.photo_status = 'RECEIVED'
                    photo_uploaded = True

            db.session.commit()

            # Redireciona com flag para exibir o modal correto
            if photo_uploaded:
                # Foto recebida -> dispara modal WhatsApp
                return redirect(url_for('professor_session_detail', session_id=new_session.id, trigger_modal='whatsapp_ready'))
            else:
                # Sem foto -> dispara modal de foto pendente
                return redirect(url_for('professor_session_detail', session_id=new_session.id, trigger_modal='photo_pending'))

        # GET: Renderiza o formulário de registro rápido
        selected_arena_id = request.args.get('arena_id', type=int) or (arenas[0].id if arenas else None)
        initial_students = Student.query.filter_by(arena_id=selected_arena_id).order_by(Student.name.asc()).all() if selected_arena_id else []
        
        turmas_padrao = [
            "Iniciante Manhã",
            "Iniciante Noite",
            "Intermediário Manhã",
            "Intermediário Noite",
            "Avançado Tarde",
            "Avançado Noite",
            "Kids & Teens"
        ]

        return render_template(
            'professor/quick_class.html',
            arenas=arenas,
            selected_arena_id=selected_arena_id,
            initial_students=initial_students,
            turmas_padrao=turmas_padrao,
            default_date=date.today().strftime('%Y-%m-%d'),
            default_time=datetime.now().strftime('%H:%M')
        )

    @app.route('/professor/aula/<int:session_id>')
    @login_required
    @role_required('PROFESSOR')
    def professor_session_detail(session_id):
        user = get_current_user()
        class_session = db.session.get(ClassSession, session_id)

        if not class_session:
            flash("Aula não encontrada.", "danger")
            return redirect(url_for('professor_dashboard'))

        # Isolamento estrito de dados
        if class_session.professor_id != user.id:
            flash("Você não possui permissão para acessar esta área.", "danger")
            return redirect(url_for('professor_dashboard'))

        trigger_modal = request.args.get('trigger_modal')

        # Formatação de mensagem para WhatsApp
        # Ex: "Boa noite! Segue a foto da aula de hoje na Arena Ipanema Beach (26/08/2026). 🏐📸"
        hora_atual = class_session.time.hour if class_session.time else datetime.now().hour
        if hora_atual < 12:
            saudacao = "Bom dia!"
        elif hora_atual < 18:
            saudacao = "Boa tarde!"
        else:
            saudacao = "Boa noite!"

        data_formatada = class_session.date.strftime('%d/%m/%Y')
        whatsapp_message = f"{saudacao} Segue a foto da aula de hoje na {class_session.arena.name} ({data_formatada}). 🏐📸"

        return render_template(
            'professor/session_detail.html',
            class_session=class_session,
            trigger_modal=trigger_modal,
            whatsapp_message=whatsapp_message
        )

    @app.route('/professor/aula/<int:session_id>/foto', methods=['POST'])
    @login_required
    @role_required('PROFESSOR')
    def professor_upload_photo(session_id):
        user = get_current_user()
        class_session = db.session.get(ClassSession, session_id)

        if not class_session or class_session.professor_id != user.id:
            flash("Você não possui permissão para acessar esta área.", "danger")
            return redirect(url_for('professor_dashboard'))

        photo_file = request.files.get('class_photo')
        if not photo_file or not photo_file.filename:
            flash("Por favor, selecione uma foto para enviar.", "warning")
            return redirect(url_for('professor_session_detail', session_id=session_id))

        ext = photo_file.filename.rsplit('.', 1)[-1].lower()
        if ext not in Config.ALLOWED_EXTENSIONS:
            flash("Formato de arquivo não suportado. Utilize JPG, PNG ou WEBP.", "danger")
            return redirect(url_for('professor_session_detail', session_id=session_id))

        filename = f"aula_{class_session.id}_{uuid.uuid4().hex[:8]}.{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        photo_file.save(filepath)

        class_photo = ClassPhoto(
            class_session_id=class_session.id,
            photo_path=filename
        )
        db.session.add(class_photo)
        class_session.photo_status = 'RECEIVED'
        db.session.commit()

        flash("Foto anexada com sucesso!", "success")
        return redirect(url_for('professor_session_detail', session_id=session_id, trigger_modal='whatsapp_ready'))

    @app.route('/professor/aula/<int:session_id>/whatsapp-enviado', methods=['POST'])
    @login_required
    @role_required('PROFESSOR')
    def professor_mark_whatsapp_sent(session_id):
        user = get_current_user()
        class_session = db.session.get(ClassSession, session_id)

        if not class_session or class_session.professor_id != user.id:
            if request.is_json:
                return jsonify({'erro': 'Você não possui permissão para acessar esta área.'}), 403
            flash("Você não possui permissão para acessar esta área.", "danger")
            return redirect(url_for('professor_dashboard'))

        class_session.photo_status = 'READY_TO_SEND'
        db.session.commit()

        if request.is_json:
            return jsonify({
                'sucesso': True,
                'status': 'READY_TO_SEND',
                'status_label': 'PREPARADO PARA ENVIO',
                'badge_class': 'badge-ready'
            })

        flash("Status atualizado para PREPARADO PARA ENVIO.", "info")
        return redirect(url_for('professor_session_detail', session_id=session_id))

    @app.route('/professor/fechamento')
    @login_required
    @role_required('PROFESSOR')
    def professor_monthly_close():
        user = get_current_user()
        today = date.today()

        selected_month = request.args.get('mes', type=int) or today.month
        selected_year = request.args.get('ano', type=int) or today.year

        # Aulas do professor no mês selecionado
        classes = ClassSession.query.filter(
            ClassSession.professor_id == user.id,
            extract('month', ClassSession.date) == selected_month,
            extract('year', ClassSession.date) == selected_year
        ).order_by(ClassSession.date.desc(), ClassSession.time.desc()).all()

        total_classes = len(classes)
        total_attendances_slots = sum(c.total_students for c in classes)
        total_presents = sum(c.present_count for c in classes)
        total_absents = sum(c.absent_count for c in classes)
        total_photos = sum(len(c.photos) for c in classes)
        pending_photos = sum(1 for c in classes if c.photo_status == 'PENDING')

        overall_attendance_rate = round((total_presents / total_attendances_slots * 100)) if total_attendances_slots > 0 else 0

        # Anos disponíveis para filtro (últimos 3 anos)
        anos_disponiveis = [today.year - 1, today.year, today.year + 1]

        return render_template(
            'professor/monthly_close.html',
            classes=classes,
            selected_month=selected_month,
            selected_year=selected_year,
            anos_disponiveis=anos_disponiveis,
            total_classes=total_classes,
            total_presents=total_presents,
            total_absents=total_absents,
            total_photos=total_photos,
            pending_photos=pending_photos,
            overall_attendance_rate=overall_attendance_rate
        )

    # ----------------------------------------------------
    # FLUXO DO ADMINISTRADOR (PAINEL ADMINISTRATIVO)
    # ----------------------------------------------------
    @app.route('/admin')
    @login_required
    @role_required('ADMIN')
    def admin_dashboard():
        today = date.today()
        current_month = today.month
        current_year = today.year

        # 1. Métricas do Dia
        today_classes = ClassSession.query.filter_by(date=today).all()
        classes_today_count = len(today_classes)
        active_profs_today = len(set(c.professor_id for c in today_classes))
        total_students_today = sum(c.total_students for c in today_classes)
        present_students_today = sum(c.present_count for c in today_classes)
        photos_today_count = sum(1 for c in today_classes if c.photo_status in ('RECEIVED', 'READY_TO_SEND'))
        presence_rate_today = round((present_students_today / total_students_today * 100)) if total_students_today > 0 else 100

        # 2. Métricas do Mês
        month_classes = ClassSession.query.filter(
            extract('month', ClassSession.date) == current_month,
            extract('year', ClassSession.date) == current_year
        ).all()
        classes_month_count = len(month_classes)
        total_students_month = sum(c.total_students for c in month_classes)
        present_students_month = sum(c.present_count for c in month_classes)
        presence_rate_month = round((present_students_month / total_students_month * 100)) if total_students_month > 0 else 0
        photos_month_count = sum(1 for c in month_classes if c.photo_status in ('RECEIVED', 'READY_TO_SEND'))
        photos_compliance_rate = round((photos_month_count / classes_month_count * 100)) if classes_month_count > 0 else 0

        # 3. Totais Globais
        total_arenas = Arena.query.count()
        total_professors = User.query.filter_by(role='PROFESSOR').count()
        total_students = Student.query.count()

        # 4. Aulas Recentes
        recent_classes = ClassSession.query.order_by(
            ClassSession.date.desc(),
            ClassSession.time.desc()
        ).limit(10).all()

        # 5. Distribuição por Arena
        arenas = Arena.query.all()
        arena_stats = []
        for a in arenas:
            a_classes = [c for c in month_classes if c.arena_id == a.id]
            a_students_count = Student.query.filter_by(arena_id=a.id).count()
            arena_stats.append({
                'arena': a,
                'classes_count': len(a_classes),
                'students_count': a_students_count
            })

        return render_template(
            'admin/dashboard.html',
            today=today,
            classes_today_count=classes_today_count,
            active_profs_today=active_profs_today,
            present_students_today=present_students_today,
            photos_today_count=photos_today_count,
            presence_rate_today=presence_rate_today,
            classes_month_count=classes_month_count,
            presence_rate_month=presence_rate_month,
            photos_month_count=photos_month_count,
            photos_compliance_rate=photos_compliance_rate,
            total_arenas=total_arenas,
            total_professors=total_professors,
            total_students=total_students,
            recent_classes=recent_classes,
            arena_stats=arena_stats
        )

    @app.route('/admin/galeria')
    @login_required
    @role_required('ADMIN')
    def admin_gallery():
        # Filtros
        date_filter = request.args.get('data')
        arena_id = request.args.get('arena_id', type=int)
        prof_id = request.args.get('prof_id', type=int)
        group_name = request.args.get('turma')
        status_filter = request.args.get('status')

        query = ClassPhoto.query.join(ClassSession).order_by(ClassPhoto.uploaded_at.desc())

        if date_filter:
            try:
                parsed_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
                query = query.filter(ClassSession.date == parsed_date)
            except ValueError:
                pass

        if arena_id:
            query = query.filter(ClassSession.arena_id == arena_id)

        if prof_id:
            query = query.filter(ClassSession.professor_id == prof_id)

        if group_name and group_name != 'TODAS':
            query = query.filter(ClassSession.group_name == group_name)

        if status_filter and status_filter != 'TODOS':
            query = query.filter(ClassSession.photo_status == status_filter)

        photos = query.all()

        arenas = Arena.query.order_by(Arena.name.asc()).all()
        professors = User.query.filter_by(role='PROFESSOR').order_by(User.name.asc()).all()

        # Lista de turmas únicas para filtro
        turmas_existentes = db.session.query(ClassSession.group_name).distinct().all()
        turmas = [t[0] for t in turmas_existentes if t[0]]

        return render_template(
            'admin/gallery.html',
            photos=photos,
            arenas=arenas,
            professors=professors,
            turmas=turmas,
            selected_date=date_filter,
            selected_arena_id=arena_id,
            selected_prof_id=prof_id,
            selected_group=group_name,
            selected_status=status_filter
        )

    @app.route('/admin/relatorios')
    @login_required
    @role_required('ADMIN')
    def admin_reports():
        today = date.today()
        selected_month = request.args.get('mes', type=int) or today.month
        selected_year = request.args.get('ano', type=int) or today.year

        # Aulas no mês selecionado
        month_classes = ClassSession.query.filter(
            extract('month', ClassSession.date) == selected_month,
            extract('year', ClassSession.date) == selected_year
        ).all()

        # 1. Relatório por Professor
        professors = User.query.filter_by(role='PROFESSOR').order_by(User.name.asc()).all()
        prof_reports = []
        for p in professors:
            p_classes = [c for c in month_classes if c.professor_id == p.id]
            total_cls = len(p_classes)
            total_slots = sum(c.total_students for c in p_classes)
            total_presents = sum(c.present_count for c in p_classes)
            total_absents = sum(c.absent_count for c in p_classes)
            photos_count = sum(len(c.photos) for c in p_classes)
            rate = round((total_presents / total_slots * 100)) if total_slots > 0 else 0
            
            prof_reports.append({
                'professor': p,
                'total_classes': total_cls,
                'total_presents': total_presents,
                'total_absents': total_absents,
                'photos_count': photos_count,
                'rate': rate
            })

        # 2. Relatório por Arena
        arenas = Arena.query.order_by(Arena.name.asc()).all()
        arena_reports = []
        for a in arenas:
            a_classes = [c for c in month_classes if c.arena_id == a.id]
            total_cls = len(a_classes)
            total_slots = sum(c.total_students for c in a_classes)
            total_presents = sum(c.present_count for c in a_classes)
            rate = round((total_presents / total_slots * 100)) if total_slots > 0 else 0
            students_count = Student.query.filter_by(arena_id=a.id).count()

            arena_reports.append({
                'arena': a,
                'total_classes': total_cls,
                'total_students': students_count,
                'total_presents': total_presents,
                'rate': rate
            })

        anos_disponiveis = [today.year - 1, today.year, today.year + 1]

        return render_template(
            'admin/reports.html',
            selected_month=selected_month,
            selected_year=selected_year,
            anos_disponiveis=anos_disponiveis,
            prof_reports=prof_reports,
            arena_reports=arena_reports,
            total_classes_month=len(month_classes)
        )

    @app.route('/admin/relatorios/exportar-csv')
    @login_required
    @role_required('ADMIN')
    def admin_export_csv():
        today = date.today()
        selected_month = request.args.get('mes', type=int) or today.month
        selected_year = request.args.get('ano', type=int) or today.year

        classes = ClassSession.query.filter(
            extract('month', ClassSession.date) == selected_month,
            extract('year', ClassSession.date) == selected_year
        ).order_by(ClassSession.date.asc(), ClassSession.time.asc()).all()

        output = io.StringIO()
        # Adiciona BOM UTF-8 para correta abertura no Excel em português
        output.write('\ufeff')
        writer = csv.writer(output, delimiter=';')

        # Cabeçalhos do CSV
        writer.writerow([
            'ID da Aula',
            'Data',
            'Horário',
            'Arena',
            'Professor',
            'Turma',
            'Total de Alunos',
            'Presentes',
            'Ausentes',
            'Taxa de Presença (%)',
            'Status da Foto',
            'Observações'
        ])

        for c in classes:
            writer.writerow([
                c.id,
                c.date.strftime('%d/%m/%Y'),
                c.time.strftime('%H:%M'),
                c.arena.name if c.arena else '-',
                c.professor.name if c.professor else '-',
                c.group_name,
                c.total_students,
                c.present_count,
                c.absent_count,
                f"{c.attendance_rate}%",
                c.status_label,
                c.observations or ''
            ])

        output.seek(0)
        filename = f"relatorio_aulas_{selected_month:02d}_{selected_year}.csv"
        
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8-sig')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename
        )

    @app.route('/admin/alunos', methods=['GET', 'POST'])
    @login_required
    @role_required('ADMIN')
    def admin_students():
        if request.method == 'POST':
            name = request.form.get('name', '').strip()
            phone = request.form.get('phone', '').strip()
            email = request.form.get('email', '').strip()
            arena_id = request.form.get('arena_id', type=int)
            group_name = request.form.get('group_name', '').strip() or 'Geral'

            if not name or not arena_id:
                flash("Nome e Arena são obrigatórios.", "warning")
            else:
                student = Student(
                    name=name,
                    phone=phone,
                    email=email,
                    arena_id=arena_id,
                    group_name=group_name
                )
                db.session.add(student)
                db.session.commit()
                flash(f"Aluno(a) {name} cadastrado(a) com sucesso!", "success")
            return redirect(url_for('admin_students'))

        # Filtro de Arena
        arena_filter = request.args.get('arena_id', type=int)
        search_query = request.args.get('q', '').strip()

        query = Student.query.join(Arena)
        if arena_filter:
            query = query.filter(Student.arena_id == arena_filter)
        if search_query:
            query = query.filter(Student.name.ilike(f"%{search_query}%"))

        students = query.order_by(Student.name.asc()).all()
        arenas = Arena.query.order_by(Arena.name.asc()).all()

        return render_template(
            'admin/students.html',
            students=students,
            arenas=arenas,
            selected_arena_id=arena_filter,
            search_query=search_query
        )

    @app.route('/admin/alunos/<int:student_id>/excluir', methods=['POST'])
    @login_required
    @role_required('ADMIN')
    def admin_delete_student(student_id):
        student = db.session.get(Student, student_id)
        if not student:
            flash("Aluno não encontrado.", "danger")
        else:
            name = student.name
            db.session.delete(student)
            db.session.commit()
            flash(f"Aluno(a) {name} removido(a) com sucesso.", "info")
        return redirect(url_for('admin_students'))

    @app.route('/admin/arenas', methods=['GET', 'POST'])
    @login_required
    @role_required('ADMIN')
    def admin_arenas():
        if request.method == 'POST':
            name = request.form.get('name', '').strip()
            location = request.form.get('location', '').strip()

            if not name or not location:
                flash("Nome da arena e localização são obrigatórios.", "warning")
            else:
                arena = Arena(name=name, location=location)
                db.session.add(arena)
                db.session.commit()
                flash(f"Arena '{name}' cadastrada com sucesso!", "success")
            return redirect(url_for('admin_arenas'))

        arenas = Arena.query.order_by(Arena.name.asc()).all()
        return render_template('admin/arenas.html', arenas=arenas)

    @app.route('/admin/professores', methods=['GET', 'POST'])
    @login_required
    @role_required('ADMIN')
    def admin_professores():
        if request.method == 'POST':
            name = request.form.get('name', '').strip()
            email = request.form.get('email', '').strip().lower()
            phone = request.form.get('phone', '').strip()
            password = request.form.get('password', 'senha123')

            is_valid, role, error = validate_email_domain(email)
            if not is_valid or role != 'PROFESSOR':
                flash("O e-mail do professor deve possuir domínio @prof.com.", "danger")
                return redirect(url_for('admin_professores'))

            if User.query.filter_by(email=email).first():
                flash("Este e-mail já está cadastrado.", "warning")
                return redirect(url_for('admin_professores'))

            prof = User(
                name=name,
                email=email,
                phone=phone,
                password_hash=hash_password(password),
                role='PROFESSOR'
            )
            db.session.add(prof)
            db.session.commit()
            flash(f"Professor(a) {name} cadastrado(a) com sucesso!", "success")
            return redirect(url_for('admin_professores'))

        professors = User.query.filter_by(role='PROFESSOR').order_by(User.name.asc()).all()
        return render_template('admin/professores.html', professors=professors)

    @app.route('/admin/calendario')
    @login_required
    @role_required('ADMIN')
    def admin_calendar():
        today = date.today()
        selected_month = request.args.get('mes', type=int) or today.month
        selected_year = request.args.get('ano', type=int) or today.year

        classes = ClassSession.query.filter(
            extract('month', ClassSession.date) == selected_month,
            extract('year', ClassSession.date) == selected_year
        ).order_by(ClassSession.date.asc(), ClassSession.time.asc()).all()

        # Agrupa por dia
        days_in_month = monthrange(selected_year, selected_month)[1]
        calendar_days = {}
        for day in range(1, days_in_month + 1):
            calendar_days[day] = []

        for c in classes:
            day_num = c.date.day
            if day_num in calendar_days:
                calendar_days[day_num].append(c)

        anos_disponiveis = [today.year - 1, today.year, today.year + 1]

        return render_template(
            'admin/calendar.html',
            calendar_days=calendar_days,
            selected_month=selected_month,
            selected_year=selected_year,
            anos_disponiveis=anos_disponiveis,
            classes=classes
        )

    # ----------------------------------------------------
    # TRATAMENTO DE ERROS (100% EM PT-BR)
    # ----------------------------------------------------
    @app.errorhandler(403)
    def forbidden(e):
        return render_template('errors/403.html', message=str(e.description or "Você não possui permissão para acessar esta área.")), 403

    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('errors/404.html'), 404

    @app.errorhandler(500)
    def internal_server_error(e):
        return render_template('errors/500.html'), 500

    return app

# Instância padrão da aplicação para Flask CLI, WSGI e execução direta
app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

