import os
import tempfile

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
# Detecta se está rodando no ambiente Serverless da Vercel
IS_VERCEL = os.environ.get('VERCEL') == '1' or bool(os.environ.get('VERCEL'))

class Config:
    BASE_DIR = BASE_DIR
    IS_VERCEL = IS_VERCEL
    SECRET_KEY = os.environ.get('SECRET_KEY', 'chave-secreta-volei-praia-brasil-2026-super-segura')
    
    # Na Vercel, apenas o diretório /tmp é gravável para o SQLite e uploads
    if IS_VERCEL:
        DB_PATH = os.path.join(tempfile.gettempdir(), "beach_volley.db")
        UPLOAD_FOLDER = os.path.join(tempfile.gettempdir(), "uploads", "photos")
    else:
        DB_PATH = os.path.join(BASE_DIR, "beach_volley.db")
        UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads", "photos")
        
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f'sqlite:///{DB_PATH}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'heic'}
