/**
 * interface.js
 * Gerencia elementos de interface e feedback visual
 * Implementa sistema de notificações e diálogos de confirmação
 * Centraliza mensagens do sistema para fácil manutenção
 */

export const MENSAGENS = {
  clienteAdicionado: 'Cliente adicionado com sucesso!',
  clienteRemovido: 'Cliente removido com sucesso!',
  produtoAdicionado: 'Compra registrada com sucesso!',
  produtoRemovido: 'Produto removido com sucesso!',
  divididaLiquidada: function(quantidade) {
    return `${quantidade === 1 ? 'Dívida' : 'Dívidas'} liquidada${quantidade === 1 ? '' : 's'} com sucesso!`;
  },
  backupExportado: 'Backup exportado com sucesso!',
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

// Sistema de notificações temporárias com animação e auto-remoção
export function mostrarNotificacao(mensagem, tipo = 'info') {
  const container = document.getElementById('notificacaoContainer');
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
    <button class="notificacao-fechar">&times;</button>
  `;
  
  container.appendChild(notificacao);
  
  setTimeout(() => {
    notificacao.classList.add('mostrar');
  }, 10);
  
  const btnFechar = notificacao.querySelector('.notificacao-fechar');
  const fecharNotificacao = () => {
    notificacao.classList.remove('mostrar');
    setTimeout(() => {
      notificacao.remove();
    }, 300);
  };
  
  btnFechar.addEventListener('click', fecharNotificacao);
  setTimeout(fecharNotificacao, 5000);
}

// Diálogo de confirmação acessível e responsivo
// Suporta diferentes tipos de alerta com ícones e cores correspondentes
export function mostrarConfirmacao(titulo, mensagem, tipo, callbackConfirmar, callbackCancelar = () => {}) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay-escuro';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
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

  setTimeout(() => { modal.focus(); }, 50);

  const btnCancelar = overlay.querySelector('#confirmarCancelar');
  const btnConfirmar = overlay.querySelector('#confirmarOk');

  btnCancelar.addEventListener('click', () => {
    overlay.remove();
    callbackCancelar();
  });

  btnConfirmar.addEventListener('click', () => {
    overlay.remove();
    callbackConfirmar();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      callbackCancelar();
    }
  });

  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      callbackCancelar();
    }
  });
  modal.focus();
}

// Gerencia estado de loading em botões preservando texto original
export function setButtonLoading(button, isLoading) {
  const originalText = button.innerHTML;
  
  if (isLoading) {
    button.dataset.originalText = originalText;
    button.classList.add('loading');
    button.innerHTML = '<span style="visibility: hidden;">' + originalText + '</span>';
    button.disabled = true;
  } else {
    const textToRestore = button.dataset.originalText || originalText;
    button.classList.remove('loading');
    button.innerHTML = textToRestore;
    button.disabled = false;
    delete button.dataset.originalText;
  }
}