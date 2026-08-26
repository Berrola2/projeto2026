/**
 * ==========================================================================
 * SISTEMA DE GESTÃO DE AULAS DE VÔLEI DE PRAIA
 * Gerenciador de Estado e Banco de Dados (Suporte a Supabase & Multi-tenant)
 * Suporte a RBAC: SUPER_ADMIN (@dev.com), ADMIN (@adm.com), PROFESSOR (@prof.com)
 * ==========================================================================
 */

const ALLOWED_DOMAINS = {
  'dev.com': 'SUPER_ADMIN',
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
  if (!name) return '';
  
  const firstName = sanitizeSlug(name.trim().split(' ')[0]);
  
  if (role === 'SUPER_ADMIN') {
    return `${firstName || 'dev'}.master@dev.com`;
  }

  // Limpa prefixos comuns de arena como "Arena ", "Praia ", etc.
  let cleanArena = (arenaName || 'arena').replace(/^Arena\s+/i, '').replace(/^Praia\s+/i, '').trim();
  cleanArena = sanitizeSlug(cleanArena.split(' ')[0]) || 'arena';

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

// Dados Iniciais de Fábrica Multitenant com Suporte a DEV/SuperAdmin
function getDefaultData() {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const photoIlha = generateSamplePhotoSvg('Turma Iniciante Manhã', 'Arena Ilha', '#0f2b48', '#fbbf24');
  const photoMaroka = generateSamplePhotoSvg('Turma Intermediário Noite', 'Arena Maroka', '#1e3a8a', '#f97316');
  const photoIpanema = generateSamplePhotoSvg('Turma Avançado Tarde', 'Arena Ipanema Beach', '#0e7490', '#f59e0b');

  return {
    currentUser: null,
    arenas: [
      { id: 1, name: 'Arena Ilha', slug: 'ilha', location: 'Praia da Bica, Ilha do Governador - Rio de Janeiro, RJ' },
      { id: 2, name: 'Arena Maroka', slug: 'maroka', location: 'Av. Maroka Beach, Posto 2 - Niterói, RJ' },
      { id: 3, name: 'Arena Ipanema Beach', slug: 'ipanema', location: 'Av. Vieira Souto, Posto 9 - Ipanema, Rio de Janeiro, RJ' },
      { id: 4, name: 'Arena Copacabana Sun', slug: 'copacabana', location: 'Av. Atlântica, Posto 4 - Copacabana, Rio de Janeiro, RJ' }
    ],
    tenantConfigs: [
      {
        arenaId: 1,
        slug: 'ilha',
        tagline: 'O melhor centro de treinamento de esportes de areia da Ilha',
        primaryColor: '#0369a1',
        accentColor: '#f59e0b',
        whatsappContact: '(21) 9 8888-0001',
        instagram: '@arenailha.beach',
        description: 'Estrutura com 4 quadras iluminadas, vestiários e professores certificados.',
        modalities: ['Vôlei de Praia 🏐', 'Beach Tennis 🎾', 'Funcional de Areia 🏃‍♂️']
      },
      {
        arenaId: 2,
        slug: 'maroka',
        tagline: 'A arena mais vibrante de Niterói para treinar e se divertir',
        primaryColor: '#1e3a8a',
        accentColor: '#ea580c',
        whatsappContact: '(21) 9 8888-0002',
        instagram: '@arenamaroka.oficial',
        description: 'Treinos de Futevôlei e Vôlei de Praia todos os dias do iniciante ao avançado.',
        modalities: ['Futevôlei ⚽', 'Vôlei de Praia 🏐', 'Altinha ☀️']
      },
      {
        arenaId: 3,
        slug: 'ipanema',
        tagline: 'Treine com a vista mais icônica do Rio de Janeiro',
        primaryColor: '#0e7490',
        accentColor: '#f59e0b',
        whatsappContact: '(21) 9 7777-3003',
        instagram: '@ipanemabeach.sports',
        description: 'Metodologia exclusiva para alta performance e aulas recreativas.',
        modalities: ['Vôlei de Praia 🏐', 'Beach Tennis 🎾']
      },
      {
        arenaId: 4,
        slug: 'copacabana',
        tagline: 'Tradição e energia no berço do vôlei de praia mundial',
        primaryColor: '#0284c7',
        accentColor: '#10b981',
        whatsappContact: '(21) 9 7777-4004',
        instagram: '@copasun.arena',
        description: 'Aulas matinais e noturnas para todas as idades no Posto 4.',
        modalities: ['Vôlei de Praia 🏐', 'Beach Tennis 🎾', 'Funcional 🏃‍♂️']
      }
    ],
    users: [
      // SUPER ADMIN / MASTER DEVELOPER (@dev.com)
      { id: 99, name: 'Master Developer', email: 'admin.master@dev.com', role: 'SUPER_ADMIN', arenaId: null, phone: '(21) 9 9999-9999' },

      // ARENA ILHA (Isolamento 1)
      { id: 1, name: 'Heitor Augusto', email: 'heitor.ilha@adm.com', role: 'ADMIN', arenaId: 1, phone: '(21) 9 8888-0001' },
      { id: 2, name: 'Felipe Gabriel', email: 'felipe.ilha@prof.com', role: 'PROFESSOR', arenaId: 1, modality: 'Vôlei de Praia 🏐', initialPassword: 'felipe.74912', phone: '(21) 9 7777-1001' },
      
      // ARENA MAROKA (Isolamento 2)
      { id: 3, name: 'Marcos Gestor', email: 'marcos.maroka@adm.com', role: 'ADMIN', arenaId: 2, phone: '(21) 9 8888-0002' },
      { id: 4, name: 'Lucas Treinador', email: 'lucas.maroka@prof.com', role: 'PROFESSOR', arenaId: 2, modality: 'Futevôlei ⚽', initialPassword: 'lucas.83910', phone: '(21) 9 7777-2002' },

      // OUTRAS ARENAS
      { id: 5, name: 'Carlos Silva', email: 'carlos.ipanema@prof.com', role: 'PROFESSOR', arenaId: 3, modality: 'Vôlei de Praia 🏐', initialPassword: 'carlos.61823', phone: '(21) 9 7777-3003' },
      { id: 6, name: 'Ana Souza', email: 'ana.copacabana@prof.com', role: 'PROFESSOR', arenaId: 4, modality: 'Beach Tennis 🎾', initialPassword: 'ana.94120', phone: '(21) 9 7777-4004' }
    ],
    students: [
      // Alunos Arena Ilha (ID: 1)
      { id: 1, name: 'Gabriel Martins', phone: '(21) 9 9111-2233', email: 'gabriel@email.com', arenaId: 1, groupName: 'Iniciante Manhã' },
      { id: 2, name: 'Beatriz Lima', phone: '(21) 9 9222-3344', email: 'beatriz@email.com', arenaId: 1, groupName: 'Iniciante Manhã' },
      { id: 3, name: 'Lucas Oliveira', phone: '(21) 9 9333-4455', email: 'lucas@email.com', arenaId: 1, groupName: 'Iniciante Manhã' },
      { id: 4, name: 'Mariana Costa', phone: '(21) 9 9444-5566', email: 'mariana@email.com', arenaId: 1, groupName: 'Iniciante Manhã' },
      { id: 5, name: 'Felipe Santos', phone: '(21) 9 9555-6677', email: 'felipe@email.com', arenaId: 1, groupName: 'Intermediário Noite' },
      { id: 6, name: 'Camila Rocha', phone: '(21) 9 9666-7788', email: 'camila@email.com', arenaId: 1, groupName: 'Intermediário Noite' },

      // Alunos Arena Maroka (ID: 2)
      { id: 7, name: 'Rodrigo Alves', phone: '(21) 9 9345-6789', email: 'rodrigo@email.com', arenaId: 2, groupName: 'Iniciante Manhã' },
      { id: 8, name: 'Fernanda Gomes', phone: '(21) 9 9456-7890', email: 'fernanda@email.com', arenaId: 2, groupName: 'Iniciante Manhã' },
      { id: 9, name: 'Marcelo Dias', phone: '(21) 9 9567-8901', email: 'marcelo@email.com', arenaId: 2, groupName: 'Intermediário Noite' },
      { id: 10, name: 'Patricia Ramos', phone: '(21) 9 9678-9012', email: 'patricia@email.com', arenaId: 2, groupName: 'Intermediário Noite' },

      // Alunos Arena Ipanema (ID: 3)
      { id: 11, name: 'Thiago Mendes', phone: '(21) 9 9777-8899', email: 'thiago@email.com', arenaId: 3, groupName: 'Avançado Tarde' },
      { id: 12, name: 'Juliana Paiva', phone: '(21) 9 9888-9900', email: 'juliana@email.com', arenaId: 3, groupName: 'Avançado Tarde' },

      // Alunos Arena Copacabana (ID: 4)
      { id: 13, name: 'Vinicius Barbosa', phone: '(21) 9 9890-1234', email: 'vinicius@email.com', arenaId: 4, groupName: 'Iniciante Manhã' },
      { id: 14, name: 'Aline Guimarães', phone: '(21) 9 9901-2345', email: 'aline@email.com', arenaId: 4, groupName: 'Iniciante Manhã' }
    ],
    classes: [
      // Aula 1: Prof. Felipe na Arena Ilha (ID: 1)
      {
        id: 1,
        professorId: 2,
        arenaId: 1,
        groupName: 'Iniciante Manhã',
        date: today,
        time: '07:00 - 08:30',
        observations: 'Treino de recepção e fundamentos básicos na rede.',
        photoUrl: photoIlha,
        photoStatus: 'READY_TO_SEND',
        attendances: [
          { studentId: 1, present: true },
          { studentId: 2, present: true },
          { studentId: 3, present: true },
          { studentId: 4, present: false }
        ]
      },
      // Aula 2: Prof. Felipe na Arena Ilha (ID: 1)
      {
        id: 2,
        professorId: 2,
        arenaId: 1,
        groupName: 'Intermediário Noite',
        date: yesterday,
        time: '19:00 - 20:30',
        observations: 'Treino de levantamento acelerado e contra-ataque.',
        photoUrl: photoIlha,
        photoStatus: 'RECEIVED',
        attendances: [
          { studentId: 5, present: true },
          { studentId: 6, present: true }
        ]
      },
      // Aula 3: Prof. Lucas na Arena Maroka (ID: 2)
      {
        id: 3,
        professorId: 4,
        arenaId: 2,
        groupName: 'Intermediário Noite',
        date: today,
        time: '18:30 - 20:00',
        observations: 'Treino tático de futevôlei e posicionamento defensivo.',
        photoUrl: photoMaroka,
        photoStatus: 'RECEIVED',
        attendances: [
          { studentId: 7, present: true },
          { studentId: 8, present: true },
          { studentId: 9, present: true },
          { studentId: 10, present: false }
        ]
      }
    ]
  };
}

class Store {
  constructor() {
    this.STORAGE_KEY = 'VOLEI_PRAIA_DB_v4';
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
      return { valid: false, role: null, error: 'E-mail inválido. Utilize um e-mail institucional.' };
    }
    const parts = email.trim().toLowerCase().split('@');
    if (parts.length !== 2) {
      return { valid: false, role: null, error: 'E-mail inválido.' };
    }
    const domain = parts[1];
    if (ALLOWED_DOMAINS[domain]) {
      return { valid: true, role: ALLOWED_DOMAINS[domain], error: null };
    }
    return { valid: false, role: null, error: 'Apenas e-mails institucionais autorizados (@prof.com, @adm.com ou @dev.com) possuem acesso.' };
  }

  login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const validation = this.validateEmailDomain(cleanEmail);

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    let user = this.state.users.find(u => u.email.toLowerCase() === cleanEmail);

    // Se o usuário não existir no seed mas possui domínio institucional autorizado, auto-cadastra
    if (!user) {
      user = {
        id: Date.now(),
        name: cleanEmail.split('@')[0].replace('.', ' ').toUpperCase(),
        email: cleanEmail,
        role: validation.role,
        arenaId: validation.role === 'SUPER_ADMIN' ? null : 1,
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

    const existing = this.state.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'Este e-mail já está cadastrado no sistema.' };
    }

    const newId = this.state.users.length > 0 ? Math.max(...this.state.users.map(u => u.id)) + 1 : 1;
    const newUser = {
      id: newId,
      name,
      email: cleanEmail,
      phone: phone || '',
      arenaId: validation.role === 'SUPER_ADMIN' ? null : Number(arenaId),
      role: validation.role,
      createdAt: new Date().toISOString()
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
  // GESTÃO MULTITENANT GLOBAL (DEV / SUPER_ADMIN)
  // ----------------------------------------------------
  getGlobalMetrics() {
    const totalArenas = this.state.arenas.length;
    const totalUsers = this.state.users.length;
    const totalProfessors = this.state.users.filter(u => u.role === 'PROFESSOR').length;
    const totalManagers = this.state.users.filter(u => u.role === 'ADMIN').length;
    const totalStudents = this.state.students.length;
    const totalClasses = this.state.classes.length;
    const totalPhotos = this.state.classes.filter(c => c.photoUrl).length;

    const arenaStats = this.state.arenas.map(a => {
      const cls = this.state.classes.filter(c => c.arenaId === a.id);
      const st = this.state.students.filter(s => s.arenaId === a.id);
      const pr = this.state.users.filter(u => u.role === 'PROFESSOR' && u.arenaId === a.id);
      const mg = this.state.users.filter(u => u.role === 'ADMIN' && u.arenaId === a.id);
      return {
        arena: a,
        classesCount: cls.length,
        studentsCount: st.length,
        professorsCount: pr.length,
        managersCount: mg.length
      };
    });

    return {
      totalArenas,
      totalUsers,
      totalProfessors,
      totalManagers,
      totalStudents,
      totalClasses,
      totalPhotos,
      arenaStats
    };
  }

  getTenantConfig(arenaIdOrSlug) {
    if (!this.state.tenantConfigs) this.state.tenantConfigs = [];
    
    let config = this.state.tenantConfigs.find(c => c.arenaId === Number(arenaIdOrSlug) || c.slug === arenaIdOrSlug);
    if (!config) {
      const arena = this.getArenaById(arenaIdOrSlug) || this.state.arenas.find(a => a.slug === arenaIdOrSlug);
      if (arena) {
        config = {
          arenaId: arena.id,
          slug: arena.slug || sanitizeSlug(arena.name),
          tagline: `Aulas e Treinos de Esportes de Areia na ${arena.name}`,
          primaryColor: '#0369a1',
          accentColor: '#f59e0b',
          whatsappContact: '(21) 9 9999-9999',
          instagram: `@${sanitizeSlug(arena.name)}.beach`,
          description: `Venha treinar com a melhor estrutura na ${arena.location}.`,
          modalities: ['Vôlei de Praia 🏐', 'Beach Tennis 🎾', 'Futevôlei ⚽']
        };
      }
    }
    return config;
  }

  saveTenantConfig(arenaId, config) {
    if (!this.state.tenantConfigs) this.state.tenantConfigs = [];
    const index = this.state.tenantConfigs.findIndex(c => c.arenaId === Number(arenaId));
    if (index >= 0) {
      this.state.tenantConfigs[index] = { ...this.state.tenantConfigs[index], ...config };
    } else {
      this.state.tenantConfigs.push({ arenaId: Number(arenaId), ...config });
    }
    this.save();
  }

  // ----------------------------------------------------
  // GESTÃO DE AULAS COM ISOLAMENTO POR ARENA
  // ----------------------------------------------------
  getClasses(filters = {}) {
    const user = this.getCurrentUser();
    let list = [...this.state.classes];

    // Se for gestor (ADMIN), isola obrigatoriamente para a sua arena
    if (user && user.role === 'ADMIN' && user.arenaId) {
      list = list.filter(c => c.arenaId === user.arenaId);
    } else if (user && user.role === 'PROFESSOR') {
      list = list.filter(c => c.professorId === user.id);
    } else if (filters.arenaId) {
      list = list.filter(c => c.arenaId === Number(filters.arenaId));
    }

    if (filters.date) {
      list = list.filter(c => c.date === filters.date);
    }
    if (filters.professorId) {
      list = list.filter(c => c.professorId === Number(filters.professorId));
    }
    if (filters.groupName && filters.groupName !== 'TODAS') {
      list = list.filter(c => c.groupName === filters.groupName);
    }

    return list.sort((a, b) => new Date(b.date + 'T' + (b.time?.split(' ')[0] || '00:00')) - new Date(a.date + 'T' + (a.time?.split(' ')[0] || '00:00')));
  }

  getClassById(id) {
    const cls = this.state.classes.find(c => c.id === Number(id));
    if (!cls) return null;

    const user = this.getCurrentUser();
    // Se for gestor e a aula não for da arena dele, bloqueia (RBAC / Multitenant)
    if (user && user.role === 'ADMIN' && user.arenaId && cls.arenaId !== user.arenaId) {
      return null;
    }
    // Se for professor e a aula não for dele, bloqueia
    if (user && user.role === 'PROFESSOR' && cls.professorId !== user.id) {
      return null;
    }

    return cls;
  }

  createClass(classData) {
    const user = this.getCurrentUser();
    const targetArenaId = (user && user.role === 'ADMIN' && user.arenaId) ? user.arenaId : (classData.arenaId ? Number(classData.arenaId) : (user?.arenaId || 1));
    const targetProfId = (user && user.role === 'PROFESSOR') ? user.id : Number(classData.professorId || user?.id || 1);

    const newId = this.state.classes.length > 0 ? Math.max(...this.state.classes.map(c => c.id)) + 1 : 1;
    const newClass = {
      id: newId,
      date: classData.date,
      time: classData.time || '07:00 - 08:30',
      arenaId: targetArenaId,
      professorId: targetProfId,
      groupName: classData.groupName || 'Iniciante Manhã',
      observations: classData.observations || '',
      photoUrl: classData.photoUrl || null,
      photoStatus: classData.photoUrl ? 'RECEIVED' : 'PENDING',
      attendances: classData.attendances || [],
      createdAt: new Date().toISOString()
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
  // GESTÃO DE ALUNOS, ARENAS E PROFESSORES
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
      groupName: data.groupName || 'Iniciante Manhã'
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

  getArenaById(idOrSlug) {
    return this.state.arenas.find(a => a.id === Number(idOrSlug) || a.slug === idOrSlug);
  }

  addArena(data) {
    const newId = this.state.arenas.length > 0 ? Math.max(...this.state.arenas.map(a => a.id)) + 1 : 1;
    const slug = data.slug || sanitizeSlug(data.name.replace(/^Arena\s+/i, ''));
    const newArena = {
      id: newId,
      name: data.name,
      slug: slug,
      location: data.location
    };
    this.state.arenas.push(newArena);

    // Inicializa a configuração da landing page da nova arena
    this.saveTenantConfig(newId, {
      slug,
      tagline: data.tagline || `Aulas e Treinos de Esportes de Areia na ${data.name}`,
      primaryColor: data.primaryColor || '#0369a1',
      accentColor: data.accentColor || '#f59e0b',
      whatsappContact: data.whatsappContact || '(21) 9 9999-9999',
      instagram: data.instagram || `@${slug}.beach`,
      description: data.description || `Estrutura de ponta na ${data.location}.`,
      modalities: ['Vôlei de Praia 🏐', 'Beach Tennis 🎾', 'Futevôlei ⚽']
    });

    this.save();
    return newArena;
  }

  deleteArena(id) {
    const arenaId = Number(id);
    this.state.arenas = this.state.arenas.filter(a => a.id !== arenaId);
    this.state.users = this.state.users.filter(u => u.arenaId !== arenaId);
    this.state.students = this.state.students.filter(s => s.arenaId !== arenaId);
    this.state.classes = this.state.classes.filter(c => c.arenaId !== arenaId);
    if (this.state.tenantConfigs) {
      this.state.tenantConfigs = this.state.tenantConfigs.filter(c => c.arenaId !== arenaId);
    }
    this.save();
    return { success: true };
  }

  getProfessors(arenaId = null) {
    const user = this.getCurrentUser();
    let list = this.state.users.filter(u => u.role === 'PROFESSOR');

    // Se o gestor for de uma arena específica, lista apenas professores da sua arena
    if (user && user.role === 'ADMIN' && user.arenaId) {
      list = list.filter(p => p.arenaId === user.arenaId);
    } else if (arenaId) {
      list = list.filter(p => p.arenaId === Number(arenaId));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  getManagers(arenaId = null) {
    let list = this.state.users.filter(u => u.role === 'ADMIN');
    if (arenaId) {
      list = list.filter(m => m.arenaId === Number(arenaId));
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

  addManager(data) {
    const targetArenaId = Number(data.arenaId || 1);
    const arenaObj = this.getArenaById(targetArenaId);
    const arenaName = arenaObj ? arenaObj.name : 'Arena';

    let email = data.email;
    if (!email) {
      email = generateAutomaticEmail(data.name, arenaName, 'ADMIN');
    }

    const validation = this.validateEmailDomain(email);
    if (!validation.valid || validation.role !== 'ADMIN') {
      return { success: false, error: 'O e-mail gerado do gestor deve possuir domínio @adm.com.' };
    }

    const generatedPassword = generateInitialPassword(data.name);

    const newId = this.state.users.length > 0 ? Math.max(...this.state.users.map(u => u.id)) + 1 : 1;
    const newManager = {
      id: newId,
      name: data.name,
      email: email.toLowerCase(),
      arenaId: targetArenaId,
      phone: data.phone || '',
      role: 'ADMIN',
      initialPassword: generatedPassword,
      createdAt: new Date().toISOString()
    };
    this.state.users.push(newManager);
    this.save();
    return { success: true, manager: newManager, generatedPassword, email: email.toLowerCase() };
  }

  deleteProfessor(id) {
    this.state.users = this.state.users.filter(u => u.id !== Number(id));
    this.save();
    return { success: true };
  }

  deleteManager(id) {
    this.state.users = this.state.users.filter(u => u.id !== Number(id));
    this.save();
    return { success: true };
  }

  // ----------------------------------------------------
  // RELATÓRIOS E EXPORTAÇÃO CSV
  // ----------------------------------------------------
  getMonthlyMetrics(month, year, professorId = null, arenaId = null) {
    const user = this.getCurrentUser();
    let list = this.state.classes.filter(c => {
      const d = new Date(c.date + 'T00:00:00');
      return (d.getMonth() + 1) === Number(month) && d.getFullYear() === Number(year);
    });

    if (user && user.role === 'ADMIN' && user.arenaId) {
      list = list.filter(c => c.arenaId === user.arenaId);
    } else if (arenaId) {
      list = list.filter(c => c.arenaId === Number(arenaId));
    }

    if (professorId) {
      list = list.filter(c => c.professorId === Number(professorId));
    }

    let totalPresents = 0;
    let totalSlots = 0;
    let totalPhotos = 0;

    list.forEach(c => {
      if (c.photoUrl) totalPhotos++;
      if (c.attendances) {
        totalSlots += c.attendances.length;
        c.attendances.forEach(att => {
          if (att.present) totalPresents++;
        });
      }
    });

    const totalAbsents = totalSlots - totalPresents;
    const rate = totalSlots > 0 ? Math.round((totalPresents / totalSlots) * 100) : 0;
    const photoRate = list.length > 0 ? Math.round((totalPhotos / list.length) * 100) : 0;

    return {
      totalClasses: list.length,
      totalPresents,
      totalAbsents,
      totalSlots,
      rate,
      totalPhotos,
      photoRate,
      pendingPhotos: list.length - totalPhotos,
      classes: list
    };
  }

  exportCSV(month, year) {
    const user = this.getCurrentUser();
    const metrics = this.getMonthlyMetrics(month, year);
    const professors = this.getProfessors();
    const arena = user?.arenaId ? this.getArenaById(user.arenaId) : null;
    const arenaTitle = arena ? arena.name : 'Todas as Arenas';

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += `RELATORIO CONSOLIDADO DE AULAS DE VOLEI DE PRAIA - ${arenaTitle.toUpperCase()}\n`;
    csvContent += `Mes de Referencia:;${month}/${year}\n`;
    csvContent += `Data de Emissao:;${new Date().toLocaleDateString('pt-BR')}\n\n`;

    csvContent += 'DESEMPENHO DOS PROFESSORES\n';
    csvContent += 'Professor;Login;Aulas Dadas;Presencas Totais;Faltas;Taxa de Frequencia (%);Fotos Entregues\n';

    professors.forEach(p => {
      const stats = this.getMonthlyMetrics(month, year, p.id);
      csvContent += `"${p.name}";"${p.email}";${stats.totalClasses};${stats.totalPresents};${stats.totalAbsents};${stats.rate}%;${stats.totalPhotos}/${stats.totalClasses}\n`;
    });

    csvContent += '\nDETALHAMENTO DE TODAS AS AULAS\n';
    csvContent += 'Data;Horario;Arena;Turma;Professor;Alunos Presentes;Total Alunos;Frequencia (%);Status Foto\n';

    metrics.classes.forEach(c => {
      const p = this.getProfessorById(c.professorId);
      const a = this.getArenaById(c.arenaId);
      const total = c.attendances?.length || 0;
      const presents = c.attendances ? c.attendances.filter(att => att.present).length : 0;
      const rate = total > 0 ? Math.round((presents / total) * 100) : 0;
      csvContent += `"${c.date}";"${c.time}";"${a ? a.name : ''}";"${c.groupName}";"${p ? p.name : ''}";${presents};${total};${rate}%;"${c.photoStatus}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_volei_${arenaTitle.replace(/\s+/g, '_').toLowerCase()}_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

window.store = new Store();
