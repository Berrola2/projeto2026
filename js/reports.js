/**
 * ==========================================================================
 * RELATÓRIOS ADMINISTRATIVOS & EXPORTAÇÃO CSV
 * ==========================================================================
 */

const Reports = {
  selectedMonth: new Date().getMonth() + 1,
  selectedYear: new Date().getFullYear(),

  init() {
    this.render();
  },

  render() {
    const container = document.getElementById('reportsView');
    if (!container) return;

    const user = window.store.getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      window.App.showToast('Você não possui permissão para acessar esta área.', 'danger');
      window.App.navigate(user?.role === 'PROFESSOR' ? '#/professor' : '#/login');
      return;
    }

    const meses = [
      '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const currentYear = new Date().getFullYear();
    const anos = [currentYear - 1, currentYear, currentYear + 1];

    container.innerHTML = `
      <div>
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
          <div>
            <span style="font-size: 0.85rem; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.05em;">
              Auditoria e Desempenho
            </span>
            <h1 style="font-size: 1.85rem; color: var(--primary-deep); margin-top: 0.15rem;">
              Relatórios Administrativos 📈
            </h1>
            <p style="color: var(--text-muted); font-size: 0.95rem;">
              Consolidado de frequência, aulas dadas e fotos por professor e por arena.
            </p>
          </div>

          <!-- FILTRO DE MÊS/ANO & BOTÃO CSV -->
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
            <div style="display: flex; gap: 0.5rem; background: white; padding: 0.4rem 0.6rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <select id="rep_selectMonth" class="form-select" onchange="Reports.handleFilterChange()" style="min-height: 40px; padding: 0.4rem 0.75rem; font-weight: 700;">
                ${[1,2,3,4,5,6,7,8,9,10,11,12].map(m => `
                  <option value="${m}" ${m === this.selectedMonth ? 'selected' : ''}>${meses[m]}</option>
                `).join('')}
              </select>

              <select id="rep_selectYear" class="form-select" onchange="Reports.handleFilterChange()" style="min-height: 40px; padding: 0.4rem 0.75rem; font-weight: 700;">
                ${anos.map(y => `
                  <option value="${y}" ${y === this.selectedYear ? 'selected' : ''}>${y}</option>
                `).join('')}
              </select>
            </div>

            <button class="btn btn-sand" onclick="window.store.exportCSV(Reports.selectedMonth, Reports.selectedYear)" style="min-height: 48px;">
              <span>📥</span> EXPORTAR CSV (EXCEL)
            </button>
          </div>
        </div>

        <!-- 1. RELATÓRIO POR PROFESSOR -->
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-header">
            <h2 class="card-title">
              <span>👨‍🏫</span> Desempenho por Professor (${meses[this.selectedMonth]}/${this.selectedYear})
            </h2>
          </div>

          <div class="table-responsive">
            <table class="custom-table" id="rep_profTable"></table>
          </div>
        </div>

        <!-- 2. RELATÓRIO POR ARENA -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <span>🏖️</span> Desempenho por Arena (${meses[this.selectedMonth]}/${this.selectedYear})
            </h2>
          </div>

          <div class="table-responsive">
            <table class="custom-table" id="rep_arenaTable"></table>
          </div>
        </div>

      </div>
    `;

    this.renderTables();
  },

  handleFilterChange() {
    this.selectedMonth = Number(document.getElementById('rep_selectMonth').value);
    this.selectedYear = Number(document.getElementById('rep_selectYear').value);
    this.render();
  },

  renderTables() {
    const profTable = document.getElementById('rep_profTable');
    const arenaTable = document.getElementById('rep_arenaTable');
    if (!profTable || !arenaTable) return;

    const professors = window.store.getProfessors();
    const arenas = window.store.getArenas();

    // 1. Tabela por Professor
    profTable.innerHTML = `
      <thead>
        <tr>
          <th>Professor(a)</th>
          <th>E-mail</th>
          <th>Aulas Dadas</th>
          <th>Presenças Totais</th>
          <th>Faltas</th>
          <th>Taxa Média (%)</th>
          <th>Fotos Entregues</th>
        </tr>
      </thead>
      <tbody>
        ${professors.map(p => {
          const stats = window.store.getMonthlyMetrics(this.selectedMonth, this.selectedYear, p.id);
          const colorRate = stats.rate >= 80 ? '#059669' : stats.rate >= 60 ? '#d97706' : '#dc2626';

          return `
            <tr>
              <td class="font-bold">${p.name}</td>
              <td style="font-size: 0.85rem; color: var(--text-muted);">${p.email}</td>
              <td><strong>${stats.totalClasses}</strong> aulas</td>
              <td><span style="color: var(--success-emerald); font-weight: 800;">${stats.totalPresents}</span></td>
              <td><span style="color: var(--danger-crimson);">${stats.totalAbsents}</span></td>
              <td><span style="font-weight: 900; color: ${colorRate};">${stats.rate}%</span></td>
              <td>
                <span class="badge ${stats.totalPhotos >= stats.totalClasses && stats.totalClasses > 0 ? 'badge-received' : 'badge-pending'}">
                  📸 ${stats.totalPhotos} / ${stats.totalClasses}
                </span>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    `;

    // 2. Tabela por Arena
    arenaTable.innerHTML = `
      <thead>
        <tr>
          <th>Arena</th>
          <th>Localização</th>
          <th>Alunos Cadastrados</th>
          <th>Aulas no Mês</th>
          <th>Presenças</th>
          <th>Frequência Média (%)</th>
        </tr>
      </thead>
      <tbody>
        ${arenas.map(a => {
          const classesInArena = window.store.state.classes.filter(c => {
            const d = new Date(c.date + 'T00:00:00');
            return c.arenaId === a.id && (d.getMonth() + 1) === this.selectedMonth && d.getFullYear() === this.selectedYear;
          });

          const studentsCount = window.store.getStudents(a.id).length;
          let presents = 0;
          let totalSlots = 0;

          classesInArena.forEach(c => {
            if (c.attendances) {
              totalSlots += c.attendances.length;
              c.attendances.forEach(att => { if (att.present) presents++; });
            }
          });

          const rate = totalSlots > 0 ? Math.round((presents / totalSlots) * 100) : 0;
          const colorRate = rate >= 80 ? '#059669' : rate >= 60 ? '#d97706' : '#dc2626';

          return `
            <tr>
              <td class="font-bold">${a.name}</td>
              <td style="font-size: 0.85rem; color: var(--text-muted);">${a.location}</td>
              <td><strong>${studentsCount}</strong> alunos</td>
              <td><strong>${classesInArena.length}</strong> aulas</td>
              <td><span style="color: var(--success-emerald); font-weight: 800;">${presents}</span></td>
              <td><span style="font-weight: 900; color: ${colorRate};">${rate}%</span></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    `;
  }
};

window.Reports = Reports;
