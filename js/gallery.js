/**
 * ==========================================================================
 * GALERIA CENTRAL DE FOTOS (FEED VISUAL & FILTROS COM ISOLAMENTO POR ARENA)
 * ==========================================================================
 */

const Gallery = {
  init() {
    this.render();
  },

  render() {
    const container = document.getElementById('galleryView');
    if (!container) return;

    const user = window.store.getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      window.App.showToast('Você não possui permissão para acessar esta área.', 'danger');
      window.App.navigate(user?.role === 'PROFESSOR' ? '#/professor' : '#/login');
      return;
    }

    const arenaObj = window.store.getArenaById(user.arenaId);
    const arenaName = arenaObj ? arenaObj.name : 'Minha Arena';

    const professors = window.store.getProfessors();
    const myClasses = window.store.getClasses();
    const allGroups = [...new Set(myClasses.map(c => c.groupName))];

    container.innerHTML = `
      <div>
        <div style="margin-bottom: 1.5rem;">
          <span style="font-size: 0.85rem; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.05em;">
            Feed Fotográfico &bull; ${arenaName}
          </span>
          <h1 style="font-size: 1.85rem; color: var(--primary-deep); margin-top: 0.15rem;">
            Galeria de Fotos da ${arenaName} 📸
          </h1>
          <p style="color: var(--text-muted); font-size: 0.95rem;">
            Acompanhamento visual em tempo real das turmas e treinos realizados na <strong>${arenaName}</strong>.
          </p>
        </div>

        <!-- BARRA DE FILTROS DINÂMICOS -->
        <div class="filter-bar">
          <div class="filter-form-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
            
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.8rem;">Data da Aula</label>
              <input type="date" id="gal_filterDate" class="form-control" onchange="Gallery.filterPhotos()" style="min-height: 42px; padding: 0.4rem 0.75rem;">
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.8rem;">Professor</label>
              <select id="gal_filterProf" class="form-select" onchange="Gallery.filterPhotos()" style="min-height: 42px; padding: 0.4rem 0.75rem;">
                <option value="">Todos os Professores</option>
                ${professors.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.8rem;">Turma</label>
              <select id="gal_filterGroup" class="form-select" onchange="Gallery.filterPhotos()" style="min-height: 42px; padding: 0.4rem 0.75rem;">
                <option value="TODAS">Todas as Turmas</option>
                ${allGroups.map(g => `<option value="${g}">${g}</option>`).join('')}
              </select>
            </div>

            <div style="display: flex; gap: 0.5rem; align-items: flex-end;">
              <button class="btn btn-secondary" onclick="Gallery.clearFilters()" style="min-height: 42px; width: 100%;">
                ↺ Limpar Filtros
              </button>
            </div>

          </div>
        </div>

        <!-- FEED DE FOTOS -->
        <div id="galleryGridContainer"></div>
      </div>
    `;

    this.filterPhotos();
  },

  filterPhotos() {
    const date = document.getElementById('gal_filterDate')?.value || '';
    const profId = document.getElementById('gal_filterProf')?.value || '';
    const group = document.getElementById('gal_filterGroup')?.value || 'TODAS';

    // Obtém apenas as aulas da arena isolada do gestor
    let classesWithPhotos = window.store.getClasses().filter(c => c.photoUrl);

    if (date) classesWithPhotos = classesWithPhotos.filter(c => c.date === date);
    if (profId) classesWithPhotos = classesWithPhotos.filter(c => c.professorId === Number(profId));
    if (group && group !== 'TODAS') classesWithPhotos = classesWithPhotos.filter(c => c.groupName === group);

    const container = document.getElementById('galleryGridContainer');
    if (!container) return;

    if (classesWithPhotos.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">📸</div>
          <h3 style="font-size: 1.25rem; color: var(--primary-deep); margin-bottom: 0.25rem;">Nenhuma foto encontrada para os filtros selecionados</h3>
          <p style="font-size: 0.9rem;">Fotos postadas por professores desta arena aparecerão automaticamente aqui.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="gallery-grid">
        ${classesWithPhotos.map(c => {
          const arena = window.store.getArenaById(c.arenaId)?.name || 'Arena';
          const prof = window.store.getProfessorById(c.professorId)?.name || 'Professor';
          const total = c.attendances?.length || 0;
          const presents = c.attendances ? c.attendances.filter(a => a.present).length : 0;
          const rate = total > 0 ? Math.round((presents / total) * 100) : 0;

          const dateParts = c.date.split('-');
          const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : c.date;

          let badgeClass = 'badge-pending';
          let statusLabel = '🟡 FOTO PENDENTE';
          if (c.photoStatus === 'READY_TO_SEND') {
            badgeClass = 'badge-ready';
            statusLabel = '🔵 PREPARADO';
          } else if (c.photoStatus === 'RECEIVED') {
            badgeClass = 'badge-received';
            statusLabel = '🟢 RECEBIDA';
          }

          const whatsappMessage = `Boa noite! Segue a foto da aula de hoje na ${arena} (${formattedDate}). 🏐📸`;

          return `
            <div class="gallery-card">
              <div class="gallery-image-container" onclick="Gallery.openLightbox('${c.photoUrl}', '${arena} - ${c.groupName}', 'Data: ${formattedDate} às ${c.time || ''} | Professor: ${prof}')">
                <img src="${c.photoUrl}" alt="Foto da Aula" class="gallery-img">
                <div class="gallery-status-overlay">
                  <span class="badge ${badgeClass}">${statusLabel}</span>
                </div>
                <div class="gallery-date-overlay">
                  📅 ${formattedDate} &bull; ${c.time || ''}
                </div>
              </div>

              <div class="gallery-body">
                <div>
                  <div class="gallery-arena-title">${arena}</div>
                  <div class="gallery-meta">
                    <div><strong>Turma:</strong> ${c.groupName}</div>
                    <div><strong>Professor:</strong> ${prof}</div>
                    <div><strong>Presença:</strong> ${presents}/${total} alunos (${rate}%)</div>
                  </div>
                </div>

                <div style="display: flex; gap: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                  <button class="btn btn-whatsapp btn-sm" style="flex: 1;" onclick="window.open('https://wa.me/?text=${encodeURIComponent(whatsappMessage)}', '_blank')">
                    <span>📲</span> WhatsApp
                  </button>
                  <a href="${c.photoUrl}" download="foto_aula_${c.id}.jpg" class="btn btn-secondary btn-sm" title="Baixar Imagem">
                    💾
                  </a>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  clearFilters() {
    const d = document.getElementById('gal_filterDate');
    const p = document.getElementById('gal_filterProf');
    const g = document.getElementById('gal_filterGroup');

    if (d) d.value = '';
    if (p) p.value = '';
    if (g) g.value = 'TODAS';

    this.filterPhotos();
  },

  openLightbox(src, title, details) {
    const imgElem = document.getElementById('lightboxImage');
    const titleElem = document.getElementById('lightboxTitle');
    const descElem = document.getElementById('lightboxDetails');

    if (imgElem) imgElem.src = src;
    if (titleElem) titleElem.textContent = title;
    if (descElem) descElem.textContent = details;

    window.App.openModal('photoLightboxModal');
  }
};

window.Gallery = Gallery;
