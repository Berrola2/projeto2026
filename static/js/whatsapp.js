/**
 * INTEGRAÇÃO WHATSAPP PARA AULAS DE VÔLEI DE PRAIA
 * Geração de link com mensagem formatada e atualização de status no backend
 */

function enviarParaWhatsApp(sessionId, encodedText) {
  // 1. Gera link oficial wa.me
  const whatsappUrl = `https://wa.me/?text=${encodedText}`;

  // 2. Abre WhatsApp em nova aba/app
  window.open(whatsappUrl, '_blank');

  // 3. Atualiza status no backend para READY_TO_SEND
  fetch(`/professor/aula/${sessionId}/whatsapp-enviado`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  })
  .then(res => res.json())
  .then(data => {
    if (data.sucesso) {
      // Atualiza badge de status na tela
      const statusBadge = document.getElementById(`statusBadge_${sessionId}`) || document.getElementById('sessionStatusBadge');
      if (statusBadge) {
        statusBadge.className = `badge ${data.badge_class}`;
        statusBadge.innerHTML = `🔵 ${data.status_label}`;
      }
    }
  })
  .catch(err => {
    console.error('Erro ao atualizar status do WhatsApp:', err);
  })
  .finally(() => {
    // Fecha modal do WhatsApp se estiver aberto
    fecharModal('whatsappModal');
  });
}
