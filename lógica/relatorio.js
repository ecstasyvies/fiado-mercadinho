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
  const metaMensal = localStorage.getItem('metaMensal') || 0;
  const progresso = (stats.totalDividas / metaMensal) * 100;
  const progressoFormatado = Math.min(100, Math.max(0, progresso));
  const faltaParaMeta = Math.max(0, metaMensal - stats.totalDividas);
  
  return `
    <div style="text-align: center; margin-bottom: 2rem;">
      <i class="fas fa-chart-bar modal-icone" style="color: var(--marca-padrao);"></i>
      <h3 class="modal-titulo">Relatório de Fiados</h3>
      <p style="color: var(--texto-corpo);">Resumo geral dos dados do sistema</p>
    </div>
    ${gerarEstatisticasHTML(stats)}
    ${gerarMetaMensalHTML(stats.totalDividas, metaMensal, progressoFormatado, faltaParaMeta)}
    ${stats.topClientes.length > 0 ? gerarTopClientesHTML(stats.topClientes) : ''}
    <div style="text-align: center; margin-top: auto; padding-top: 1rem;">
      <button id="fecharRelatorio" class="modal-botao" aria-label="Fechar relatório">Fechar</button>
    </div>
  `;
}

function gerarEstatisticasHTML(stats) {
  const formatarValor = (valor, cor, descricao, tipo = 'numero') => {
    const valorFormatado = tipo === 'moeda'
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
      : valor;

    return `
      <div style="
        background: var(--fundo-superficie);
        padding: 1rem;
        border: 1px solid var(--borda-sutil);
        border-radius: var(--raio-borda-m);
        text-align: center;
        word-break: break-word; 
        overflow-wrap: anywhere;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        box-sizing: border-box;
      ">
        <div style="font-size: 2rem; font-weight: bold; color: ${cor}; text-shadow: 0 0 1px rgba(0,0,0,0.3);">
          ${valorFormatado}
        </div>
        <div style="color: var(--texto-corpo); font-size: 0.9rem;">
          ${descricao}
        </div>
      </div>
    `;
  };

  return `
    <div class="modal-estatisticas"
         style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem; align-items: stretch; justify-items: stretch;">
      ${formatarValor(stats.totalDividas, 'var(--texto-corpo)', 'Total em Fiados', 'moeda')}
      ${formatarValor(stats.totalClientes, 'var(--retorno-sucesso)', 'Total de Clientes', 'numero')}
      ${formatarValor(stats.clientesComDivida, 'var(--retorno-alerta)', 'Com Dívidas', 'numero')}
      ${formatarValor(stats.totalProdutos, 'var(--retorno-perigo)', 'Itens Fiados', 'numero')}
    </div>
  `;
}

function gerarTopClientesHTML(topClientes) {
  return `
    <div style="margin-bottom: 1rem;">
      <h4 style="color: var(--texto-titulo); margin-bottom: 1rem; margin-left: 0.5rem;">Principais Clientes em Dívida</h4>
      <div style="background: var(--fundo-interativo); border-radius: var(--raio-borda-m); border: 1px solid var(--borda-sutil); overflow: hidden;">
        ${topClientes.map((cliente, index) => gerarClienteHTML(cliente, index)).join('')}
      </div>
    </div>
  `;
}

function gerarClienteHTML(cliente, index) {
  return `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; ${index === 4 ? '' : 'border-bottom: 1px solid var(--borda-sutil);'}">
      <div>
        <div style="font-weight: 600; color: var(--texto-corpo);">${index + 1}. ${cliente.nome}</div>
        <div style="font-size: 0.85rem; font-weight: 300; color: var(--texto-corpo);">${cliente.produtos.length} itens</div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 600; color: var(--marca-padrao);">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cliente.dividaPendente)}</div>
      </div>
    </div>
  `;
}

function gerarMetaMensalHTML(totalDividas, metaMensal, progresso, faltaParaMeta) {
  const metaAtingida = totalDividas >= metaMensal;
  const mensagemStatus = metaAtingida 
    ? '<span class="mensagem-sucesso">Meta atingida!</span>'
    : `<span>Faltam ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faltaParaMeta)} para atingir a meta</span>`;
  
  return `
    <div class="secao-meta-mensal" style="margin-bottom: 2rem;">
      <h4 style="color: var(--texto-titulo); margin-bottom: 1rem;">Meta Mensal de Recebimento</h4>
      <div class="meta-input-container">
        <div class="meta-input-wrapper">
          <label for="inputMetaMensal" class="rotulo">Valor da Meta</label>
          <input 
            type="number" 
            id="inputMetaMensal" 
            class="modal-input"
            min="0" 
            step="0.01" 
            placeholder="0,00"
            value="${metaMensal}"
            aria-label="Valor da meta mensal em reais"
          >
        </div>
        <div class="meta-btn-wrapper">
          <button 
            id="btnSalvarMeta" 
            class="modal-botao"
            aria-label="Salvar valor da meta"
          >
            <i class="fas fa-save"></i>
          </button>
        </div>
      </div>
      
      <div class="barra-progresso-container" style="margin-bottom: 0.5rem;">
        <div 
          role="progressbar" 
          class="barra-progresso" 
          aria-valuenow="${progresso}" 
          aria-valuemin="0" 
          aria-valuemax="100" 
          style="
            width: 100%; 
            height: 20px; 
            background: var(--fundo-interativo);
            border-radius: var(--raio-borda-m);
            overflow: hidden;
          "
        >
          <div 
            style="
              width: ${progresso}%; 
              height: 100%; 
              background: ${metaAtingida ? 'var(--retorno-sucesso)' : 'var(--marca-padrao)'};
              transition: width 0.3s ease;
            "
          ></div>
        </div>
      </div>
      
      <div style="
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        color: var(--texto-corpo);
        font-size: 0.9rem;
      ">
        <div style="font-weight: 600;">
          ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDividas)}
          <span style="opacity: 0.7;">/</span>
          ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metaMensal)}
        </div>
        <div style="color: ${metaAtingida ? 'var(--retorno-sucesso)' : 'var(--texto-corpo)'}">
          ${mensagemStatus}
        </div>
      </div>
    </div>
  `;
}

function configurarEventosFecharRelatorio(overlay, fecharModal) {
  const fechar = () => {
    aoFecharModal();
    fecharModal();
  };
  
  const configurarEventosMeta = () => {
    const btnSalvarMeta = overlay.querySelector('#btnSalvarMeta');
    const inputMetaMensal = overlay.querySelector('#inputMetaMensal');
    
    if (btnSalvarMeta && inputMetaMensal) {
      btnSalvarMeta.addEventListener('click', () => {
        const valor = parseFloat(inputMetaMensal.value);
        if (!isNaN(valor) && valor >= 0) {
          localStorage.setItem('metaMensal', valor);
          calcularEstatisticas().then(stats => {
            const metaMensal = valor;
            const progresso = (stats.totalDividas / metaMensal) * 100;
            const progressoFormatado = Math.min(100, Math.max(0, progresso));
            const faltaParaMeta = Math.max(0, metaMensal - stats.totalDividas);
            
            // Atualiza apenas a seção da meta
            const secaoMeta = overlay.querySelector('.secao-meta-mensal');
            if (secaoMeta) {
              secaoMeta.outerHTML = gerarMetaMensalHTML(stats.totalDividas, metaMensal, progressoFormatado, faltaParaMeta);
              configurarEventosMeta(); // Reconfigura os eventos após atualizar o HTML
            }
          });
        }
      });
      
      // Permite salvar com Enter
      inputMetaMensal.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          btnSalvarMeta.click();
        }
      });
    }
  };
  
  configurarEventosMeta();
  overlay.querySelector('#fecharRelatorio')?.addEventListener('click', fechar);
  overlay.addEventListener('click', e => e.target === overlay && fechar());
}