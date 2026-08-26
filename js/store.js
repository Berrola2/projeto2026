/**
 * ==========================================================================
 * SISTEMA DE GESTÃO DE AULAS DE VÔLEI DE PRAIA
 * Gerenciador de Estado e Banco de Dados Local (localStorage)
 * Geração Automática de E-mail: (nome).(arena)@(funcao).com
 * Isolamento Multitenant por Arena (Segurança Estrita para Venda SaaS)
 * ==========================================================================
 */

const ALLOWED_DOMAINS = {
  'prof.com': 'PROFESSOR',
  'adm.com': 'ADMIN',
  'arenaadm.com': 'ADMIN'
};

// Remove acentos, pontuações e espaços para gerar slugs limpos
function sanitizeSlug(text) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9]/g, '')     // remove caracteres especiais
    .toLowerCase();
}

// Gera e-mail no formato oficial: (primeiro_nome).(arena)@(funcao).com
function generateAutomaticEmail(name, arenaName, role) {
  if (!name || !arenaName) return '';
  
  const firstName = sanitizeSlug(name.trim().split(' ')[0]);
  
  // Limpa prefixos comuns de arena como "Arena ", "Praia ", etc.
  let cleanArena = arenaName.replace(/^Arena\s+/i, '').replace(/^Praia\s+/i, '').trim();
  cleanArena = sanitizeSlug(cleanArena.split(' ')[0]);

  const domain = (role === 'PROFESSOR') ? 'prof.com' : 'adm.com';
  
  if (!firstName || !cleanArena) return '';
  return `${firstName}.${cleanArena}@${domain}`;
}

// Gera senha inicial no formato: (primeiro_nome).(5_numeros_aleatorios)
function generateInitialPassword(name) {
  if (!name) return 'prof.12345';
  const firstName = sanitizeSlug(name.trim().split(' ')[0]) || 'prof';
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `${firstName}.${randomDigits}`;
}

// Fotos de amostra em SVG DataURL elegantes para exibição imediata
function generateSamplePhotoSvg(title, arenaName, bgColor, accentColor) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgColor}"/>
        <stop offset="100%" stop-color="#0284c7"/>
      </linearGradient>
      <linearGradient id="sandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#d97706"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#skyGrad)"/>
    <!-- Sol / Círculo Solar -->
    <circle cx="680" cy="120" r="90" fill="${accentColor}" opacity="0.9"/>
    <!-- Faixa de Areia -->
    <path d="M 0,440 Q 200,410 400,430 T 800,420 L 800,600 L 0,600 Z" fill="url(#sandGrad)"/>
    <!-- Rede de Vôlei -->
    <line x1="80" y1="340" x2="720" y2="340" stroke="#ffffff" stroke-width="4"/>
    <line x1="80" y1="400" x2="720" y2="400" stroke="#ffffff" stroke-width="3"/>
    <line x1="80" y1="300" x2="80" y2="480" stroke="#cbd5e1" stroke-width="6"/>
    <line x1="720" y1="300" x2="720" y2="480" stroke="#cbd5e1" stroke-width="6"/>
    <!-- Textos -->
    <text x="50" y="80" fill="#ffffff" font-family="'Plus Jakarta Sans', sans-serif" font-size="28" font-weight="800">🏐 VÔLEI DE PRAIA - REGISTRO OFICIAL</text>
    <text x="50" y="125" fill="#fef08a" font-family="'Plus Jakarta Sans', sans-serif" font-size="22" font-weight="700">${arenaName}</text>
    <text x="50" y="160" fill="#e0f2fe" font-family="'Plus Jakarta Sans', sans-serif" font-size="18">${title}</text>
    <text x="50" y="550" fill="#0f172a" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="600">Registro fotográfico validado em quadra</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Dados Iniciais de Fábrica Multitenant
function getDefaultData() {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const photoIlha = generateSamplePhotoSvg('Turma Iniciante Manhã', 'Arena Ilha', '#0f2b48', '#fbbf24');
  const photoMaroka = generateSamplePhotoSvg('Turma Intermediário Noite', 'Arena Maroka', '#1e3a8a', '#f97316');
  const photoIpanema = generateSamplePhotoSvg('Turma Avançado Tarde', 'Arena Ipanema Beach', '#0e7490', '#f59e0b');

  return {
    currentUser: null,
    arenas: [
      { id: 1, name: 'Arena Ilha', location: 'Praia da Bica, Ilha do Governador - Rio de Janeiro, RJ' },
      { id: 2, name: 'Arena Maroka', location: 'Av. Maroka Beach, Posto 2 - Niterói, RJ' },
      { id: 3, name: 'Arena Ipanema Beach', location: 'Av. Vieira Souto, Posto 9 - Ipanema, Rio de Janeiro, RJ' },
      { id: 4, name: 'Arena Copacabana Sun', location: 'Av. Atlântica, Posto 4 - Copacabana, Rio de Janeiro, RJ' }
    ],
    users: [
      // ARENA ILHA (Isolamento 1)
      { id: 1, name: 'Heitor Augusto', email: 'heitor.ilha@adm.com', role: 'ADMIN', arenaId: 1, phone: '(21) 98888-0001' },
      { id: 2, name: 'Felipe Gabriel', email: 'felipe.ilha@prof.com', role: 'PROFESSOR', arenaId: 1, modality: 'Vôlei de Praia 🏐', initialPassword: 'felipe.74912', phone: '(21) 97777-1001' },
      
      // ARENA MAROKA (Isolamento 2)
      { id: 3, name: 'Marcos Gestor', email: 'marcos.maroka@adm.com', role: 'ADMIN', arenaId: 2, phone: '(21) 98888-0002' },
      { id: 4, name: 'Lucas Treinador', email: 'lucas.maroka@prof.com', role: 'PROFESSOR', arenaId: 2, modality: 'Futevôlei ⚽', initialPassword: 'lucas.83910', phone: '(21) 97777-2002' },

      // OUTRAS ARENAS
      { id: 5, name: 'Carlos Silva', email: 'carlos.ipanema@prof.com', role: 'PROFESSOR', arenaId: 3, modality: 'Vôlei de Praia 🏐', initialPassword: 'carlos.61823', phone: '(21) 97777-3003' },
      { id: 6, name: 'Ana Souza', email: 'ana.copacabana@prof.com', role: 'PROFESSOR', arenaId: 4, modality: 'Beach Tennis 🎾', initialPassword: 'ana.94120', phone: '(21) 97777-4004' }
    ],
    students: [
      // Alunos Arena Ilha (ID: 1)
      { id: 1, name: 'Gabriel Martins', phone: '(21) 99111-2233', email: 'gabriel@email.com', arenaId: 1, groupName: 'Iniciante Manhã' },
      { id: 2, name: 'Beatriz Lima', phone: '(21) 99222-3344', email: 'beatriz@email.com', arenaId: 1, groupName: 'Iniciante Manhã' },
      { id: 3, name: 'Lucas Oliveira', phone: '(21) 99333-4455', email: 'lucas@email.com', arenaId: 1, groupName: 'Iniciante Manhã' },
      { id: 4, name: 'Mariana Costa', phone: '(21) 99444-5566', email: 'mariana@email.com', arenaId: 1, groupName: 'Iniciante Manhã' },
      { id: 5, name: 'Felipe Santos', phone: '(21) 99555-6677', email: 'felipe@email.com', arenaId: 1, groupName: 'Intermediário Noite' },
      { id: 6, name: 'Camila Rocha', phone: '(21) 99666-7788', email: 'camila@email.com', arenaId: 1, groupName: 'Intermediário Noite' },

      // Alunos Arena Maroka (ID: 2)
      { id: 7, name: 'Rodrigo Alves', phone: '(21) 99345-6789', email: 'rodrigo@email.com', arenaId: 2, groupName: 'Iniciante Manhã' },
      { id: 8, name: 'Fernanda Gomes', phone: '(21) 99456-7890', email: 'fernanda@email.com', arenaId: 2, groupName: 'Iniciante Manhã' },
      { id: 9, name: 'Marcelo Dias', phone: '(21) 99567-8901', email: 'marcelo@email.com', arenaId: 2, groupName: 'Intermediário Noite' },
      { id: 10, name: 'Patricia Ramos', phone: '(21) 99678-9012', email: 'patricia@email.com', arenaId: 2, groupName: 'Intermediário Noite' },

      // Alunos Arena Ipanema (ID: 3)
      { id: 11, name: 'Thiago Mendes', phone: '(21) 99777-8899', email: 'thiago@email.com', arenaId: 3, groupName: 'Avançado Tarde' },
      { id: 12, name: 'Juliana Paiva', phone: '(21) 99888-9900', email: 'juliana@email.com', arenaId: 3, groupName: 'Avançado Tarde' },

      // Alunos Arena Copacabana (ID: 4)
      { id: 13, name: 'Vinicius Barbosa', phone: '(21) 99890-1234', email: 'vinicius@email.com', arenaId: 4, groupName: 'Iniciante Manhã' },
      { id: 14, name: 'Aline Guimarães', phone: '(21) 99901-2345', email: 'aline@email.com', arenaId: 4, groupName: 'Iniciante Manhã' }
    ],
    classes: [
      // Aula 1: Prof. Felipe na Arena Ilha (ID: 1) - Enviada WhatsApp
      {
        id: 1,
        professorId: 2,
        arenaId: 1,
        date: today,
        time: '07:30',
        groupName: 'Iniciante Manhã',
        observations: 'Treino de saque e recepção na Arena Ilha.',
        photoStatus: 'READY_TO_SEND',
        photoUrl: photoIlha,
        attendances: [
          { studentId: 1, present: true },
          { studentId: 2, present: true },
          { studentId: 3, present: true },
          { studentId: 4, present: false }
        ]
      },
      // Aula 2: Prof. Felipe na Arena Ilha (ID: 1) - Ontem
      {
        id: 2,
        professorId: 2,
        arenaId: 1,
        date: yesterday,
        time: '18:30',
        groupName: 'Intermediário Noite',
        observations: 'Táticas de bloqueio e levantamento.',
        photoStatus: 'RECEIVED',
        photoUrl: photoIlha,
        attendances: [
          { studentId: 5, present: true },
          { studentId: 6, present: true }
        ]
      },
      // Aula 3: Prof. Lucas na Arena Maroka (ID: 2) - Exclusivo da Maroka!
      {
        id: 3,
        professorId: 4,
        arenaId: 2,
        date: today,
        time: '08:00',
        groupName: 'Iniciante Manhã',
        observations: 'Aula inaugural na Arena Maroka.',
        photoStatus: 'READY_TO_SEND',
        photoUrl: photoMaroka,
        attendances: [
          { studentId: 7, present: true },
          { studentId: 8, present: true }
        ]
      },
      // Aula 4: Prof. Carlos na Arena Ipanema (ID: 3)
      {
        id: 4,
        professorId: 5,
        arenaId: 3,
        date: today,
        time: '16:00',
        groupName: 'Avançado Tarde',
        observations: 'Treino avançado sob vento.',
        photoStatus: 'RECEIVED',
        photoUrl: photoIpanema,
        attendances: [
          { studentId: 11, present: true },
          { studentId: 12, present: true }
        ]
      }
    ]
  };
}

class Store {
  constructor() {
    this.STORAGE_KEY = 'VOLEI_PRAIA_DB_v3';
    this.listeners = [];
    this.state = this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Erro ao carregar localStorage:', e);
    }
    const initial = getDefaultData();
    this.save(initial);
    return initial;
  }

  save(newState) {
    this.state = newState || this.state;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }
    this.notify();

    // Sincroniza automaticamente com o Supabase na nuvem
    if (window.SupabaseSync && typeof window.SupabaseSync.pushToCloud === 'function') {
      window.SupabaseSync.pushToCloud();
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this.state));
  }

  // ----------------------------------------------------
  // GERAÇÃO E VALIDAÇÃO DE E-MAIL AUTOMÁTICO
  // ----------------------------------------------------
  generateEmail(name, arenaName, role) {
    return generateAutomaticEmail(name, arenaName, role);
  }

  validateEmailDomain(email) {
    if (!email || !email.includes('@')) {
      return { valid: false, role: null, error: 'Este e-mail não possui permissão para acessar o sistema.' };
    }
    const parts = email.trim().toLowerCase().split('@');
    if (parts.length !== 2) {
      return { valid: false, role: null, error: 'Este e-mail não possui permissão para acessar o sistema.' };
    }
    const domain = parts[1];
    if (ALLOWED_DOMAINS[domain]) {
      return { valid: true, role: ALLOWED_DOMAINS[domain], error: null };
    }
    return { valid: false, role: null, error: 'Este e-mail não possui permissão para acessar o sistema.' };
  }

  login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const validation = this.validateEmailDomain(cleanEmail);

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    let user = this.state.users.find(u => u.email.toLowerCase() === cleanEmail);

    // Se o usuário não existir no seed, mas possui domínio institucional autorizado, auto-cadastra com arena padrão
    if (!user) {
      user = {
        id: Date.now(),
        name: cleanEmail.split('@')[0].replace('.', ' ').toUpperCase(),
        email: cleanEmail,
        role: validation.role,
        arenaId: 1, // Padrão
        phone: ''
      };
      this.state.users.push(user);
    }

    this.state.currentUser = user;
    this.save();
    return { success: true, user };
  }

  register(name, email, phone, arenaId, role, password, passwordConfirm) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!name || !cleanEmail || !password) {
      return { success: false, error: 'Por favor, preencha todos os campos obrigatórios.' };
    }

    if (password !== passwordConfirm) {
      return { success: false, error: 'As senhas informadas não coincidem.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'A senha deve conter no mínimo 6 caracteres.' };
    }

    const validation = this.validateEmailDomain(cleanEmail);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const exists = this.state.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      this.state.currentUser = exists;
      this.save();
      return { success: true, user: exists };
    }

    const newUser = {
      id: Date.now(),
      name: name.trim(),
      email: cleanEmail,
      role: validation.role,
      arenaId: Number(arenaId) || 1,
      phone: (phone || '').trim()
    };

    this.state.users.push(newUser);
    this.state.currentUser = newUser;
    this.save();
    return { success: true, user: newUser };
  }

  logout() {
    this.state.currentUser = null;
    this.save();
  }

  getCurrentUser() {
    return this.state.currentUser;
  }

  // ----------------------------------------------------
  // ISOLAMENTO MULTITENANT POR ARENA (SEGURANÇA ESTRITA)
  // ----------------------------------------------------
  getUserArenaId() {
    const user = this.getCurrentUser();
    return user ? user.arenaId : null;
  }

  getUserArena() {
    const user = this.getCurrentUser();
    if (!user || !user.arenaId) return null;
    return this.getArenaById(user.arenaId);
  }

  // Retorna aulas respeitando estritamente o isolamento da Arena
  getClasses(filters = {}) {
    const user = this.getCurrentUser();
    let list = [...this.state.classes];

    // Se for PROFESSOR: só vê as suas próprias aulas
    if (user && user.role === 'PROFESSOR') {
      list = list.filter(c => c.professorId === user.id);
    } 
    // Se for GESTOR/ADMIN DA ARENA: SÓ VÊ AULAS DA SUA ARENA!
    else if (user && user.role === 'ADMIN' && user.arenaId) {
      list = list.filter(c => c.arenaId === user.arenaId);
    }

    // Filtros adicionais manuais
    if (filters.professorId) {
      list = list.filter(c => c.professorId === Number(filters.professorId));
    }
    if (filters.arenaId) {
      list = list.filter(c => c.arenaId === Number(filters.arenaId));
    }
    if (filters.date) {
      list = list.filter(c => c.date === filters.date);
    }
    if (filters.groupName && filters.groupName !== 'TODAS') {
      list = list.filter(c => c.groupName === filters.groupName);
    }
    if (filters.photoStatus && filters.photoStatus !== 'TODOS') {
      list = list.filter(c => c.photoStatus === filters.photoStatus);
    }

    // Ordenação decrescente de data/hora
    list.sort((a, b) => {
      const dtA = new Date(`${a.date}T${a.time || '00:00'}`);
      const dtB = new Date(`${b.date}T${b.time || '00:00'}`);
      return dtB - dtA;
    });

    return list;
  }

  getClassById(id) {
    const cls = this.state.classes.find(c => c.id === Number(id));
    if (!cls) return null;

    const user = this.getCurrentUser();
    if (!user) return null;

    // Regra de segurança: se professor, só vê se for dele
    if (user.role === 'PROFESSOR' && cls.professorId !== user.id) {
      return null;
    }
    // Regra de segurança: se gestor de arena, só vê se for da sua arena
    if (user.role === 'ADMIN' && user.arenaId && cls.arenaId !== user.arenaId) {
      return null;
    }

    return cls;
  }

  createClass(data) {
    const user = this.getCurrentUser();
    const newId = this.state.classes.length > 0 ? Math.max(...this.state.classes.map(c => c.id)) + 1 : 1;
    
    const newClass = {
      id: newId,
      professorId: user ? user.id : data.professorId,
      arenaId: Number(data.arenaId) || (user ? user.arenaId : 1),
      date: data.date,
      time: data.time,
      groupName: data.groupName,
      observations: data.observations || '',
      photoStatus: data.photoUrl ? 'RECEIVED' : 'PENDING',
      photoUrl: data.photoUrl || null,
      attendances: data.attendances || []
    };

    this.state.classes.unshift(newClass);
    this.save();
    return newClass;
  }

  attachPhoto(classId, photoUrl) {
    const cls = this.state.classes.find(c => c.id === Number(classId));
    if (!cls) return null;

    cls.photoUrl = photoUrl;
    cls.photoStatus = 'RECEIVED';
    this.save();
    return cls;
  }

  markWhatsAppSent(classId) {
    const cls = this.state.classes.find(c => c.id === Number(classId));
    if (!cls) return null;

    cls.photoStatus = 'READY_TO_SEND';
    this.save();
    return cls;
  }

  // ----------------------------------------------------
  // GESTÃO DE ALUNOS, ARENAS E PROFESSORES (COM ISOLAMENTO)
  // ----------------------------------------------------
  getStudents(arenaId = null, query = '') {
    const user = this.getCurrentUser();
    let list = [...this.state.students];

    // Se o gestor logado tem arenaId fixo, isola apenas para sua arena
    if (user && user.role === 'ADMIN' && user.arenaId) {
      list = list.filter(s => s.arenaId === user.arenaId);
    } else if (arenaId) {
      list = list.filter(s => s.arenaId === Number(arenaId));
    }

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  addStudent(data) {
    const user = this.getCurrentUser();
    const targetArenaId = (user && user.role === 'ADMIN' && user.arenaId) ? user.arenaId : Number(data.arenaId || 1);
    
    const newId = this.state.students.length > 0 ? Math.max(...this.state.students.map(s => s.id)) + 1 : 1;
    const newStudent = {
      id: newId,
      name: data.name,
      phone: data.phone || '',
      email: data.email || '',
      arenaId: targetArenaId,
      groupName: data.groupName || 'Geral'
    };
    this.state.students.push(newStudent);
    this.save();
    return newStudent;
  }

  deleteStudent(id) {
    this.state.students = this.state.students.filter(s => s.id !== Number(id));
    this.save();
  }

  getArenas() {
    const user = this.getCurrentUser();
    let list = [...this.state.arenas];
    
    // Se o gestor for específico de uma arena, destaca/isola
    if (user && user.role === 'ADMIN' && user.arenaId) {
      list = list.filter(a => a.id === user.arenaId);
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  getAllArenasGlobal() {
    return [...this.state.arenas].sort((a, b) => a.name.localeCompare(b.name));
  }

  getArenaById(id) {
    return this.state.arenas.find(a => a.id === Number(id));
  }

  addArena(data) {
    const newId = this.state.arenas.length > 0 ? Math.max(...this.state.arenas.map(a => a.id)) + 1 : 1;
    const newArena = {
      id: newId,
      name: data.name,
      location: data.location
    };
    this.state.arenas.push(newArena);
    this.save();
    return newArena;
  }

  getProfessors() {
    const user = this.getCurrentUser();
    let list = this.state.users.filter(u => u.role === 'PROFESSOR');

    // Se o gestor for de uma arena específica, lista apenas professores da sua arena
    if (user && user.role === 'ADMIN' && user.arenaId) {
      list = list.filter(p => p.arenaId === user.arenaId);
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  getProfessorById(id) {
    return this.state.users.find(u => u.id === Number(id));
  }

  addProfessor(data) {
    const user = this.getCurrentUser();
    const targetArenaId = (user && user.role === 'ADMIN' && user.arenaId) ? user.arenaId : Number(data.arenaId || 1);
    const arenaObj = this.getArenaById(targetArenaId);
    const arenaName = arenaObj ? arenaObj.name : 'Arena';

    // Gera o e-mail automaticamente se não foi fornecido
    let email = data.email;
    if (!email) {
      email = generateAutomaticEmail(data.name, arenaName, 'PROFESSOR');
    }

    const validation = this.validateEmailDomain(email);
    if (!validation.valid || validation.role !== 'PROFESSOR') {
      return { success: false, error: 'O e-mail gerado do professor deve possuir domínio @prof.com.' };
    }

    const generatedPassword = generateInitialPassword(data.name);

    const newId = this.state.users.length > 0 ? Math.max(...this.state.users.map(u => u.id)) + 1 : 1;
    const newProf = {
      id: newId,
      name: data.name,
      email: email.toLowerCase(),
      arenaId: targetArenaId,
      phone: data.phone || '',
      role: 'PROFESSOR',
      modality: data.modality || 'Vôlei de Praia 🏐',
      initialPassword: generatedPassword,
      createdAt: new Date().toISOString()
    };
    this.state.users.push(newProf);
    this.save();
    return { success: true, professor: newProf, generatedPassword, email: email.toLowerCase() };
  }

  deleteProfessor(id) {
    this.state.users = this.state.users.filter(u => u.id !== Number(id));
    this.save();
    return { success: true };
  }

  // ----------------------------------------------------
  // RELATÓRIOS E EXPORTAÇÃO CSV COM ISOLAMENTO DE ARENA
  // ----------------------------------------------------
  getMonthlyMetrics(month, year, professorId = null) {
    const m = Number(month);
    const y = Number(year);
    const user = this.getCurrentUser();

    let classes = this.getClasses().filter(c => {
      const d = new Date(c.date + 'T00:00:00');
      const matchMonth = (d.getMonth() + 1) === m && d.getFullYear() === y;
      if (!matchMonth) return false;
      if (professorId) return c.professorId === Number(professorId);
      return true;
    });

    const totalClasses = classes.length;
    let totalSlots = 0;
    let totalPresents = 0;
    let totalAbsents = 0;
    let totalPhotos = 0;
    let pendingPhotos = 0;

    classes.forEach(c => {
      if (c.attendances) {
        totalSlots += c.attendances.length;
        c.attendances.forEach(a => {
          if (a.present) totalPresents++;
          else totalAbsents++;
        });
      }
      if (c.photoStatus === 'RECEIVED' || c.photoStatus === 'READY_TO_SEND') {
        totalPhotos++;
      } else {
        pendingPhotos++;
      }
    });

    const rate = totalSlots > 0 ? Math.round((totalPresents / totalSlots) * 100) : 0;
    const photoRate = totalClasses > 0 ? Math.round((totalPhotos / totalClasses) * 100) : 0;

    return {
      classes,
      totalClasses,
      totalSlots,
      totalPresents,
      totalAbsents,
      totalPhotos,
      pendingPhotos,
      rate,
      photoRate
    };
  }

  exportCSV(month, year) {
    const m = Number(month);
    const y = Number(year);

    const classes = this.getClasses().filter(c => {
      const d = new Date(c.date + 'T00:00:00');
      return (d.getMonth() + 1) === m && d.getFullYear() === y;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Cabeçalhos em PT-BR com separador ';' e UTF-8 BOM
    let csv = '\ufeffID da Aula;Data;Horário;Arena;Professor;Turma;Total de Alunos;Presentes;Ausentes;Taxa de Presença (%);Status da Foto;Observações\r\n';

    classes.forEach(c => {
      const arena = this.getArenaById(c.arenaId)?.name || '-';
      const prof = this.getProfessorById(c.professorId)?.name || '-';
      const total = c.attendances?.length || 0;
      const presents = c.attendances ? c.attendances.filter(a => a.present).length : 0;
      const absents = total - presents;
      const rate = total > 0 ? Math.round((presents / total) * 100) : 0;

      let statusLabel = 'FOTO PENDENTE';
      if (c.photoStatus === 'READY_TO_SEND') statusLabel = 'PREPARADO PARA ENVIO';
      else if (c.photoStatus === 'RECEIVED') statusLabel = 'FOTO RECEBIDA';

      const dateParts = c.date.split('-');
      const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : c.date;

      const row = [
        c.id,
        formattedDate,
        c.time || '',
        `"${arena}"`,
        `"${prof}"`,
        `"${c.groupName}"`,
        total,
        presents,
        absents,
        `${rate}%`,
        statusLabel,
        `"${(c.observations || '').replace(/"/g, '""')}"`
      ];

      csv += row.join(';') + '\r\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_aulas_${String(m).padStart(2, '0')}_${y}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  resetToDefaults() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.state = getDefaultData();
    this.save();
  }
}

// Instância global do banco de dados
window.store = new Store();
