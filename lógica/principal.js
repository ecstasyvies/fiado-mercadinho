import { abrirBancoDados, exportarDados, importarDados, db } from './dataset.js';
import { adicionarCliente, listarClientes, buscarClientes, removerCliente, idClienteSelecionado, nomeClienteSelecionado } from './clientes.js';
import { adicionarProduto, listarProdutos, removerProduto, liquidarDivida } from './produtos.js';
import { mostrarNotificacao, MENSAGENS } from './interface.js';
import { mostrarPromptSenha } from './seguranca.js';
import { mostrarRelatorio } from './relatorio.js';
import { mostrarConfiguracoes } from './configuracoes.js';

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

window.removerProduto = removerProduto;
window.listarClientes = listarClientes;

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
  
  document.getElementById('buscaCliente').addEventListener('input', buscarClientes);
  document.getElementById('buscaCliente').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      buscarClientes().then(() => {
        const primeiroCliente = document.querySelector('#listaClientes .item-lista:not(.sem-registros)');
        if (primeiroCliente) {
          primeiroCliente.click();
          document.getElementById('nomeProduto').focus();
        }
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
});