/**
 * FLUXO DE REGISTRO RÁPIDO DE AULA (< 1 MINUTO NO CELULAR)
 * Suporte a toque rápido em quadra, marcação de presença e preview de foto
 */

document.addEventListener('DOMContentLoaded', () => {
  const arenaSelect = document.getElementById('arenaSelect');
  const attendanceContainer = document.getElementById('attendanceGrid');
  const totalCounterElem = document.getElementById('totalCounter');
  const presentCounterElem = document.getElementById('presentCounter');
  const rateCounterElem = document.getElementById('rateCounter');
  const btnMarkAll = document.getElementById('btnMarkAll');
  const btnUnmarkAll = document.getElementById('btnUnmarkAll');
  
  const photoInput = document.getElementById('classPhotoInput');
  const uploadZone = document.getElementById('photoUploadZone');
  const previewContainer = document.getElementById('photoPreviewContainer');
  const previewImg = document.getElementById('photoPreviewImg');
  const btnRemovePhoto = document.getElementById('btnRemovePhoto');

  // 1. Atualizar contadores de presença
  function updateAttendanceCounters() {
    const cards = document.querySelectorAll('.student-card');
    const total = cards.length;
    let present = 0;

    cards.forEach(card => {
      const isPresent = card.classList.contains('present');
      const input = card.querySelector('input[type="hidden"]');
      if (isPresent) {
        present++;
        if (input) input.value = '1';
      } else {
        if (input) input.value = '0';
      }
    });

    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    if (totalCounterElem) totalCounterElem.textContent = total;
    if (presentCounterElem) presentCounterElem.textContent = present;
    if (rateCounterElem) rateCounterElem.textContent = `${rate}%`;
  }

  // 2. Toggle de presença ao clicar no card do aluno
  function bindStudentCardEvents() {
    document.querySelectorAll('.student-card').forEach(card => {
      card.onclick = function() {
        const isPresent = this.classList.contains('present');
        const statusPill = this.querySelector('.presence-status-pill');
        const input = this.querySelector('input[type="hidden"]');

        if (isPresent) {
          this.classList.remove('present');
          this.classList.add('absent');
          if (statusPill) statusPill.innerHTML = '⚪ Ausente';
          if (input) input.value = '0';
        } else {
          this.classList.remove('absent');
          this.classList.add('present');
          if (statusPill) statusPill.innerHTML = '🟢 Presente';
          if (input) input.value = '1';
        }

        updateAttendanceCounters();
      };
    });
  }

  // Inicializa eventos nos cards existentes
  bindStudentCardEvents();
  updateAttendanceCounters();

  // 3. Atalhos de Marcação Rápida
  if (btnMarkAll) {
    btnMarkAll.addEventListener('click', () => {
      document.querySelectorAll('.student-card').forEach(card => {
        card.classList.remove('absent');
        card.classList.add('present');
        const statusPill = card.querySelector('.presence-status-pill');
        if (statusPill) statusPill.innerHTML = '🟢 Presente';
      });
      updateAttendanceCounters();
    });
  }

  if (btnUnmarkAll) {
    btnUnmarkAll.addEventListener('click', () => {
      document.querySelectorAll('.student-card').forEach(card => {
        card.classList.remove('present');
        card.classList.add('absent');
        const statusPill = card.querySelector('.presence-status-pill');
        if (statusPill) statusPill.innerHTML = '⚪ Ausente';
      });
      updateAttendanceCounters();
    });
  }

  // 4. Carregamento dinâmico de alunos ao trocar de Arena
  if (arenaSelect && attendanceContainer) {
    arenaSelect.addEventListener('change', async () => {
      const arenaId = arenaSelect.value;
      if (!arenaId) return;

      attendanceContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #64748b;">Carregando lista de alunos da quadra...</div>';

      try {
        const response = await fetch(`/api/arena/${arenaId}/alunos`);
        const students = await response.json();

        if (students.length === 0) {
          attendanceContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #64748b; background: white; border-radius: 12px; border: 1px dashed #cbd5e1;">Nenhum aluno cadastrado nesta arena ainda.</div>';
          updateAttendanceCounters();
          return;
        }

        attendanceContainer.innerHTML = '';
        students.forEach(st => {
          const card = document.createElement('div');
          card.className = 'student-card present';
          card.dataset.studentId = st.id;

          const initial = st.name ? st.name.charAt(0).toUpperCase() : 'A';

          card.innerHTML = `
            <div class="student-info">
              <div class="student-avatar">${initial}</div>
              <div>
                <div class="student-name">${st.name}</div>
                <div class="student-group-tag">${st.group_name || 'Geral'}</div>
              </div>
            </div>
            <div class="presence-status-pill">🟢 Presente</div>
            <input type="hidden" name="present_student_${st.id}" value="1">
          `;

          attendanceContainer.appendChild(card);
        });

        bindStudentCardEvents();
        updateAttendanceCounters();
      } catch (err) {
        console.error("Erro ao carregar alunos:", err);
        attendanceContainer.innerHTML = '<div style="grid-column: 1/-1; color: #ef4444; text-align: center;">Erro ao carregar alunos. Tente novamente.</div>';
      }
    });
  }

  // 5. Upload e Preview da Foto da Aula
  if (uploadZone && photoInput) {
    uploadZone.addEventListener('click', () => {
      photoInput.click();
    });

    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (previewImg && previewContainer) {
            previewImg.src = event.target.result;
            previewContainer.classList.add('active');
            uploadZone.style.display = 'none';
          }
        };
        reader.readAsDataURL(file);
      }
    });

    if (btnRemovePhoto) {
      btnRemovePhoto.addEventListener('click', (e) => {
        e.stopPropagation();
        photoInput.value = '';
        if (previewContainer) previewContainer.classList.remove('active');
        if (uploadZone) uploadZone.style.display = 'block';
      });
    }
  }
});
