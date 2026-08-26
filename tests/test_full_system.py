import io
from datetime import date, time
import pytest
from app import create_app
from models import db, User, Arena, Student, ClassSession, Attendance, ClassPhoto
from seed_data import seed_database

@pytest.fixture
def app():
    app = create_app(testing=True)
    
    with app.app_context():
        seed_database(app)
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_complete_professor_journey(client, app):
    # 1. Login com Professor Carlos
    resp = client.post('/login', data={
        'email': 'carlos@prof.com',
        'password': 'senha123'
    }, follow_redirects=True)
    assert resp.status_code == 200
    assert "Meu Painel".encode('utf-8') in resp.data
    assert "Prof. Carlos Silva".encode('utf-8') in resp.data
    assert "REGISTRAR NOVA AULA".encode('utf-8') in resp.data

    # 2. Acessa tela de Registro Rápido
    resp = client.get('/professor/aula/nova')
    assert resp.status_code == 200
    assert "Registro Rápido de Aula".encode('utf-8') in resp.data
    assert "Lista de Presença".encode('utf-8') in resp.data
    assert "Arena Ipanema Beach".encode('utf-8') in resp.data

    # 3. Cria aula com presença parcial e sem foto inicial
    resp = client.post('/professor/aula/nova', data={
        'arena_id': 1,
        'group_name': 'Iniciante Manhã',
        'date': date.today().strftime('%Y-%m-%d'),
        'time': '07:30',
        'observations': 'Treino tático sob sol forte',
        'present_student_1': '1',
        'present_student_2': '1',
        'present_student_3': '0',
        'present_student_4': '1'
    }, follow_redirects=True)
    assert resp.status_code == 200
    # Verifica acionamento do modal de foto pendente
    assert "FOTO DA AULA PENDENTE".encode('utf-8') in resp.data
    assert "FOTO PENDENTE".encode('utf-8') in resp.data

    # 4. Envia foto para a aula
    with app.app_context():
        latest_session = ClassSession.query.order_by(ClassSession.id.desc()).first()
        session_id = latest_session.id
    
    resp_photo = client.post(f'/professor/aula/{session_id}/foto', data={
        'class_photo': (io.BytesIO(b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb'), 'foto_aula.jpg')
    }, content_type='multipart/form-data', follow_redirects=True)
    assert resp_photo.status_code == 200
    assert "FOTO PRONTA PARA ENVIO".encode('utf-8') in resp_photo.data
    assert "ABRIR WHATSAPP".encode('utf-8') in resp_photo.data

    # 5. Aciona envio via WhatsApp
    resp_wa = client.post(f'/professor/aula/{session_id}/whatsapp-enviado', json={})
    assert resp_wa.status_code == 200
    assert resp_wa.json['status'] == 'READY_TO_SEND'

    # 6. Acessa Fechamento do Mês
    resp_close = client.get('/professor/fechamento')
    assert resp_close.status_code == 200
    assert "Fechamento do Mês".encode('utf-8') in resp_close.data
    assert "Aulas Dadas".encode('utf-8') in resp_close.data
    assert "Taxa Média de Presença".encode('utf-8') in resp_close.data

def test_complete_admin_journey(client, app):
    # 1. Login com Administrador Roberto
    resp = client.post('/login', data={
        'email': 'gestor@arenaadm.com',
        'password': 'senha123'
    }, follow_redirects=True)
    assert resp.status_code == 200
    assert "Painel Administrativo Consolidado".encode('utf-8') in resp.data
    assert "Galeria Central de Fotos".encode('utf-8') in resp.data or "Galeria Central".encode('utf-8') in resp.data

    # 2. Acessa Galeria Central de Fotos
    resp_gallery = client.get('/admin/galeria')
    assert resp_gallery.status_code == 200
    assert "Galeria Central de Fotos das Aulas".encode('utf-8') in resp_gallery.data
    assert "Todas as Arenas".encode('utf-8') in resp_gallery.data

    # 3. Acessa Relatórios
    resp_reports = client.get('/admin/relatorios')
    assert resp_reports.status_code == 200
    assert "Relatórios Administrativos".encode('utf-8') in resp_reports.data
    assert "Desempenho por Professor".encode('utf-8') in resp_reports.data
    assert "Desempenho por Arena".encode('utf-8') in resp_reports.data

    # 4. Exporta CSV
    resp_csv = client.get(f'/admin/relatorios/exportar-csv?mes={date.today().month}&ano={date.today().year}')
    assert resp_csv.status_code == 200
    assert resp_csv.mimetype == 'text/csv'
    csv_content = resp_csv.data.decode('utf-8-sig')
    assert 'ID da Aula;Data;Horário;Arena;Professor;Turma;Total de Alunos' in csv_content

    # 5. Gestão de Alunos
    resp_students = client.get('/admin/alunos')
    assert resp_students.status_code == 200
    assert "Gestão de Alunos & Turmas".encode('utf-8') in resp_students.data
    assert "Gabriel Martins".encode('utf-8') in resp_students.data

    # 6. Cadastro de Novo Aluno
    resp_new_st = client.post('/admin/alunos', data={
        'name': 'Novo Aluno Teste',
        'arena_id': 1,
        'group_name': 'Iniciante Manhã',
        'phone': '(21) 98888-7777',
        'email': 'novo.aluno@email.com'
    }, follow_redirects=True)
    assert resp_new_st.status_code == 200
    assert "Novo Aluno Teste".encode('utf-8') in resp_new_st.data

    # 7. Gestão de Arenas
    resp_arenas = client.get('/admin/arenas')
    assert resp_arenas.status_code == 200
    assert "Arena Ipanema Beach".encode('utf-8') in resp_arenas.data

    # 8. Gestão de Professores
    resp_profs = client.get('/admin/professores')
    assert resp_profs.status_code == 200
    assert "Carlos Silva".encode('utf-8') in resp_profs.data
    assert "carlos@prof.com".encode('utf-8') in resp_profs.data
