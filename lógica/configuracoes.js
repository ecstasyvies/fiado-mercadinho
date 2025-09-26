'use strict';

import { senhaConfigurada, configurarSenha, removerSenha } from './seguranca.js';
import { mostrarNotificacao, mostrarConfirmacao } from './interface.js';
import { configurarModalAcessibilidade } from './acessibilidade.js';

function gerarSecaoSegurancaHTML() {
  return `
    <div id="secaoSeguranca" style="margin-bottom: 2rem;">
      <h4 style="color: var(--escura); margin-bottom: 1rem;">Segurança</h4>
      <div style="background: var(--clara); padding: 1rem; border-radius: var(--raio-pequeno);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <div>
            <div style="font-weight: 600; color: var(--escura);">Proteção por Senha</div>
            <div style="font-size: 0.85rem; color: ${senhaConfigurada() ? 'var(--sucesso)' : 'var(--alerta)'};">
              ${senhaConfigurada() ? 'Ativada' : 'Desativada'}
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            ${senhaConfigurada()
              ? '<button id="btnRemoverSenha" class="modal-botao perigo" aria-label="Remover proteção por senha">Remover</button>'
              : '<button id="btnConfigurarSenha" class="modal-botao" aria-label="Ativar proteção por senha">Ativar</button>'
            }
          </div>
        </div>
        <div style="font-size: 0.8rem; color: #adb5bd;">
          ${senhaConfigurada()
            ? 'O sistema encontra-se protegido por senha. Caso deseje desativar essa proteção, é possível selecionar a opção “Remover”.'
            : 'O sistema encontra-se desprotegido por senha. Para habilitar a proteção, selecione a opção “Ativar” e configure uma senha. Recomenda-se registrar ou memorizar a senha escolhida, uma vez que o acesso ao sistema dependerá exclusivamente dela.'
          }
        </div>
      </div>
    </div>
  `;
}

function criarOverlayComModal(titulo, conteudoHTML) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay-modal-escuro';
  overlay.setAttribute('aria-label', titulo);
  
  const modal = document.createElement('div');
  modal.className = 'modal-escuro';
  modal.tabIndex = -1;
  modal.innerHTML = conteudoHTML;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  configurarModalAcessibilidade(overlay, modal);
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  
  return { overlay, modal };
}

function mostrarConfigurarSenha(overlayOriginal) {
  const { overlay, modal } = criarOverlayComModal('Configurar senha', `
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
  `);
  
  setTimeout(() => {
    const inputSenha = modal.querySelector('#novaSenha');
    if (inputSenha) {
      inputSenha.focus({ preventScroll: true });
      inputSenha.select();
    }
  }, 50);
  
  const inputSenha = modal.querySelector('#novaSenha');
  const inputConfirmar = modal.querySelector('#confirmarSenha');
  const btnCancelar = modal.querySelector('#cancelarSenha');
  const btnConfirmar = modal.querySelector('#confirmarNovaSenha');
  const erroSenha = modal.querySelector('#erroSenha');
  
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
    
    if (!senha) { mostrarErro('Digite uma senha'); return; }
    if (senha.length < 4) { mostrarErro('Senha deve ter pelo menos 4 caracteres'); return; }
    if (senha !== confirmacao) { mostrarErro('Senhas não coincidem'); return; }
    
    try {
      configurarSenha(senha);
      overlay.remove();
      setTimeout(() => atualizarConteudoModal(overlayOriginal), 500);
    } catch (error) {
      mostrarErro(error.message);
    }
  };
  
  inputSenha.addEventListener('input', limparErro);
  inputConfirmar.addEventListener('input', limparErro);
  
  inputSenha.addEventListener('keypress', (e) => { if (e.key === 'Enter') inputConfirmar.focus(); });
  inputConfirmar.addEventListener('keypress', (e) => { if (e.key === 'Enter') configurarNovaSenha(); });
  
  btnConfirmar.addEventListener('click', configurarNovaSenha);
  btnCancelar.addEventListener('click', () => overlay.remove());
}

export function mostrarConfiguracoes() {
  const btnConfiguracoes = document.querySelector('.btn-configuracoes');
  
  if (btnConfiguracoes) btnConfiguracoes.classList.add('ativo');
  
  const { overlay, modal } = criarOverlayComModal('Configurações do sistema', `
    <div style="text-align: center; margin-bottom: 2rem;">
      <i class="fas fa-cog modal-icone" style="color: var(--primaria);"></i>
      <h3 class="modal-titulo">Configurações</h3>
      <p style="color: #adb5bd;">Gerenciar configurações do sistema</p>
    </div>
    ${gerarSecaoSegurancaHTML()}
    <div style="text-align: center;">
      <button id="fecharConfiguracoes" class="modal-botao" aria-label="Fechar configurações">Fechar</button>
    </div>
  `);
  
  const btnFechar = modal.querySelector('#fecharConfiguracoes');
  const btnConfigurarSenha = modal.querySelector('#btnConfigurarSenha');
  const btnRemoverSenha = modal.querySelector('#btnRemoverSenha');
  
  btnFechar.addEventListener('click', () => {
    overlay.remove();
    if (btnConfiguracoes) btnConfiguracoes.classList.remove('ativo');
  });
  
  if (btnConfigurarSenha) btnConfigurarSenha.addEventListener('click', () => mostrarConfigurarSenha(overlay));
  if (btnRemoverSenha) btnRemoverSenha.addEventListener('click', () => {
    mostrarConfirmacao(
      'Remover Proteção',
      'Confirma a remoção da proteção por senha? A desativação tornará o sistema desprotegido.',
      'warning',
      () => {
        removerSenha();
        overlay.remove();
        if (btnConfiguracoes) btnConfiguracoes.classList.remove('ativo');
        setTimeout(() => atualizarConteudoModal(overlay), 1000);
      }
    );
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && btnConfiguracoes) {
      btnConfiguracoes.classList.remove('ativo');
    }
  });
}

function atualizarConteudoModal(overlay) {
  const modal = overlay.querySelector('.modal-escuro');
  if (!modal) return;
  
  const containerSeguranca = modal.querySelector('#secaoSeguranca');
  if (containerSeguranca) containerSeguranca.outerHTML = gerarSecaoSegurancaHTML();
  
  const btnConfigurarSenha = overlay.querySelector('#btnConfigurarSenha');
  const btnRemoverSenha = overlay.querySelector('#btnRemoverSenha');
  
  if (btnConfigurarSenha) btnConfigurarSenha.onclick = () => mostrarConfigurarSenha(overlay);
  if (btnRemoverSenha) btnRemoverSenha.onclick = () => {
    mostrarConfirmacao(
      'Remover Proteção',
      'Confirma a remoção da proteção por senha? A desativação tornará o sistema desprotegido.',
      'warning',
      () => {
        removerSenha();
        setTimeout(() => atualizarConteudoModal(overlay), 1000);
      }
    );
  };
}