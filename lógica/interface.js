'use strict';

import { configurarModalAcessibilidade } from './acessibilidade.js';

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
  erroCamposObrigatorios: 'Preencha todos os campos',
  erroClienteNaoSelecionado: 'Selecione um cliente antes de adicionar produtos',
  backupVazio: 'Nenhum dado para exportar',
  confirmacaoRemocao: 'Tem certeza que deseja remover este item?',
  senhaConfigurada: 'Senha configurada com sucesso!',
  senhaRemovida: 'Proteção por senha removida'
};

export function mostrarNotificacao(mensagem, tipo = 'info') {
  const container = document.getElementById('notificacaoContainer');
  if (!container) return console.error('Container de notificações não encontrado');
  
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
    <div class="notificacao-conteudo">${icone}<span>${mensagem}</span></div>
    <button class="notificacao-fechar">&times;</button>
  `;
  container.appendChild(notificacao);
  
  setTimeout(() => notificacao.classList.add('mostrar'), 10);
  
  const fecharNotificacao = () => {
    notificacao.classList.remove('mostrar');
    setTimeout(() => notificacao.remove(), 300);
  };
  
  notificacao.querySelector('.notificacao-fechar').addEventListener('click', fecharNotificacao);
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
      cor = 'var(--erro)';
      break;
    case 'warning':
      icone = 'exclamation-triangle';
      cor = 'var(--alerta)';
      break;
    case 'question':
      icone = 'question-circle';
      cor = 'var(--primaria)';
      break;
    default:
      icone = 'info-circle';
      cor = 'var(--primaria)';
  }
  
  modal.innerHTML = `
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <i class="fas fa-${icone} modal-icone" style="color: ${cor};"></i>
      <h3 class="modal-titulo">${titulo}</h3>
      <p style="color: #adb5bd;">${mensagem.replace(/\n/g, '<br>')}</p>
    </div>
    <div style="display: flex; gap: 1rem; justify-content: center;">
      <button id="confirmarCancelar" class="modal-botao alerta" aria-label="Cancelar ação">Cancelar</button>
      <button id="confirmarOk" class="modal-botao" aria-label="Confirmar ação">Confirmar</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  const fecharModal = configurarModalAcessibilidade(overlay, modal);
  
  const limparLoading = () => {
    if (buttonLoading) setButtonLoading(buttonLoading, false);
  };
  
  overlay.querySelector('#confirmarCancelar').addEventListener('click', () => {
    limparLoading();
    fecharModal();
    callbackCancelar();
  });
  
  overlay.querySelector('#confirmarOk').addEventListener('click', () => {
    limparLoading();
    fecharModal();
    callbackConfirmar();
  });
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      limparLoading();
      fecharModal();
      callbackCancelar();
    }
  });
}

export function setButtonLoading(button, isLoading) {
  const originalText = button.innerHTML;
  if (isLoading) {
    button.dataset.originalText = originalText;
    button.classList.add('loading');
    button.innerHTML = '<span style="visibility: hidden;">' + originalText + '</span>';
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.innerHTML = button.dataset.originalText || originalText;
    button.disabled = false;
    delete button.dataset.originalText;
  }
}