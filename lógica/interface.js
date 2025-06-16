export const MENSAGENS = {
  clienteAdicionado: 'Cliente adicionado com sucesso!',
  clienteRemovido: 'Cliente removido com sucesso!',
  produtoAdicionado: 'Compra registrada com sucesso!',
  produtoRemovido: 'Produto removido com sucesso!',
  divididaLiquidada: 'Dívida liquidada com sucesso!',
  backupExportado: 'Backup exportado com sucesso!',
  erroGeral: 'Erro na operação',
  erroNomeVazio: 'Insira um nome válido',
  erroCamposObrigatorios: 'Preencha todos os campos',
  erroClienteNaoSelecionado: 'Selecione um cliente antes de adicionar produtos',
  backupVazio: 'Nenhum dado para exportar',
  confirmacaoRemocao: 'Tem certeza que deseja remover este item?'
};

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

export function mostrarConfirmacao(titulo, mensagem, tipo, callbackConfirmar, callbackCancelar = () => {}) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '1000';
  
  const modal = document.createElement('div');
  modal.style.backgroundColor = 'white';
  modal.style.padding = '2rem';
  modal.style.borderRadius = 'var(--raio)';
  modal.style.maxWidth = '500px';
  modal.style.width = '90%';
  modal.style.boxShadow = 'var(--sombra)';
  
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
        <i class="fas fa-${icone}" style="font-size: 3rem; color: ${cor}; margin-bottom: 1rem;"></i>
        <h3 style="margin-bottom: 0.5rem; color: var(--escura);">${titulo}</h3>
        <p style="color: var(--cinza-escuro);">${mensagem}</p>
    </div>
    <div style="display: flex; gap: 1rem; justify-content: center;">
        <button id="confirmarCancelar" style="background: var(--cinza-medio);">Cancelar</button>
        <button id="confirmarOk" style="background: ${cor};">Confirmar</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
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
}

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