/**
 * ==========================================================================
 * FLUXO DE REGISTRO RÁPIDO DE AULA (< 1 MINUTO NO CELULAR NA QUADRA)
 * Chamada de alunos por toque, contadores dinâmicos e captura de câmera
 * ==========================================================================
 */

const QuickClass = {
  currentPhotoBase64: null,
  attendancesMap: {},

  init() {
    this.renderForm();
  },

  renderForm() {
    const container = document.getElementById('quickClassView');
    if (!container) return;

    const user = window.store.getCurrentUser();
    if (!user || user.role !== 'PROFESSOR') {
      window.App.navigate('#/login');
      return;
    }

    const arenas = window.store.getArenas();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    container.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto;">
        
        <div style="margin-bottom: 1.25rem;">
          <button class="btn btn-secondary btn-sm" onclick="window.App.navigate('#/professor')" style="margin-bottom: 0.5rem;">
            &larr; Voltar para Meu Painel
          </button>
          <h1 style="font-size: 1.85rem; color: var(--primary-deep);">
            ⚡ Registro Rápido de Aula (&lt; 1 min)
          </h1>
          <p style="color: var(--text-muted); font-size: 0.95rem;">
            Selecione a quadra, turma, marque a chamada com 1 toque e anexe a foto da aula.
          </p>
        </div>

        <form id="formQuickClass" onsubmit="QuickClass.handleSubmit(event)">
          
          <!-- 1. DADOS BÁSICOS DA AULA -->
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">
                <span>🏖️</span> Informações da Aula
              </h2>
            </div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
              
              <!-- Seleção de Arena -->
              <div class="form-group" style="margin-bottom: 0;">
                <label for="qc_arenaSelect" class="form-label">Arena / Quadra *</label>
                <select id="qc_arenaSelect" class="form-select" onchange="QuickClass.handleArenaChange(this.value)" required style="font-weight: 800; color: var(--primary-deep);">
                  ${arenas.map(a => `<option value="${a.id}">${a.name} (${a.location})</option>`).join('')}
                </select>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                
                <!-- Turma -->
                <div class="form-group" style="margin-bottom: 0; grid-column: 1 / -1;">
                  <label for="qc_groupName" class="form-label">Turma / Categoria *</label>
                  <input 
                    type="text" 
                    list="turmasList" 
                    id="qc_groupName" 
                    class="form-control" 
                    placeholder="Ex: Iniciante Manhã, Intermediário Noite..." 
                    value="Iniciante Manhã" 
                    required
                  >
                  <datalist id="turmasList">
                    <option value="Iniciante Manhã">
                    <option value="Iniciante Noite">
                    <option value="Intermediário Manhã">
                    <option value="Intermediário Noite">
                    <option value="Avançado Tarde">
                    <option value="Avançado Noite">
                    <option value="Kids & Teens">
                  </datalist>
                </div>

                <!-- Data -->
                <div class="form-group" style="margin-bottom: 0;">
                  <label for="qc_date" class="form-label">Data da Aula *</label>
                  <input type="date" id="qc_date" class="form-control" value="${today}" required>
                </div>

                <!-- Horário -->
                <div class="form-group" style="margin-bottom: 0;">
                  <label for="qc_time" class="form-label">Horário *</label>
                  <input type="time" id="qc_time" class="form-control" value="${currentTime}" required>
                </div>

              </div>

              <!-- Observações -->
              <div class="form-group" style="margin-bottom: 0; margin-top: 0.5rem;">
                <label for="qc_obs" class="form-label">Observações da Aula (Opcional)</label>
                <input type="text" id="qc_obs" class="form-control" placeholder="Ex: Treino de manchete e saque. Sol forte em quadra.">
              </div>

            </div>
          </div>

          <!-- 2. LISTA DE CHAMADA COM 1-TOQUE -->
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">
                <span>👥</span> Lista de Chamada em Quadra
              </h2>
              <div style="display: flex; gap: 0.5rem;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="QuickClass.setAllPresent(true)">
                  ✅ Todos Presentes
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="QuickClass.setAllPresent(false)">
                  ❌ Todos Ausentes
                </button>
              </div>
            </div>

            <!-- Resumo Dinâmico de Presença -->
            <div class="attendance-header">
              <div class="attendance-counter">
                Presentes: <span id="qc_presentCount" style="color: var(--success-emerald); font-size: 1.15rem;">0</span> de <span id="qc_totalCount">0</span>
              </div>
              <div style="font-weight: 800; color: var(--primary-deep); font-size: 1.05rem;">
                Frequência: <span id="qc_ratePercent" style="color: var(--sand-warm);">100%</span>
              </div>
            </div>

            <div class="attendance-grid" id="qc_attendanceGrid"></div>
          </div>

          <!-- 3. FOTO DA AULA (CÂMERA NO CELULAR / GALERIA) -->
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">
                <span>📸</span> Foto da Turma em Quadra
              </h2>
              <span style="font-size: 0.8rem; color: var(--text-muted);">Opcional (pode enviar depois)</span>
            </div>

            <input 
              type="file" 
              id="qc_photoInput" 
              accept="image/*" 
              capture="environment"
              style="display: none;" 
              onchange="QuickClass.handlePhotoSelected(event)"
            >

            <div class="photo-upload-zone" id="qc_uploadZone" onclick="document.getElementById('qc_photoInput').click()">
              <div class="upload-icon-circle">📷</div>
              <div style="font-weight: 800; font-size: 1.15rem; color: var(--primary-deep); margin-bottom: 0.25rem;">
                Tirar Foto ou Escolher da Galeria
              </div>
              <div style="font-size: 0.85rem; color: var(--text-muted);">
                Toque para abrir a câmera do celular ou selecionar foto
              </div>
            </div>

            <div class="photo-preview-container" id="qc_previewContainer">
              <img src="" id="qc_previewImg" alt="Foto da Aula" class="photo-preview-img">
              <button type="button" class="photo-preview-remove" onclick="QuickClass.removePhoto()">&times;</button>
              <div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--success-emerald); font-weight: 800;">
                🟢 Foto pronta para envio!
              </div>
            </div>
          </div>

          <!-- BOTÃO FINAL DE SALVAMENTO -->
          <div style="margin: 2rem 0;">
            <button type="submit" class="btn btn-sand btn-block btn-lg" style="box-shadow: 0 10px 25px rgba(245, 158, 11, 0.45); font-size: 1.25rem;">
              <span>💾</span> SALVAR AULA E PRESENÇAS
            </button>
            <div style="text-align: center; margin-top: 0.75rem; font-size: 0.85rem; color: var(--text-muted);">
              ⏱️ Registro concluído em menos de 1 minuto. Sincronizado instantaneamente.
            </div>
          </div>

        </form>

      </div>
    `;

    // Carrega alunos da primeira arena
    if (arenas.length > 0) {
      this.handleArenaChange(arenas[0].id);
    }
  },

  handleArenaChange(arenaId) {
    const grid = document.getElementById('qc_attendanceGrid');
    if (!grid) return;

    const students = window.store.getStudents(arenaId);
    this.attendancesMap = {};

    if (students.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted); background: var(--bg-surface-subtle); border-radius: var(--radius-md);">
          Nenhum aluno cadastrado nesta arena ainda.
        </div>
      `;
      this.updateCounters();
      return;
    }

    grid.innerHTML = students.map(st => {
      this.attendancesMap[st.id] = true; // Padrão: presente
      const initial = st.name ? st.name.charAt(0).toUpperCase() : 'A';

      return `
        <div class="student-card present" id="card_st_${st.id}" onclick="QuickClass.togglePresence(${st.id})">
          <div class="student-info">
            <div class="student-avatar">${initial}</div>
            <div>
              <div class="student-name">${st.name}</div>
              <div class="student-group-tag">${st.groupName || 'Geral'}</div>
            </div>
          </div>
          <div class="presence-status-pill" id="pill_st_${st.id}">🟢 Presente</div>
        </div>
      `;
    }).join('');

    this.updateCounters();
  },

  togglePresence(studentId) {
    const isPresent = !this.attendancesMap[studentId];
    this.attendancesMap[studentId] = isPresent;

    const card = document.getElementById(`card_st_${studentId}`);
    const pill = document.getElementById(`pill_st_${studentId}`);

    if (card && pill) {
      if (isPresent) {
        card.classList.remove('absent');
        card.classList.add('present');
        pill.innerHTML = '🟢 Presente';
      } else {
        card.classList.remove('present');
        card.classList.add('absent');
        pill.innerHTML = '⚪ Ausente';
      }
    }

    this.updateCounters();
  },

  setAllPresent(present) {
    Object.keys(this.attendancesMap).forEach(stId => {
      this.attendancesMap[stId] = present;
      const card = document.getElementById(`card_st_${stId}`);
      const pill = document.getElementById(`pill_st_${stId}`);
      if (card && pill) {
        if (present) {
          card.classList.remove('absent');
          card.classList.add('present');
          pill.innerHTML = '🟢 Presente';
        } else {
          card.classList.remove('present');
          card.classList.add('absent');
          pill.innerHTML = '⚪ Ausente';
        }
      }
    });
    this.updateCounters();
  },

  updateCounters() {
    const totalElem = document.getElementById('qc_totalCount');
    const presentElem = document.getElementById('qc_presentCount');
    const rateElem = document.getElementById('qc_ratePercent');

    const ids = Object.keys(this.attendancesMap);
    const total = ids.length;
    const presents = ids.filter(id => this.attendancesMap[id]).length;
    const rate = total > 0 ? Math.round((presents / total) * 100) : 100;

    if (totalElem) totalElem.textContent = total;
    if (presentElem) presentElem.textContent = presents;
    if (rateElem) rateElem.textContent = `${rate}%`;
  },

  handlePhotoSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.currentPhotoBase64 = e.target.result;
      const previewImg = document.getElementById('qc_previewImg');
      const previewContainer = document.getElementById('qc_previewContainer');
      const uploadZone = document.getElementById('qc_uploadZone');

      if (previewImg && previewContainer && uploadZone) {
        previewImg.src = this.currentPhotoBase64;
        previewContainer.classList.add('active');
        uploadZone.style.display = 'none';
      }
    };
    reader.readAsDataURL(file);
  },

  removePhoto() {
    this.currentPhotoBase64 = null;
    const input = document.getElementById('qc_photoInput');
    const previewContainer = document.getElementById('qc_previewContainer');
    const uploadZone = document.getElementById('qc_uploadZone');

    if (input) input.value = '';
    if (previewContainer) previewContainer.classList.remove('active');
    if (uploadZone) uploadZone.style.display = 'block';
  },

  handleSubmit(event) {
    event.preventDefault();

    const user = window.store.getCurrentUser();
    const arenaId = document.getElementById('qc_arenaSelect').value;
    const groupName = document.getElementById('qc_groupName').value.trim();
    const date = document.getElementById('qc_date').value;
    const time = document.getElementById('qc_time').value;
    const observations = document.getElementById('qc_obs').value.trim();

    const attendances = Object.keys(this.attendancesMap).map(stId => ({
      studentId: Number(stId),
      present: this.attendancesMap[stId]
    }));

    const newClass = window.store.createClass({
      professorId: user.id,
      arenaId,
      groupName,
      date,
      time,
      observations,
      photoUrl: this.currentPhotoBase64,
      attendances
    });

    // Redireciona para visualização detalhada da aula criada
    window.App.navigate(`#/aula/${newClass.id}`);

    // Dispara modal apropriado
    setTimeout(() => {
      if (newClass.photoUrl) {
        window.WhatsAppIntegration.openModal(newClass.id);
      } else {
        window.App.openModal('photoPendingModal');
      }
    }, 150);
  }
};

window.QuickClass = QuickClass;
