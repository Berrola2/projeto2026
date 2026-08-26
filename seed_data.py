import os
from datetime import date, time, datetime, timedelta
from werkzeug.security import generate_password_hash
from PIL import Image, ImageDraw, ImageFont
from models import db, User, Arena, Student, ClassSession, Attendance, ClassPhoto

def create_sample_photo(filename: str, text: str, bg_color: tuple, accent_color: tuple, upload_dir: str = None):
    """Cria uma imagem de exemplo representativa de foto de aula de vôlei."""
    if not upload_dir:
        upload_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'static', 'uploads', 'photos')
    
    try:
        os.makedirs(upload_dir, exist_ok=True)
        filepath = os.path.join(upload_dir, filename)
        
        if os.path.exists(filepath):
            return filename
        
        # Criar imagem estilosa
        width, height = 800, 600
        image = Image.new('RGB', (width, height), color=bg_color)
        draw = ImageDraw.Draw(image)
        
        # Desenhar sol / círculo estilizado
        draw.ellipse((width - 250, -50, width + 150, 350), fill=accent_color)
        
        # Desenhar faixa de areia
        draw.polygon([(0, 480), (width, 420), (width, height), (0, height)], fill=(234, 179, 8) if bg_color != (234, 179, 8) else (217, 119, 6))
        
        # Desenhar rede estilizada de vôlei
        draw.line([(0, 380), (width, 380)], fill=(255, 255, 255), width=4)
        for x in range(0, width, 25):
            draw.line([(x, 380), (x, 430)], fill=(255, 255, 255), width=2)
        draw.line([(0, 430), (width, 430)], fill=(255, 255, 255), width=3)
        
        # Textos na imagem
        try:
            font_large = ImageFont.load_default()
        except Exception:
            font_large = None
            
        draw.text((40, 60), "🏐 VÔLEI DE PRAIA - REGISTRO DE AULA", fill=(255, 255, 255))
        draw.text((40, 100), text, fill=(255, 255, 255))
        draw.text((40, 530), "Foto oficial registrada no sistema de gestão de aulas", fill=(15, 23, 42))
        
        image.save(filepath, 'JPEG', quality=85)
    except Exception as e:
        print(f"Aviso ao gerar foto de amostra: {e}")
    return filename


def seed_database(app):
    with app.app_context():
        # Cria todas as tabelas
        db.create_all()

        # Cria diretório de uploads configurado
        upload_dir = app.config.get('UPLOAD_FOLDER', os.path.join(os.path.abspath(os.path.dirname(__file__)), 'static', 'uploads', 'photos'))
        try:
            os.makedirs(upload_dir, exist_ok=True)
        except Exception:
            pass

        # Se já existirem usuários, pula o seed
        if User.query.first():
            print("Banco de dados já contém registros. Seed ignorado.")
            return

        print("Populando banco de dados inicial...")

        # 1. Usuários
        admin_user = User(
            name="Roberto Gestor",
            email="gestor@arenaadm.com",
            password_hash=generate_password_hash("senha123"),
            role="ADMIN",
            phone="(21) 98888-0001"
        )

        admin_user2 = User(
            name="Administrador da Arena",
            email="admin@arenaadm.com",
            password_hash=generate_password_hash("senha123"),
            role="ADMIN",
            phone="(21) 98888-0000"
        )
        
        prof_carlos = User(
            name="Carlos Silva",
            email="carlos@prof.com",
            password_hash=generate_password_hash("senha123"),
            role="PROFESSOR",
            phone="(21) 97777-1001"
        )
        
        prof_ana = User(
            name="Ana Souza",
            email="ana@prof.com",
            password_hash=generate_password_hash("senha123"),
            role="PROFESSOR",
            phone="(21) 97777-2002"
        )

        db.session.add_all([admin_user, admin_user2, prof_carlos, prof_ana])
        db.session.commit()

        # 2. Arenas
        arena1 = Arena(
            name="Arena Ipanema Beach",
            location="Av. Vieira Souto, Posto 9 - Ipanema, Rio de Janeiro - RJ"
        )
        arena2 = Arena(
            name="Arena Copacabana Sun",
            location="Av. Atlântica, Posto 4 - Copacabana, Rio de Janeiro - RJ"
        )
        arena3 = Arena(
            name="Arena Barra Sunset",
            location="Av. Lúcio Costa, Posto 6 - Barra da Tijuca, Rio de Janeiro - RJ"
        )

        db.session.add_all([arena1, arena2, arena3])
        db.session.commit()

        # 3. Alunos
        students_data = [
            # Arena 1 - Ipanema
            ("Gabriel Martins", "(21) 99111-2233", "gabriel@email.com", arena1.id, "Iniciante Manhã"),
            ("Beatriz Lima", "(21) 99222-3344", "beatriz@email.com", arena1.id, "Iniciante Manhã"),
            ("Lucas Oliveira", "(21) 99333-4455", "lucas@email.com", arena1.id, "Iniciante Manhã"),
            ("Mariana Costa", "(21) 99444-5566", "mariana@email.com", arena1.id, "Iniciante Manhã"),
            ("Felipe Santos", "(21) 99555-6677", "felipe@email.com", arena1.id, "Intermediário Noite"),
            ("Camila Rocha", "(21) 99666-7788", "camila@email.com", arena1.id, "Intermediário Noite"),
            ("Thiago Mendes", "(21) 99777-8899", "thiago@email.com", arena1.id, "Intermediário Noite"),
            ("Juliana Paiva", "(21) 99888-9900", "juliana@email.com", arena1.id, "Intermediário Noite"),
            ("Rafael Moreira", "(21) 99123-4567", "rafael@email.com", arena1.id, "Avançado Tarde"),
            ("Larissa Duarte", "(21) 99234-5678", "larissa@email.com", arena1.id, "Avançado Tarde"),
            # Arena 2 - Copacabana
            ("Rodrigo Alves", "(21) 99345-6789", "rodrigo@email.com", arena2.id, "Iniciante Manhã"),
            ("Fernanda Gomes", "(21) 99456-7890", "fernanda@email.com", arena2.id, "Iniciante Manhã"),
            ("Marcelo Dias", "(21) 99567-8901", "marcelo@email.com", arena2.id, "Intermediário Noite"),
            ("Patricia Ramos", "(21) 99678-9012", "patricia@email.com", arena2.id, "Intermediário Noite"),
            ("Diego Carvalho", "(21) 99789-0123", "diego@email.com", arena2.id, "Avançado Tarde"),
            # Arena 3 - Barra
            ("Vinicius Barbosa", "(21) 99890-1234", "vinicius@email.com", arena3.id, "Iniciante Manhã"),
            ("Aline Guimarães", "(21) 99901-2345", "aline@email.com", arena3.id, "Iniciante Manhã"),
            ("Eduardo Ferreira", "(21) 99012-3456", "eduardo@email.com", arena3.id, "Intermediário Noite"),
            ("Tatiana Ribeiro", "(21) 99124-5678", "tatiana@email.com", arena3.id, "Intermediário Noite")
        ]

        created_students = []
        for name, phone, email, arena_id, group in students_data:
            st = Student(name=name, phone=phone, email=email, arena_id=arena_id, group_name=group)
            db.session.add(st)
            created_students.append(st)
        
        db.session.commit()

        # 4. Fotos de Amostra
        photo1_file = create_sample_photo(
            "aula_ipanema_01.jpg",
            "Arena Ipanema Beach - Turma Iniciante Manhã",
            (15, 43, 72),
            (2, 132, 199),
            upload_dir=upload_dir
        )
        photo2_file = create_sample_photo(
            "aula_copacabana_01.jpg",
            "Arena Copacabana Sun - Turma Intermediário Noite",
            (30, 58, 138),
            (249, 115, 22),
            upload_dir=upload_dir
        )
        photo3_file = create_sample_photo(
            "aula_barra_01.jpg",
            "Arena Barra Sunset - Turma Avançado Tarde",
            (14, 116, 144),
            (234, 179, 8),
            upload_dir=upload_dir
        )

        today = date.today()

        # 5. Aulas e Presenças
        # Aula 1: Hoje de manhã - Carlos na Arena Ipanema (Turma Iniciante) - Com Foto e Enviada WhatsApp
        session1 = ClassSession(
            professor_id=prof_carlos.id,
            arena_id=arena1.id,
            date=today,
            time=time(7, 30),
            group_name="Iniciante Manhã",
            observations="Treino de manchete e saque por baixo. Excelente aproveitamento dos alunos.",
            photo_status="READY_TO_SEND"
        )
        db.session.add(session1)
        db.session.flush()

        # Foto da Aula 1
        db.session.add(ClassPhoto(class_session_id=session1.id, photo_path=photo1_file))

        # Presenças da Aula 1 (Alunos da Arena 1 Iniciante)
        arena1_iniciantes = [s for s in created_students if s.arena_id == arena1.id and s.group_name == "Iniciante Manhã"]
        for idx, st in enumerate(arena1_iniciantes):
            # Deixa 1 ausente para testar cálculos
            present = (idx != 2)
            db.session.add(Attendance(class_session_id=session1.id, student_id=st.id, present=present))

        # Aula 2: Hoje à tarde - Carlos na Arena Ipanema (Turma Avançado) - Foto Recebida
        session2 = ClassSession(
            professor_id=prof_carlos.id,
            arena_id=arena1.id,
            date=today,
            time=time(16, 0),
            group_name="Avançado Tarde",
            observations="Treino tático de bloqueio e contra-ataque em duplas.",
            photo_status="RECEIVED"
        )
        db.session.add(session2)
        db.session.flush()
        db.session.add(ClassPhoto(class_session_id=session2.id, photo_path=photo3_file))
        
        arena1_avancados = [s for s in created_students if s.arena_id == arena1.id and s.group_name == "Avançado Tarde"]
        for st in arena1_avancados:
            db.session.add(Attendance(class_session_id=session2.id, student_id=st.id, present=True))

        # Aula 3: Ontem - Carlos na Arena Ipanema (Turma Intermediário) - Sem foto (PENDENTE)
        session3 = ClassSession(
            professor_id=prof_carlos.id,
            arena_id=arena1.id,
            date=today - timedelta(days=1),
            time=time(18, 30),
            group_name="Intermediário Noite",
            observations="Fundamentos de levantamento e ataque na diagonal.",
            photo_status="PENDING"
        )
        db.session.add(session3)
        db.session.flush()
        
        arena1_intermediarios = [s for s in created_students if s.arena_id == arena1.id and s.group_name == "Intermediário Noite"]
        for st in arena1_intermediarios:
            db.session.add(Attendance(class_session_id=session3.id, student_id=st.id, present=True))

        # Aula 4: Hoje - Professora Ana na Arena Copacabana (Turma Intermediário) - Foto enviada
        session4 = ClassSession(
            professor_id=prof_ana.id,
            arena_id=arena2.id,
            date=today,
            time=time(8, 0),
            group_name="Intermediário Noite",
            observations="Simulação de jogo e posicionamento defensivo.",
            photo_status="READY_TO_SEND"
        )
        db.session.add(session4)
        db.session.flush()
        db.session.add(ClassPhoto(class_session_id=session4.id, photo_path=photo2_file))

        arena2_alunos = [s for s in created_students if s.arena_id == arena2.id]
        for st in arena2_alunos:
            db.session.add(Attendance(class_session_id=session4.id, student_id=st.id, present=True))

        db.session.commit()
        print("Banco de dados populado com sucesso!")
