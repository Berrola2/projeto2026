/**
 * ==========================================================================
 * INTEGRAÇÃO SUPABASE & SINCRONIZAÇÃO EM NUVEM EM TEMPO REAL
 * Sincroniza dados entre múltiplos dispositivos, computadores e celulares
 * ==========================================================================
 */

const SupabaseSync = {
  client: null,
  isOnline: false,
  syncInterval: null,

  // Chaves padrão ou salvas no navegador
  getConfig() {
    return {
      url: localStorage.getItem('VOLEI_SUPABASE_URL') || '',
      key: localStorage.getItem('VOLEI_SUPABASE_KEY') || ''
    };
  },

  setConfig(url, key) {
    if (url) localStorage.setItem('VOLEI_SUPABASE_URL', url.trim());
    if (key) localStorage.setItem('VOLEI_SUPABASE_KEY', key.trim());
    return this.init();
  },

  async init() {
    const { url, key } = this.getConfig();

    if (!url || !key || !window.supabase) {
      this.isOnline = false;
      this.updateStatusBadge();
      return false;
    }

    try {
      this.client = window.supabase.createClient(url, key);
      
      // Testa a conexão baixando os dados
      await this.pullFromCloud();
      this.isOnline = true;
      this.setupRealtimeListener();
      this.updateStatusBadge();

      // Sincronização periódica a cada 10 segundos
      if (this.syncInterval) clearInterval(this.syncInterval);
      this.syncInterval = setInterval(() => this.pullFromCloud(), 10000);

      console.log('✅ Supabase conectado e sincronizado com sucesso!');
      return true;
    } catch (err) {
      console.warn('⚠️ Falha ao conectar com o Supabase:', err);
      this.isOnline = false;
      this.updateStatusBadge();
      return false;
    }
  },

  async pullFromCloud() {
    if (!this.client) return;

    try {
      // 1. Tenta buscar da tabela app_state
      const { data, error } = await this.client
        .from('app_state')
        .select('data')
        .eq('id', 'global_db')
        .maybeSingle();

      if (data && data.data) {
        const cloudState = data.data;
        const localCurrentUser = window.store.getCurrentUser();
        
        // Atualiza o estado preservando o login atual
        window.store.state = {
          ...cloudState,
          currentUser: localCurrentUser
        };
        localStorage.setItem(window.store.STORAGE_KEY, JSON.stringify(window.store.state));
        window.store.notify();
      }
    } catch (e) {
      console.error('Erro no pull do Supabase:', e);
    }
  },

  async pushToCloud() {
    if (!this.client) return;

    try {
      const stateToSave = {
        arenas: window.store.state.arenas,
        users: window.store.state.users,
        students: window.store.state.students,
        classes: window.store.state.classes
      };

      await this.client
        .from('app_state')
        .upsert({
          id: 'global_db',
          data: stateToSave,
          updated_at: new Date().toISOString()
        });

      console.log('☁️ Alterações sincronizadas com o Supabase com sucesso.');
    } catch (e) {
      console.error('Erro ao enviar dados para o Supabase:', e);
    }
  },

  setupRealtimeListener() {
    if (!this.client) return;

    try {
      this.client
        .channel('public:app_state')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, () => {
          console.log('⚡ Atualização em tempo real recebida do Supabase!');
          this.pullFromCloud();
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription error:', e);
    }
  },

  updateStatusBadge() {
    const badge = document.getElementById('cloudSyncStatusBadge');
    if (!badge) return;

    if (this.isOnline) {
      badge.innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 0.35rem; color: #15803d; background: #dcfce7; border: 1px solid #86efac; padding: 0.2rem 0.65rem; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 800; cursor: pointer;" onclick="App.openModal('supabaseConfigModal')" title="Banco de dados na nuvem ativo e sincronizando">
          🟢 Supabase Ativo
        </span>
      `;
    } else {
      badge.innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 0.35rem; color: #b45309; background: #fef3c7; border: 1px solid #fde047; padding: 0.2rem 0.65rem; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 800; cursor: pointer;" onclick="App.openModal('supabaseConfigModal')" title="Clique para configurar o banco de dados online">
          ⚡ Conectar Supabase
        </span>
      `;
    }
  }
};

window.SupabaseSync = SupabaseSync;
