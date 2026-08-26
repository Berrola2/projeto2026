/**
 * ==========================================================================
 * INTEGRAÇÃO SUPABASE & SINCRONIZAÇÃO EM NUVEM EM TEMPO REAL
 * Sincroniza dados em background entre celulares e computadores
 * ==========================================================================
 */

// Configuração Central do Supabase
const SUPABASE_CONFIG = {
  url: localStorage.getItem('VOLEI_SUPABASE_URL') || '',
  anonKey: localStorage.getItem('VOLEI_SUPABASE_KEY') || ''
};

const SupabaseSync = {
  client: null,
  isOnline: false,
  syncInterval: null,

  async init() {
    const url = SUPABASE_CONFIG.url;
    const key = SUPABASE_CONFIG.anonKey;

    if (!url || !key || !window.supabase) {
      this.isOnline = false;
      return false;
    }

    try {
      this.client = window.supabase.createClient(url, key);
      
      // Sincroniza dados iniciais
      await this.pullFromCloud();
      this.isOnline = true;
      this.setupRealtimeListener();

      // Sincronização periódica em background a cada 10 segundos
      if (this.syncInterval) clearInterval(this.syncInterval);
      this.syncInterval = setInterval(() => this.pullFromCloud(), 10000);

      console.log('☁️ Supabase conectado e sincronizando em tempo real.');
      return true;
    } catch (err) {
      console.warn('Falha na sincronização do Supabase:', err);
      this.isOnline = false;
      return false;
    }
  },

  async pullFromCloud() {
    if (!this.client) return;

    try {
      const { data, error } = await this.client
        .from('app_state')
        .select('data')
        .eq('id', 'global_db')
        .maybeSingle();

      if (data && data.data) {
        const cloudState = data.data;
        const localCurrentUser = window.store.getCurrentUser();
        
        // Atualiza o estado preservando a sessão local do usuário
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

      console.log('☁️ Alteração sincronizada com o Supabase.');
    } catch (e) {
      console.error('Erro no push do Supabase:', e);
    }
  },

  setupRealtimeListener() {
    if (!this.client) return;

    try {
      this.client
        .channel('public:app_state')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, () => {
          this.pullFromCloud();
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime listener subscription error:', e);
    }
  }
};

window.SupabaseSync = SupabaseSync;
