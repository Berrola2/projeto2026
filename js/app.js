/**
 * ==========================================================================
 * SISTEMA DE GESTÃO DE AULAS DE VÔLEI DE PRAIA
 * Roteador de Telas (SPA), Navegação, Modais e Renderização
 * Suporte a SUPER_ADMIN (@dev.com), Landing Pages de Arena e Multi-Tenant
 * Padrão de E-mail: (nome + primeira letra do Sobrenome).(arena)@(funcao).com
 * ==========================================================================
 */

const App = {
  currentRoute: '',
  selectedDevTab: 'arenas',

  maskPhone(value) {
    if (!value) return '';
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2) {
      return `(${digits}`;
    }
    if (digits.length <= 3) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  },

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());

    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-close-modal]') || e.target.classList.contains('modal-backdrop')) {
        const modal = e.target.closest('.modal-backdrop');
        if (modal) this.closeModal(modal.id);
      }
    });

    // Máscara automática de telefone padrão: (XX) X XXXX-XXXX
    document.addEventListener('input', (e) => {
      if (e.target && (e.target.matches('input[type="tel"]') || e.target.id.includes('phone') || e.target.id.includes('Phone'))) {
        e.target.value = this.maskPhone(e.target.value);
      }
    });

    if (!window.location.hash) {
      const user = window.store.getCurrentUser();
      if (!user) {
        window.location.hash = '#/login';
      } else if (user.role === 'SUPER_ADMIN') {
        window.location.hash = '#/dev';
      } else if (user.role === 'ADMIN') {
        window.location.hash = '#/admin';
      } else {
        window.location.hash = '#/professor';
      }
    } else {
      this.handleRoute();
    }

    window.store.subscribe(() => {
      this.renderNav();
    });
  },

  navigate(hash) {
    window.location.hash = hash;
  },

  handleRoute() {
    let hash = window.location.hash || '#/login';
    
    // Bloqueia cadastro público: apenas gestores e dev criam acessos
    if (hash === '#/cadastro') {
      hash = '#/login';
      window.location.hash = '#/login';
    }

    this.currentRoute = hash;
    const user = window.store.getCurrentUser();

    // 1. Rotas Públicas (Sem necessidade de Login)
    if (hash.startsWith('#/arena/')) {
      const arenaSlugOrId = hash.replace('#/arena/', '');
      this.renderArenaLandingPage(arenaSlugOrId);
      return;
    }
    if (hash === '#/login') {
      this.renderLogin();
      return;
    }

    // Se não estiver autenticado, redireciona para login
    if (!user) {
      this.showToast('Por favor, faça login para acessar o sistema.', 'warning');
      this.navigate('#/login');
      return;
    }

    this.renderNav();

    // 2. Rota de Super Administrador (DEV / Master @dev.com)
    if (hash === '#/dev' || hash.startsWith('#/dev/')) {
      if (user.role !== 'SUPER_ADMIN') {
        this.showToast('Acesso restrito a desenvolvedores e master admins (@dev.com).', 'danger');
        this.navigate(user.role === 'ADMIN' ? '#/admin' : '#/professor');
        return;
      }
      this.renderSuperAdminDashboard();
      return;
    }

    // 3. Roteamento baseado em RBAC
    if (hash === '#/professor') {
      if (user.role !== 'PROFESSOR' && user.role !== 'SUPER_ADMIN') {
        this.showToast('Você não possui permissão para acessar esta área.', 'danger');
        this.navigate('#/admin');
        return;
      }
      this.renderProfessorDashboard();
    } else if (hash === '#/aula/nova') {
      if (user.role !== 'PROFESSOR' && user.role !== 'SUPER_ADMIN') {
        this.showToast('Você não possui permissão para acessar esta área.', 'danger');
        this.navigate('#/admin');
        return;
      }
      window.QuickClass.init();
      this.showView('quickClassView');
    } else if (hash.startsWith('#/aula/')) {
      const id = hash.replace('#/aula/', '');
      this.renderClassDetail(id);
    } else if (hash === '#/fechamento') {
      if (user.role !== 'PROFESSOR' && user.role !== 'SUPER_ADMIN') {
        this.showToast('Você não possui permissão para acessar esta área.', 'danger');
        this.navigate('#/admin');
        return;
      }
      this.renderMonthlyClose();
    } else if (hash === '#/admin') {
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        this.showToast('Você não possui permissão para acessar esta área.', 'danger');
        this.navigate('#/professor');
        return;
      }
      this.renderAdminDashboard();
    } else if (hash === '#/galeria') {
      window.Gallery.init();
      this.showView('galleryView');
    } else if (hash === '#/relatorios') {
      window.Reports.init();
      this.showView('reportsView');
    } else if (hash === '#/alunos') {
      this.renderStudents();
    } else if (hash === '#/arenas') {
      this.renderArenas();
    } else if (hash === '#/professores') {
      this.renderProfessores();
    } else if (hash === '#/calendario') {
      this.renderCalendar();
    } else {
      if (user.role === 'SUPER_ADMIN') this.navigate('#/dev');
      else if (user.role === 'ADMIN') this.navigate('#/admin');
      else this.navigate('#/professor');
    }
  },

  showView(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) {
      target.classList.add('active');
      window.scrollTo(0, 0);
    }
  },

  // ----------------------------------------------------
  // CABEÇALHO & BARRA DE NAVEGAÇÃO
  // ----------------------------------------------------
  renderNav() {
    const user = window.store.getCurrentUser();
    const headerNav = document.getElementById('headerNavDesktop');
    const bottomNav = document.getElementById('bottomNavMobile');

    if (!user) {
      if (headerNav) headerNav.innerHTML = '';
      if (bottomNav) bottomNav.innerHTML = '';
      return;
    }

    const arenaObj = user.arenaId ? window.store.getArenaById(user.arenaId) : null;
    const arenaName = arenaObj ? arenaObj.name : (user.role === 'SUPER_ADMIN' ? 'Global SaaS' : 'Minha Arena');
    const initial = user.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

    // 1. Navegação Desktop
    if (headerNav) {
      if (user.role === 'SUPER_ADMIN') {
        headerNav.innerHTML = `
          <button class="nav-link ${this.currentRoute === '#/dev' ? 'active' : ''}" onclick="App.navigate('#/dev')">
            <span>⚡</span> Painel Master
          </button>
          <button class="nav-link ${this.currentRoute === '#/arenas' ? 'active' : ''}" onclick="App.navigate('#/arenas')">
            <span>🏖️</span> Arenas & Sites
          </button>
          <button class="nav-link ${this.currentRoute === '#/professores' ? 'active' : ''}" onclick="App.navigate('#/professores')">
            <span>👨‍🏫</span> Professores
          </button>
          <button class="nav-link ${this.currentRoute === '#/alunos' ? 'active' : ''}" onclick="App.navigate('#/alunos')">
            <span>👥</span> Alunos
          </button>
          <button class="nav-link ${this.currentRoute === '#/galeria' ? 'active' : ''}" onclick="App.navigate('#/galeria')">
            <span>📸</span> Galeria Global
          </button>
          <button class="nav-link ${this.currentRoute === '#/relatorios' ? 'active' : ''}" onclick="App.navigate('#/relatorios')">
            <span>📈</span> Relatórios
          </button>
          <div class="user-badge-header">
            <div class="user-badge-avatar" style="background: linear-gradient(135deg, #8b5cf6, #ec4899);">${initial}</div>
            <div class="user-badge-text">
              <span>${user.name}</span>
            </div>
            <span class="user-badge-arena-tag" style="background: rgba(168, 85, 247, 0.25); border-color: #d8b4fe; color: #f3e8ff;">
              🛠️ DEV / MASTER
            </span>
            <span class="role-pill" style="background: #a855f7; color: white;">SUPER ADMIN</span>
            <button class="user-badge-logout" onclick="App.handleLogout()" title="Sair do Sistema">🚪</button>
          </div>
        `;
      } else if (user.role === 'PROFESSOR') {
        headerNav.innerHTML = `
          <button class="nav-link ${this.currentRoute === '#/professor' ? 'active' : ''}" onclick="App.navigate('#/professor')">
            <span>📊</span> Painel
          </button>
          <button class="nav-link ${this.currentRoute === '#/aula/nova' ? 'active' : ''}" onclick="App.navigate('#/aula/nova')">
            <span>⚡</span> Nova Aula
          </button>
          <button class="nav-link ${this.currentRoute === '#/fechamento' ? 'active' : ''}" onclick="App.navigate('#/fechamento')">
            <span>📅</span> Fechamento
          </button>
          <div class="user-badge-header">
            <div class="user-badge-avatar">${initial}</div>
            <div class="user-badge-text">
              <span>${user.name}</span>
            </div>
            <span class="user-badge-arena-tag">📍 ${arenaName}</span>
            <span class="role-pill role-pill-professor">Professor</span>
            <button class="user-badge-logout" onclick="App.handleLogout()" title="Sair do Sistema">🚪</button>
          </div>
        `;
      } else {
        headerNav.innerHTML = `
          <button class="nav-link ${this.currentRoute === '#/admin' ? 'active' : ''}" onclick="App.navigate('#/admin')">
            <span>📊</span> Painel
          </button>
          <button class="nav-link ${this.currentRoute === '#/galeria' ? 'active' : ''}" onclick="App.navigate('#/galeria')">
            <span>📸</span> Galeria
          </button>
          <button class="nav-link ${this.currentRoute === '#/relatorios' ? 'active' : ''}" onclick="App.navigate('#/relatorios')">
            <span>📈</span> Relatórios
          </button>
          <button class="nav-link ${this.currentRoute === '#/alunos' ? 'active' : ''}" onclick="App.navigate('#/alunos')">
            <span>👥</span> Alunos
          </button>
          <button class="nav-link ${this.currentRoute === '#/professores' ? 'active' : ''}" onclick="App.navigate('#/professores')">
            <span>👨‍🏫</span> Professores
          </button>
          <button class="nav-link ${this.currentRoute === '#/calendario' ? 'active' : ''}" onclick="App.navigate('#/calendario')">
            <span>🗓️</span> Calendário
          </button>
          <div class="user-badge-header">
            <div class="user-badge-avatar" style="background: linear-gradient(135deg, #0284c7, #0369a1);">${initial}</div>
            <div class="user-badge-text">
              <span>${user.name}</span>
            </div>
            <span class="user-badge-arena-tag">📍 ${arenaName}</span>
            <span class="role-pill role-pill-admin">Gestor</span>
            <button class="user-badge-logout" onclick="App.handleLogout()" title="Sair do Sistema">🚪</button>
          </div>
        `;
      }
    }

    // 2. Navegação Mobile Inferior
    if (bottomNav) {
      if (user.role === 'SUPER_ADMIN') {
        bottomNav.innerHTML = `
          <a class="bottom-nav-item ${this.currentRoute === '#/dev' ? 'active' : ''}" onclick="App.navigate('#/dev')">
            <span class="icon">⚡</span>
            <span>Master</span>
          </a>
          <a class="bottom-nav-item ${this.currentRoute === '#/arenas' ? 'active' : ''}" onclick="App.navigate('#/arenas')">
            <span class="icon">🏖️</span>
            <span>Arenas</span>
          </a>
          <a class="bottom-nav-item ${this.currentRoute === '#/galeria' ? 'active' : ''}" onclick="App.navigate('#/galeria')">
            <span class="icon">📸</span>
            <span>Galeria</span>
          </a>
          <a class="bottom-nav-item" onclick="App.handleLogout()">
            <span class="icon">🚪</span>
            <span>Sair</span>
          </a>
        `;
      } else if (user.role === 'PROFESSOR') {
        bottomNav.innerHTML = `
          <a class="bottom-nav-item ${this.currentRoute === '#/professor' ? 'active' : ''}" onclick="App.navigate('#/professor')">
            <span class="icon">📊</span>
            <span>Meu Painel</span>
          </a>
          <a class="bottom-nav-item highlight" onclick="App.navigate('#/aula/nova')">
            <div class="icon-wrapper">⚡</div>
            <span>Nova Aula</span>
          </a>
          <a class="bottom-nav-item ${this.currentRoute === '#/fechamento' ? 'active' : ''}" onclick="App.navigate('#/fechamento')">
            <span class="icon">📅</span>
            <span>Fechamento</span>
          </a>
          <a class="bottom-nav-item" onclick="App.handleLogout()">
            <span class="icon">🚪</span>
            <span>Sair</span>
          </a>
        `;
      } else {
        bottomNav.innerHTML = `
          <a class="bottom-nav-item ${this.currentRoute === '#/admin' ? 'active' : ''}" onclick="App.navigate('#/admin')">
            <span class="icon">📊</span>
            <span>Painel</span>
          </a>
          <a class="bottom-nav-item ${this.currentRoute === '#/galeria' ? 'active' : ''}" onclick="App.navigate('#/galeria')">
            <span class="icon">📸</span>
            <span>Fotos</span>
          </a>
          <a class="bottom-nav-item ${this.currentRoute === '#/relatorios' ? 'active' : ''}" onclick="App.navigate('#/relatorios')">
            <span class="icon">📈</span>
            <span>Relatórios</span>
          </a>
          <a class="bottom-nav-item ${this.currentRoute === '#/alunos' ? 'active' : ''}" onclick="App.navigate('#/alunos')">
            <span class="icon">👥</span>
            <span>Alunos</span>
          </a>
          <a class="bottom-nav-item ${this.currentRoute === '#/professores' ? 'active' : ''}" onclick="App.navigate('#/professores')">
            <span class="icon">👨‍🏫</span>
            <span>Professores</span>
          </a>
          <a class="bottom-nav-item" onclick="App.handleLogout()">
            <span class="icon">🚪</span>
            <span>Sair</span>
          </a>
        `;
      }
    }
  },

  // ----------------------------------------------------
  // LOGIN (SEM CADASTRO PÚBLICO E COM ATALHOS LIMPOS)
  // ----------------------------------------------------
  renderLogin() {
    const container = document.getElementById('loginView');
    if (!container) return;

    container.innerHTML = `
      <div style="max-width: 460px; margin: 2rem auto;">
        
        <div style="text-align: center; margin-bottom: 2rem;">
          <div style="width: 76px; height: 76px; background: linear-gradient(135deg, #f59e0b, #f97316); border-radius: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 2.75rem; margin-bottom: 1rem; box-shadow: 0 10px 25px rgba(245, 158, 11, 0.35);">
            🏐
          </div>
          <h1 style="font-size: 1.85rem; color: #0f172a; margin-bottom: 0.25rem;">Vôlei de Praia Brasil</h1>
          <p style="color: #64748b; font-size: 0.95rem;">Plataforma SaaS Multi-Arenas de Gestão de Aulas</p>
        </div>

        <div class="card" style="padding: 1.85rem; border-radius: 22px; box-shadow: var(--shadow-lg);">
          <h2 style="font-size: 1.3rem; margin-bottom: 1.25rem; color: var(--primary-deep); text-align: center;">Acessar o Sistema</h2>

          <form onsubmit="App.handleLogin(event)">
            <div class="form-group">
              <label for="loginEmail" class="form-label">E-mail / Login Institucional</label>
              <input 
                type="email" 
                id="loginEmail" 
                class="form-control" 
                placeholder="(nome).(arena)@prof.com ou @adm.com" 
                required 
                autofocus
              >
            </div>

            <div class="form-group">
              <label for="loginPassword" class="form-label">Senha</label>
              <input type="password" id="loginPassword" class="form-control" placeholder="••••••••" value="senha123" required>
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg" style="margin-top: 1.5rem;">
              <span>🏐</span> Entrar na Conta
            </button>
          </form>
        </div>

        <!-- DEMO RÁPIDO DE ACESSOS (MULTI-PERFIS) -->
        <div style="background: #f8fafc; border-radius: 16px; padding: 1.2rem; margin-top: 1.5rem; font-size: 0.85rem; color: #475569; border: 1px solid #e2e8f0;">
          <strong style="color: #0f172a; display: block; margin-bottom: 0.5rem;">🔑 Atalhos para Teste:</strong>
          
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <button class="btn btn-sand btn-sm" onclick="App.quickFillLogin('felipeg.ilha@prof.com', 'felipe.74912')">
              👨‍🏫 Prof. Felipe (felipeg.ilha@prof.com)
            </button>
            <button class="btn btn-primary btn-sm" onclick="App.quickFillLogin('heitora.ilha@adm.com', 'senha123')">
              🛡️ Gestor Heitor (heitora.ilha@adm.com)
            </button>
            <button class="btn btn-secondary btn-sm" style="background: #7c3aed; color: white; border: none;" onclick="App.quickFillLogin('admin.master@dev.com', 'senha123')">
              🛠️ Master Dev (@dev.com - Super Admin Global)
            </button>
          </div>
        </div>

      </div>
    `;

    this.showView('loginView');
  },

  quickFillLogin(email, pass) {
    const e = document.getElementById('loginEmail');
    const p = document.getElementById('loginPassword');
    if (e) e.value = email;
    if (p) p.value = pass;
  },

  handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;

    const result = window.store.login(email, pass);
    if (result.success) {
      this.showToast(`Bem-vindo(a), ${result.user.name}!`, 'success');
      if (result.user.role === 'SUPER_ADMIN') {
        this.navigate('#/dev');
      } else if (result.user.role === 'ADMIN') {
        this.navigate('#/admin');
      } else {
        this.navigate('#/professor');
      }
    } else {
      this.showToast(result.error, 'danger');
    }
  },

  handleLogout() {
    window.store.logout();
    this.showToast('Sessão encerrada com sucesso.', 'info');
    this.navigate('#/login');
  },

  // ----------------------------------------------------
  // PAINEL MASTER / SUPER ADMIN (DEV @dev.com)
  // ----------------------------------------------------
  renderSuperAdminDashboard() {
    const container = document.getElementById('superAdminDashboardView');
    if (!container) return;

    const metrics = window.store.getGlobalMetrics();
    const arenas = window.store.getAllArenasGlobal();
    const managers = window.store.getManagers();

    container.innerHTML = `
      <div>
        
        <!-- HEADER MASTER DEV -->
        <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); color: white; padding: 1.75rem 2rem; border-radius: var(--radius-lg); margin-bottom: 2rem; box-shadow: var(--shadow-lg);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span style="font-size: 0.8rem; font-weight: 800; color: #c7d2fe; text-transform: uppercase; letter-spacing: 0.08em; background: rgba(255,255,255,0.15); padding: 0.2rem 0.6rem; border-radius: var(--radius-full);">
                🛠️ Painel Global de Engenharia / Master
              </span>
              <h1 style="font-size: 2.1rem; color: white; margin-top: 0.4rem; font-family: var(--font-heading);">
                Controle Master Multi-Tenant ⚡
              </h1>
              <p style="color: #e0e7ff; font-size: 0.95rem; margin-top: 0.25rem;">
                Gerenciamento global de Arenas, Gestores, Landing Pages e provisionamento instantâneo de novos ambientes SaaS.
              </p>
            </div>

            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-sand" onclick="App.openNewArenaModal()">
                <span>➕</span> Provisionar Nova Arena & Gestor
              </button>
              <button class="btn btn-primary" onclick="App.openNewManagerModal()">
                <span>🛡️</span> Cadastrar Gestor
              </button>
            </div>
          </div>
        </div>

        <!-- KPIS GLOBAIS DO SAAS -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon">🏖️</div>
            <div class="kpi-label">Arenas Ativas</div>
            <div class="kpi-value">${metrics.totalArenas}</div>
            <div style="font-size: 0.75rem; color: var(--primary-ocean);">Instâncias Multi-tenant</div>
          </div>

          <div class="kpi-card emerald">
            <div class="kpi-icon">👥</div>
            <div class="kpi-label">Alunos Globais</div>
            <div class="kpi-value">${metrics.totalStudents}</div>
            <div style="font-size: 0.75rem; color: #059669;">Em todas as arenas</div>
          </div>

          <div class="kpi-card gold">
            <div class="kpi-icon">👨‍🏫</div>
            <div class="kpi-label">Professores</div>
            <div class="kpi-value">${metrics.totalProfessors}</div>
            <div style="font-size: 0.75rem; color: #d97706;">${metrics.totalManagers} gestores ativos</div>
          </div>

          <div class="kpi-card orange">
            <div class="kpi-icon">📸</div>
            <div class="kpi-label">Aulas / Fotos</div>
            <div class="kpi-value">${metrics.totalClasses}</div>
            <div style="font-size: 0.75rem; color: #ea580c;">${metrics.totalPhotos} fotos sincronizadas</div>
          </div>
        </div>

        <!-- SELEÇÃO DE ABAS MASTER -->
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem;">
          <button class="btn ${this.selectedDevTab === 'arenas' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="App.switchDevTab('arenas')">
            🏖️ Arenas & Sites Públicos (${arenas.length})
          </button>
          <button class="btn ${this.selectedDevTab === 'managers' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="App.switchDevTab('managers')">
            🛡️ Gestores de Arena (${managers.length})
          </button>
          <button class="btn ${this.selectedDevTab === 'overview' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="App.switchDevTab('overview')">
            📊 Auditoria por Arena
          </button>
        </div>

        <!-- CONTEÚDO DA ABA SELECIONADA -->
        ${this.renderDevTabContent(arenas, managers, metrics)}

      </div>
    `;

    this.showView('superAdminDashboardView');
  },

  switchDevTab(tab) {
    this.selectedDevTab = tab;
    this.renderSuperAdminDashboard();
  },

  renderDevTabContent(arenas, managers, metrics) {
    if (this.selectedDevTab === 'arenas') {
      return `
        <div class="card">
          <div class="card-header">
            <h2 class="card-title"><span>🏖️</span> Arenas Cadastradas & Landing Pages Provisionadas</h2>
            <button class="btn btn-sand btn-sm" onclick="App.openNewArenaModal()">+ Nova Arena</button>
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Arena / ID</th>
                  <th>Subdomínio / Slug</th>
                  <th>Localização</th>
                  <th>Alunos / Aulas</th>
                  <th class="text-center">Landing Page Pública</th>
                  <th class="text-center">Ações Master</th>
                </tr>
              </thead>
              <tbody>
                ${arenas.map(a => {
                  const cfg = window.store.getTenantConfig(a.id);
                  const stCount = window.store.getStudents(a.id).length;
                  const clsCount = window.store.state.classes.filter(c => c.arenaId === a.id).length;
                  const slug = a.slug || cfg.slug || `arena-${a.id}`;

                  return `
                    <tr>
                      <td class="font-bold">
                        <div style="font-size: 1.05rem; color: var(--primary-deep);">${a.name}</div>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">Tenant ID: #${a.id}</span>
                      </td>
                      <td>
                        <code style="background: #e0f2fe; color: #0369a1; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 4px;">
                          #/arena/${slug}
                        </code>
                      </td>
                      <td style="font-size: 0.85rem; color: var(--text-muted); max-width: 250px;">${a.location}</td>
                      <td>
                        <strong>${stCount}</strong> alunos &bull; <strong>${clsCount}</strong> aulas
                      </td>
                      <td class="text-center">
                        <a href="#/arena/${slug}" target="_blank" class="btn btn-primary btn-sm" style="text-decoration: none;">
                          🌐 Abrir Site Público
                        </a>
                      </td>
                      <td class="text-center">
                        <div style="display: inline-flex; gap: 0.35rem;">
                          <button class="btn btn-sand btn-sm" onclick="App.openNewManagerModal(${a.id})" title="Criar Gestor para esta Arena">
                            + Gestor
                          </button>
                          <button class="btn btn-secondary btn-sm" onclick="App.openEditArenaConfigModal(${a.id})" title="Editar Configurações da Landing Page">
                            ⚙️
                          </button>
                          <button class="btn btn-secondary btn-sm" style="color: #ef4444;" onclick="App.handleDeleteArena(${a.id}, '${a.name}')" title="Excluir Arena">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    if (this.selectedDevTab === 'managers') {
      return `
        <div class="card">
          <div class="card-header">
            <h2 class="card-title"><span>🛡️</span> Gestores e Administradores de Arena (@adm.com)</h2>
            <button class="btn btn-primary btn-sm" onclick="App.openNewManagerModal()">+ Novo Gestor</button>
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Nome do Gestor</th>
                  <th>Arena Vinculada</th>
                  <th>Login Institucional (@adm.com)</th>
                  <th>Telefone</th>
                  <th class="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${managers.map(m => {
                  const arena = window.store.getArenaById(m.arenaId);
                  const arenaName = arena ? arena.name : `Arena #${m.arenaId}`;

                  return `
                    <tr>
                      <td class="font-bold">${m.name}</td>
                      <td>
                        <span class="badge" style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a;">
                          📍 ${arenaName}
                        </span>
                      </td>
                      <td><code style="font-weight: 800; color: #0369a1;">${m.email}</code></td>
                      <td>${m.phone ? App.maskPhone(m.phone) : '-'}</td>
                      <td class="text-center">
                        <div style="display: inline-flex; gap: 0.35rem;">
                          <button class="btn btn-whatsapp btn-sm" onclick="App.openManagerCredentialsModal(${m.id})" title="Ver Credenciais e Encaminhar WhatsApp">
                            📲 Acesso
                          </button>
                          <button class="btn btn-secondary btn-sm" style="color: #ef4444;" onclick="App.handleDeleteManager(${m.id}, '${m.name}')" title="Remover Gestor">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    return `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title"><span>📊</span> Desempenho Consolidado por Tenant (Arena)</h2>
        </div>

        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Arena</th>
                <th>Aulas Realizadas</th>
                <th>Alunos Cadastrados</th>
                <th>Professores</th>
                <th>Gestores</th>
              </tr>
            </thead>
            <tbody>
              ${metrics.arenaStats.map(stat => `
                <tr>
                  <td class="font-bold">${stat.arena.name}</td>
                  <td><strong style="color: var(--primary-ocean);">${stat.classesCount}</strong> aulas</td>
                  <td><strong>${stat.studentsCount}</strong> alunos</td>
                  <td>${stat.professorsCount} professores</td>
                  <td>${stat.managersCount} gestores</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ----------------------------------------------------
  // PROVISIONAMENTO DE ARENA & GESTOR (DEV FLOW)
  // ----------------------------------------------------
  openNewArenaModal() {
    document.getElementById('new_ar_name').value = '';
    document.getElementById('new_ar_loc').value = '';
    document.getElementById('new_ar_mgr_name').value = '';
    document.getElementById('new_ar_mgr_phone').value = '';
    const previewBox = document.getElementById('new_ar_mgr_email_box');
    if (previewBox) previewBox.style.display = 'none';
    this.openModal('newArenaModal');
  },

  updateNewArenaPreview() {
    const arenaName = document.getElementById('new_ar_name').value;
    const mgrName = document.getElementById('new_ar_mgr_name').value;
    const previewBox = document.getElementById('new_ar_mgr_email_box');
    const previewInput = document.getElementById('new_ar_mgr_email_preview');

    if (mgrName.trim() && arenaName.trim()) {
      const email = window.store.generateEmail(mgrName, arenaName, 'ADMIN');
      if (previewInput) previewInput.value = email;
      if (previewBox) previewBox.style.display = 'block';
    } else {
      if (previewBox) previewBox.style.display = 'none';
    }
  },

  handleCreateArena(event) {
    event.preventDefault();
    const name = document.getElementById('new_ar_name').value;
    const location = document.getElementById('new_ar_loc').value;
    const mgrName = document.getElementById('new_ar_mgr_name').value;
    const mgrPhone = document.getElementById('new_ar_mgr_phone').value;

    const newArena = window.store.addArena({ name, location });
    this.closeModal('newArenaModal');

    // Se o Dev informou o Gestor junto, já cria o acesso automaticamente
    if (mgrName.trim()) {
      const mgrRes = window.store.addManager({ name: mgrName, arenaId: newArena.id, phone: mgrPhone });
      if (mgrRes.success) {
        this.showToast(`Arena "${name}" provisionada com gestor criado!`, 'success');
        if (this.currentRoute === '#/dev') this.renderSuperAdminDashboard();
        else this.renderArenas();
        this.showCreatedManagerCredentials(mgrRes.manager, mgrRes.generatedPassword);
        return;
      }
    }

    this.showToast(`Arena "${name}" cadastrada com sucesso!`, 'success');
    if (this.currentRoute === '#/dev') this.renderSuperAdminDashboard();
    else this.renderArenas();
  },

  openNewManagerModal(preselectedArenaId = null) {
    const select = document.getElementById('new_mgr_arena');
    const arenas = window.store.getAllArenasGlobal();
    if (select) {
      select.innerHTML = arenas.map(a => `<option value="${a.id}" ${preselectedArenaId && Number(preselectedArenaId) === a.id ? 'selected' : ''}>${a.name}</option>`).join('');
    }
    document.getElementById('new_mgr_name').value = '';
    document.getElementById('new_mgr_phone').value = '';
    this.openModal('newManagerModal');
  },

  handleCreateManager(event) {
    event.preventDefault();
    const name = document.getElementById('new_mgr_name').value;
    const arenaId = document.getElementById('new_mgr_arena').value;
    const phone = document.getElementById('new_mgr_phone').value;

    const res = window.store.addManager({ name, arenaId, phone });
    if (res.success) {
      this.closeModal('newManagerModal');
      this.showToast('Gestor cadastrado com sucesso!', 'success');
      this.renderSuperAdminDashboard();
      this.showCreatedManagerCredentials(res.manager, res.generatedPassword);
    } else {
      this.showToast(res.error, 'danger');
    }
  },

  showCreatedManagerCredentials(manager, password) {
    const arena = window.store.getArenaById(manager.arenaId);
    const arenaName = arena ? arena.name : 'Arena';

    document.getElementById('cred_prof_name').textContent = manager.name;
    document.getElementById('cred_prof_modality').textContent = 'Administração / Gestor 🛡️';
    document.getElementById('cred_prof_arena').textContent = arenaName;
    document.getElementById('cred_prof_email').textContent = manager.email;
    document.getElementById('cred_prof_password').textContent = password || manager.initialPassword || 'senha123';

    const linkApp = window.location.origin + window.location.pathname + '#/login';
    const message = `Olá, ${manager.name}! Sua conta de Gestor da ${arenaName} foi criada com sucesso. 🛡️\n\n` +
      `🔗 Link de Acesso: ${linkApp}\n` +
      `📧 Login: ${manager.email}\n` +
      `🔑 Senha: ${password || manager.initialPassword || 'senha123'}\n\n` +
      `Tenha uma excelente gestão!`;

    const btnWhatsApp = document.getElementById('btnForwardProfWhatsApp');
    if (btnWhatsApp) {
      btnWhatsApp.onclick = () => {
        const phone = (manager.phone || '').replace(/\D/g, '');
        window.open(`https://wa.me/${phone ? phone : ''}?text=${encodeURIComponent(message)}`, '_blank');
      };
    }

    const btnCopy = document.getElementById('btnCopyCredentials');
    if (btnCopy) {
      btnCopy.onclick = () => {
        navigator.clipboard.writeText(message);
        this.showToast('Dados de acesso copiados!', 'success');
      };
    }

    this.openModal('profCredentialsCreatedModal');
  },

  openManagerCredentialsModal(mgrId) {
    const mgr = window.store.state.users.find(u => u.id === Number(mgrId));
    if (!mgr) return;
    this.showCreatedManagerCredentials(mgr, mgr.initialPassword || 'senha123');
  },

  handleDeleteArena(id, name) {
    if (confirm(`⚠️ ATENÇÃO DEV: Deseja realmente excluir a "${name}" e todos os seus dados associados?`)) {
      window.store.deleteArena(id);
      this.showToast(`Arena "${name}" excluída com sucesso.`, 'info');
      this.renderSuperAdminDashboard();
    }
  },

  handleDeleteManager(id, name) {
    if (confirm(`Deseja remover o gestor "${name}"?`)) {
      window.store.deleteManager(id);
      this.showToast(`Gestor "${name}" removido.`, 'info');
      this.renderSuperAdminDashboard();
    }
  },

  openEditArenaConfigModal(arenaId) {
    const arena = window.store.getArenaById(arenaId);
    if (!arena) return;
    const cfg = window.store.getTenantConfig(arenaId);

    document.getElementById('cfg_arena_id').value = arena.id;
    document.getElementById('cfg_arena_name_label').textContent = arena.name;
    document.getElementById('cfg_arena_slug').value = cfg.slug || arena.slug || '';
    document.getElementById('cfg_arena_tagline').value = cfg.tagline || '';
    document.getElementById('cfg_arena_whatsapp').value = cfg.whatsappContact || '';
    document.getElementById('cfg_arena_instagram').value = cfg.instagram || '';

    this.openModal('editArenaConfigModal');
  },

  handleSaveTenantConfig(event) {
    event.preventDefault();
    const arenaId = document.getElementById('cfg_arena_id').value;
    const slug = (document.getElementById('cfg_arena_slug').value || '').trim();
    const tagline = document.getElementById('cfg_arena_tagline').value;
    const whatsappContact = document.getElementById('cfg_arena_whatsapp').value;
    const instagram = document.getElementById('cfg_arena_instagram').value;

    window.store.saveTenantConfig(arenaId, { slug, tagline, whatsappContact, instagram });
    this.closeModal('editArenaConfigModal');
    this.showToast('Configurações da Landing Page salvas com sucesso!', 'success');
    this.renderSuperAdminDashboard();
  },

  // ----------------------------------------------------
  // PÁGINA INICIAL / LANDING PAGE DINÂMICA DA ARENA (#/arena/:slug)
  // ----------------------------------------------------
  renderArenaLandingPage(idOrSlug) {
    const container = document.getElementById('arenaLandingView');
    if (!container) return;

    const arena = window.store.getArenaById(idOrSlug) || window.store.state.arenas.find(a => a.slug === idOrSlug) || window.store.state.arenas[0];
    if (!arena) {
      this.showToast('Arena não encontrada.', 'danger');
      this.navigate('#/login');
      return;
    }

    const config = window.store.getTenantConfig(arena.id);

    container.innerHTML = `
      <div class="arena-landing-wrapper">
        
        <!-- HERO BANNER DA ARENA -->
        <div class="arena-hero-banner" style="background: linear-gradient(135deg, ${config.primaryColor || '#0f2b48'} 0%, #0369a1 100%);">
          <div class="arena-hero-content">
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.18); backdrop-filter: blur(8px); padding: 0.35rem 0.9rem; border-radius: var(--radius-full); margin-bottom: 1rem;">
              <span>🏖️</span>
              <span style="font-weight: 800; font-size: 0.85rem; color: #fef08a;">Arena Oficial de Esportes de Areia</span>
            </div>

            <h1 style="font-size: 2.75rem; font-family: var(--font-heading); font-weight: 900; line-height: 1.1; margin-bottom: 0.75rem;">
              ${arena.name}
            </h1>
            
            <p style="font-size: 1.2rem; color: #e0f2fe; max-width: 680px; margin: 0 auto 1.5rem auto;">
              ${config.tagline || 'Aulas diárias de Vôlei de Praia, Beach Tennis e Futevôlei com metodologia profissional.'}
            </p>

            <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
              <a href="https://wa.me/?text=${encodeURIComponent(`Olá! Gostaria de informações sobre as aulas na ${arena.name}.`)}" target="_blank" class="btn btn-sand btn-lg" style="box-shadow: 0 10px 25px rgba(245, 158, 11, 0.4); text-decoration: none;">
                <span>📲</span> Agendar Aula Experimental
              </a>
              <a href="#/login" class="btn btn-outline btn-lg" style="background: rgba(255,255,255,0.12); color: white; border-color: rgba(255,255,255,0.3); text-decoration: none;">
                <span>👤</span> Portal do Aluno & Professor
              </a>
            </div>
          </div>
        </div>

        <!-- MODALIDADES & INFORMAÇÕES DA ARENA -->
        <div style="max-width: 1100px; margin: 3rem auto; padding: 0 1rem;">
          
          <div style="text-align: center; margin-bottom: 2.5rem;">
            <span style="font-size: 0.85rem; font-weight: 800; color: var(--primary-ocean); text-transform: uppercase; letter-spacing: 0.05em;">
              O que oferecemos
            </span>
            <h2 style="font-size: 2rem; color: var(--primary-deep); margin-top: 0.25rem;">
              Modalidades em Destaque na ${arena.name}
            </h2>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
            ${(config.modalities || ['Vôlei de Praia 🏐', 'Beach Tennis 🎾', 'Futevôlei ⚽']).map(mod => `
              <div class="card" style="text-align: center; padding: 2rem 1.5rem; border-top: 4px solid ${config.accentColor || '#f59e0b'};">
                <div style="font-size: 3rem; margin-bottom: 0.75rem;">${mod.split(' ')[1] || '🏐'}</div>
                <h3 style="font-size: 1.3rem; color: var(--primary-deep); margin-bottom: 0.5rem;">${mod.split(' ')[0]}</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem;">
                  Aulas para iniciantes, intermediários e avançados com horários matutinos e noturnos.
                </p>
              </div>
            `).join('')}
          </div>

          <!-- LOCALIZAÇÃO & CONTATO -->
          <div class="card" style="margin-top: 3rem; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 2px dashed #cbd5e1; padding: 2.5rem 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem;">
              <div>
                <span style="font-size: 0.85rem; font-weight: 800; color: #0284c7; text-transform: uppercase;">
                  Onde Estamos
                </span>
                <h3 style="font-size: 1.6rem; color: var(--primary-deep); margin-top: 0.25rem;">
                  📍 ${arena.location}
                </h3>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0.35rem;">
                  ${config.description || 'Quadras oficiais com areia tratada, iluminação LED e vestiários.'}
                </p>
                <div style="margin-top: 0.75rem; font-weight: 700; color: var(--primary-ocean);">
                  Instagram: <strong>${config.instagram || '@arena.beach'}</strong> &bull; WhatsApp: <strong>${config.whatsappContact || '(21) 9 9999-9999'}</strong>
                </div>
              </div>

              <button class="btn btn-whatsapp btn-lg" onclick="window.open('https://wa.me/?text=${encodeURIComponent(`Olá! Quero tirar dúvidas sobre a ${arena.name}.`)}', '_blank')">
                <span>📲</span> Falar no WhatsApp
              </button>
            </div>
          </div>

        </div>

      </div>
    `;

    this.showView('arenaLandingView');
  },

  // ----------------------------------------------------
  // GESTÃO DE PROFESSORES: MODALIDADES, SENHA INICIAL & DEMISSÃO
  // ----------------------------------------------------
  renderProfessores() {
    const container = document.getElementById('professoresView');
    if (!container) return;

    const user = window.store.getCurrentUser();
    const professors = window.store.getProfessors();
    const arena = user.arenaId ? window.store.getArenaById(user.arenaId) : null;
    const arenaName = arena ? arena.name : (user.role === 'SUPER_ADMIN' ? 'Todas as Arenas (Global)' : 'Minha Arena');

    container.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
          <div>
            <span style="font-size: 0.85rem; font-weight: 800; color: #0284c7; text-transform: uppercase;">
              ${arenaName}
            </span>
            <h1 style="font-size: 1.85rem; color: var(--primary-deep); margin-top: 0.15rem;">
              Professores Cadastrados 👨‍🏫
            </h1>
            <p style="color: var(--text-muted); font-size: 0.95rem;">
              Controle de modalidades, senhas iniciais e gestão de instrutores.
            </p>
          </div>

          <button class="btn btn-sand" onclick="App.openNewProfModal()">
            <span>➕</span> Cadastrar Novo Professor
          </button>
        </div>

        <div class="card">
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Nome do Professor</th>
                  <th>Arena</th>
                  <th>Modalidade</th>
                  <th>Login (@prof.com)</th>
                  <th>Telefone</th>
                  <th>Aulas Dadas</th>
                  <th class="text-center">Ações / Credenciais</th>
                </tr>
              </thead>
              <tbody>
                ${professors.length > 0 ? professors.map(p => {
                  const pArena = window.store.getArenaById(p.arenaId)?.name || 'Arena';
                  const clsCount = window.store.state.classes.filter(c => c.professorId === p.id).length;
                  const initial = p.name ? p.name.charAt(0).toUpperCase() : 'P';
                  const modality = p.modality || 'Vôlei de Praia 🏐';

                  return `
                    <tr>
                      <td class="font-bold">
                        <div style="display: flex; align-items: center; gap: 0.6rem;">
                          <div class="student-avatar" style="width:36px; height:36px; font-size:0.9rem;">${initial}</div>
                          <span>${p.name}</span>
                        </div>
                      </td>
                      <td>
                        <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">📍 ${pArena}</span>
                      </td>
                      <td>
                        <span class="badge" style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd;">
                          ${modality}
                        </span>
                      </td>
                      <td><code style="font-weight:800; color:#0369a1;">${p.email}</code></td>
                      <td>${p.phone ? App.maskPhone(p.phone) : '-'}</td>
                      <td><strong>${clsCount}</strong> aulas</td>
                      <td class="text-center">
                        <div style="display: inline-flex; gap: 0.4rem;">
                          <button class="btn btn-whatsapp btn-sm" onclick="App.openCredentialsModal(${p.id})" title="Ver e Encaminhar Acesso">
                            <span>📲</span> Acesso
                          </button>
                          <button class="btn btn-secondary btn-sm" style="color:#ef4444; border-color:#fecaca;" onclick="App.handleDismissProfessor(${p.id}, '${p.name}')" title="Desvincular/Demitir Professor">
                            🗑️ Demitir
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('') : `
                  <tr>
                    <td colspan="7" class="text-center text-muted" style="padding: 2.5rem;">
                      Nenhum professor cadastrado ainda.
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.showView('professoresView');
  },

  openNewProfModal() {
    const user = window.store.getCurrentUser();
    const arena = user.arenaId ? window.store.getArenaById(user.arenaId) : window.store.state.arenas[0];
    const arenaName = arena ? arena.name : 'Arena';

    const modalArenaSpan = document.getElementById('new_prof_arena_label');
    if (modalArenaSpan) modalArenaSpan.textContent = arenaName;

    const nameInput = document.getElementById('new_prof_name');
    const emailInput = document.getElementById('new_prof_email');
    const passInput = document.getElementById('new_prof_pass_preview');
    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (passInput) passInput.value = '';

    this.openModal('newProfModal');
  },

  updateNewProfEmailPreview() {
    const nameInput = document.getElementById('new_prof_name');
    const emailInput = document.getElementById('new_prof_email');
    const passInput = document.getElementById('new_prof_pass_preview');
    if (!nameInput || !emailInput) return;

    const user = window.store.getCurrentUser();
    const arena = user.arenaId ? window.store.getArenaById(user.arenaId) : window.store.state.arenas[0];
    const arenaName = arena ? arena.name : 'ilha';

    const autoEmail = window.store.generateEmail(nameInput.value, arenaName, 'PROFESSOR');
    emailInput.value = autoEmail;

    if (passInput) {
      const firstName = (nameInput.value.trim().split(' ')[0] || 'prof').toLowerCase();
      passInput.value = `${firstName}.***** (5 dígitos aleatórios gerados ao salvar)`;
    }
  },

  handleCreateProf(event) {
    event.preventDefault();
    const name = document.getElementById('new_prof_name').value;
    const modality = document.getElementById('new_prof_modality').value;
    const phone = document.getElementById('new_prof_phone').value;

    const res = window.store.addProfessor({ name, modality, phone });
    if (res.success) {
      this.closeModal('newProfModal');
      this.showToast('Professor cadastrado com sucesso!', 'success');
      this.renderProfessores();
      this.showCreatedCredentialsModal(res.professor, res.generatedPassword);
    } else {
      this.showToast(res.error, 'danger');
    }
  },

  showCreatedCredentialsModal(prof, password) {
    const arena = window.store.getArenaById(prof.arenaId);
    const arenaName = arena ? arena.name : 'Arena';

    document.getElementById('cred_prof_name').textContent = prof.name;
    document.getElementById('cred_prof_modality').textContent = prof.modality || 'Vôlei de Praia 🏐';
    document.getElementById('cred_prof_arena').textContent = arenaName;
    document.getElementById('cred_prof_email').textContent = prof.email;
    document.getElementById('cred_prof_password').textContent = password || prof.initialPassword || 'prof.12345';

    const linkApp = window.location.origin + window.location.pathname + '#/login';
    const message = `Olá, ${prof.name}! Seu cadastro como professor na ${arenaName} foi realizado com sucesso. 🏐\n\n` +
      `🔗 Acesso ao Sistema: ${linkApp}\n` +
      `📧 Login: ${prof.email}\n` +
      `🔑 Senha Inicial: ${password || prof.initialPassword || 'senha123'}\n` +
      `🏅 Modalidade: ${prof.modality || 'Vôlei de Praia'}\n\n` +
      `Bom treino em quadra!`;

    const btnWhatsApp = document.getElementById('btnForwardProfWhatsApp');
    if (btnWhatsApp) {
      btnWhatsApp.onclick = () => {
        const phone = (prof.phone || '').replace(/\D/g, '');
        const phoneParam = phone ? `phone=${phone}&` : '';
        window.open(`https://wa.me/${phone ? phone : ''}?${phoneParam}text=${encodeURIComponent(message)}`, '_blank');
      };
    }

    const btnCopy = document.getElementById('btnCopyCredentials');
    if (btnCopy) {
      btnCopy.onclick = () => {
        navigator.clipboard.writeText(message);
        this.showToast('Dados de acesso copiados para a área de transferência!', 'success');
      };
    }

    this.openModal('profCredentialsCreatedModal');
  },

  openCredentialsModal(profId) {
    const prof = window.store.getProfessorById(profId);
    if (!prof) return;
    this.showCreatedCredentialsModal(prof, prof.initialPassword);
  },

  handleDismissProfessor(profId, profName) {
    const confirmed = confirm(`⚠️ ATENÇÃO: Deseja realmente demitir/desvincular o professor "${profName}" da arena?\n\nEle será removido do corpo docente e perderá o acesso.`);
    if (confirmed) {
      window.store.deleteProfessor(profId);
      this.showToast(`Professor "${profName}" foi desvinculado com sucesso.`, 'info');
      this.renderProfessores();
    }
  },

  // ----------------------------------------------------
  // PAINEL DO PROFESSOR (MEU PAINEL)
  // ----------------------------------------------------
  renderProfessorDashboard() {
    const container = document.getElementById('professorDashboardView');
    if (!container) return;

    const user = window.store.getCurrentUser();
    const arena = window.store.getArenaById(user.arenaId);
    const arenaName = arena ? arena.name : 'Arena';

    const today = new Date().toISOString().split('T')[0];
    const todayBr = today.split('-').reverse().join('/');

    const myClasses = window.store.getClasses({ professorId: user.id });
    const todayClasses = myClasses.filter(c => c.date === today);
    const pendingPhotos = myClasses.filter(c => c.photoStatus === 'PENDING').length;

    let studentsToday = 0;
    let totalSlotsToday = 0;
    todayClasses.forEach(c => {
      if (c.attendances) {
        totalSlotsToday += c.attendances.length;
        studentsToday += c.attendances.filter(a => a.present).length;
      }
    });

    const rateToday = totalSlotsToday > 0 ? Math.round((studentsToday / totalSlotsToday) * 100) : 100;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
          <div>
            <span style="font-size: 0.85rem; font-weight: 800; color: var(--sand-warm); text-transform: uppercase; letter-spacing: 0.05em;">
              Quadra: ${arenaName} &bull; ${user.modality || 'Vôlei de Praia 🏐'}
            </span>
            <h1 style="font-size: 1.85rem; color: var(--primary-deep); margin-top: 0.15rem;">
              Olá, Prof. ${user.name}! 🏐
            </h1>
            <p style="color: var(--text-muted); font-size: 0.95rem;">
              Hoje é <strong>${todayBr}</strong>. Faça chamadas e envie fotos das suas turmas da <strong>${arenaName}</strong>.
            </p>
          </div>

          <button class="btn btn-sand btn-lg" onclick="App.navigate('#/aula/nova')" style="box-shadow: 0 8px 22px rgba(245, 158, 11, 0.45); font-size: 1.15rem;">
            <span style="font-size: 1.4rem;">⚡</span> REGISTRAR NOVA AULA
          </button>
        </div>
      </div>

      <!-- KPIS DO PROFESSOR -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">📋</div>
          <div class="kpi-label">Aulas Hoje</div>
          <div class="kpi-value">${todayClasses.length}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${arenaName}</div>
        </div>

        <div class="kpi-card emerald">
          <div class="kpi-icon">👥</div>
          <div class="kpi-label">Alunos em Quadra</div>
          <div class="kpi-value">${studentsToday}</div>
          <div style="font-size: 0.75rem; color: #059669;">Presentes hoje</div>
        </div>

        <div class="kpi-card gold">
          <div class="kpi-icon">🎯</div>
          <div class="kpi-label">Taxa do Dia</div>
          <div class="kpi-value">${rateToday}%</div>
          <div style="font-size: 0.75rem; color: #d97706;">Aproveitamento</div>
        </div>

        <div class="kpi-card ${pendingPhotos > 0 ? 'orange' : 'emerald'}">
          <div class="kpi-icon">📸</div>
          <div class="kpi-label">Fotos Pendentes</div>
          <div class="kpi-value">${pendingPhotos}</div>
          <div style="font-size: 0.75rem; color: ${pendingPhotos > 0 ? '#ea580c' : '#059669'};">
            ${pendingPhotos > 0 ? 'Aguardando foto' : 'Tudo em dia!'}
          </div>
        </div>
      </div>

      <!-- AULAS DE HOJE -->
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-header">
          <h2 class="card-title">
            <span>🏖️</span> Aulas de Hoje (${todayBr})
          </h2>
          <button class="btn btn-primary btn-sm" onclick="App.navigate('#/aula/nova')">
            + Nova Aula
          </button>
        </div>

        ${todayClasses.length > 0 ? `
          <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
            ${todayClasses.map(c => {
              const total = c.attendances?.length || 0;
              const presents = c.attendances ? c.attendances.filter(a => a.present).length : 0;
              const rate = total > 0 ? Math.round((presents / total) * 100) : 0;

              let badgeClass = 'badge-pending';
              let statusLabel = '🟡 FOTO PENDENTE';
              if (c.photoStatus === 'READY_TO_SEND') {
                badgeClass = 'badge-ready';
                statusLabel = '🔵 PREPARADO';
              } else if (c.photoStatus === 'RECEIVED') {
                badgeClass = 'badge-received';
                statusLabel = '🟢 RECEBIDA';
              }

              return `
                <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.15rem; background: var(--bg-surface-subtle); display: flex; flex-direction: column; gap: 0.75rem;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
                    <div>
                      <div style="font-weight: 800; font-size: 1.15rem; color: var(--primary-deep);">
                        ${arenaName} &bull; <span style="color: var(--primary-ocean);">${c.groupName}</span>
                      </div>
                      <div style="font-size: 0.9rem; color: var(--text-muted);">
                        ⏰ Horário: <strong>${c.time || ''}</strong> &bull; Presentes: <strong>${presents}/${total} (${rate}%)</strong>
                      </div>
                    </div>
                    <span class="badge ${badgeClass}">${statusLabel}</span>
                  </div>

                  <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                    <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="App.navigate('#/aula/${c.id}')">
                      🔍 Ver Chamada & Detalhes
                    </button>
                    ${c.photoUrl ? `
                      <button class="btn btn-whatsapp btn-sm" style="flex: 1;" onclick="window.WhatsAppIntegration.openModal(${c.id})">
                        📲 WhatsApp
                      </button>
                    ` : `
                      <button class="btn btn-sand btn-sm" style="flex: 1;" onclick="App.navigate('#/aula/${c.id}')">
                        📸 Enviar Foto
                      </button>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
            <div style="font-size: 3rem; margin-bottom: 0.75rem;">🏐</div>
            <p style="font-size: 1.1rem; font-weight: 800; color: var(--primary-deep); margin-bottom: 0.25rem;">
              Nenhuma aula registrada para hoje na ${arenaName}.
            </p>
            <p style="font-size: 0.9rem; margin-bottom: 1.25rem;">
              Registre sua turma e chamada em menos de 1 minuto diretamente da quadra.
            </p>
            <button class="btn btn-sand" onclick="App.navigate('#/aula/nova')">
              ⚡ Registrar Aula Agora
            </button>
          </div>
        `}
      </div>

      <!-- ÚLTIMAS AULAS -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">
            <span>📋</span> Minhas Aulas Registradas
          </h2>
          <button class="btn btn-outline btn-sm" onclick="App.navigate('#/fechamento')">
            Ver Fechamento do Mês
          </button>
        </div>

        <div class="table-responsive">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Horário</th>
                <th>Arena</th>
                <th>Turma</th>
                <th>Presença</th>
                <th>Status Foto</th>
                <th class="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${myClasses.slice(0, 8).map(c => {
                const total = c.attendances?.length || 0;
                const presents = c.attendances ? c.attendances.filter(a => a.present).length : 0;
                const rate = total > 0 ? Math.round((presents / total) * 100) : 0;

                const dateParts = c.date.split('-');
                const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : c.date;

                let badgeClass = 'badge-pending';
                let statusLabel = '🟡 PENDENTE';
                if (c.photoStatus === 'READY_TO_SEND') {
                  badgeClass = 'badge-ready';
                  statusLabel = '🔵 PREPARADO';
                } else if (c.photoStatus === 'RECEIVED') {
                  badgeClass = 'badge-received';
                  statusLabel = '🟢 RECEBIDA';
                }

                return `
                  <tr>
                    <td class="font-bold">${formattedDate}</td>
                    <td>${c.time || ''}</td>
                    <td>${arenaName}</td>
                    <td><span style="font-weight: 700; color: var(--primary-ocean);">${c.groupName}</span></td>
                    <td><strong>${presents}/${total}</strong> <span class="text-muted" style="font-size:0.8rem;">(${rate}%)</span></td>
                    <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
                    <td class="text-center">
                      <button class="btn btn-secondary btn-sm" onclick="App.navigate('#/aula/${c.id}')">
                        Abrir
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.showView('professorDashboardView');
  },

  // ----------------------------------------------------
  // PAINEL DO ADMINISTRADOR DE ARENA
  // ----------------------------------------------------
  renderAdminDashboard() {
    const container = document.getElementById('adminDashboardView');
    if (!container) return;

    const user = window.store.getCurrentUser();
    const arenaObj = window.store.getArenaById(user.arenaId);
    const currentArenaName = arenaObj ? arenaObj.name : 'Minha Arena';

    const today = new Date().toISOString().split('T')[0];
    const todayBr = today.split('-').reverse().join('/');

    const classes = window.store.getClasses();
    const todayClasses = classes.filter(c => c.date === today);
    const activeProfsToday = new Set(todayClasses.map(c => c.professorId)).size;

    let studentsToday = 0;
    let totalSlotsToday = 0;
    todayClasses.forEach(c => {
      if (c.attendances) {
        totalSlotsToday += c.attendances.length;
        studentsToday += c.attendances.filter(a => a.present).length;
      }
    });
    const presenceRateToday = totalSlotsToday > 0 ? Math.round((studentsToday / totalSlotsToday) * 100) : 100;
    const photosToday = todayClasses.filter(c => c.photoStatus === 'RECEIVED' || c.photoStatus === 'READY_TO_SEND').length;

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthStats = window.store.getMonthlyMetrics(currentMonth, currentYear);

    const students = window.store.getStudents();

    container.innerHTML = `
      <div>
        <div style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span style="font-size: 0.85rem; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.05em;">
                🛡️ Gestão: ${currentArenaName}
              </span>
              <h1 style="font-size: 1.85rem; color: var(--primary-deep); margin-top: 0.15rem;">
                Painel da ${currentArenaName} 📊
              </h1>
              <p style="color: var(--text-muted); font-size: 0.95rem;">
                Visualização segura e restrita aos dados, professores e alunos da <strong>${currentArenaName}</strong> em ${todayBr}.
              </p>
            </div>

            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-sand btn-sm" onclick="App.navigate('#/galeria')">
                <span>📸</span> Galeria de Fotos
              </button>
              <button class="btn btn-primary btn-sm" onclick="App.navigate('#/relatorios')">
                <span>📈</span> Ver Relatórios
              </button>
            </div>
          </div>
        </div>

        <h2 style="font-size: 1.2rem; color: var(--primary-deep); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>⚡</span> Métricas de Hoje (${todayBr})
        </h2>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon">🏐</div>
            <div class="kpi-label">Aulas Hoje</div>
            <div class="kpi-value">${todayClasses.length}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${currentArenaName}</div>
          </div>

          <div class="kpi-card emerald">
            <div class="kpi-icon">👨‍🏫</div>
            <div class="kpi-label">Professores em Quadra</div>
            <div class="kpi-value">${activeProfsToday}</div>
            <div style="font-size: 0.75rem; color: #059669;">Instrutores da arena</div>
          </div>

          <div class="kpi-card gold">
            <div class="kpi-icon">🎯</div>
            <div class="kpi-label">Presença Hoje</div>
            <div class="kpi-value">${presenceRateToday}%</div>
            <div style="font-size: 0.75rem; color: #d97706;">${studentsToday} alunos presentes</div>
          </div>

          <div class="kpi-card orange">
            <div class="kpi-icon">📸</div>
            <div class="kpi-label">Fotos Recebidas Hoje</div>
            <div class="kpi-value">${photosToday}</div>
            <div style="font-size: 0.75rem; color: #ea580c;">Registros fotográficos</div>
          </div>
        </div>

        <h2 style="font-size: 1.2rem; color: var(--primary-deep); margin-bottom: 0.75rem; margin-top: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>📅</span> Consolidado Mensal (${currentArenaName})
        </h2>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon">👥</div>
            <div class="kpi-label">Alunos Matriculados</div>
            <div class="kpi-value">${students.length}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Cadastrados nesta arena</div>
          </div>

          <div class="kpi-card emerald">
            <div class="kpi-icon">📋</div>
            <div class="kpi-label">Aulas no Mês</div>
            <div class="kpi-value">${monthStats.totalClasses}</div>
            <div style="font-size: 0.75rem; color: #059669;">Realizadas</div>
          </div>

          <div class="kpi-card gold">
            <div class="kpi-icon">📊</div>
            <div class="kpi-label">Frequência Geral</div>
            <div class="kpi-value">${monthStats.rate}%</div>
            <div style="font-size: 0.75rem; color: #d97706;">Média dos alunos</div>
          </div>

          <div class="kpi-card orange">
            <div class="kpi-icon">🌟</div>
            <div class="kpi-label">Índice de Fotos</div>
            <div class="kpi-value">${monthStats.photoRate}%</div>
            <div style="font-size: 0.75rem; color: #ea580c;">${monthStats.totalPhotos} fotos registradas</div>
          </div>
        </div>

        <div class="card" style="margin-top: 1.5rem;">
          <div class="card-header">
            <h2 class="card-title"><span>📋</span> Aulas Recentes na ${currentArenaName}</h2>
            <button class="btn btn-outline btn-sm" onclick="App.navigate('#/calendario')">Ver Cronograma</button>
          </div>
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Professor</th>
                  <th>Turma</th>
                  <th>Presença</th>
                  <th>Status Foto</th>
                  <th class="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${classes.slice(0, 8).map(c => {
                  const prof = window.store.getProfessorById(c.professorId)?.name || 'Professor';
                  const total = c.attendances?.length || 0;
                  const presents = c.attendances ? c.attendances.filter(a => a.present).length : 0;
                  const rate = total > 0 ? Math.round((presents / total) * 100) : 0;

                  const dateParts = c.date.split('-');
                  const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : c.date;

                  let badgeClass = 'badge-pending';
                  let statusLabel = '🟡 PENDENTE';
                  if (c.photoStatus === 'READY_TO_SEND') {
                    badgeClass = 'badge-ready';
                    statusLabel = '🔵 PREPARADO';
                  } else if (c.photoStatus === 'RECEIVED') {
                    badgeClass = 'badge-received';
                    statusLabel = '🟢 RECEBIDA';
                  }

                  return `
                    <tr>
                      <td class="font-bold">${formattedDate} <span style="font-weight:400; color:var(--text-muted); font-size:0.85rem;">${c.time || ''}</span></td>
                      <td>${prof}</td>
                      <td><span style="font-weight:700; color:var(--primary-ocean);">${c.groupName}</span></td>
                      <td><strong>${presents}/${total}</strong> (${rate}%)</td>
                      <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
                      <td class="text-center">
                        <button class="btn btn-secondary btn-sm" onclick="App.navigate('#/aula/${c.id}')">Abrir</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.showView('adminDashboardView');
  },

  // ----------------------------------------------------
  // GESTÃO DE ALUNOS (ISOLADA POR ARENA OU GLOBAL PARA DEV)
  // ----------------------------------------------------
  renderStudents() {
    const container = document.getElementById('studentsView');
    if (!container) return;

    const user = window.store.getCurrentUser();
    const students = window.store.getStudents();
    const arena = user.arenaId ? window.store.getArenaById(user.arenaId) : null;
    const arenaName = arena ? arena.name : (user.role === 'SUPER_ADMIN' ? 'Todas as Arenas (Global)' : 'Minha Arena');

    container.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
          <div>
            <span style="font-size: 0.85rem; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.05em;">
              ${arenaName}
            </span>
            <h1 style="font-size: 1.85rem; color: var(--primary-deep); margin-top: 0.15rem;">
              Gestão de Alunos & Turmas 👥
            </h1>
            <p style="color: var(--text-muted); font-size: 0.95rem;">
              Total de <strong>${students.length}</strong> alunos matriculados.
            </p>
          </div>

          <button class="btn btn-sand" onclick="App.openModal('newStudentModal')">
            <span>➕</span> Novo Aluno
          </button>
        </div>

        <div class="card">
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Nome do Aluno</th>
                  <th>Arena</th>
                  <th>Turma</th>
                  <th>Telefone</th>
                  <th>E-mail</th>
                  <th class="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${students.map(s => {
                  const sArena = window.store.getArenaById(s.arenaId)?.name || 'Arena';
                  return `
                    <tr>
                      <td class="font-bold">${s.name}</td>
                      <td><span style="font-weight: 700; color: var(--text-muted);">📍 ${sArena}</span></td>
                      <td><span style="font-weight:700; color:var(--primary-ocean);">${s.groupName || 'Geral'}</span></td>
                      <td>${s.phone ? App.maskPhone(s.phone) : '-'}</td>
                      <td style="color:var(--text-muted); font-size:0.85rem;">${s.email || '-'}</td>
                      <td class="text-center">
                        <button class="btn btn-secondary btn-sm" style="color:#ef4444;" onclick="App.deleteStudent(${s.id})" title="Excluir Aluno">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.showView('studentsView');
  },

  deleteStudent(id) {
    if (confirm('Deseja realmente remover este aluno?')) {
      window.store.deleteStudent(id);
      this.showToast('Aluno removido com sucesso.', 'info');
      this.renderStudents();
    }
  },

  // ----------------------------------------------------
  // GESTÃO DE ARENAS & CALENDÁRIO
  // ----------------------------------------------------
  renderArenas() {
    const container = document.getElementById('arenasView');
    if (!container) return;

    const user = window.store.getCurrentUser();
    const arenas = window.store.getArenas();

    container.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
          <div>
            <span style="font-size: 0.85rem; font-weight: 800; color: #0284c7; text-transform: uppercase;">
              Infraestrutura & Sites
            </span>
            <h1 style="font-size: 1.85rem; color: var(--primary-deep); margin-top: 0.15rem;">
              Arenas & Landing Pages 🏖️
            </h1>
            <p style="color: var(--text-muted); font-size: 0.95rem;">
              Lista de quadras e seus portais públicos independentes na web.
            </p>
          </div>

          ${user.role === 'SUPER_ADMIN' ? `
            <button class="btn btn-sand" onclick="App.openNewArenaModal()">
              <span>➕</span> Provisionar Nova Arena & Gestor
            </button>
          ` : ''}
        </div>

        <div style="display: grid; grid-template-columns: 1fr; gap: 1.25rem;">
          ${arenas.map(a => {
            const stCount = window.store.getStudents(a.id).length;
            const clsCount = window.store.state.classes.filter(c => c.arenaId === a.id).length;
            const slug = a.slug || `arena-${a.id}`;

            return `
              <div class="card" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.6rem;">🏖️</span>
                    <h2 style="font-size: 1.25rem; color: var(--primary-deep);">${a.name}</h2>
                    <span class="badge" style="background: #e0f2fe; color: #0369a1;">#/arena/${slug}</span>
                  </div>
                  <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">
                    📍 ${a.location}
                  </p>
                </div>

                <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
                  <div style="text-align: right; margin-right: 0.5rem;">
                    <div style="font-size: 1.15rem; font-weight: 900; color: var(--primary-ocean);">${stCount} Alunos</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${clsCount} Aulas registradas</div>
                  </div>

                  <a href="#/arena/${slug}" target="_blank" class="btn btn-primary btn-sm" style="text-decoration: none;">
                    🌐 Ver Site da Arena
                  </a>
                  ${user.role === 'SUPER_ADMIN' ? `
                    <button class="btn btn-sand btn-sm" onclick="App.openNewManagerModal(${a.id})" title="Criar Gestor para esta Arena">
                      + Gestor
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="App.openEditArenaConfigModal(${a.id})" title="Configurar Landing Page">
                      ⚙️
                    </button>
                    <button class="btn btn-secondary btn-sm" style="color: #ef4444;" onclick="App.handleDeleteArena(${a.id}, '${a.name}')" title="Excluir Arena">
                      🗑️
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.showView('arenasView');
  },

  renderCalendar() {
    const container = document.getElementById('calendarView');
    if (!container) return;

    const user = window.store.getCurrentUser();
    const arena = user.arenaId ? window.store.getArenaById(user.arenaId) : null;
    const arenaName = arena ? arena.name : 'Minha Arena';
    const classes = window.store.getClasses();

    container.innerHTML = `
      <div>
        <div style="margin-bottom: 1.5rem;">
          <span style="font-size: 0.85rem; font-weight: 800; color: #0284c7; text-transform: uppercase;">
            Cronograma: ${arenaName}
          </span>
          <h1 style="font-size: 1.85rem; color: var(--primary-deep); margin-top: 0.15rem;">
            Calendário de Aulas 🗓️
          </h1>
          <p style="color: var(--text-muted); font-size: 0.95rem;">
            Sessões ministradas em quadra.
          </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${classes.map(c => {
            const prof = window.store.getProfessorById(c.professorId)?.name || 'Professor';
            const cArena = window.store.getArenaById(c.arenaId)?.name || 'Arena';
            const dateParts = c.date.split('-');
            const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : c.date;

            const total = c.attendances?.length || 0;
            const presents = c.attendances ? c.attendances.filter(a => a.present).length : 0;

            let badgeClass = 'badge-pending';
            let statusLabel = '🟡 PENDENTE';
            if (c.photoStatus === 'READY_TO_SEND') {
              badgeClass = 'badge-ready';
              statusLabel = '🔵 PREPARADO';
            } else if (c.photoStatus === 'RECEIVED') {
              badgeClass = 'badge-received';
              statusLabel = '🟢 RECEBIDA';
            }

            return `
              <div class="card" style="margin-bottom: 0; padding: 1.15rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                  <div>
                    <div style="font-weight: 800; font-size: 1.1rem; color: var(--primary-deep);">
                      📅 ${formattedDate} às ${c.time || ''} &bull; ${cArena}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
                      <strong>Turma:</strong> ${c.groupName} &bull; <strong>Professor:</strong> ${prof} &bull; <strong>Presentes:</strong> ${presents}/${total} alunos
                    </div>
                  </div>

                  <div style="display: align-items: center; gap: 0.75rem;">
                    <span class="badge ${badgeClass}">${statusLabel}</span>
                    <button class="btn btn-secondary btn-sm" onclick="App.navigate('#/aula/${c.id}')">Ver</button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.showView('calendarView');
  },

  // ----------------------------------------------------
  // DETALHES DA AULA & FECHAMENTO DO MÊS
  // ----------------------------------------------------
  renderClassDetail(classId) {
    const container = document.getElementById('classDetailView');
    if (!container) return;

    const user = window.store.getCurrentUser();
    const cls = window.store.getClassById(classId);

    if (!cls) {
      this.showToast('Você não possui permissão para acessar esta aula ou ela não existe.', 'danger');
      this.navigate(user?.role === 'SUPER_ADMIN' ? '#/dev' : (user?.role === 'ADMIN' ? '#/admin' : '#/professor'));
      return;
    }

    const arena = window.store.getArenaById(cls.arenaId)?.name || 'Arena';
    const prof = window.store.getProfessorById(cls.professorId)?.name || 'Professor';

    const dateParts = cls.date.split('-');
    const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : cls.date;

    const total = cls.attendances?.length || 0;
    const presents = cls.attendances ? cls.attendances.filter(a => a.present).length : 0;
    const rate = total > 0 ? Math.round((presents / total) * 100) : 0;

    let badgeClass = 'badge-pending';
    let statusLabel = '🟡 FOTO PENDENTE';
    if (cls.photoStatus === 'READY_TO_SEND') {
      badgeClass = 'badge-ready';
      statusLabel = '🔵 PREPARADO PARA ENVIO';
    } else if (cls.photoStatus === 'RECEIVED') {
      badgeClass = 'badge-received';
      statusLabel = '🟢 FOTO RECEBIDA';
    }

    container.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto;">
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm" onclick="App.navigate('${user.role === 'SUPER_ADMIN' ? '#/dev' : (user.role === 'ADMIN' ? '#/admin' : '#/professor')}')">
            &larr; Voltar ao Painel
          </button>
          
          <span class="badge ${badgeClass}" style="font-size: 0.85rem; padding: 0.5rem 1rem;">
            ${statusLabel}
          </span>
        </div>

        <div class="card" style="border-top: 5px solid var(--primary-ocean);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span style="font-size: 0.85rem; font-weight: 800; color: var(--sand-warm); text-transform: uppercase;">
                Registro de Treino em Quadra
              </span>
              <h1 style="font-size: 1.7rem; color: var(--primary-deep); margin-top: 0.2rem;">
                ${arena}
              </h1>
              <div style="font-size: 1.1rem; font-weight: 800; color: var(--primary-ocean); margin-top: 0.25rem;">
                Turma: ${cls.groupName} &bull; Prof: ${prof}
              </div>
            </div>

            <div style="text-align: right;">
              <div style="font-size: 1.15rem; font-weight: 900; color: var(--primary-deep);">
                📅 ${formattedDate}
              </div>
              <div style="font-size: 1rem; color: var(--text-muted); font-weight: 700;">
                ⏰ ${cls.time || ''}
              </div>
            </div>
          </div>

          ${cls.observations ? `
            <div style="margin-top: 1rem; padding: 0.85rem 1rem; background: var(--bg-surface-subtle); border-radius: var(--radius-md); font-size: 0.9rem;">
              <strong>Observações:</strong> ${cls.observations}
            </div>
          ` : ''}
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <span>📸</span> Foto Oficial da Aula
            </h2>
            <span class="badge ${badgeClass}">${statusLabel}</span>
          </div>

          ${cls.photoUrl ? `
            <div style="text-align: center; margin-bottom: 1.25rem;">
              <img src="${cls.photoUrl}" alt="Foto da Aula" style="max-width: 100%; max-height: 380px; border-radius: var(--radius-lg); object-fit: cover; box-shadow: var(--shadow-md);">
            </div>

            <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
              <button class="btn btn-whatsapp btn-lg" style="flex: 1; max-width: 340px;" onclick="window.WhatsAppIntegration.openModal(${cls.id})">
                <span>📲</span> COMPARTILHAR NO WHATSAPP
              </button>
            </div>

            <div style="margin-top: 1.5rem; border-top: 1px dashed var(--border-color); padding-top: 1rem; text-align: center;">
              <label class="btn btn-secondary btn-sm" style="cursor: pointer;">
                Substituir Foto
                <input type="file" accept="image/*" style="display: none;" onchange="App.handleUploadDetailPhoto(event, ${cls.id})">
              </label>
            </div>
          ` : `
            <div style="background: var(--warning-light); border-left: 4px solid var(--warning-amber); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
              <strong style="color: #854d0e;">⚠️ Foto ainda não anexada para esta aula!</strong>
              <p style="font-size: 0.9rem; color: #a16207; margin-top: 0.25rem;">
                Anexe a foto da turma reunida na areia para concluir o registro e liberar o envio via WhatsApp.
              </p>
            </div>

            <label class="btn btn-sand btn-lg btn-block" style="cursor: pointer;">
              <span>📸</span> Anexar Foto da Aula Agora
              <input type="file" accept="image/*" capture="environment" style="display: none;" onchange="App.handleUploadDetailPhoto(event, ${cls.id})">
            </label>
          `}
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <span>👥</span> Chamada Realizada
            </h2>
            <div style="font-weight: 900; font-size: 1rem; color: var(--primary-deep);">
              Presentes: <span style="color: var(--success-emerald);">${presents}</span> / ${total} (${rate}%)
            </div>
          </div>

          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Aluno(a)</th>
                  <th>Telefone</th>
                  <th class="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                ${(cls.attendances || []).map(att => {
                  const student = window.store.state.students.find(s => s.id === att.studentId);
                  const stName = student ? student.name : `Aluno #${att.studentId}`;
                  const stPhone = student ? (student.phone ? App.maskPhone(student.phone) : '-') : '-';

                  return `
                    <tr>
                      <td class="font-bold">${stName}</td>
                      <td>${stPhone}</td>
                      <td class="text-center">
                        ${att.present ? `
                          <span style="display: inline-flex; align-items: center; gap: 0.25rem; font-weight: 800; color: #059669; background: var(--success-light); padding: 0.25rem 0.75rem; border-radius: var(--radius-full); font-size: 0.8rem;">
                            🟢 Presente
                          </span>
                        ` : `
                          <span style="display: inline-flex; align-items: center; gap: 0.25rem; font-weight: 800; color: #dc2626; background: var(--danger-light); padding: 0.25rem 0.75rem; border-radius: var(--radius-full); font-size: 0.8rem;">
                            🔴 Ausente
                          </span>
                        `}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    this.showView('classDetailView');
  },

  handleUploadDetailPhoto(event, classId) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      window.store.attachPhoto(classId, base64);
      this.showToast('Foto anexada com sucesso!', 'success');
      this.renderClassDetail(classId);

      setTimeout(() => {
        window.WhatsAppIntegration.openModal(classId);
      }, 150);
    };
    reader.readAsDataURL(file);
  },

  renderMonthlyClose() {
    const container = document.getElementById('monthlyCloseView');
    if (!container) return;

    const user = window.store.getCurrentUser();
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const selectedMonth = this.monthlyCloseMonth || currentMonth;
    const selectedYear = this.monthlyCloseYear || currentYear;

    const stats = window.store.getMonthlyMetrics(selectedMonth, selectedYear, user.id);

    const meses = [
      '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    container.innerHTML = `
      <div style="max-width: 1000px; margin: 0 auto;">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
          <div>
            <span style="font-size: 0.85rem; font-weight: 800; color: var(--sand-warm); text-transform: uppercase;">
              Relatório do Professor &bull; ${user.modality || 'Vôlei de Praia 🏐'}
            </span>
            <h1 style="font-size: 1.85rem; color: var(--primary-deep); margin-top: 0.2rem;">
              Fechamento do Mês
            </h1>
            <p style="color: var(--text-muted); font-size: 0.95rem;">
              Consolidado de aulas ministradas e frequência dos alunos.
            </p>
          </div>

          <div style="display: flex; gap: 0.5rem; align-items: center; background: white; padding: 0.4rem 0.6rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <select id="mc_month" class="form-select" onchange="App.handleMonthlyCloseChange()" style="min-height: 40px; padding: 0.4rem 0.75rem; font-weight: 700;">
              ${[1,2,3,4,5,6,7,8,9,10,11,12].map(m => `
                <option value="${m}" ${m === selectedMonth ? 'selected' : ''}>${meses[m]}</option>
              `).join('')}
            </select>

            <select id="mc_year" class="form-select" onchange="App.handleMonthlyCloseChange()" style="min-height: 40px; padding: 0.4rem 0.75rem; font-weight: 700;">
              ${[currentYear - 1, currentYear, currentYear + 1].map(y => `
                <option value="${y}" ${y === selectedYear ? 'selected' : ''}>${y}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon">🏐</div>
            <div class="kpi-label">Aulas Dadas</div>
            <div class="kpi-value">${stats.totalClasses}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">No mês</div>
          </div>

          <div class="kpi-card emerald">
            <div class="kpi-icon">👥</div>
            <div class="kpi-label">Presenças Totais</div>
            <div class="kpi-value">${stats.totalPresents}</div>
            <div style="font-size: 0.75rem; color: #059669;">Faltas: ${stats.totalAbsents}</div>
          </div>

          <div class="kpi-card gold">
            <div class="kpi-icon">🎯</div>
            <div class="kpi-label">Taxa Média</div>
            <div class="kpi-value">${stats.rate}%</div>
            <div style="font-size: 0.75rem; color: #d97706;">Frequência</div>
          </div>

          <div class="kpi-card orange">
            <div class="kpi-icon">📸</div>
            <div class="kpi-label">Total de Fotos</div>
            <div class="kpi-value">${stats.totalPhotos}</div>
            <div style="font-size: 0.75rem; color: ${stats.pendingPhotos > 0 ? '#ea580c' : '#059669'};">
              ${stats.pendingPhotos} aula(s) sem foto
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <span>📋</span> Aulas em ${meses[selectedMonth]} de ${selectedYear}
            </h2>
            <button class="btn btn-secondary btn-sm" onclick="window.print()">
              🖨️ Imprimir
            </button>
          </div>

          ${stats.classes.length > 0 ? `
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Horário</th>
                    <th>Turma</th>
                    <th>Presentes</th>
                    <th>Taxa (%)</th>
                    <th>Status Foto</th>
                    <th class="text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  ${stats.classes.map(c => {
                    const total = c.attendances?.length || 0;
                    const presents = c.attendances ? c.attendances.filter(a => a.present).length : 0;
                    const rate = total > 0 ? Math.round((presents / total) * 100) : 0;

                    const dateParts = c.date.split('-');
                    const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : c.date;

                    let badgeClass = 'badge-pending';
                    let statusLabel = '🟡 PENDENTE';
                    if (c.photoStatus === 'READY_TO_SEND') {
                      badgeClass = 'badge-ready';
                      statusLabel = '🔵 PREPARADO';
                    } else if (c.photoStatus === 'RECEIVED') {
                      badgeClass = 'badge-received';
                      statusLabel = '🟢 RECEBIDA';
                    }

                    return `
                      <tr>
                        <td class="font-bold">${formattedDate}</td>
                        <td>${c.time || ''}</td>
                        <td><span style="font-weight: 700; color: var(--primary-ocean);">${c.groupName}</span></td>
                        <td><strong>${presents}/${total}</strong></td>
                        <td><strong>${rate}%</strong></td>
                        <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
                        <td class="text-center">
                          <button class="btn btn-secondary btn-sm" onclick="App.navigate('#/aula/${c.id}')">Ver</button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
              Nenhuma aula registrada neste mês.
            </div>
          `}
        </div>

      </div>
    `;

    this.showView('monthlyCloseView');
  },

  handleMonthlyCloseChange() {
    this.monthlyCloseMonth = Number(document.getElementById('mc_month').value);
    this.monthlyCloseYear = Number(document.getElementById('mc_year').value);
    this.renderMonthlyClose();
  },

  // ----------------------------------------------------
  // MODAIS & TOASTS
  // ----------------------------------------------------
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  },

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type}`;
    toast.style.position = 'fixed';
    toast.style.bottom = '90px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    toast.style.maxWidth = '380px';
    toast.style.boxShadow = 'var(--shadow-xl)';
    toast.innerHTML = `
      <div>${message}</div>
      <button class="alert-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
  window.App.init();
});
