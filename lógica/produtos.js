import { db } from './dataset.js';
import { mostrarNotificacao, mostrarConfirmacao, MENSAGENS, setButtonLoading } from './interface.js';
import { idClienteSelecionado, nomeClienteSelecionado } from './clientes.js';

export function adicionarProduto() {
  const elementoErro = document.getElementById('erroProduto');
  const btnAdicionar = document.getElementById('btnAdicionarProduto');
if (!btnAdicionar) {
  console.error('Botão não encontrado!');
  return;
}
  
  try {
    if (!idClienteSelecionado) {
      elementoErro.textContent = MENSAGENS.erroClienteNaoSelecionado;
      elementoErro.style.display = 'block';
      return;
    }
    
    const nomeProduto = document.getElementById('nomeProduto').value.trim().replace(/<[^>]*>/g, '');
    const precoProduto = document.getElementById('precoProduto').value;
    
    if (!nomeProduto || !precoProduto) {
      elementoErro.textContent = MENSAGENS.erroCamposObrigatorios;
      elementoErro.style.display = 'block';
      return;
    }
    
    const precoValidado = parseFloat(precoProduto.replace(',', '.'));
    if (isNaN(precoValidado) || !/^\d+([.,]\d{1,2})?$/.test(precoProduto)) {
      elementoErro.textContent = 'Formato inválido (use: 12 ou 12,50)';
      elementoErro.style.display = 'block';
      return;
    }
    
    if (precoValidado <= 0.01) {
      elementoErro.textContent = 'Valor mínimo: R$ 0,01';
      elementoErro.style.display = 'block';
      return;
    }
    
    elementoErro.style.display = 'none';
    setButtonLoading(btnAdicionar, true);
    
    const produto = {
      nome: nomeProduto,
      preco: precoValidado,
      dataCompra: new Date().toISOString()
    };
    
    const transacao = db.transaction(['clientes'], 'readwrite');
    const armazenamento = transacao.objectStore('clientes');
    const requisicao = armazenamento.get(idClienteSelecionado);
    
    requisicao.onsuccess = function(e) {
      const cliente = e.target.result;
      if (!cliente.produtos) {
        cliente.produtos = [];
      }
      cliente.produtos.push(produto);
      
      const requisicaoAtualizar = armazenamento.put(cliente);
      
      requisicaoAtualizar.onsuccess = function() {
        document.getElementById('nomeProduto').value = '';
        document.getElementById('precoProduto').value = '';
        listarProdutos(idClienteSelecionado);
        mostrarNotificacao(MENSAGENS.produtoAdicionado, 'sucesso');
      };
      
      requisicaoAtualizar.onerror = function(e) {
        throw new Error(MENSAGENS.erroGeral);
      };
    };
    
    requisicao.onerror = function(e) {
      throw new Error(MENSAGENS.erroGeral);
    };
  } catch (error) {
    elementoErro.textContent = error.message || MENSAGENS.erroGeral;
    elementoErro.style.display = 'block';
  } finally {
    setButtonLoading(btnAdicionar, false);
  }
}

export function listarProdutos(idCliente) {
  const transacao = db.transaction(['clientes'], 'readonly');
  const armazenamento = transacao.objectStore('clientes');
  const requisicao = armazenamento.get(idCliente);
  
  requisicao.onsuccess = function(e) {
    const cliente = e.target.result;
    const lista = document.getElementById('listaProdutos');
    lista.innerHTML = '';
    
    if (!cliente || !cliente.produtos || cliente.produtos.length === 0) {
      lista.innerHTML = '<li class="sem-registros">Nenhuma compra registrada</li>';
      document.getElementById('totalCompra').innerHTML = 'Total: <span class="total-valor">R$ 0,00</span>';
      return;
    }
    
    cliente.produtos.sort((a, b) => new Date(b.dataCompra) - new Date(a.dataCompra));
    
    let total = 0;
    let totalPago = cliente.valorPago || 0;
    let totalPendente = 0;
    
    cliente.produtos.forEach((produto, index) => {
      total += Number(produto.preco);
      
      const item = document.createElement('li');
      item.className = 'item-produto';
      
      item.innerHTML = `
        <div class="produto-info">
          <div class="produto-nome">${produto.nome}</div>
          <div class="produto-detalhes">${new Date(produto.dataCompra).toLocaleDateString('pt-BR')}</div>
        </div>
        <div class="produto-valor">
          R$ ${Number(produto.preco).toFixed(2)}
        </div>
        <div class="acoes-produto">
          <button class="btn-acao btn-perigo" onclick="removerProduto(${index})" title="Remover produto">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `;
      lista.appendChild(item);
    });
    
    totalPendente = total - totalPago;
    
    const totalPendenteTexto = totalPendente > 0 ? `Pendente: R$ ${totalPendente.toFixed(2)}` : '';
    const totalPagoTexto = totalPago > 0 ? `Pago: R$ ${totalPago.toFixed(2)}` : '';
    
    document.getElementById('totalCompra').innerHTML = `
      <div>Total: <span class="total-valor">R$ ${total.toFixed(2)}</span></div>
      ${totalPagoTexto ? `<div style="font-size: 0.9rem; color: var(--sucesso);">${totalPagoTexto}</div>` : ''}
      ${totalPendenteTexto ? `<div style="font-size: 0.9rem; color: var(--alerta);">${totalPendenteTexto}</div>` : ''}
    `;
  };
  
  requisicao.onerror = function(e) {
    console.error(`Erro ao recuperar produtos do cliente ID ${idCliente}:`, e.target.error);
  };
}

export function removerProduto(index) {
  if (!idClienteSelecionado) return;
  
  mostrarConfirmacao(
    'Remover Produto',
    'Deseja realmente remover este produto da lista de compras?',
    'question',
    () => {
      const transacao = db.transaction(['clientes'], 'readwrite');
      const armazenamento = transacao.objectStore('clientes');
      const requisicao = armazenamento.get(idClienteSelecionado);
      
      requisicao.onsuccess = function(e) {
        const cliente = e.target.result;
        if (cliente.produtos && cliente.produtos.length > index) {
          cliente.produtos.splice(index, 1);
          
          const requisicaoAtualizar = armazenamento.put(cliente);
          
          requisicaoAtualizar.onsuccess = function() {
            listarProdutos(idClienteSelecionado);
            mostrarNotificacao(MENSAGENS.produtoRemovido, 'sucesso');
          };
          
          requisicaoAtualizar.onerror = function(e) {
            mostrarNotificacao(MENSAGENS.erroGeral, 'erro');
          };
        }
      };
      
      requisicao.onerror = function(e) {
        console.error('Erro ao recuperar cliente para remover produto:', e.target.error);
      };
    }
  );
}

export function registrarPagamentoParcial() {
  if (!idClienteSelecionado) return;
  
  const transacao = db.transaction(['clientes'], 'readonly');
  const armazenamento = transacao.objectStore('clientes');
  const requisicao = armazenamento.get(idClienteSelecionado);
  
  requisicao.onsuccess = function(e) {
    const cliente = e.target.result;
    
    if (!cliente.produtos || cliente.produtos.length === 0) {
      mostrarNotificacao('Este cliente não possui dívidas', 'alerta');
      return;
    }
    
    const totalDivida = cliente.produtos.reduce((sum, produto) => sum + Number(produto.preco), 0);
    const valorPago = cliente.valorPago || 0;
    const valorPendente = totalDivida - valorPago;
    
    if (valorPendente <= 0) {
      mostrarNotificacao('Este cliente não possui dívidas pendentes', 'alerta');
      return;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay-escuro';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Pagamento Parcial');
    
    const modal = document.createElement('div');
    modal.className = 'modal-escuro';
    modal.tabIndex = -1;
    
    modal.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <i class="fas fa-money-bill-wave modal-icone" style="color: var(--alerta);"></i>
        <h3 class="modal-titulo">Pagamento Parcial</h3>
        <p style="color: #adb5bd;">Cliente: ${nomeClienteSelecionado}</p>
        <p style="color: #adb5bd;">Valor pendente: R$ ${valorPendente.toFixed(2)}</p>
      </div>
      <div style="margin-bottom: 1.5rem;">
        <label for="valorPagamento" class="rotulo">Valor do Pagamento (R$)</label>
        <input type="number" id="valorPagamento" class="modal-input" 
               placeholder="0,00" step="0.01" min="0.01" max="${valorPendente}"
               aria-label="Valor do pagamento">
        <div id="erroPagamento" class="modal-erro" style="display: none;"></div>
      </div>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button id="cancelarPagamento" class="modal-botao alerta">Cancelar</button>
        <button id="confirmarPagamento" class="modal-botao">Confirmar</button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    const inputValor = overlay.querySelector('#valorPagamento');
    const btnCancelar = overlay.querySelector('#cancelarPagamento');
    const btnConfirmar = overlay.querySelector('#confirmarPagamento');
    const erroPagamento = overlay.querySelector('#erroPagamento');
    
    setTimeout(() => { 
      inputValor.focus();
      inputValor.select();
    }, 100);
    
    const limparErro = () => {
      erroPagamento.style.display = 'none';
    };
    
    const mostrarErro = (mensagem) => {
      erroPagamento.textContent = mensagem;
      erroPagamento.style.display = 'block';
    };
    
    const processarPagamento = () => {
      const valor = parseFloat(inputValor.value.replace(',', '.'));
      
      if (!valor || valor <= 0) {
        mostrarErro('Digite um valor válido');
        return;
      }
      
      if (valor > valorPendente) {
        mostrarErro(`Valor não pode ser maior que R$ ${valorPendente.toFixed(2)}`);
        return;
      }
      
      const transacao = db.transaction(['clientes'], 'readwrite');
      const armazenamento = transacao.objectStore('clientes');
      const requisicao = armazenamento.get(idClienteSelecionado);
      
      requisicao.onsuccess = function(e) {
        const cliente = e.target.result;
        
        cliente.valorPago = (cliente.valorPago || 0) + valor;
        cliente.pagamentos = cliente.pagamentos || [];
        cliente.pagamentos.push({
          valor: valor,
          data: new Date().toISOString()
        });
        
        const requisicaoAtualizar = armazenamento.put(cliente);
        
        requisicaoAtualizar.onsuccess = function() {
          overlay.remove();
          listarProdutos(idClienteSelecionado);
          mostrarNotificacao(`Pagamento de R$ ${valor.toFixed(2)} registrado com sucesso!`, 'sucesso');
        };
        
        requisicaoAtualizar.onerror = function() {
          mostrarNotificacao('Erro ao registrar pagamento', 'erro');
        };
      };
    };
    
    inputValor.addEventListener('input', limparErro);
    inputValor.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') processarPagamento();
    });
    
    btnConfirmar.addEventListener('click', processarPagamento);
    btnCancelar.addEventListener('click', () => overlay.remove());
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') overlay.remove();
    });
  };
}

export function liquidarDivida() {
  if (!idClienteSelecionado) {
    mostrarNotificacao('Nenhum cliente selecionado', 'alerta');
    return;
  }
  
  const btnLiquidar = document.getElementById('btnLiquidar');
  const originalText = btnLiquidar.innerHTML;
  
  const setLoading = () => {
    btnLiquidar.classList.add('loading');
    btnLiquidar.innerHTML = `<span style="visibility: hidden;">${originalText}</span>`;
  };
  
  const resetButton = () => {
    btnLiquidar.classList.remove('loading');
    btnLiquidar.innerHTML = originalText;
  };
  
  setLoading();
  
  const transacao = db.transaction(['clientes'], 'readonly');
  const armazenamento = transacao.objectStore('clientes');
  const requisicao = armazenamento.get(idClienteSelecionado);
  
  requisicao.onsuccess = function(e) {
    const cliente = e.target.result;
    const temDivida = cliente.produtos && cliente.produtos.length > 0;
    
    if (!temDivida) {
      mostrarNotificacao('Este cliente não possui dívidas para liquidar', 'alerta');
      resetButton();
      return;
    }
    
    const quantidadeDividas = cliente.produtos.length;
    mostrarConfirmacao(
      'Liquidar Dívida',
      `Tem certeza que deseja liquidar ${quantidadeDividas === 1 ? 'a dívida' : `TODOS os ${quantidadeDividas} débitos`} de ${nomeClienteSelecionado}?\nEsta ação não pode ser desfeita.`,
      'warning',
      () => {
        setLoading();
        
        const transacao = db.transaction(['clientes'], 'readwrite');
        const armazenamento = transacao.objectStore('clientes');
        const requisicao = armazenamento.get(idClienteSelecionado);
        
        requisicao.onsuccess = function(e) {
          const cliente = e.target.result;
          cliente.produtos = [];
          cliente.valorPago = 0;
          cliente.pagamentos = [];
          
          const requisicaoAtualizar = armazenamento.put(cliente);
          
          requisicaoAtualizar.onsuccess = function() {
            listarProdutos(idClienteSelecionado);
            mostrarNotificacao(MENSAGENS.divididaLiquidada(quantidadeDividas), 'sucesso');
            resetButton();
          };
          
          requisicaoAtualizar.onerror = function(e) {
            mostrarNotificacao(MENSAGENS.erroGeral, 'erro');
            resetButton();
          };
        };
      },
      () => {
        resetButton();
      }
    );
  };
  
  requisicao.onerror = function(e) {
    mostrarNotificacao('Erro ao verificar dívidas do cliente', 'erro');
    resetButton();
  };
}

window.registrarPagamentoParcial = registrarPagamentoParcial;