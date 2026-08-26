import io
from datetime import date, time
import pytest
from app import create_app
from models import db, User, Arena, Student, ClassSession, Attendance
from auth import hash_password

@pytest.fixture
def app():
    app = create_app(testing=True)
    
    with app.app_context():
        db.create_all()
        
        # Popula dados de teste
        admin = User(name="Admin", email="admin@arenaadm.com", password_hash=hash_password("senha123"), role="ADMIN")
        prof1 = User(name="Prof 1", email="prof1@prof.com", password_hash=hash_password("senha123"), role="PROFESSOR")
        prof2 = User(name="Prof 2", email="prof2@prof.com", password_hash=hash_password("senha123"), role="PROFESSOR")
        arena = Arena(name="Arena Teste", location="Praia de Teste")
        
        db.session.add_all([admin, prof1, prof2, arena])
        db.session.commit()
        
        st1 = Student(name="Aluno 1", arena_id=arena.id, group_name="Iniciante Manhã")
        st2 = Student(name="Aluno 2", arena_id=arena.id, group_name="Iniciante Manhã")
        db.session.add_all([st1, st2])
        db.session.commit()

        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_quick_class_creation_without_photo(client, app):
    # Loga como Professor 1
    client.post('/login', data={'email': 'prof1@prof.com', 'password': 'senha123'})

    # Cria aula sem foto
    resp = client.post('/professor/aula/nova', data={
        'arena_id': 1,
        'group_name': 'Iniciante Manhã',
        'date': '2026-08-26',
        'time': '08:00',
        'observations': 'Aula de teste de fundamentos',
        'present_student_1': '1',
        'present_student_2': '0'
    }, follow_redirects=False)

    assert resp.status_code == 302
    assert "trigger_modal=photo_pending" in resp.location

    with app.app_context():
        session = ClassSession.query.first()
        assert session is not None
        assert session.photo_status == 'PENDING'
        assert session.present_count == 1
        assert session.absent_count == 1
        assert session.attendance_rate == 50

def test_class_photo_upload_and_whatsapp_flow(client, app):
    # Loga como Professor 1
    client.post('/login', data={'email': 'prof1@prof.com', 'password': 'senha123'})

    # Cria sessão inicial
    with app.app_context():
        session = ClassSession(
            professor_id=2, # prof1
            arena_id=1,
            date=date.today(),
            time=time(9, 0),
            group_name="Iniciante Manhã",
            photo_status='PENDING'
        )
        db.session.add(session)
        db.session.commit()
        session_id = session.id

    # Faz upload de foto
    data = {
        'class_photo': (io.BytesIO(b'fake_image_bytes'), 'aula.jpg')
    }
    resp = client.post(f'/professor/aula/{session_id}/foto', data=data, content_type='multipart/form-data', follow_redirects=False)
    assert resp.status_code == 302
    assert "trigger_modal=whatsapp_ready" in resp.location

    with app.app_context():
        s = db.session.get(ClassSession, session_id)
        assert s.photo_status == 'RECEIVED'
        assert len(s.photos) == 1

    # Dispara endpoint do WhatsApp
    resp_wa = client.post(f'/professor/aula/{session_id}/whatsapp-enviado', json={})
    assert resp_wa.status_code == 200
    assert resp_wa.json['status'] == 'READY_TO_SEND'

    with app.app_context():
        s = db.session.get(ClassSession, session_id)
        assert s.photo_status == 'READY_TO_SEND'

def test_professor_data_isolation(client, app):
    # Cria aula para o Professor 1
    with app.app_context():
        session1 = ClassSession(
            professor_id=2, # prof1
            arena_id=1,
            date=date.today(),
            time=time(10, 0),
            group_name="Turma Prof 1",
            photo_status='PENDING'
        )
        db.session.add(session1)
        db.session.commit()
        session1_id = session1.id

    # Loga como Professor 2
    client.post('/login', data={'email': 'prof2@prof.com', 'password': 'senha123'})

    # Professor 2 tenta acessar a aula do Professor 1
    resp = client.get(f'/professor/aula/{session1_id}', follow_redirects=True)
    assert resp.status_code == 200
    # Deve ser bloqueado com a mensagem padrão
    assert "Você não possui permissão para acessar esta área.".encode('utf-8') in resp.data

def test_admin_csv_export(client, app):
    # Loga como Admin
    client.post('/login', data={'email': 'admin@arenaadm.com', 'password': 'senha123'})

    resp = client.get(f'/admin/relatorios/exportar-csv?mes={date.today().month}&ano={date.today().year}')
    assert resp.status_code == 200
    assert resp.mimetype == 'text/csv'
    # Verifica cabeçalhos em PT-BR
    assert "Taxa de Presen".encode('utf-8') in resp.data or "Presen".encode('utf-8') in resp.data
