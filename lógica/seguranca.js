'use strict';

import { mostrarNotificacao, aoAbrirModal, aoFecharModal } from './interface.js';
import { configurarModalAcessibilidade } from './acessibilidade.js';

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
  validarSenha(senha);
  const hash = criarHash(senha);
  salvarSenha(hash);
  mostrarNotificacao('Senha configurada com sucesso!', 'sucesso');
}

function validarSenha(senha) {
  if (!senha || senha.length < 4) {
    throw new Error('Senha deve ter pelo menos 4 caracteres');
  }
}

function salvarSenha(hash) {
  localStorage.setItem(CHAVE_SENHA, hash);
  localStorage.setItem(CHAVE_SENHA_ATIVA, 'true');
}

export function verificarSenha(senha) {
  const hashArmazenado = localStorage.getItem(CHAVE_SENHA);
  if (!hashArmazenado) return false;
  return criarHash(senha) === hashArmazenado;
}

export function removerSenha() {
  localStorage.removeItem(CHAVE_SENHA);
  localStorage.setItem(CHAVE_SENHA_ATIVA, 'false');
  mostrarNotificacao('Proteção por senha removida', 'sucesso');
}

export function mostrarPromptSenha() {
  return new Promise((resolve) => {
    if (!senhaConfigurada()) {
      resolve(true);
      return;
    }
    
    const { overlay, modal, elementos } = criarModalSenha();
    document.body.appendChild(overlay);
    aoAbrirModal();
    abrirModal(modal);
    
    configurarModalAcessibilidade(overlay, modal);
    focarInputSenha(elementos.inputSenha);
    
    const limparErro = () => esconderErro(elementos.erroSenha);
    const fecharModal = (resultado = false) => finalizarModal(overlay, modal, resolve, resultado);
    const verificarEAcessar = () => processarSenha(elementos.inputSenha, fecharModal, elementos.erroSenha);
    
    elementos.inputSenha.addEventListener('input', limparErro);
    elementos.inputSenha.addEventListener('keypress', (e) => { if (e.key === 'Enter') verificarEAcessar(); });
    elementos.btnConfirmar.addEventListener('click', verificarEAcessar);
    elementos.btnCancelar.addEventListener('click', () => fecharModal(false));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) fecharModal(false); });
    modal.addEventListener('cancel', (e) => {
      e.preventDefault();
      fecharModal(false);
    });
  });
}


function criarModalSenha() {
  const overlay = document.createElement('div');
  overlay.className = 'overlay-modal-escuro';
  overlay.setAttribute('aria-label', 'Acesso ao Sistema');
  
  const modal = document.createElement('dialog');
  modal.className = 'modal-escuro';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.style.position = 'relative';
  
  modal.innerHTML = gerarHTMLModal();
  
  overlay.appendChild(modal);
  
  const elementos = {
    inputSenha: overlay.querySelector('#senhaInput'),
    btnCancelar: overlay.querySelector('#btnCancelarSenha'),
    btnConfirmar: overlay.querySelector('#btnConfirmarSenha'),
    erroSenha: overlay.querySelector('#erroSenha')
  };
  
  return { overlay, modal, elementos };
}

function gerarHTMLModal() {
  return `
    <div style="margin-bottom: 1.5rem; text-align: center;">
      <i class="fas fa-lock modal-icone" style="color: var(--primaria);"></i>
      <h3 class="modal-titulo">Acesso ao Sistema</h3>
      <p style="color: #adb5bd; margin-bottom: 1rem;">
        ${senhaConfigurada() ? 'Digite sua senha para acessar o sistema' : 'Configure uma senha para proteger o sistema'}
      </p>
    </div>
    <div style="margin-bottom: 1.5rem;">
      <input type="password" id="senhaInput" class="modal-input" placeholder="${senhaConfigurada() ? 'Digite sua senha' : 'Digite uma senha (mín. 4 caracteres)'}" aria-label="Senha de acesso" aria-describedby="erroSenha" autofocus>
      <div id="erroSenha" class="modal-erro" style="display: none;"></div>
    </div>
    <div style="display: flex; gap: 1rem; justify-content: center;">
      <button id="btnCancelarSenha" class="modal-botao alerta" aria-label="Cancelar">Cancelar</button>
      <button id="btnConfirmarSenha" class="modal-botao" aria-label="${senhaConfigurada() ? 'Entrar' : 'Configurar'}">${senhaConfigurada() ? 'Entrar' : 'Configurar'}</button>
    </div>
  `;
}

function abrirModal(modal) {
  try { modal.showModal(); } catch (_) {}
}

function focarInputSenha(inputSenha) {
  setTimeout(() => {
    inputSenha.focus({ preventScroll: true });
    inputSenha.select();
  }, 100);
}

function esconderErro(erroSenha) {
  erroSenha.style.display = 'none';
  erroSenha.textContent = '';
}

function mostrarErro(erroSenha, mensagem) {
  erroSenha.textContent = mensagem;
  erroSenha.style.display = 'block';
}

function finalizarModal(overlay, modal, resolve, resultado) {
  aoFecharModal();
  try { modal.close(); } catch (_) {}
  overlay.remove();
  resolve(resultado);
}

function processarSenha(inputSenha, fecharModal, erroSenha) {
  const senha = inputSenha.value.trim();
  if (!senha) {
    mostrarErro(erroSenha, 'Digite uma senha');
    return;
  }
  if (senhaConfigurada()) {
    if (verificarSenha(senha)) {
      fecharModal(true);
    } else {
      mostrarErro(erroSenha, 'Senha incorreta');
      inputSenha.value = '';
      focarInputSenha(inputSenha);
    }
  } else {
    try {
      configurarSenha(senha);
      fecharModal(true);
    } catch (error) {
      mostrarErro(erroSenha, error.message);
    }
  }
}