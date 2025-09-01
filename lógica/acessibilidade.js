'use strict';

export function confinarTabulacao(overlay) {
  return (e) => {
    if (e.key === 'Tab') {
      const elementosFocaveis = overlay.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const primeiroElemento = elementosFocaveis[0];
      const ultimoElemento = elementosFocaveis[elementosFocaveis.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === primeiroElemento) {
          e.preventDefault();
          ultimoElemento.focus();
        }
      } else {
        if (document.activeElement === ultimoElemento) {
          e.preventDefault();
          primeiroElemento.focus();
        }
      }
    }
  };
}

export function configurarModalAcessibilidade(overlay, modal) {
  const confinarTab = confinarTabulacao(overlay);
  
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
    } else {
      confinarTab(e);
    }
  });
  
  setTimeout(() => { modal.focus(); }, 50);
}

export function validarContrasteAAA() {
  const cores = {
    '--primaria': '#4361ee',
    '--primaria-escura': '#3a56d4',
    '--sucesso': '#4cc9f0',
    '--alerta': '#f8961e',
    '--erro': '#ef233c',
    '--cinza-escuro': '#f8f9fa',
    '--escura': '#f8f9fa',
    '--cinza-medio': '#adb5bd'
  };
  
  return cores;
}

export function melhorarAcessibilidadeInput(input, labelId) {
  if (!input.getAttribute('aria-describedby') && labelId) {
    input.setAttribute('aria-describedby', labelId);
  }
  
  if (!input.getAttribute('aria-required') && input.hasAttribute('required')) {
    input.setAttribute('aria-required', 'true');
  }
}