from functools import wraps
from flask import session, redirect, url_for, flash, abort, request, g
from werkzeug.security import generate_password_hash, check_password_hash
from models import User, db

ALLOWED_DOMAINS = {
    'prof.com': 'PROFESSOR',
    'arenaadm.com': 'ADMIN'
}

def validate_email_domain(email: str) -> tuple[bool, str | None, str | None]:
    """
    Valida se o e-mail possui um domínio autorizado.
    Retorna: (is_valid, role, error_message)
    """
    error_msg = "Este e-mail não possui permissão para acessar o sistema."
    if not email or '@' not in email:
        return False, None, error_msg
    
    parts = email.strip().lower().split('@')
    if len(parts) != 2:
        return False, None, error_msg
    
    domain = parts[1]
    if domain in ALLOWED_DOMAINS:
        return True, ALLOWED_DOMAINS[domain], None
    
    return False, None, error_msg


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    return check_password_hash(password_hash, password)


def get_current_user():
    """Recupera o usuário autenticado na sessão atual."""
    user_id = session.get('user_id')
    if not user_id:
        return None
    if not hasattr(g, 'current_user') or g.current_user is None or g.current_user.id != user_id:
        g.current_user = db.session.get(User, user_id)
    return g.current_user


def login_user(user: User):
    """Armazena informações do usuário na sessão."""
    session['user_id'] = user.id
    session['user_name'] = user.name
    session['user_email'] = user.email
    session['user_role'] = user.role
    session.permanent = True


def logout_user():
    """Limpa a sessão do usuário."""
    session.pop('user_id', None)
    session.pop('user_name', None)
    session.pop('user_email', None)
    session.pop('user_role', None)
    g.current_user = None


def login_required(f):
    """Garante que o usuário esteja autenticado."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('user_id'):
            flash("Por favor, faça login para acessar o sistema.", "warning")
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function


def role_required(allowed_roles):
    """
    Garante que o usuário possua um dos papéis autorizados.
    Se não possuir, bloqueia com a mensagem especificada.
    """
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not session.get('user_id'):
                flash("Por favor, faça login para acessar o sistema.", "warning")
                return redirect(url_for('login', next=request.url))
            
            user_role = session.get('user_role')
            if user_role not in allowed_roles:
                flash("Você não possui permissão para acessar esta área.", "danger")
                # Se for requisição AJAX/API retorna 403 JSON, caso contrário redireciona ou 403
                if request.is_json or request.path.startswith('/api/'):
                    return {"erro": "Você não possui permissão para acessar esta área."}, 403
                
                # Redireciona o usuário para seu painel apropriado se tiver um
                if user_role == 'PROFESSOR':
                    return redirect(url_for('professor_dashboard'))
                elif user_role == 'ADMIN':
                    return redirect(url_for('admin_dashboard'))
                return abort(403, description="Você não possui permissão para acessar esta área.")
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator
