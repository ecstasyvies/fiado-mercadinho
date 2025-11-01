'use strict';

import { db } from './dataset.js';
import { mostrarNotificacao, mostrarConfirmacao, MENSAGENS, anunciarParaLeitorDeTela, mostrarErroCampo } from './interface.js';
import { emitir as emitirEvento } from './eventos.js';
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
  // anotação: se não tiver cliente, eu escondo ações que só fazem sentido com cliente
  try {
    const btnBackup = document.getElementById('btnBackup');
    const btnRelatorio = document.getElementById('btnRelatorio');
    const containerAcoes = document.querySelector('.acoes-backup');
    const temClientes = total > 0;
    if (btnBackup) btnBackup.style.display = temClientes ? '' : 'none';
    if (btnRelatorio) btnRelatorio.style.display = temClientes ? '' : 'none';
    if (containerAcoes) {
      let dica = containerAcoes.querySelector('.dica-relatorio');
      if (!temClientes) {
        if (!dica) {
          dica = document.createElement('div');
          dica.className = 'sem-registros dica-relatorio';
          dica.setAttribute('role', 'note');
          dica.textContent = 'Cadastre clientes para gerar relatório';
          containerAcoes.appendChild(dica);
        }
      } else if (dica) {
        dica.remove();
      }
    }
  } catch (_) {}
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
  // sinaliza que houve alteração no DB (novo cliente)
  emitirEvento('dados:alterados', { type: 'add', entity: 'cliente' });
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

// Removida primeira declaração de resetarSelecaoCliente (movida para baixo)

function criarItemCliente(cliente) {
  const item = document.createElement('li');
  item.className = `item-lista ${cliente.id === idClienteSelecionado ? 'ativo' : ''}`;
  item.innerHTML = `
    <span>${cliente.nome}${cliente.comentarios ? ' <i class="fas fa-comment-dots" title="Cliente possui anotações"></i>' : ''}</span>
    <span class="etiqueta">${cliente.produtos ? cliente.produtos.length : 0} itens</span>
  `;
  item.setAttribute('tabindex', '0');
  item.setAttribute('role', 'button');
  item.setAttribute('aria-label', `Selecionar cliente ${cliente.nome}${cliente.comentarios ? ' (possui anotações)' : ''}`);
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
      
      // Mostra e carrega os comentários
      const comentariosDiv = document.getElementById('comentariosCliente');
      comentariosDiv.style.display = 'block';
      carregarComentarios(cliente.id);
      
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
    // anotação: quando não tem nada, deixo o recado padrão aqui
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
          // sinaliza que houve remoção
          emitirEvento('dados:alterados', { type: 'delete', entity: 'cliente' });
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

// Removida primeira declaração de selecionarClientePorId (movida para baixo)

function carregarComentarios(clienteId) {
  const transacao = db.transaction(['clientes'], 'readonly');
  const armazenamento = transacao.objectStore('clientes');
  const requisicao = armazenamento.get(clienteId);
  
  requisicao.onsuccess = function(e) {
    const cliente = e.target.result;
    const comentariosTexto = document.getElementById('comentariosTexto');
    comentariosTexto.value = cliente.comentarios || '';
  };
  
  requisicao.onerror = function() {
    mostrarNotificacao('Erro ao carregar anotações', 'erro');
  };
}

function salvarComentarios(clienteId, novoComentario) {
  const transacao = db.transaction(['clientes'], 'readwrite');
  const armazenamento = transacao.objectStore('clientes');
  const requisicao = armazenamento.get(clienteId);
  
  requisicao.onsuccess = function(e) {
    const cliente = e.target.result;
    cliente.comentarios = novoComentario;
    
    const requisicaoUpdate = armazenamento.put(cliente);
    
    requisicaoUpdate.onsuccess = function() {
      mostrarNotificacao('Anotações salvas com sucesso', 'sucesso');
      emitirEvento('dados:alterados', { type: 'update', entity: 'cliente', field: 'comentarios' });
    };
    
    requisicaoUpdate.onerror = function() {
      mostrarNotificacao('Erro ao salvar anotações', 'erro');
    };
  };
}

// Função para debounce do auto-save
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Função para salvar comentários com feedback visual
function salvarComentariosComFeedback(clienteId, novoComentario, silencioso = false) {
  if (!clienteId) return;
  
  const textarea = document.getElementById('comentariosTexto');
  textarea.classList.add('salvando');
  
  const transacao = db.transaction(['clientes'], 'readwrite');
  const armazenamento = transacao.objectStore('clientes');
  const requisicao = armazenamento.get(clienteId);
  
  requisicao.onsuccess = function(e) {
    const cliente = e.target.result;
    cliente.comentarios = novoComentario;
    
    const requisicaoUpdate = armazenamento.put(cliente);
    
    requisicaoUpdate.onsuccess = function() {
      if (!silencioso) {
        mostrarNotificacao('Anotações salvas com sucesso', 'sucesso');
      }
      emitirEvento('dados:alterados', { type: 'update', entity: 'cliente', field: 'comentarios' });
      
      textarea.classList.remove('salvando');
      textarea.classList.add('salvo');
      setTimeout(() => textarea.classList.remove('salvo'), 500);
      
      // Atualiza o ícone na lista
      listarClientes();
    };
    
    requisicaoUpdate.onerror = function() {
      mostrarNotificacao('Erro ao salvar anotações', 'erro');
      textarea.classList.remove('salvando');
    };
  };
}

// Função para inicializar os eventos dos comentários
function inicializarEventosComentarios() {
  const textarea = document.getElementById('comentariosTexto');
  const btnSalvarComentarios = document.getElementById('btnSalvarComentarios');
  
  if (!textarea || !btnSalvarComentarios) return;
  
  // Auto-save com debounce
  const autoSave = debounce(() => {
    if (!idClienteSelecionado) return;
    const novoComentario = textarea.value.trim();
    salvarComentariosComFeedback(idClienteSelecionado, novoComentario, true);
  }, 1000);
  
  // Evento de mudança no texto
  textarea.addEventListener('input', autoSave);
  
  // Salvar ao perder foco
  textarea.addEventListener('blur', () => {
    if (!idClienteSelecionado) return;
    const novoComentario = textarea.value.trim();
    salvarComentariosComFeedback(idClienteSelecionado, novoComentario, true);
  });
  
  // Tecla Enter (exceto em mobile)
  textarea.addEventListener('keydown', (e) => {
    // Em dispositivos móveis, Enter é usado para quebra de linha
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const novoComentario = textarea.value.trim();
      salvarComentariosComFeedback(idClienteSelecionado, novoComentario);
    }
    // Ctrl/Cmd + Enter sempre salva (útil em mobile)
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const novoComentario = textarea.value.trim();
      salvarComentariosComFeedback(idClienteSelecionado, novoComentario);
    }
  });
  
  // Botão de salvar
  btnSalvarComentarios.addEventListener('click', () => {
    if (!idClienteSelecionado) return;
    const novoComentario = textarea.value.trim();
    salvarComentariosComFeedback(idClienteSelecionado, novoComentario);
  });
}

export function resetarSelecaoCliente() {
  idClienteSelecionado = null;
  nomeClienteSelecionado = '';
  document.getElementById('acoesCliente').className = 'acoes-cliente acoes-cliente-oculto';
  document.getElementById('statusCliente').className = 'status-cliente status-cliente-oculto';
  document.getElementById('listaProdutos').innerHTML = '<li class="sem-registros">Selecione um cliente para ver as compras</li>';
  document.getElementById('totalCompra').innerHTML = 'Total: <span class="total-valor">R$ 0,00</span>';
  document.getElementById('comentariosCliente').style.display = 'none';
  const tituloH3 = document.getElementById('tituloComprasRegistradas');
  if (tituloH3) {
    tituloH3.textContent = 'Compras Registradas';
  }
}

// Função para selecionar um cliente
export function selecionarClientePorId(clienteId, clienteNome) {
  idClienteSelecionado = clienteId;
  nomeClienteSelecionado = clienteNome;
  listarProdutos(clienteId);
  document.getElementById('acoesCliente').className = 'acoes-cliente acoes-cliente-visivel';
  document.getElementById('statusCliente').className = 'status-cliente status-cliente-visivel';
  document.getElementById('nomeClienteSelecionado').textContent = clienteNome;
  document.getElementById('comentariosCliente').style.display = 'block';
  carregarComentarios(clienteId);
  listarClientes();
}

// Inicializa os eventos dos comentários quando o módulo é carregado
inicializarEventosComentarios();

export { idClienteSelecionado, nomeClienteSelecionado };