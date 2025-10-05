"use strict";

import {
  senhaConfigurada,
  configurarSenha,
  removerSenha,
} from "./seguranca.js";
import {
  mostrarNotificacao,
  mostrarConfirmacao,
  aoAbrirModal,
  aoFecharModal,
} from "./interface.js";
import { configurarModalAcessibilidade } from "./acessibilidade.js";

export function aplicarTemaSalvo() {
  try {
    const temaClaro = localStorage.getItem("temaClaro");
    if (temaClaro === "true") document.body.classList.add("tema-claro");
    else document.body.classList.remove("tema-claro");
  } catch (_) {}
}

export function alternarTema(ativar) {
  try {
    if (ativar) {
      document.body.classList.add("tema-claro");
      localStorage.setItem("temaClaro", "true");
    } else {
      document.body.classList.remove("tema-claro");
      localStorage.setItem("temaClaro", "false");
    }
  } catch (_) {}
}

function gerarSecaoSegurancaHTML() {
  return `
    <div id="secaoSeguranca" style="margin-bottom: 2rem;">
      <div style="background: var(--fundo-superficie); padding: 1rem; border: 1px solid var(--borda-sutil); border-radius: var(--raio-borda-m);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <div>
            <h4 style="font-weight: 600; color: var(--texto-corpo);">Proteção por Senha</h4>
            <div style="font-size: 0.85rem; color: ${
              senhaConfigurada()
                ? "var(--retorno-sucesso)"
                : "var(--retorno-alerta)"
            };">
              ${senhaConfigurada() ? "Ativada" : "Desativada"}
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            ${
              senhaConfigurada()
                ? '<button id="btnRemoverSenha" class="modal-botao perigo" aria-label="Remover proteção por senha">Remover</button>'
                : '<button id="btnConfigurarSenha" class="modal-botao" aria-label="Ativar proteção por senha">Ativar</button>'
            }
          </div>
        </div>
        <div style="font-size: 0.8rem; color: var(--texto-corpo);">
          ${
            senhaConfigurada()
              ? "O sistema encontra-se protegido por senha. Caso deseje desativar essa proteção, é possível selecionar a opção “Remover”."
              : "O sistema encontra-se desprotegido por senha. Para habilitar a proteção, selecione a opção “Ativar” e configure uma senha. Recomenda-se registrar ou memorizar a senha escolhida, uma vez que o acesso ao sistema dependerá exclusivamente dela."
          }
        </div>
      </div>
    </div>
  `;
}

function criarOverlayComModal(titulo, conteudoHTML) {
  const overlay = document.createElement("div");
  overlay.className = "overlay-modal-escuro";
  overlay.setAttribute("aria-label", titulo);
  
  const modal = document.createElement("div");
  modal.className = "modal-escuro";
  modal.tabIndex = -1;
  modal.innerHTML = conteudoHTML;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  aoAbrirModal();
  
  configurarModalAcessibilidade(overlay, modal);
  
  const fecharEsteModal = () => {
    aoFecharModal();
    overlay.remove();
  };
  
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) fecharEsteModal();
  });
  
  return { overlay, modal, fecharEsteModal };
}

function mostrarConfigurarSenha(overlayOriginal) {
  const { overlay, modal, fecharEsteModal } = criarOverlayComModal(
    "Configurar senha",
    `
    <div style="margin-bottom: 1.5rem; text-align: center;">
      <i class="fas fa-lock modal-icone" style="color: var(--marca-padrao);"></i>
      <h3 class="modal-titulo">Configurar Senha</h3>
      <p style="color: var(--texto-corpo);">Digite uma senha para proteger o sistema</p>
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
  `
  );
  
  setTimeout(() => {
    const inputSenha = modal.querySelector("#novaSenha");
    if (inputSenha) {
      inputSenha.focus({ preventScroll: true });
      inputSenha.select();
    }
  }, 50);
  
  const inputSenha = modal.querySelector("#novaSenha");
  const inputConfirmar = modal.querySelector("#confirmarSenha");
  const btnCancelar = modal.querySelector("#cancelarSenha");
  const btnConfirmar = modal.querySelector("#confirmarNovaSenha");
  const erroSenha = modal.querySelector("#erroSenha");
  
  const limparErro = () => {
    erroSenha.style.display = "none";
    erroSenha.textContent = "";
  };
  
  const mostrarErro = (mensagem) => {
    erroSenha.textContent = mensagem;
    erroSenha.style.display = "block";
  };
  
  const configurarNovaSenha = () => {
    const senha = inputSenha.value.trim();
    const confirmacao = inputConfirmar.value.trim();
    
    if (!senha) {
      mostrarErro("Digite uma senha");
      return;
    }
    if (senha.length < 4) {
      mostrarErro("Senha deve ter pelo menos 4 caracteres");
      return;
    }
    if (senha !== confirmacao) {
      mostrarErro("Senhas não coincidem");
      return;
    }
    
    try {
      configurarSenha(senha);
      fecharEsteModal();
      setTimeout(() => atualizarConteudoModal(overlayOriginal), 500);
    } catch (error) {
      mostrarErro(error.message);
    }
  };
  
  inputSenha.addEventListener("input", limparErro);
  inputConfirmar.addEventListener("input", limparErro);
  
  inputSenha.addEventListener("keypress", (e) => {
    if (e.key === "Enter") inputConfirmar.focus();
  });
  inputConfirmar.addEventListener("keypress", (e) => {
    if (e.key === "Enter") configurarNovaSenha();
  });
  
  btnConfirmar.addEventListener("click", configurarNovaSenha);
  btnCancelar.addEventListener("click", fecharEsteModal);
}

export function mostrarConfiguracoes() {
  const btnConfiguracoes = document.querySelector(".btn-configuracoes");
  
  if (btnConfiguracoes) btnConfiguracoes.classList.add("ativo");
  
  const { overlay, modal, fecharEsteModal } = criarOverlayComModal(
    "Configurações do sistema",
    `
    <div style="text-align: center; margin-bottom: 2rem;">
      <i class="fas fa-cog modal-icone" style="color: var(--marca-padrao);"></i>
      <h3 class="modal-titulo">Configurações</h3>
    </div>
    ${gerarSecaoSegurancaHTML()}
    <!-- anotação: dá pra colocar aqui outras coisinhas depois (atalho de backup, etc.) se eu quiser -->
    <div id="secaoTema" style="margin-bottom: 1.5rem;">
      <div style="background: var(--fundo-superficie); padding: 1rem; border: 1px solid var(--borda-sutil); border-radius: var(--raio-borda-m); display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:1rem;">
        <div>
          <h4 style="font-weight:600; color: var(--texto-corpo); margin:0 0 0.25rem 0;">Tema Claro</h4>
          <div style="font-size:0.85rem; color: var(--texto-corpo);">Mude para o modo claro para mais luminosidade.</div>
        </div>
        <div>
          <button id="btnToggleTema" class="modal-botao" aria-pressed="false">Ativar Tema Claro</button>
        </div>
      </div>
    </div>
    <div id="secaoAtualizacao" style="margin-bottom: 1.5rem;">
      <div style="background: var(--fundo-superficie); padding: 1rem; border: 1px solid var(--borda-sutil); border-radius: var(--raio-borda-m); display:flex; justify-content:space-between; align-items:center; gap:1rem;">
        <div>
          <h4 style="font-weight:600; color: var(--texto-corpo); margin:0 0 0.25rem 0;">Atualizações</h4>
          <div id="statusAtualizacao" style="font-size:0.85rem; color: var(--texto-corpo);" aria-live="polite">Verificando atualizações...</div>
        </div>
        <div>
          <button id="btnAtualizarVersao" class="modal-botao" aria-label="Atualizar versão">Atualizar versão</button>
        </div>
      </div>
    </div>
    <div style="text-align: center;">
      <button id="fecharConfiguracoes" class="modal-botao" aria-label="Fechar configurações">Fechar</button>
    </div>
  `
  );
  
  const btnFechar = modal.querySelector("#fecharConfiguracoes");
  const btnToggleTema = modal.querySelector("#btnToggleTema");
  const btnConfigurarSenha = modal.querySelector("#btnConfigurarSenha");
  const btnRemoverSenha = modal.querySelector("#btnRemoverSenha");
  const btnAtualizarVersao = modal.querySelector('#btnAtualizarVersao');
  const statusAtualizacao = modal.querySelector('#statusAtualizacao');
  
  const fecharPrincipal = () => {
    fecharEsteModal();
    if (btnConfiguracoes) btnConfiguracoes.classList.remove("ativo");
  };
  
  btnFechar.addEventListener("click", fecharPrincipal);
  if (btnToggleTema) {
    try {
      const temaAtual = localStorage.getItem("temaClaro") === "true";
      btnToggleTema.textContent = temaAtual ? "Desativar" : "Ativar";
      btnToggleTema.setAttribute("aria-pressed", temaAtual ? "true" : "false");
    } catch (_) {}
    
    btnToggleTema.addEventListener("click", () => {
      try {
        const ativar = !(localStorage.getItem("temaClaro") === "true");
        alternarTema(ativar);
        btnToggleTema.textContent = ativar ? "Desativar" : "Ativar";
        btnToggleTema.setAttribute(
          "aria-label",
          ativar ? "Desativar modo claro" : "Ativar modo claro"
        );
        btnToggleTema.setAttribute(
          "aria-pressed",
          ativar ? "true" : "false"
        );
      } catch (e) {
        console.error(e);
      }
    });
  }
  if (btnAtualizarVersao) {
    // Por padrão, escondo até detectar atualização
    btnAtualizarVersao.style.display = 'none';

    const tornarVisivelSeWaiting = (reg) => {
      if (reg && reg.waiting) {
        btnAtualizarVersao.style.display = '';
        if (statusAtualizacao) statusAtualizacao.textContent = 'Nova versão disponível.';
      }
    };

    const observarUpdate = (reg) => {
      try {
        if (!reg) return;
        reg.addEventListener('updatefound', () => {
          const novo = reg.installing;
          if (!novo) return;
          novo.addEventListener('statechange', () => {
            // Quando o SW novo instala e há um controller, ele ficará em waiting
            if (novo.state === 'installed' && navigator.serviceWorker.controller) {
              tornarVisivelSeWaiting(reg);
            }
          });
        });
      } catch (_) {}
    };

    const marcarSemAtualizacao = () => {
      if (statusAtualizacao) statusAtualizacao.textContent = 'Nenhuma atualização disponível no momento.';
      btnAtualizarVersao.style.display = 'none';
    };

    (async () => {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          observarUpdate(reg);
          // Ao abrir o modal, forço uma checagem de versão
          await reg?.update?.();
          if (reg && reg.waiting) tornarVisivelSeWaiting(reg);
          else marcarSemAtualizacao();
        }
      } catch (_) {}
    })();

    btnAtualizarVersao.addEventListener('click', async () => {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            setTimeout(() => window.location.reload(), 400);
          } else {
            await reg?.update?.();
            if (reg && reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
              setTimeout(() => window.location.reload(), 400);
            }
          }
        }
      } catch (_) {}
    });
  }
  
  if (btnConfigurarSenha)
    btnConfigurarSenha.addEventListener("click", () =>
      mostrarConfigurarSenha(overlay)
    );
  if (btnRemoverSenha)
    btnRemoverSenha.addEventListener("click", () => {
      mostrarConfirmacao(
        "Remover Proteção",
        "Confirma a remoção da proteção por senha? A desativação tornará o sistema desprotegido.",
        "warning",
        () => {
          removerSenha();
          fecharPrincipal();
          setTimeout(() => atualizarConteudoModal(overlay), 1000);
        }
      );
    });
  
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay && btnConfiguracoes) {
      btnConfiguracoes.classList.remove("ativo");
    }
  });
}

function atualizarConteudoModal(overlay) {
  const modal = overlay.querySelector(".modal-escuro");
  if (!modal) return;
  
  const containerSeguranca = modal.querySelector("#secaoSeguranca");
  if (containerSeguranca)
    containerSeguranca.outerHTML = gerarSecaoSegurancaHTML();
  
  const btnConfigurarSenha = overlay.querySelector("#btnConfigurarSenha");
  const btnRemoverSenha = overlay.querySelector("#btnRemoverSenha");
  
  if (btnConfigurarSenha)
    btnConfigurarSenha.onclick = () => mostrarConfigurarSenha(overlay);
  if (btnRemoverSenha)
    btnRemoverSenha.onclick = () => {
      mostrarConfirmacao(
        "Remover Proteção",
        "Confirma a remoção da proteção por senha? A desativação tornará o sistema desprotegido.",
        "warning",
        () => {
          removerSenha();
          setTimeout(() => atualizarConteudoModal(overlay), 1000);
        }
      );
    };
}