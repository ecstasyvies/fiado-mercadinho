'use strict';

import { db } from './dataset.js';
import { mostrarNotificacao, mostrarConfirmacao, MENSAGENS, anunciarParaLeitorDeTela, mostrarErroCampo } from './interface.js';
import { listarProdutos } from './produtos.js';

let idClienteSelecionado = null;
let nomeClienteSelecionado = '';

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
  return total;
}

export async function adicionarCliente() {
  const inputNome = document.getElementById('nomeCliente');
  const nome = inputNome.value.trim();
  const elementoErro = document.getElementById('erroCliente');
  const btnAdicionar = document.getElementById('btnAdicionarCliente');
  
  elementoErro.style.display = 'none';
  
  if (!nome || !nome.replace(/\s+/g, '')) {
    mostrarErroCampo(elementoErro, MENSAGENS.erroNomeVazio);
    inputNome.focus();
    return;
  }
  
  btnAdicionar.classList.add('loading');
  
  try {
    const clientes = await obterClientes();
    const nomeNormalizado = nome.toLowerCase();
    const clienteExistente = clientes.some(c => c.nome.trim().toLowerCase() === nomeNormalizado);
    
    if (clienteExistente) {
      mostrarErroCampo(elementoErro, MENSAGENS.erroClienteExistente);
      btnAdicionar.classList.remove('loading');
      inputNome.focus();
      return;
    }
    
    const transacao = db.transaction(['clientes'], 'readwrite');
    const armazenamento = transacao.objectStore('clientes');
    const cliente = { nome, produtos: [], dataCadastro: new Date().toISOString() };
    const requisicao = armazenamento.add(cliente);
    
    requisicao.onsuccess = async function() {
      inputNome.value = '';
      await listarClientes();
      const totalClientes = document.querySelectorAll('#listaClientes .item-lista:not(.sem-registros)').length;
      anunciarParaLeitorDeTela(`Cliente ${nome} adicionado. A lista agora contém ${totalClientes} clientes.`);
      document.getElementById('buscaCliente').value = '';
      mostrarNotificacao(MENSAGENS.clienteAdicionado, 'sucesso');
      btnAdicionar.classList.remove('loading');
      inputNome.focus();
    };
    
    requisicao.onerror = function() {
      mostrarErroCampo(elementoErro, MENSAGENS.erroGeral);
      btnAdicionar.classList.remove('loading');
    };
  } catch (error) {
    mostrarErroCampo(elementoErro, MENSAGENS.erroGeral);
    btnAdicionar.classList.remove('loading');
  }
}

async function obterClientes() {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error("Banco de dados não disponível."));
    const transacao = db.transaction(['clientes'], 'readonly');
    const armazenamento = transacao.objectStore('clientes');
    const requisicao = armazenamento.getAll();
    requisicao.onsuccess = e => resolve(e.target.result);
    requisicao.onerror = (e) => reject(e.target.error);
  });
}

function filtrarClientes(clientes, termo) {
  if (!termo) {
    return clientes.sort((a, b) => a.nome.localeCompare(b.nome));
  }
  
  termo = termo.toLowerCase();
  
  const comecamComTermo = clientes
    .filter(c => c.nome.toLowerCase().startsWith(termo))
    .sort((a, b) => a.nome.localeCompare(b.nome));
  
  const contemNoMeio = clientes
    .filter(c =>
      !c.nome.toLowerCase().startsWith(termo) &&
      c.nome.toLowerCase().includes(" " + termo)
    )
    .sort((a, b) => a.nome.localeCompare(b.nome));
  
  return [...comecamComTermo, ...contemNoMeio];
}

function resetarSelecaoCliente() {
  idClienteSelecionado = null;
  nomeClienteSelecionado = '';
  document.getElementById('acoesCliente').className = 'acoes-cliente acoes-cliente-oculto';
  document.getElementById('statusCliente').className = 'status-cliente status-cliente-oculto';
  document.getElementById('listaProdutos').innerHTML = '<li class="sem-registros">Selecione um cliente para ver as compras</li>';
  document.getElementById('totalCompra').innerHTML = 'Total: <span class="total-valor">R$ 0,00</span>';
  const tituloH3 = document.getElementById('tituloComprasRegistradas');
  if (tituloH3) {
    tituloH3.textContent = 'Compras Registradas';
  }
}

function criarItemCliente(cliente) {
  const item = document.createElement('li');
  item.className = `item-lista ${cliente.id === idClienteSelecionado ? 'ativo' : ''}`;
  item.innerHTML = `
    <span>${cliente.nome}</span>
    <span class="etiqueta">${cliente.produtos ? cliente.produtos.length : 0} itens</span>
  `;
  item.setAttribute('tabindex', '0');
  item.setAttribute('role', 'button');
  item.setAttribute('aria-label', `Selecionar cliente ${cliente.nome}`);
  item.setAttribute('data-cliente-id', cliente.id);
  
  const selecionarCliente = () => {
    if (idClienteSelecionado === cliente.id) {
      resetarSelecaoCliente();
      listarClientes();
    } else {
      idClienteSelecionado = cliente.id;
      nomeClienteSelecionado = cliente.nome;
      listarClientes();
      listarProdutos(cliente.id);
      document.getElementById('acoesCliente').className = 'acoes-cliente acoes-cliente-visivel';
      document.getElementById('statusCliente').className = 'status-cliente status-cliente-visivel';
      document.getElementById('nomeClienteSelecionado').textContent = cliente.nome;
      
      setTimeout(() => {
        const campo = document.getElementById('nomeProduto');
        if (campo) {
          const posicaoElemento = campo.getBoundingClientRect().top + window.scrollY;
          const offset = window.innerHeight * 0.25;
          const destino = posicaoElemento - offset;
          
          window.scrollTo({ top: destino, behavior: 'smooth' });
          campo.focus({ preventScroll: true });
        }
      }, 200);
    }
  };
  
  item.addEventListener('click', selecionarCliente);
  item.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selecionarCliente();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = item.nextElementSibling;
      if (next && next.classList.contains('item-lista')) next.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = item.previousElementSibling;
      if (prev && prev.classList.contains('item-lista')) prev.focus();
    } else if (e.key === 'Tab' && !e.shiftKey) {
      const next = item.nextElementSibling;
      if (!next || !next.classList.contains('item-lista')) document.getElementById('nomeProduto').focus();
    }
  });
  
  return item;
}

function renderizarClientes(clientes) {
  const lista = document.getElementById('listaClientes');
  lista.innerHTML = '';
  
  if (!clientes.length) {
    lista.innerHTML = '<li class="sem-registros">Nenhum cliente encontrado</li>';
    atualizarContadorClientes();
    return;
  }
  
  clientes.forEach(cliente => lista.appendChild(criarItemCliente(cliente)));
  atualizarContadorClientes();
}

export async function buscarClientes() {
  const termo = document.getElementById('buscaCliente').value.toLowerCase();
  const clientes = await obterClientes();
  const clientesFiltrados = filtrarClientes(clientes, termo);
  if (termo && !clientesFiltrados.some(c => c.id === idClienteSelecionado)) resetarSelecaoCliente();
  renderizarClientes(clientesFiltrados);
}

export function listarClientes() {
  return buscarClientes();
}

function deletarClienteDoDB(clienteId, callbackSucesso, callbackErro) {
  const transacao = db.transaction(['clientes'], 'readwrite');
  const armazenamento = transacao.objectStore('clientes');
  const requisicao = armazenamento.delete(clienteId);
  requisicao.onsuccess = callbackSucesso;
  requisicao.onerror = callbackErro;
}

export function removerCliente() {
  if (!idClienteSelecionado) return;
  const transacao = db.transaction(['clientes'], 'readonly');
  const armazenamento = transacao.objectStore('clientes');
  const requisicao = armazenamento.get(idClienteSelecionado);
  const btnRemover = document.getElementById('btnRemoverCliente');
  btnRemover.classList.add('loading');
  
  requisicao.onsuccess = e => {
    const cliente = e.target.result;
    const nomeClienteParaRemover = nomeClienteSelecionado;
    const totalProdutos = cliente.produtos?.reduce((sum, p) => sum + Number(p.preco), 0) || 0;
    const valorPago = cliente.valorPago || 0;
    const saldoDevedor = totalProdutos - valorPago;
    const temDivida = saldoDevedor > 0;
    
    const mensagem = temDivida ?
      `ATENÇÃO: ${nomeClienteParaRemover} possui uma dívida de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoDevedor)}! Deseja realmente remover?` :
      `Remover ${nomeClienteParaRemover}?`;
    
    mostrarConfirmacao(
      'Remover Cliente',
      mensagem,
      temDivida ? 'error' : 'question',
      () => {
        deletarClienteDoDB(idClienteSelecionado, async () => {
          resetarSelecaoCliente();
          await listarClientes();
          const totalClientes = document.querySelectorAll('#listaClientes .item-lista:not(.sem-registros)').length;
          anunciarParaLeitorDeTela(`Cliente ${nomeClienteParaRemover} removido. A lista agora contém ${totalClientes} clientes.`);
          document.getElementById('listaProdutos').innerHTML = '<li class="sem-registros">Selecione um cliente para ver as compras</li>';
          document.getElementById('totalCompra').innerHTML = 'Total: <span class="total-valor">R$ 0,00</span>';
          mostrarNotificacao(MENSAGENS.clienteRemovido, 'sucesso');
          btnRemover.classList.remove('loading');
        }, () => {
          mostrarNotificacao(MENSAGENS.erroGeral, 'erro');
          btnRemover.classList.remove('loading');
        });
      },
      () => btnRemover.classList.remove('loading')
    );
  };
}

export function selecionarClientePorId(clienteId, clienteNome) {
  idClienteSelecionado = clienteId;
  nomeClienteSelecionado = clienteNome;
  listarProdutos(clienteId);
  document.getElementById('acoesCliente').className = 'acoes-cliente acoes-cliente-visivel';
  document.getElementById('statusCliente').className = 'status-cliente status-cliente-visivel';
  document.getElementById('nomeClienteSelecionado').textContent = clienteNome;
  listarClientes();
}

export { idClienteSelecionado, nomeClienteSelecionado };