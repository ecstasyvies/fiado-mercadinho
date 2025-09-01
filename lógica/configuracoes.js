'use strict';

import { senhaConfigurada, configurarSenha, removerSenha } from './seguranca.js';
import { mostrarNotificacao, mostrarConfirmacao } from './interface.js';
import { configurarModalAcessibilidade } from './acessibilidade.js';

export function mostrarConfiguracoes() {
  const overlay = document.createElement('div');
  overlay.className = 'overlay-modal-escuro';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Configurações do sistema');

  const modal = document.createElement('div');
  modal.className = 'modal-escuro';
  modal.tabIndex = -1;
  modal.style.position = 'relative';

  modal.innerHTML = `
    <div style="text-align: center; margin-bottom: 2rem;">
      <i class="fas fa-cog modal-icone" style="color: var(--primaria);"></i>
      <h3 class="modal-titulo">Configurações</h3>
      <p style="color: #adb5bd;">Gerenciar configurações do sistema</p>
    </div>
    <div style="margin-bottom: 2rem;">
      <h4 style="color: var(--escura); margin-bottom: 1rem;">Segurança</h4>
      <div style="background: var(--clara); padding: 1rem; border-radius: var(--raio-pequeno);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <div>
            <div style="font-weight: 600; color: var(--escura);">Proteção por Senha</div>
            <div style="font-size: 0.85rem; color: #adb5bd;">
              ${senhaConfigurada() ? 'Ativada' : 'Desativada'}
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            ${senhaConfigurada() ? 
              '<button id="btnRemoverSenha" class="modal-botao perigo" aria-label="Remover proteção por senha">Remover</button>' :
              '<button id="btnConfigurarSenha" class="modal-botao" aria-label="Ativar proteção por senha">Ativar</button>'
            }
          </div>
        </div>
        <div style="font-size: 0.8rem; color: #adb5bd;">
          ${senhaConfigurada() ? 
            'O sistema está protegido por senha. Clique em "Remover" para desativar.' :
            'O sistema não está protegido por senha. Clique em "Ativar" para configurar. Ao ativar, anote ou memorize a senha escolhida — sem ela não será possível acessar o sistema.'
          }
        </div>
      </div>
    </div>
    <div style="text-align: center;">
      <button id="fecharConfiguracoes" class="modal-botao" aria-label="Fechar configurações">Fechar</button>
    </div>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  setTimeout(() => { modal.focus(); }, 50);
  const btnFechar = overlay.querySelector('#fecharConfiguracoes');
  const btnConfigurarSenha = overlay.querySelector('#btnConfigurarSenha');
  const btnRemoverSenha = overlay.querySelector('#btnRemoverSenha');
  btnFechar.addEventListener('click', () => {
    overlay.remove();
  });
  if (btnConfigurarSenha) {
    btnConfigurarSenha.addEventListener('click', () => {
      mostrarConfigurarSenha(overlay);
    });
  }
  if (btnRemoverSenha) {
    btnRemoverSenha.addEventListener('click', () => {
      mostrarConfirmacao(
        'Remover Proteção',
        'Tem certeza que deseja remover a proteção por senha?\n\nO sistema ficará desprotegido.',
        'warning',
        () => {
          removerSenha();
          overlay.remove();
          setTimeout(() => {
            mostrarConfiguracoes();
          }, 1000);
        }
      );
    });
  }
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
  
  configurarModalAcessibilidade(overlay, modal);
}

function mostrarConfigurarSenha(overlayOriginal) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay-modal-escuro';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Configurar senha');

  const modal = document.createElement('div');
  modal.className = 'modal-escuro';
  modal.tabIndex = -1;
  modal.style.position = 'relative';

  modal.innerHTML = `
    <div style="margin-bottom: 1.5rem; text-align: center;">
      <i class="fas fa-lock modal-icone" style="color: var(--primaria);"></i>
      <h3 class="modal-titulo">Configurar Senha</h3>
      <p style="color: #adb5bd;">Digite uma senha para proteger o sistema</p>
    </div>
    <div style="margin-bottom: 1.5rem;">
      <input type="password" id="novaSenha" class="modal-input" placeholder="Digite uma senha (mín. 4 caracteres)" aria-label="Nova senha">
      <input type="password" id="confirmarSenha" class="modal-input" placeholder="Confirme a senha" aria-label="Confirme a senha">
      <div id="erroSenha" class="modal-erro" style="display: none;"></div>
    </div>
    <div style="display: flex; gap: 1rem; justify-content: center;">
      <button id="cancelarSenha" class="modal-botao alerta" aria-label="Cancelar">Cancelar</button>
      <button id="confirmarNovaSenha" class="modal-botao" aria-label="Configurar">Configurar</button>
    </div>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  setTimeout(() => { modal.focus(); }, 50);
  const inputSenha = overlay.querySelector('#novaSenha');
  const inputConfirmar = overlay.querySelector('#confirmarSenha');
  const btnCancelar = overlay.querySelector('#cancelarSenha');
  const btnConfirmar = overlay.querySelector('#confirmarNovaSenha');
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
  const configurarNovaSenha = () => {
    const senha = inputSenha.value.trim();
    const confirmacao = inputConfirmar.value.trim();
    if (!senha) {
      mostrarErro('Digite uma senha');
      return;
    }
    if (senha.length < 4) {
      mostrarErro('Senha deve ter pelo menos 4 caracteres');
      return;
    }
    if (senha !== confirmacao) {
      mostrarErro('Senhas não coincidem');
      return;
    }
    try {
      configurarSenha(senha);
      overlay.remove();
      overlayOriginal.remove();
      setTimeout(() => {
        mostrarConfiguracoes();
      }, 1000);
    } catch (error) {
      mostrarErro(error.message);
    }
  };
  inputSenha.addEventListener('input', limparErro);
  inputConfirmar.addEventListener('input', limparErro);
  inputSenha.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      inputConfirmar.focus();
    }
  });
  inputConfirmar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      configurarNovaSenha();
    }
  });
  btnConfirmar.addEventListener('click', configurarNovaSenha);
  btnCancelar.addEventListener('click', () => {
    overlay.remove();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
  
  configurarModalAcessibilidade(overlay, modal);
}