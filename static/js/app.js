/**
 * SISTEMA DE GESTÃO DE AULAS DE VÔLEI DE PRAIA
 * Javascript Global: Modais, Alertas e Lightbox
 */

document.addEventListener('DOMContentLoaded', () => {
  // Fechar alertas flash
  document.querySelectorAll('.alert-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const alert = e.target.closest('.alert');
      if (alert) {
        alert.style.opacity = '0';
        alert.style.transform = 'translateY(-8px)';
        setTimeout(() => alert.remove(), 250);
      }
    });
  });

  // Fechar modais ao clicar no botão fechar ou fora do modal
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-backdrop');
      if (modal) {
        fecharModal(modal.id);
      }
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        fecharModal(modal.id);
      }
    });
  });
});

// Funções globais de Modal
function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

function fecharModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
}

// Lightbox para Galeria
function abrirFotoLightbox(imgSrc, titulo, detalhes) {
  const modal = document.getElementById('photoLightboxModal');
  if (!modal) return;

  const imgElem = modal.querySelector('#lightboxImage');
  const titleElem = modal.querySelector('#lightboxTitle');
  const descElem = modal.querySelector('#lightboxDetails');

  if (imgElem) imgElem.src = imgSrc;
  if (titleElem) titleElem.textContent = titulo;
  if (descElem) descElem.textContent = detalhes;

  abrirModal('photoLightboxModal');
}
