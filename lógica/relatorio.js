/**
 * relatorio.js
 * Gera relatórios e estatísticas do sistema
 * Calcula totais, médias e rankings de clientes
 * Apresenta dados em modal interativo e responsivo
 */

import { db } from './dataset.js';
import { mostrarNotificacao } from './interface.js';

// Calcula métricas principais e top 5 clientes com mais dívidas
// Retorna Promise com objeto contendo todas as estatísticas
export function calcularEstatisticas() {
  return new Promise((resolve) => {
    const transacao = db.transaction(['clientes'], 'readonly');
    const armazenamento = transacao.objectStore('clientes');
    const requisicao = armazenamento.getAll();
    
    requisicao.onsuccess = function(e) {
      const clientes = e.target.result;
      
      let totalDividas = 0;
      let totalClientes = clientes.length;
      let clientesComDivida = 0;
      let totalProdutos = 0;
      
      clientes.forEach(cliente => {
        if (cliente.produtos && cliente.produtos.length > 0) {
          clientesComDivida++;
          totalProdutos += cliente.produtos.length;
          cliente.produtos.forEach(produto => {
            totalDividas += Number(produto.preco);
          });
        }
      });
      
      const clientesOrdenados = [...clientes]
        .filter(cliente => cliente.produtos && cliente.produtos.length > 0)
        .sort((a, b) => (b.produtos?.length || 0) - (a.produtos?.length || 0))
        .slice(0, 5);
      
      resolve({
        totalDividas,
        totalClientes,
        clientesComDivida,
        totalProdutos,
        topClientes: clientesOrdenados
      });
    };
    
    requisicao.onerror = function(e) {
      console.error('Erro ao calcular estatísticas:', e.target.error);
      resolve({
        totalDividas: 0,
        totalClientes: 0,
        clientesComDivida: 0,
        totalProdutos: 0,
        topClientes: []
      });
    };
  });
}

// Exibe modal com relatório detalhado e interativo
// Inclui métricas gerais e ranking dos top devedores
export function mostrarRelatorio() {
  calcularEstatisticas().then(stats => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay-escuro';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Relatório de Fiados');

    const modal = document.createElement('div');
    modal.className = 'modal-escuro';
    modal.tabIndex = -1;
    modal.style.position = 'relative';

    modal.innerHTML = `
      <div style="text-align: center; margin-bottom: 2rem;">
        <i class="fas fa-chart-bar modal-icone" style="color: var(--primaria);"></i>
        <h3 class="modal-titulo">Relatório de Fiados</h3>
        <p style="color: #adb5bd;">Resumo geral dos dados do sistema</p>
      </div>
      <div class="modal-estatisticas" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
        <div style="background: var(--clara); padding: 1rem; border-radius: var(--raio-pequeno); text-align: center;">
          <div style="font-size: 2rem; font-weight: bold; color: var(--primaria);">R$ ${stats.totalDividas.toFixed(2)}</div>
          <div style="color: #adb5bd; font-size: 0.9rem;">Total em Fiados</div>
        </div>
        <div style="background: var(--clara); padding: 1rem; border-radius: var(--raio-pequeno); text-align: center;">
          <div style="font-size: 2rem; font-weight: bold; color: var(--sucesso);">${stats.totalClientes}</div>
          <div style="color: #adb5bd; font-size: 0.9rem;">Total de Clientes</div>
        </div>
        <div style="background: var(--clara); padding: 1rem; border-radius: var(--raio-pequeno); text-align: center;">
          <div style="font-size: 2rem; font-weight: bold; color: var(--alerta);">${stats.clientesComDivida}</div>
          <div style="color: #adb5bd; font-size: 0.9rem;">Com Dívidas</div>
        </div>
        <div style="background: var(--clara); padding: 1rem; border-radius: var(--raio-pequeno); text-align: center;">
          <div style="font-size: 2rem; font-weight: bold; color: var(--erro);">${stats.totalProdutos}</div>
          <div style="color: #adb5bd; font-size: 0.9rem;">Itens Fiados</div>
        </div>
      </div>
      ${stats.topClientes.length > 0 ? `
        <div style="margin-bottom: 1rem;">
          <h4 style="color: var(--escura); margin-bottom: 1rem;">Top 5 Clientes com Mais Itens</h4>
          <div style="background: var(--clara); border-radius: var(--raio-pequeno); overflow: hidden;">
            ${stats.topClientes.map((cliente, index) => {
              const totalCliente = cliente.produtos.reduce((sum, produto) => sum + Number(produto.preco), 0);
              return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--cinza-claro); ${index === stats.topClientes.length - 1 ? '' : 'border-bottom: 1px solid var(--cinza-claro);'}">
                  <div>
                    <div style="font-weight: 600; color: var(--escura);">${index + 1}. ${cliente.nome}</div>
                    <div style="font-size: 0.85rem; color: #adb5bd;">${cliente.produtos.length} itens</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-weight: 600; color: var(--primaria);">R$ ${totalCliente.toFixed(2)}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
      <div style="text-align: center; margin-top: auto; padding-top: 1rem;">
        <button id="fecharRelatorio" class="modal-botao" aria-label="Fechar relatório">Fechar</button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    setTimeout(() => { 
      modal.focus(); 
    }, 50);
    
    const btnFechar = overlay.querySelector('#fecharRelatorio');
    
    btnFechar.addEventListener('click', () => {
      overlay.remove();
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
    
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
      }
    });
    
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
      }
    });
    
    modal.focus();
  });
} 