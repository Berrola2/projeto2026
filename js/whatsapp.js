/**
 * ==========================================================================
 * INTEGRAÇÃO WHATSAPP PARA AULAS DE VÔLEI DE PRAIA
 * Geração de link wa.me com mensagem formatada e atualização para READY_TO_SEND
 * ==========================================================================
 */

const WhatsAppIntegration = {
  currentClassId: null,

  openModal(classId) {
    const cls = window.store.getClassById(classId);
    if (!cls) return;

    this.currentClassId = classId;
    const arena = window.store.getArenaById(cls.arenaId);
    const arenaName = arena ? arena.name : 'Arena de Vôlei';

    // Determina saudação pelo horário
    const hour = cls.time ? parseInt(cls.time.split(':')[0], 10) : new Date().getHours();
    let saudacao = 'Boa noite!';
    if (hour < 12) saudacao = 'Bom dia!';
    else if (hour < 18) saudacao = 'Boa tarde!';

    const dateParts = cls.date.split('-');
    const dataFormatada = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : cls.date;

    const message = `${saudacao} Segue a foto da aula de hoje na ${arenaName} (${dataFormatada}). 🏐📸`;

    const previewElem = document.getElementById('whatsappMessagePreview');
    if (previewElem) {
      previewElem.textContent = `“${message}”`;
    }

    const btnSend = document.getElementById('btnConfirmWhatsApp');
    if (btnSend) {
      btnSend.onclick = () => {
        this.send(classId, message);
      };
    }

    window.App.openModal('whatsappModal');
  },

  send(classId, message) {
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/?text=${encoded}`;

    // Abre o WhatsApp oficial em nova aba/app
    window.open(url, '_blank');

    // Atualiza status para READY_TO_SEND no banco local
    window.store.markWhatsAppSent(classId);

    window.App.closeModal('whatsappModal');
    window.App.showToast('Status atualizado para 🔵 PREPARADO PARA ENVIO!', 'info');

    // Re-renderiza a visualização da aula atual
    if (window.location.hash.startsWith('#/aula/')) {
      window.App.renderClassDetail(classId);
    } else if (window.location.hash === '#/professor') {
      window.App.renderProfessorDashboard();
    }
  }
};

window.WhatsAppIntegration = WhatsAppIntegration;
