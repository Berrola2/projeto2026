/**
 * ==========================================================================
 * INTEGRAÇÃO SUPABASE & SINCRONIZAÇÃO EM NUVEM EM TEMPO REAL
 * Sincroniza dados em background entre celulares e computadores
 * ==========================================================================
 */

// Credenciais Oficiais do Supabase
const SUPABASE_CONFIG = {
  url: 'https://wwxlfucpllxdpzmrrhfa.supabase.co',
  anonKey: 'sb_publishable_yROxATTExwYaBlSnFydLYg_QKTWXfg6'
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
      
      // Sincroniza dados iniciais da nuvem
      await this.pullFromCloud();
      this.isOnline = true;
      this.setupRealtimeListener();

      // Sincronização periódica em background a cada 6 segundos
      if (this.syncInterval) clearInterval(this.syncInterval);
      this.syncInterval = setInterval(() => this.pullFromCloud(), 6000);

      console.log('☁️ Supabase conectado e sincronizando em tempo real.');
      return true;
    } catch (err) {
      console.warn('Sincronização Supabase em espera:', err);
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

      if (error) {
        // Se a tabela ainda não foi criada no Supabase SQL editor
        return;
      }

      if (data && data.data) {
        const cloudState = data.data;
        const localCurrentUser = window.store.getCurrentUser();
        
        // Atualiza o estado local preservando a sessão atual do usuário
        window.store.state = {
          ...cloudState,
          currentUser: localCurrentUser
        };
        localStorage.setItem(window.store.STORAGE_KEY, JSON.stringify(window.store.state));
        window.store.notify();
      }
    } catch (e) {
      // Falha silenciosa
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

      const { error } = await this.client
        .from('app_state')
        .upsert({
          id: 'global_db',
          data: stateToSave,
          updated_at: new Date().toISOString()
        });

      if (!error) {
        console.log('☁️ Alteração sincronizada com o Supabase com sucesso.');
      }
    } catch (e) {
      console.warn('Erro ao enviar dados para o Supabase:', e);
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
      console.warn('Realtime listener subscription:', e);
    }
  }
};

window.SupabaseSync = SupabaseSync;
