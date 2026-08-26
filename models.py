from datetime import datetime, date, time
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'PROFESSOR' or 'ADMIN'
    phone = db.Column(db.String(30), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)

    # Relationships
    classes = db.relationship('ClassSession', backref='professor', lazy='dynamic', foreign_keys='ClassSession.professor_id')

    @property
    def is_professor(self):
        return self.role == 'PROFESSOR'

    @property
    def is_admin(self):
        return self.role == 'ADMIN'

    def __repr__(self):
        return f'<User {self.name} ({self.role})>'


class Arena(db.Model):
    __tablename__ = 'arenas'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

    # Relationships
    students = db.relationship('Student', backref='arena', lazy='dynamic', cascade='all, delete-orphan')
    classes = db.relationship('ClassSession', backref='arena', lazy='dynamic', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Arena {self.name}>'


class Student(db.Model):
    __tablename__ = 'students'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(30), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    arena_id = db.Column(db.Integer, db.ForeignKey('arenas.id'), nullable=False)
    group_name = db.Column(db.String(100), nullable=True, default='Geral')
    created_at = db.Column(db.DateTime, default=datetime.now)

    # Relationships
    attendances = db.relationship('Attendance', backref='student', lazy='dynamic', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Student {self.name}>'


class ClassSession(db.Model):
    __tablename__ = 'class_sessions'

    id = db.Column(db.Integer, primary_key=True)
    professor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    arena_id = db.Column(db.Integer, db.ForeignKey('arenas.id'), nullable=False)
    date = db.Column(db.Date, nullable=False, default=date.today)
    time = db.Column(db.Time, nullable=False, default=lambda: datetime.now().time())
    group_name = db.Column(db.String(100), nullable=False)  # Turma (Ex: Iniciante Manhã, etc.)
    observations = db.Column(db.Text, nullable=True)
    photo_status = db.Column(db.String(20), default='PENDING', nullable=False)  # 'PENDING', 'RECEIVED', 'READY_TO_SEND'
    created_at = db.Column(db.DateTime, default=datetime.now)

    # Relationships
    attendances = db.relationship('Attendance', backref='class_session', lazy='joined', cascade='all, delete-orphan')
    photos = db.relationship('ClassPhoto', backref='class_session', lazy='joined', cascade='all, delete-orphan')

    @property
    def total_students(self):
        return len(self.attendances)

    @property
    def present_count(self):
        return sum(1 for a in self.attendances if a.present)

    @property
    def absent_count(self):
        return sum(1 for a in self.attendances if not a.present)

    @property
    def attendance_rate(self):
        if not self.attendances:
            return 0
        return round((self.present_count / len(self.attendances)) * 100)

    @property
    def primary_photo(self):
        if self.photos:
            return self.photos[0]
        return None

    @property
    def status_label(self):
        if self.photo_status == 'READY_TO_SEND':
            return 'PREPARADO PARA ENVIO'
        elif self.photo_status == 'RECEIVED':
            return 'FOTO RECEBIDA'
        return 'FOTO PENDENTE'

    @property
    def status_badge_class(self):
        if self.photo_status == 'READY_TO_SEND':
            return 'badge-ready'
        elif self.photo_status == 'RECEIVED':
            return 'badge-received'
        return 'badge-pending'

    @property
    def status_icon(self):
        if self.photo_status == 'READY_TO_SEND':
            return '🔵'
        elif self.photo_status == 'RECEIVED':
            return '🟢'
        return '🟡'

    def __repr__(self):
        return f'<ClassSession #{self.id} {self.group_name} on {self.date}>'


class Attendance(db.Model):
    __tablename__ = 'attendances'

    id = db.Column(db.Integer, primary_key=True)
    class_session_id = db.Column(db.Integer, db.ForeignKey('class_sessions.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    present = db.Column(db.Boolean, default=False, nullable=False)

    def __repr__(self):
        return f'<Attendance class={self.class_session_id} student={self.student_id} present={self.present}>'


class ClassPhoto(db.Model):
    __tablename__ = 'class_photos'

    id = db.Column(db.Integer, primary_key=True)
    class_session_id = db.Column(db.Integer, db.ForeignKey('class_sessions.id'), nullable=False)
    photo_path = db.Column(db.String(255), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.now)

    def __repr__(self):
        return f'<ClassPhoto {self.id} for class={self.class_session_id}>'
