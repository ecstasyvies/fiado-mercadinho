/**
 * clientes.js
 * Gerencia todas as operações relacionadas a clientes
 * Implementa CRUD completo com validações e feedback
 * Mantém estado do cliente selecionado para operações encadeadas
 */

import { db } from './dataset.js';
import { mostrarNotificacao, mostrarConfirmacao, MENSAGENS } from './interface.js';
import { listarProdutos } from './produtos.js';

let idClienteSelecionado = null;
let nomeClienteSelecionado = '';

// Atualiza contador total de clientes mantendo referência DOM
function atualizarContadorClientes() {
  const total = document.querySelectorAll('#listaClientes .item-lista').length;
  const contador = document.createElement('div');
  contador.className = 'total-clientes';
  contador.textContent = `Total de clientes: ${total}`;
  
  const container = document.querySelector('#listaClientes').parentElement;
  const contadorExistente = container.querySelector('.total-clientes');
  
  if (contadorExistente) {
    contadorExistente.replaceWith(contador);
  } else {
    container.appendChild(contador);
  }
}

export function adicionarCliente() {
  const inputNome = document.getElementById('nomeCliente');
  const nome = inputNome.value.trim();
  const elementoErro = document.getElementById('erroCliente');
  const btnAdicionar = document.getElementById('btnAdicionarCliente');
  
  if (!nome || !nome.replace(/\s+/g, '')) {
    elementoErro.textContent = MENSAGENS.erroNomeVazio;
    elementoErro.style.display = 'block';
    inputNome.focus();
    return;
  }
  
  elementoErro.style.display = 'none';
  btnAdicionar.classList.add('loading');
  
  const transacao = db.transaction(['clientes'], 'readwrite');
  const armazenamento = transacao.objectStore('clientes');
  const cliente = {
    nome: nome,
    produtos: [],
    dataCadastro: new Date().toISOString()
  };
  
  const requisicao = armazenamento.add(cliente);
  
  requisicao.onsuccess = function() {
    inputNome.value = '';
    listarClientes();
    document.getElementById('buscaCliente').value = '';
    mostrarNotificacao(MENSAGENS.clienteAdicionado, 'sucesso');
    btnAdicionar.classList.remove('loading');
    inputNome.focus();
  };
  
  requisicao.onerror = function(e) {
    elementoErro.textContent = MENSAGENS.erroGeral;
    elementoErro.style.display = 'block';
    btnAdicionar.classList.remove('loading');
  };
}

// Busca e filtra clientes, ordenando por nome
// Atualiza UI com resultados e mantém seleção atual
export function buscarClientes() {
  return new Promise((resolve) => {
    const termo = document.getElementById('buscaCliente').value.toLowerCase();
    const transacao = db.transaction(['clientes'], 'readonly');
    const armazenamento = transacao.objectStore('clientes');
    const requisicao = armazenamento.getAll();
    
    requisicao.onsuccess = function(e) {
      const clientes = e.target.result;
      const lista = document.getElementById('listaClientes');
      lista.innerHTML = '';
      
      if (clientes.length === 0) {
        lista.innerHTML = '<li class="sem-registros">Nenhum cliente cadastrado</li>';
        atualizarContadorClientes();
        resolve();
        return;
      }
      
      const clientesFiltrados = termo ?
        clientes.filter(cliente => cliente.nome.toLowerCase().includes(termo)) :
        clientes;
      
      clientesFiltrados.sort((a, b) => a.nome.localeCompare(b.nome));
      
      if (clientesFiltrados.length === 0) {
        lista.innerHTML = '<li class="sem-registros">Nenhum cliente encontrado</li>';
        atualizarContadorClientes();
        resolve();
        return;
      }
      
      clientesFiltrados.forEach(cliente => {
        const item = document.createElement('li');
        item.className = `item-lista ${cliente.id === idClienteSelecionado ? 'ativo' : ''}`;
        item.innerHTML = `
          <span>${cliente.nome}</span>
          <span class="etiqueta">${cliente.produtos ? cliente.produtos.length : 0} itens</span>
        `;
        item.addEventListener('click', () => {
          idClienteSelecionado = cliente.id;
          nomeClienteSelecionado = cliente.nome;
          listarClientes();
          listarProdutos(cliente.id);
          document.getElementById('acoesCliente').style.display = 'flex';
          document.getElementById('statusCliente').style.display = 'flex';
          document.getElementById('nomeClienteSelecionado').textContent = cliente.nome;
          
          if (window.innerWidth <= 768) {
            const secaoProdutos = document.querySelector('.cartao:nth-child(2)');
            secaoProdutos.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
            setTimeout(() => {
              document.getElementById('nomeProduto').focus();
            }, 800);
          }
        });
        lista.appendChild(item);
      });
      
      atualizarContadorClientes();
      resolve();
    };
    
    requisicao.onerror = function(e) {
      console.error('Erro ao recuperar lista de clientes:', e.target.error);
      resolve();
    };
  });
}

export function listarClientes() {
  buscarClientes();
}

// Remove cliente com confirmação extra caso tenha dívidas
// Limpa estados e atualiza UI após remoção
export function removerCliente() {
  if (!idClienteSelecionado) return;
  
  const transacao = db.transaction(['clientes'], 'readonly');
  const armazenamento = transacao.objectStore('clientes');
  const requisicao = armazenamento.get(idClienteSelecionado);
  const btnRemover = document.getElementById('btnRemoverCliente');
  btnRemover.classList.add('loading');
  
  requisicao.onsuccess = function(e) {
    const cliente = e.target.result;
    const temDivida = cliente.produtos?.length > 0;
    const quantidadeDividas = cliente.produtos.length;
    const mensagem = temDivida ?
      `ATENÇÃO: ${nomeClienteSelecionado} possui ${quantidadeDividas} ${quantidadeDividas === 1 ? 'dívida ativa' : 'dívidas ativas'}!\nDeseja realmente remover?` :
      `Remover ${nomeClienteSelecionado}?`;
    
    mostrarConfirmacao(
      'Remover Cliente',
      mensagem,
      temDivida ? 'error' : 'question',
      () => {
        const transacao = db.transaction(['clientes'], 'readwrite');
        const armazenamento = transacao.objectStore('clientes');
        const requisicao = armazenamento.delete(idClienteSelecionado);
        
        requisicao.onsuccess = function() {
          idClienteSelecionado = null;
          nomeClienteSelecionado = '';
          document.getElementById('acoesCliente').style.display = 'none';
          document.getElementById('statusCliente').style.display = 'none';
          listarClientes();
          document.getElementById('listaProdutos').innerHTML = '<li class="sem-registros">Selecione um cliente para ver as compras</li>';
          document.getElementById('totalCompra').innerHTML = 'Total: <span class="total-valor">R$ 0,00</span>';
          mostrarNotificacao(MENSAGENS.clienteRemovido, 'sucesso');
          btnRemover.classList.remove('loading');
        };
        
        requisicao.onerror = function(e) {
          mostrarNotificacao(MENSAGENS.erroGeral, 'erro');
          btnRemover.classList.remove('loading');
        };
      },
      () => {
        btnRemover.classList.remove('loading');
      }
    );
  };
}

export { idClienteSelecionado, nomeClienteSelecionado };