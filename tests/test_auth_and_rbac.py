import pytest
from app import create_app
from models import db, User, Arena, Student, ClassSession, Attendance
from auth import validate_email_domain

@pytest.fixture
def app():
    app = create_app(testing=True)
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_email_domain_validation():
    # Validações de professor
    valid, role, err = validate_email_domain("carlos@prof.com")
    assert valid is True
    assert role == "PROFESSOR"
    assert err is None

    # Validações de admin
    valid, role, err = validate_email_domain("gestor@arenaadm.com")
    assert valid is True
    assert role == "ADMIN"
    assert err is None

    # Domínios rejeitados
    invalid_emails = [
        "usuario@gmail.com",
        "teste@hotmail.com",
        "aluno@outlook.com",
        "prof@prof.com.br",
        "semdominio"
    ]
    for email in invalid_emails:
        valid, role, err = validate_email_domain(email)
        assert valid is False
        assert "Este e-mail não possui permissão para acessar o sistema." in (err or "")

def test_user_registration_and_rbac(client, app):
    # Registro de Professor
    resp = client.post('/cadastro', data={
        'name': 'Professor Teste',
        'email': 'novo@prof.com',
        'phone': '2199999999',
        'password': 'senha_segura',
        'password_confirm': 'senha_segura'
    }, follow_redirects=True)
    assert resp.status_code == 200
    assert b"Meu Painel" in resp.data

    with app.app_context():
        user = User.query.filter_by(email='novo@prof.com').first()
        assert user is not None
        assert user.role == 'PROFESSOR'

    # Desloga antes de tentar novo cadastro
    client.get('/logout')

    # Tentativa de cadastro com domínio não autorizado
    resp_invalid = client.post('/cadastro', data={
        'name': 'Hacker',
        'email': 'hacker@gmail.com',
        'password': 'senha_segura',
        'password_confirm': 'senha_segura'
    }, follow_redirects=True)
    assert resp_invalid.status_code == 200
    assert "Este e-mail não possui permissão para acessar o sistema.".encode('utf-8') in resp_invalid.data

def test_admin_route_protection(client, app):
    # Cadastra e loga como Professor
    client.post('/cadastro', data={
        'name': 'Professor A',
        'email': 'prof_a@prof.com',
        'password': 'senha123',
        'password_confirm': 'senha123'
    })

    # Professor tenta acessar rota administrativa /admin
    resp = client.get('/admin', follow_redirects=True)
    assert resp.status_code == 200
    # Deve ser redirecionado com a mensagem de bloqueio
    assert "Você não possui permissão para acessar esta área.".encode('utf-8') in resp.data
