import { abrirBancoDados, exportarDados, importarDados, db } from './dataset.js';
import { adicionarCliente, listarClientes, buscarClientes, removerCliente, idClienteSelecionado, nomeClienteSelecionado } from './clientes.js';
import { adicionarProduto, listarProdutos, removerProduto, liquidarDivida, registrarPagamentoParcial } from './produtos.js';
import { mostrarNotificacao, MENSAGENS } from './interface.js';
import { mostrarPromptSenha } from './seguranca.js';
import { mostrarRelatorio } from './relatorio.js';
import { mostrarConfiguracoes } from './configuracoes.js';

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

let sugestoesClientes = [];
let sugestoesProdutos = [];

function carregarSugestoes() {
  const transacao = db.transaction(['clientes'], 'readonly');
  const armazenamento = transacao.objectStore('clientes');
  const requisicao = armazenamento.getAll();
  
  requisicao.onsuccess = function(e) {
    const clientes = e.target.result;
    sugestoesClientes = clientes.map(c => c.nome);
    
    const produtos = [];
    clientes.forEach(cliente => {
      if (cliente.produtos) {
        cliente.produtos.forEach(produto => {
          if (!produtos.includes(produto.nome)) {
            produtos.push(produto.nome);
          }
        });
      }
    });
    sugestoesProdutos = produtos;
  };
}

function criarAutocompletar(input, sugestoes, tipo) {
  const container = document.createElement('div');
  container.className = 'autocomplete-container';
  input.parentNode.insertBefore(container, input);
  container.appendChild(input);
  
  const suggestionsDiv = document.createElement('div');
  suggestionsDiv.className = 'autocomplete-suggestions';
  suggestionsDiv.style.display = 'none';
  container.appendChild(suggestionsDiv);
  
  let selectedIndex = -1;
  
  function mostrarSugestoes(termo) {
    if (!termo || termo.length < 2) {
      suggestionsDiv.style.display = 'none';
      return;
    }
    
    const filtradas = sugestoes.filter(item => 
      item.toLowerCase().includes(termo.toLowerCase())
    ).slice(0, 5);
    
    if (filtradas.length === 0) {
      suggestionsDiv.style.display = 'none';
      return;
    }
    
    suggestionsDiv.innerHTML = filtradas.map((item, index) => `
      <div class="autocomplete-suggestion" data-index="${index}">
        ${item}
        <span class="suggestion-type">${tipo}</span>
      </div>
    `).join('');
    
    suggestionsDiv.style.display = 'block';
    selectedIndex = -1;
    
    suggestionsDiv.querySelectorAll('.autocomplete-suggestion').forEach((suggestion, index) => {
      suggestion.addEventListener('click', () => {
        input.value = suggestion.textContent.replace(tipo, '').trim();
        suggestionsDiv.style.display = 'none';
        input.focus();
      });
    });
  }
  
  input.addEventListener('input', (e) => {
    mostrarSugestoes(e.target.value);
  });
  
  input.addEventListener('keydown', (e) => {
    const suggestions = suggestionsDiv.querySelectorAll('.autocomplete-suggestion');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
      updateSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      updateSelection();
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      input.value = suggestions[selectedIndex].textContent.replace(tipo, '').trim();
      suggestionsDiv.style.display = 'none';
    } else if (e.key === 'Escape') {
      suggestionsDiv.style.display = 'none';
      selectedIndex = -1;
    }
  });
  
  function updateSelection() {
    suggestionsDiv.querySelectorAll('.autocomplete-suggestion').forEach((suggestion, index) => {
      suggestion.classList.toggle('selected', index === selectedIndex);
    });
  }
  
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      suggestionsDiv.style.display = 'none';
    }
  });
}



window.removerProduto = removerProduto;
window.listarClientes = listarClientes;
window.registrarPagamentoParcial = registrarPagamentoParcial;

// Inicialização do aplicativo após carregamento do DOM
document.addEventListener('DOMContentLoaded', async () => {
  const acessoPermitido = await mostrarPromptSenha();
  
  if (!acessoPermitido) {
    document.body.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center;">
        <div>
          <h2>Acesso Negado</h2>
          <p>Você precisa fornecer uma senha válida para acessar o sistema.</p>
          <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primaria); color: white; border: none; border-radius: var(--raio-pequeno); cursor: pointer;">
            Tentar Novamente
          </button>
        </div>
      </div>
    `;
    return;
  }
  
  document.getElementById('btnAdicionarCliente').addEventListener('click', adicionarCliente);
  document.getElementById('btnAdicionarProduto').addEventListener('click', adicionarProduto);
  document.getElementById('btnLiquidar').addEventListener('click', liquidarDivida);
  document.getElementById('btnRemoverCliente').addEventListener('click', removerCliente);
  document.getElementById('btnPagamentoParcial').addEventListener('click', registrarPagamentoParcial);
  
  document.getElementById('buscaCliente').addEventListener('input', buscarClientes);
  
  document.getElementById('buscaCliente').addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      const primeiroCliente = document.querySelector('#listaClientes .item-lista:not(.sem-registros)');
      if (primeiroCliente) {
        e.preventDefault();
        primeiroCliente.focus();
      }
    }
  });
  document.getElementById('buscaCliente').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      buscarClientes().then(() => {
        const primeiroCliente = document.querySelector('#listaClientes .item-lista:not(.sem-registros)');
        if (primeiroCliente) {
          primeiroCliente.focus();
        }
        
        // Limpar campo de busca e focar no campo de adição de produtos
        document.getElementById('buscaCliente').value = '';
        setTimeout(() => {
          document.getElementById('nomeProduto').focus();
        }, 100);
      });
    }
  });

  document.getElementById('nomeCliente').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      document.getElementById('btnAdicionarCliente').dispatchEvent(clickEvent);
    }
  });

  document.getElementById('precoProduto').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      document.getElementById('btnAdicionarProduto').dispatchEvent(clickEvent);
      
      // Após adicionar o produto, focar no campo nome do próximo produto
      setTimeout(() => {
        document.getElementById('nomeProduto').focus();
      }, 100);
    }
  });

  document.getElementById('precoProduto').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') return;
    
    if (e.key === 'e' || e.key === '+' || e.key === '-' || e.key === ',') {
      e.preventDefault();
    }
    
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', '.'];
    const hasDecimal = e.target.value.includes('.');
    
    if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
    
    if (e.key === '.' && hasDecimal) {
      e.preventDefault();
    }
  });

  document.getElementById('nomeCliente').addEventListener('input', () => {
    document.getElementById('erroCliente').style.display = 'none';
  });
  
  document.getElementById('nomeProduto').addEventListener('input', () => {
    document.getElementById('erroProduto').style.display = 'none';
  });
  
  document.getElementById('nomeProduto').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('precoProduto').focus();
    }
  });
  
  document.getElementById('precoProduto').addEventListener('input', () => {
    document.getElementById('erroProduto').style.display = 'none';
  });

  if (isMobileDevice()) {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.item-lista')) {
        setTimeout(() => {
          const campoProduto = document.getElementById('nomeProduto');
          if (campoProduto) {
            campoProduto.focus();
          }
        }, 800);
      }
    });
  }

  document.getElementById('btnBackup').addEventListener('click', exportarDados);
  document.getElementById('btnImportar').addEventListener('click', importarDados);
  document.getElementById('btnRelatorio').addEventListener('click', mostrarRelatorio);
  document.getElementById('btnConfiguracoes').addEventListener('click', mostrarConfiguracoes);
  
  abrirBancoDados();
  
  setTimeout(() => {
    carregarSugestoes();
    criarAutocompletar(document.getElementById('nomeCliente'), sugestoesClientes, 'Cliente');
    criarAutocompletar(document.getElementById('nomeProduto'), sugestoesProdutos, 'Produto');
  }, 1000);
});