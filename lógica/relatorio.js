'use strict';

import { db } from './dataset.js';
import { aoAbrirModal, aoFecharModal } from './interface.js';
import { configurarModalAcessibilidade } from './acessibilidade.js';

export function calcularEstatisticas() {
  return new Promise((resolve) => {
    if (!db) {
      console.error('Banco de dados não inicializado');
      resolve(estatisticasVazias());
      return;
    }
    
    const requisicao = criarRequisicaoClientes();
    requisicao.onsuccess = (e) => resolve(processarClientes(e.target.result));
    requisicao.onerror = (e) => {
      console.error('Erro ao calcular estatísticas:', e.target.error);
      resolve(estatisticasVazias());
    };
  });
}

function criarRequisicaoClientes() {
  const transacao = db.transaction(['clientes'], 'readonly');
  const armazenamento = transacao.objectStore('clientes');
  return armazenamento.getAll();
}

function processarClientes(clientes) {
  let totalDividas = 0;
  let totalClientes = clientes.length;
  let clientesComDivida = 0;
  let totalProdutos = 0;
  
  clientes.forEach(cliente => {
    const totalBruto = (cliente.produtos && cliente.produtos.length > 0) ? calcularTotalCliente(cliente.produtos) : 0;
    const valorPago = cliente.valorPago || 0;
    const dividaPendente = totalBruto - valorPago;
    
    cliente.dividaPendente = dividaPendente;
    
    if (dividaPendente > 0) {
      clientesComDivida++;
      totalDividas += dividaPendente;
    }
    
    if (cliente.produtos && cliente.produtos.length > 0) {
      totalProdutos += cliente.produtos.length;
    }
  });
  
  return {
    totalDividas,
    totalClientes,
    clientesComDivida,
    totalProdutos,
    topClientes: obterTopClientes(clientes)
  };
}

function calcularTotalCliente(produtos) {
  return produtos.reduce((sum, p) => {
    const preco = Number(p.preco);
    return isNaN(preco) || preco <= 0 ? sum : sum + preco;
  }, 0);
}

function obterTopClientes(clientes) {
  return [...clientes]
    .filter(c => c.dividaPendente > 0)
    .sort((a, b) => b.dividaPendente - a.dividaPendente)
    .slice(0, 5);
}

function estatisticasVazias() {
  return {
    totalDividas: 0,
    totalClientes: 0,
    clientesComDivida: 0,
    totalProdutos: 0,
    topClientes: []
  };
}

export function mostrarRelatorio() {
  calcularEstatisticas().then(stats => {
    const { overlay, modal } = criarModalRelatorio(stats);
    document.body.appendChild(overlay);
    aoAbrirModal();
    
    const fecharModal = configurarModalAcessibilidade(overlay, modal);
    configurarEventosFecharRelatorio(overlay, fecharModal);
  });
}

function criarModalRelatorio(stats) {
  const overlay = criarOverlay('Relatório de Fiados');
  const modal = criarElementoModal();
  modal.innerHTML = gerarHTMLRelatorio(stats);
  
  overlay.appendChild(modal);
  return { overlay, modal };
}

function criarOverlay(label) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay-modal-escuro';
  overlay.setAttribute('aria-label', label);
  return overlay;
}

function criarElementoModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-escuro';
  modal.tabIndex = -1;
  modal.style.position = 'relative';
  
  if (window.innerWidth >= 1024) {
    modal.style.maxWidth = '600px';
    modal.style.width = '100%';
    modal.style.boxSizing = 'border-box';
  }
  
  return modal;
}

function gerarHTMLRelatorio(stats) {
  return `
    <div style="text-align: center; margin-bottom: 2rem;">
      <i class="fas fa-chart-bar modal-icone" style="color: var(--primaria);"></i>
      <h3 class="modal-titulo">Relatório de Fiados</h3>
      <p style="color: var(--cinza-claro-azulado);">Resumo geral dos dados do sistema</p>
    </div>
    ${gerarEstatisticasHTML(stats)}
    ${stats.topClientes.length > 0 ? gerarTopClientesHTML(stats.topClientes) : ''}
    <div style="text-align: center; margin-top: auto; padding-top: 1rem;">
      <button id="fecharRelatorio" class="modal-botao" aria-label="Fechar relatório">Fechar</button>
    </div>
  `;
}

function gerarEstatisticasHTML(stats) {
  const formatarValor = (valor, cor, descricao, tipo = 'numero') => {
    const valorFormatado = tipo === 'moeda' ?
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor) :
      valor;
    return `
      <div style="background: var(--clara); padding: 1rem; border-radius: var(--raio-pequeno); text-align: center; max-width: 200px; word-break: break-word; overflow-wrap: anywhere;">
        <div style="font-size: 2rem; font-weight: bold; color: ${cor}; text-shadow: 0 0 1px rgba(0, 0, 0, 0.3);">${valorFormatado}</div>
        <div style="color: var(--cinza-claro-azulado); font-size: 0.9rem;">${descricao}</div>
      </div>
    `;
  };
  
  return `
    <div class="modal-estatisticas" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
      ${formatarValor(stats.totalDividas, 'var(--valor-monetario)', 'Total em Fiados', 'moeda')}
      ${formatarValor(stats.totalClientes, 'var(--sucesso)', 'Total de Clientes', 'numero')}
      ${formatarValor(stats.clientesComDivida, 'var(--alerta)', 'Com Dívidas', 'numero')}
      ${formatarValor(stats.totalProdutos, 'var(--erro)', 'Itens Fiados', 'numero')}
    </div>
  `;
}

function gerarTopClientesHTML(topClientes) {
  return `
    <div style="margin-bottom: 1rem;">
      <h4 style="color: #ffffff; margin-bottom: 1rem;">Principais Clientes em Dívida</h4>
      <div style="background: var(--clara); border-radius: var(--raio-pequeno); overflow: hidden;">
        ${topClientes.map((cliente, index) => gerarClienteHTML(cliente, index)).join('')}
      </div>
    </div>
  `;
}

function gerarClienteHTML(cliente, index) {
  return `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; ${index === 4 ? '' : 'border-bottom: 1px solid var(--cinza-claro);'}">
      <div>
        <div style="font-weight: 600; color: var(--escura);">${index + 1}. ${cliente.nome}</div>
        <div style="font-size: 0.85rem; color: #adb5bd;">${cliente.produtos.length} itens</div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 600; color: var(--primaria);">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cliente.dividaPendente)}</div>
      </div>
    </div>
  `;
}

function configurarEventosFecharRelatorio(overlay, fecharModal) {
  const fechar = () => {
    aoFecharModal();
    fecharModal();
  };
  
  overlay.querySelector('#fecharRelatorio')?.addEventListener('click', fechar);
  overlay.addEventListener('click', e => e.target === overlay && fechar());
}