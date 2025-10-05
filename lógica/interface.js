'use strict';

import { configurarModalAcessibilidade } from './acessibilidade.js';

let contadorModaisAbertos = 0;

export function aoAbrirModal() {
  if (contadorModaisAbertos === 0) {
    document.body.style.overflow = 'hidden';
  }
  contadorModaisAbertos++;
}

export function aoFecharModal() {
  if (contadorModaisAbertos > 0) {
    contadorModaisAbertos--;
  }
  if (contadorModaisAbertos === 0) {
    document.body.style.overflow = '';
  }
}

export function anunciarParaLeitorDeTela(mensagem) {
  const regiaoAnuncios = document.getElementById('regiao-anuncios-sr');
  if (regiaoAnuncios) {
    regiaoAnuncios.textContent = mensagem;
  }
}

export const MENSAGENS = {
  clienteAdicionado: 'Cliente adicionado com sucesso!',
  clienteRemovido: 'Cliente removido com sucesso!',
  produtoAdicionado: 'Compra registrada com sucesso!',
  produtoRemovido: 'Produto removido com sucesso!',
  divididaLiquidada: function(quantidade) {
    return `${quantidade === 1 ? 'Dívida' : 'Dívidas'} liquidada${quantidade === 1 ? '' : 's'} com sucesso!`;
  },
  backupExportado: 'Backup concluído.',
  dadosImportados: 'Dados importados com sucesso!',
  erroGeral: 'Erro na operação',
  erroNomeVazio: 'Insira um nome válido',
  erroClienteExistente: 'Cliente com este nome já existe.',
  erroCamposObrigatorios: 'Preencha todos os campos',
  erroClienteNaoSelecionado: 'Selecione um cliente antes de adicionar produtos',
  backupVazio: 'Nenhum dado para exportar',
  confirmacaoRemocao: 'Tem certeza que deseja remover este item?',
  senhaConfigurada: 'Senha configurada com sucesso!',
  senhaRemovida: 'Proteção por senha removida'
};

export function mostrarErroCampo(elementoErro, mensagem) {
  if (!elementoErro) return;
  
  elementoErro.textContent = mensagem;
  elementoErro.style.display = 'block';
  
  setTimeout(() => {
    elementoErro.style.display = 'none';
    elementoErro.textContent = '';
  }, 4000);
}

export function mostrarNotificacao(mensagem, tipo = 'info') {
  const container = document.getElementById('notificacaoContainer');
  if (!container) {
    return console.error('Container de notificações não encontrado');
  }
  
  const notificacao = document.createElement('div');
  notificacao.className = `notificacao ${tipo}`;
  
  let icone;
  switch (tipo) {
    case 'sucesso':
      icone = '<i class="fas fa-check-circle notificacao-icone"></i>';
      break;
    case 'erro':
      icone = '<i class="fas fa-times-circle notificacao-icone"></i>';
      break;
    case 'alerta':
      icone = '<i class="fas fa-exclamation-circle notificacao-icone"></i>';
      break;
    default:
      icone = '<i class="fas fa-info-circle notificacao-icone"></i>';
  }
  
  notificacao.innerHTML = `
    <div class="notificacao-conteudo">
      ${icone}
      <span>${mensagem}</span>
    </div>
    <button class="notificacao-fechar">
      <svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
        <line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" stroke-width="1.5" />
        <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" stroke-width="1.5" />
      </svg>
    </button>
  `;
  
  container.appendChild(notificacao);
  
  setTimeout(() => notificacao.classList.add('mostrar'), 10);
  
  const fecharNotificacao = () => {
    notificacao.classList.remove('mostrar');
    setTimeout(() => notificacao.remove(), 300);
  };
  
  notificacao
    .querySelector('.notificacao-fechar')
    .addEventListener('click', fecharNotificacao);
  
  setTimeout(fecharNotificacao, 5000);
}

export function mostrarConfirmacao(titulo, mensagem, tipo, callbackConfirmar, callbackCancelar = () => {}, buttonLoading = null) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay-modal-escuro';
  overlay.setAttribute('aria-label', titulo);
  
  const modal = document.createElement('div');
  modal.className = 'modal-escuro';
  modal.tabIndex = -1;
  modal.style.position = 'relative';
  
  let icone, cor;
  switch (tipo) {
    case 'error':
      icone = 'times-circle';
      cor = 'var(--retorno-perigo)';
      break;
    case 'warning':
      icone = 'exclamation-triangle';
      cor = 'var(--retorno-alerta)';
      break;
    case 'question':
      icone = 'question-circle';
      cor = 'var(--marca-padrao)';
      break;
    default:
      icone = 'info-circle';
      cor = 'var(--marca-padrao)';
  }
  
  modal.innerHTML = `
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <i class="fas fa-${icone} modal-icone" style="color: ${cor};"></i>
      <h3 class="modal-titulo">${titulo}</h3>
      <p style="color: var(--texto-corpo);">${mensagem.replace(/\n/g, '<br>')}</p>
    </div>
    <div style="display: flex; gap: 1rem; justify-content: center;">
      <button id="confirmarCancelar" class="modal-botao alerta" aria-label="Cancelar ação">Cancelar</button>
      <button id="confirmarOk" class="modal-botao" aria-label="Confirmar ação">Confirmar</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  aoAbrirModal();
  
  const fecharModalOriginal = configurarModalAcessibilidade(overlay, modal);
  
  const fecharEsteModal = () => {
    aoFecharModal();
    fecharModalOriginal();
  };
  
  const limparLoading = () => {
    if (buttonLoading) setButtonLoading(buttonLoading, false);
  };
  
  overlay.querySelector('#confirmarCancelar').addEventListener('click', () => {
    limparLoading();
    fecharEsteModal();
    callbackCancelar();
  });
  
  overlay.querySelector('#confirmarOk').addEventListener('click', () => {
    limparLoading();
    fecharEsteModal();
    callbackConfirmar();
  });
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      limparLoading();
      fecharEsteModal();
      callbackCancelar();
    }
  });
}

export function setButtonLoading(button, isLoading) {
  const originalText = button.innerHTML;
  
  if (isLoading) {
    button.dataset.originalText = originalText;
    button.classList.add('loading');
    button.innerHTML = `<span style="visibility: hidden;">${originalText}</span>`;
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.innerHTML = button.dataset.originalText || originalText;
    button.disabled = false;
    delete button.dataset.originalText;
  }
}