'use strict';

function validarElemento(elemento, tipo) {
  return elemento instanceof HTMLElement;
}

function obterElementosFocaveis(overlay) {
  return overlay.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
}

function tratarTabulacao(elementosFocaveis, e) {
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

export function confinarTabulacao(overlay) {
  if (!validarElemento(overlay, 'HTMLElement')) {
    return () => {};
  }

  return (e) => {
    if (e.key === 'Tab') {
      const elementosFocaveis = obterElementosFocaveis(overlay);
      if (elementosFocaveis.length > 0) {
        tratarTabulacao(elementosFocaveis, e);
      }
    }
  };
}

function definirAtributosAcessibilidade(modal) {
  if (!modal.getAttribute('role')) modal.setAttribute('role', 'dialog');
  if (!modal.getAttribute('aria-modal')) modal.setAttribute('aria-modal', 'true');
}

function adicionarListenerTeclado(overlay, confinarTab, fecharModal) {
  const handler = (e) => {
    if (e.key === 'Escape') {
      fecharModal();
    } else {
      confinarTab(e);
    }
  };
  overlay.addEventListener('keydown', handler);
  return handler;
}

function criarFecharModal(overlay, keydownHandler, elementoAnterior) {
  return () => {
    overlay.removeEventListener('keydown', keydownHandler);
    overlay.remove();
    if (validarElemento(elementoAnterior, 'HTMLElement')) {
      elementoAnterior.focus({ preventScroll: true });
    }
  };
}

export function configurarModalAcessibilidade(overlay, modal) {
  if (!validarElemento(overlay, 'HTMLElement') || !validarElemento(modal, 'HTMLElement')) {
    return;
  }

  const elementoAnterior = document.activeElement;
  definirAtributosAcessibilidade(modal);
  const confinarTab = confinarTabulacao(overlay);
  const keydownHandler = adicionarListenerTeclado(overlay, confinarTab, () => fecharModal());
  const fecharModal = criarFecharModal(overlay, keydownHandler, elementoAnterior);

  setTimeout(() => modal.focus(), 50);

  return fecharModal;
}

function configurarInputAcessibilidade(input, labelId) {
  if (typeof labelId === 'string' && labelId && !input.getAttribute('aria-describedby')) {
    input.setAttribute('aria-describedby', labelId);
  }
  if (!input.getAttribute('aria-required') && input.hasAttribute('required')) {
    input.setAttribute('aria-required', 'true');
  }
}

export function melhorarAcessibilidadeInput(input, labelId) {
  if (!validarElemento(input, 'HTMLElement')) return;
  configurarInputAcessibilidade(input, labelId);
}