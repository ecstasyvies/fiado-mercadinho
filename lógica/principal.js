"use strict";

import {
  abrirBancoDados,
  exportarDados,
  importarDados,
  db,
} from "./dataset.js";
import {
  adicionarCliente,
  listarClientes,
  buscarClientes,
  removerCliente,
  selecionarClientePorId,
  idClienteSelecionado,
} from "./clientes.js";
import {
  adicionarProduto,
  listarProdutos,
  removerProduto,
  liquidarDivida,
  registrarPagamentoParcial,
} from "./produtos.js";
import { mostrarPromptSenha } from "./seguranca.js";
import { mostrarRelatorio } from "./relatorio.js";
import { mostrarConfiguracoes } from "./configuracoes.js";
import { melhorarAcessibilidadeInput } from "./acessibilidade.js";

let sugestoesClientes = [];
let sugestoesProdutos = [];
let mapaClientesPorNome = new Map();
let mapaProdutosUltimoPreco = new Map();
let dbCarregado = false;
let tentativasCarregamento = 0;
const MAX_TENTATIVAS = 10;

function verificarDispositivoMovel() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function normalizarTexto(s) {
  return (s || "").toLowerCase().trim().replace(/\s+/g, " ");
}

function carregarSugestoesClientes(clientes) {
  sugestoesClientes = clientes.map((c) => c.nome);
  mapaClientesPorNome.clear();
  clientes.forEach((c) => {
    if (c && typeof c.nome === "string") {
      mapaClientesPorNome.set(normalizarTexto(c.nome), {
        id: c.id,
        nome: c.nome,
      });
    }
  });
}

function carregarSugestoesProdutos(clientes) {
  const produtos = [];
  mapaProdutosUltimoPreco.clear();
  clientes.forEach((cliente) => {
    if (cliente.produtos) {
      cliente.produtos.forEach((produto) => {
        if (produto.nome && !produtos.includes(produto.nome)) {
          produtos.push(produto.nome);
        }
        if (
          produto &&
          typeof produto.nome === "string" &&
          typeof produto.preco === "number"
        ) {
          const chave = normalizarTexto(produto.nome);
          const data = produto.dataCompra
            ? new Date(produto.dataCompra).getTime()
            : 0;
          const existente = mapaProdutosUltimoPreco.get(chave);
          if (!existente || (data && data > existente.dataMs)) {
            mapaProdutosUltimoPreco.set(chave, {
              preco: produto.preco,
              dataMs: data,
            });
          }
        }
      });
    }
  });
  sugestoesProdutos = produtos;
}

function carregarSugestoes() {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Banco de dados não disponível"));
      return;
    }
    const transacao = db.transaction(["clientes"], "readonly");
    const armazenamento = transacao.objectStore("clientes");
    const requisicao = armazenamento.getAll();
    requisicao.onsuccess = function (e) {
      const clientes = e.target.result;
      carregarSugestoesClientes(clientes);
      carregarSugestoesProdutos(clientes);
      dbCarregado = true;
      resolve();
    };
    requisicao.onerror = function (e) {
      reject(e.target.error);
    };
  });
}

function criarContainerAutocomplete(input) {
  const container = document.createElement("div");
  container.className = "conteiner-autocompletar";
  input.parentNode.insertBefore(container, input);
  container.appendChild(input);
  const suggestionsDiv = document.createElement("div");
  suggestionsDiv.className = "sugestoes-autocompletar";
  suggestionsDiv.style.display = "none";
  container.appendChild(suggestionsDiv);
  return { container, suggestionsDiv };
}

function preencherSugestoes(input, suggestionsDiv, listaRenderizar, tipo) {
  suggestionsDiv.innerHTML = listaRenderizar
    .map(
      (entry, index) => `
        <div class="sugestao-autocompletar" data-index="${index}" ${
        entry.clienteId ? `data-cliente-id="${entry.clienteId}"` : ""
      } role="option" id="sugestao-${tipo}-${index}">
            ${entry.value}
            <span class="tipo-sugestao">${entry.tipo}</span>
        </div>
    `
    )
    .join("");
  suggestionsDiv.style.display = "block";
  input.setAttribute("aria-expanded", "true");
  suggestionsDiv.setAttribute("role", "listbox");
  suggestionsDiv.setAttribute("aria-label", `Sugestões de ${tipo}`);
}

function processarSelecaoCliente(input, suggestionsDiv, clienteId, nome) {
  input.value = "";
  suggestionsDiv.style.display = "none";
  input.setAttribute("aria-expanded", "false");
  input.removeAttribute("aria-activedescendant");
  try {
    selecionarClientePorId(parseInt(clienteId, 10), nome);
  } finally {
    setTimeout(() => {
      const campoProduto = document.getElementById("nomeProduto");
      if (campoProduto) {
        const posicaoElemento =
          campoProduto.getBoundingClientRect().top + window.scrollY;
        const offset = window.innerHeight * 0.25;
        const destino = posicaoElemento - offset;

        window.scrollTo({ top: destino, behavior: "smooth" });
        campoProduto.focus({ preventScroll: true });
      }
    }, 150);
  }
}

function processarSelecaoProduto(input, suggestionsDiv) {
  const campoPreco = document.getElementById("precoProduto");
  const btnAdicionar = document.getElementById("btnAdicionarProduto");
  const registro = mapaProdutosUltimoPreco.get(normalizarTexto(input.value));
  if (registro && campoPreco && btnAdicionar) {
    campoPreco.value = Number(registro.preco).toFixed(2);
    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    btnAdicionar.dispatchEvent(clickEvent);
    setTimeout(() => {
      input.focus();
    }, 50);
  } else if (campoPreco) {
    campoPreco.focus({ preventScroll: true });
  }
}

function configurarEventosSugestoes(input, suggestionsDiv, tipo) {
  let selectedIndex = -1;

  function updateSelection() {
    const suggestions = suggestionsDiv.querySelectorAll(
      ".sugestao-autocompletar"
    );
    suggestions.forEach((suggestion, index) => {
      const isSelected = index === selectedIndex;
      suggestion.classList.toggle("selecionada", isSelected);
      suggestion.setAttribute("aria-selected", isSelected);
      if (isSelected) {
        suggestion.scrollIntoView({ block: "nearest" });
        input.setAttribute("aria-activedescendant", suggestion.id);
      }
    });
    if (selectedIndex === -1) {
      input.removeAttribute("aria-activedescendant");
    }
  }

  input.addEventListener("keydown", (e) => {
    const suggestions = suggestionsDiv.querySelectorAll(
      ".sugestao-autocompletar"
    );
    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
      updateSelection();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      updateSelection();
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[selectedIndex];
      selected.click();
    } else if (e.key === "Escape" || e.key === "Tab") {
      suggestionsDiv.style.display = "none";
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      selectedIndex = -1;
    }
  });

  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-haspopup", "listbox");
  input.setAttribute("aria-expanded", "false");
}

function mostrarSugestoesAutocomplete(
  input,
  suggestionsDiv,
  sugestoes,
  tipo,
  termo
) {
  if (!dbCarregado) return;
  const termoStr = (termo || "").toString();
  const termoNormalizado = termoStr.trim().toLowerCase();
  if (!termoNormalizado || termoNormalizado.length < 2) {
    suggestionsDiv.style.display = "none";
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    return;
  }

  let filtradas;
  const ehCampoCliente = tipo.toLowerCase() === "cliente";

  if (ehCampoCliente) {
    const comecamComTermo = sugestoes
      .filter((c) => c.toLowerCase().startsWith(termoNormalizado))
      .sort((a, b) => a.localeCompare(b));

    const contemNoMeio = sugestoes
      .filter(
        (c) =>
          !c.toLowerCase().startsWith(termoNormalizado) &&
          c.toLowerCase().includes(" " + termoNormalizado)
      )
      .sort((a, b) => a.localeCompare(b));

    filtradas = [...comecamComTermo, ...contemNoMeio];
  } else {
    const comecamComTermo = sugestoes
      .filter((item) => item && item.toLowerCase().startsWith(termoNormalizado))
      .sort((a, b) => a.localeCompare(b));

    const contemTermo = sugestoes
      .filter(
        (item) =>
          item &&
          !item.toLowerCase().startsWith(termoNormalizado) &&
          item.toLowerCase().includes(termoNormalizado)
      )
      .sort((a, b) => a.localeCompare(b));

    filtradas = [...comecamComTermo, ...contemTermo];
  }

  const slicedFiltradas = filtradas.slice(0, 5);
  const matchExato = ehCampoCliente
    ? mapaClientesPorNome.get(normalizarTexto(termoStr))
    : null;
  const listaRenderizar = [];
  const labelTipoPadrao = ehCampoCliente ? "Cliente cadastrado" : tipo;

  if (matchExato) {
    listaRenderizar.push({
      value: matchExato.nome,
      tipo: "Cliente cadastrado",
      clienteId: String(matchExato.id),
    });
  }

  slicedFiltradas
    .filter(
      (n) => !matchExato || n.toLowerCase() !== matchExato.nome.toLowerCase()
    )
    .forEach((n) => {
      if (ehCampoCliente) {
        const m = mapaClientesPorNome.get(normalizarTexto(n));
        if (m) {
          listaRenderizar.push({
            value: n,
            tipo: labelTipoPadrao,
            clienteId: String(m.id),
          });
          return;
        }
      }
      listaRenderizar.push({ value: n, tipo: labelTipoPadrao });
    });

  if (listaRenderizar.length === 0) {
    suggestionsDiv.style.display = "none";
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    return;
  }

  preencherSugestoes(input, suggestionsDiv, listaRenderizar, tipo);
  suggestionsDiv
    .querySelectorAll(".sugestao-autocompletar")
    .forEach((suggestion) => {
      suggestion.addEventListener("click", () => {
        const clienteId = suggestion.getAttribute("data-cliente-id");
        if (clienteId) {
          processarSelecaoCliente(
            input,
            suggestionsDiv,
            clienteId,
            suggestion.childNodes[0].textContent.trim()
          );
        } else {
          input.value = suggestion.childNodes[0].textContent.trim();
          suggestionsDiv.style.display = "none";
          input.setAttribute("aria-expanded", "false");
          input.removeAttribute("aria-activedescendant");
          if (tipo.toLowerCase() === "produto") {
            processarSelecaoProduto(input, suggestionsDiv);
          } else {
            input.focus();
          }
        }
      });
    });
}

function configurarAutocompletarCampo(input, sugestoes, tipo) {
  const { container, suggestionsDiv } = criarContainerAutocomplete(input);

  input.addEventListener("input", (e) =>
    mostrarSugestoesAutocomplete(
      input,
      suggestionsDiv,
      sugestoes,
      tipo,
      e.target.value
    )
  );

  configurarEventosSugestoes(input, suggestionsDiv, tipo);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      suggestionsDiv.style.display = "none";
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }
  });

  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      suggestionsDiv.style.display = "none";
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }
  });
}

function inicializarAutocomplete() {
  configurarAutocompletarCampo(
    document.getElementById("nomeCliente"),
    sugestoesClientes,
    "Cliente"
  );
  configurarAutocompletarCampo(
    document.getElementById("nomeProduto"),
    sugestoesProdutos,
    "Produto"
  );
  melhorarAcessibilidadeInput(
    document.getElementById("nomeCliente"),
    "erroCliente"
  );
  melhorarAcessibilidadeInput(
    document.getElementById("nomeProduto"),
    "erroProduto"
  );
  melhorarAcessibilidadeInput(
    document.getElementById("precoProduto"),
    "erroProduto"
  );
  melhorarAcessibilidadeInput(document.getElementById("buscaCliente"));
}

function tentarCarregarSugestoes() {
  if (tentativasCarregamento >= MAX_TENTATIVAS) {
    dbCarregado = true;
    inicializarAutocomplete();
    return;
  }
  tentativasCarregamento++;
  if (db) {
    carregarSugestoes()
      .then(() => {
        inicializarAutocomplete();
      })
      .catch(() => {
        setTimeout(tentarCarregarSugestoes, 300);
      });
  } else {
    setTimeout(tentarCarregarSugestoes, 300);
  }
}

function configurarEventosTeclado() {
  document
    .getElementById("btnAdicionarProduto")
    .addEventListener("keydown", (e) => {
      if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        document.getElementById("precoProduto").focus();
      }
    });

  document.getElementById("btnLiquidar").addEventListener("keydown", (e) => {
    if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      document.getElementById("btnAdicionarProduto").focus();
    }
  });

  document
    .getElementById("btnRemoverCliente")
    .addEventListener("keydown", (e) => {
      if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        document.getElementById("btnLiquidar").focus();
      }
    });

  document
    .getElementById("btnPagamentoParcial")
    .addEventListener("keydown", (e) => {
      if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        document.getElementById("btnRemoverCliente").focus();
      }
    });

  document
    .getElementById("btnAdicionarCliente")
    .addEventListener("keydown", (e) => {
      if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        document.getElementById("nomeCliente").focus();
      }
    });

  document.getElementById("nomeCliente").addEventListener("keydown", (e) => {
    if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      document.getElementById("btnConfiguracoes").focus();
    }
  });

  document.getElementById("buscaCliente").addEventListener("keydown", (e) => {
    if (e.key === "Tab" && !e.shiftKey) {
      const primeiroCliente = document.querySelector(
        "#listaClientes .item-lista:not(.sem-registros)"
      );
      if (primeiroCliente) {
        e.preventDefault();
        primeiroCliente.focus();
      }
    } else if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      document.getElementById("btnAdicionarCliente").focus();
    }
  });

  document.getElementById("nomeProduto").addEventListener("keydown", (e) => {
    if (e.key === "Tab" && e.shiftKey) {
      const ultimoCliente = document.querySelector(
        "#listaClientes .item-lista:not(.sem-registros):last-child"
      );
      if (ultimoCliente) {
        e.preventDefault();
        ultimoCliente.focus();
      }
    }
  });

  document.getElementById("btnBackup").addEventListener("keydown", (e) => {
    if (e.key === "Tab" && e.shiftKey) {
      const ultimoCliente = document.querySelector(
        "#listaClientes .item-lista:not(.sem-registros):last-child"
      );
      if (ultimoCliente) {
        e.preventDefault();
        ultimoCliente.focus();
      }
    }
  });

  document.getElementById("btnImportar").addEventListener("keydown", (e) => {
    if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      document.getElementById("btnBackup").focus();
    }
  });

  document.getElementById("btnRelatorio").addEventListener("keydown", (e) => {
    if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault();
      document.getElementById("btnImportar").focus();
    }
  });

  document
    .getElementById("btnConfiguracoes")
    .addEventListener("keydown", (e) => {
      if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        document.getElementById("btnRelatorio").focus();
      }
    });
}

function configurarEventosEnter() {
  document.getElementById("buscaCliente").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const inputBusca = document.getElementById("buscaCliente");
      const termoBusca = inputBusca.value.trim();

      inputBusca.blur();

      if (termoBusca) {
        buscarClientes().then(() => {
          const primeiroCliente = document.querySelector(
            "#listaClientes .item-lista:not(.sem-registros)"
          );
          if (primeiroCliente) {
            primeiroCliente.click();
            inputBusca.value = "";
          }
        });
      }
    }
  });

  document.getElementById("nomeCliente").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      document.getElementById("btnAdicionarCliente").dispatchEvent(clickEvent);
    }
  });

  document.getElementById("nomeProduto").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const isMobile = verificarDispositivoMovel();

      if (isMobile) {
        const clickEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        });
        document
          .getElementById("btnAdicionarProduto")
          .dispatchEvent(clickEvent);
      } else {
        const campoPreco = document.getElementById("precoProduto");
        if (campoPreco) {
          campoPreco.focus();
          campoPreco.select();
        }
      }
    }
  });

  document.getElementById("precoProduto").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      document.getElementById("btnAdicionarProduto").dispatchEvent(clickEvent);
    }
  });
}

function configurarValidacaoInputs() {
  document.getElementById("nomeCliente").addEventListener("input", () => {
    document.getElementById("erroCliente").style.display = "none";
  });

  document.getElementById("nomeProduto").addEventListener("input", () => {
    document.getElementById("erroProduto").style.display = "none";
  });

  document.getElementById("precoProduto").addEventListener("input", () => {
    document.getElementById("erroProduto").style.display = "none";
  });
}

function configurarPrecoProdutoInput() {
  document.getElementById("precoProduto").addEventListener("keydown", (e) => {
    if (e.key === "Enter") return;
    if (["e", "+", "-", ","].includes(e.key)) e.preventDefault();
    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "ArrowLeft",
      "ArrowRight",
      ".",
    ];
    const hasDecimal = e.target.value.includes(".");
    if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key))
      e.preventDefault();
    if (e.key === "." && hasDecimal) e.preventDefault();
  });
}

function configurarEventosMobile() {
  if (verificarDispositivoMovel()) {
    document.addEventListener("click", (e) => {
      if (e.target.closest(".item-lista")) {
        setTimeout(() => {
          if (idClienteSelecionado !== null) {
            const campoProduto = document.getElementById("nomeProduto");
            if (campoProduto) campoProduto.focus();
          }
        }, 800);
      }
    });
  }
}

function configurarEventosBotoes() {
  document
    .getElementById("btnAdicionarCliente")
    .addEventListener("click", adicionarCliente);
  document
    .getElementById("btnAdicionarProduto")
    .addEventListener("click", adicionarProduto);
  document
    .getElementById("btnLiquidar")
    .addEventListener("click", liquidarDivida);
  document
    .getElementById("btnRemoverCliente")
    .addEventListener("click", removerCliente);
  document
    .getElementById("btnPagamentoParcial")
    .addEventListener("click", registrarPagamentoParcial);
  document.getElementById("btnBackup").addEventListener("click", exportarDados);
  document
    .getElementById("btnImportar")
    .addEventListener("click", importarDados);
  document
    .getElementById("btnRelatorio")
    .addEventListener("click", mostrarRelatorio);
  document
    .getElementById("btnConfiguracoes")
    .addEventListener("click", mostrarConfiguracoes);
}

function configurarBuscaCliente() {
  document
    .getElementById("buscaCliente")
    .addEventListener("input", buscarClientes);
}

window.removerProduto = removerProduto;
window.listarClientes = listarClientes;

document.addEventListener("DOMContentLoaded", async () => {
  const acessoPermitido = await mostrarPromptSenha();
  if (!acessoPermitido) {
    document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center;">
                <div style="max-width: 400px; padding: 1rem;">
                    <h2 style="margin: 0 auto; text-align: center; display: block; margin-bottom: 1rem; overflow-wrap: break-word; hyphens: auto;">Acesso Negado</h2>
                    <p style="margin-bottom: 1rem; overflow-wrap: break-word; hyphens: auto;">Você precisa fornecer uma senha válida.</p>
                    <button onclick="location.reload()" style="padding: 0.5rem 1rem; background: var(--primaria); color: white; border: none; border-radius: var(--raio-pequeno); cursor: pointer;">
                        Tentar Novamente
                    </button>
                </div>
            </div>
        `;
    return;
  }

  configurarEventosBotoes();
  configurarEventosTeclado();
  configurarEventosEnter();
  configurarValidacaoInputs();
  configurarPrecoProdutoInput();
  configurarEventosMobile();
  configurarBuscaCliente();

  abrirBancoDados();
  setTimeout(tentarCarregarSugestoes, 500);
});