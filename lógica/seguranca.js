import { mostrarNotificacao, mostrarConfirmacao } from './interface.js';

const CHAVE_SENHA = 'fiados_senha_hash';
const CHAVE_SENHA_ATIVA = 'fiados_senha_ativa';

function criarHash(senha) {
  return btoa(senha + '_fiados_2024');
}

export function senhaConfigurada() {
  return localStorage.getItem(CHAVE_SENHA_ATIVA) !== 'false' && localStorage.getItem(CHAVE_SENHA) !== null;
}

export function senhaAtiva() {
  return localStorage.getItem(CHAVE_SENHA_ATIVA) !== 'false';
}

export function configurarSenha(senha) {
  if (!senha || senha.length < 4) {
    throw new Error('Senha deve ter pelo menos 4 caracteres');
  }
  const hash = criarHash(senha);
  localStorage.setItem(CHAVE_SENHA, hash);
  localStorage.setItem(CHAVE_SENHA_ATIVA, 'true');
  mostrarNotificacao('Senha configurada com sucesso!', 'sucesso');
}

export function verificarSenha(senha) {
  const hashArmazenado = localStorage.getItem(CHAVE_SENHA);
  if (!hashArmazenado) {
    return false;
  }
  const hashDigitado = criarHash(senha);
  return hashDigitado === hashArmazenado;
}

export function removerSenha() {
  localStorage.removeItem(CHAVE_SENHA);
  localStorage.setItem(CHAVE_SENHA_ATIVA, 'false');
  mostrarNotificacao('Proteção por senha removida', 'sucesso');
}

export function mostrarPromptSenha() {
  return new Promise((resolve) => {

    if (!senhaAtiva()) {
      resolve(true);
      return;
    }
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay-escuro';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Acesso ao Sistema');

    const modal = document.createElement('div');
    modal.className = 'modal-escuro';
    modal.tabIndex = -1;
    modal.style.position = 'relative';

    modal.innerHTML = `
      <div style="margin-bottom: 1.5rem; text-align: center;">
        <i class="fas fa-lock modal-icone" style="color: var(--primaria);"></i>
        <h3 class="modal-titulo">Acesso ao Sistema</h3>
        <p style="color: #adb5bd; margin-bottom: 1rem;">
          ${senhaConfigurada() ? 'Digite sua senha para acessar o sistema' : 'Configure uma senha para proteger o sistema'}
        </p>
      </div>
      <div style="margin-bottom: 1.5rem;">
        <input type="password" id="senhaInput" class="modal-input" placeholder="${senhaConfigurada() ? 'Digite sua senha' : 'Digite uma senha (mín. 4 caracteres)'}" aria-label="Senha de acesso">
        <div id="erroSenha" class="modal-erro" style="display: none;"></div>
      </div>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button id="btnCancelarSenha" class="modal-botao alerta" aria-label="Cancelar">Cancelar</button>
        <button id="btnConfirmarSenha" class="modal-botao" aria-label="${senhaConfigurada() ? 'Entrar' : 'Configurar'}">${senhaConfigurada() ? 'Entrar' : 'Configurar'}</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    setTimeout(() => { modal.focus(); }, 50);

    const inputSenha = overlay.querySelector('#senhaInput');
    const btnCancelar = overlay.querySelector('#btnCancelarSenha');
    const btnConfirmar = overlay.querySelector('#btnConfirmarSenha');
    const erroSenha = overlay.querySelector('#erroSenha');

    inputSenha.focus();

    const limparErro = () => {
      erroSenha.style.display = 'none';
      erroSenha.textContent = '';
    };

    const mostrarErro = (mensagem) => {
      erroSenha.textContent = mensagem;
      erroSenha.style.display = 'block';
    };

    const verificarEAcessar = () => {
      const senha = inputSenha.value.trim();
      if (!senha) {
        mostrarErro('Digite uma senha');
        return;
      }
      if (senhaConfigurada()) {
        if (verificarSenha(senha)) {
          overlay.remove();
          resolve(true);
        } else {
          mostrarErro('Senha incorreta');
          inputSenha.value = '';
          inputSenha.focus();
        }
      } else {
        try {
          configurarSenha(senha);
          overlay.remove();
          resolve(true);
        } catch (error) {
          mostrarErro(error.message);
        }
      }
    };

    inputSenha.addEventListener('input', limparErro);
    inputSenha.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        verificarEAcessar();
      }
    });
    btnConfirmar.addEventListener('click', verificarEAcessar);
    btnCancelar.addEventListener('click', () => {
      overlay.remove();
      resolve(false);
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve(false);
      }
    });
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        resolve(false);
      }
    });
    modal.focus();
  });
} 