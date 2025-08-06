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
    cliente.produtos.forEach((produto, index) => {
      total += Number(produto.preco);
      const item = document.createElement('li');
      item.className = 'item-produto';
      item.innerHTML = `
        <div>${produto.nome}</div>
        <div>R$ ${Number(produto.preco).toFixed(2)}</div>
        <div class="acoes-produto">
          <button class="btn-acao btn-perigo" onclick="removerProduto(${index})">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `;
      lista.appendChild(item);
    });
    
    document.getElementById('totalCompra').innerHTML = `Total: <span class="total-valor">R$ ${total.toFixed(2)}</span>`;
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
          
          const requisicaoAtualizar = armazenamento.put(cliente);
          
          requisicaoAtualizar.onsuccess = function() {
            listarProdutos(idClienteSelecionado);
            const quantidadeDividas = cliente.produtos.length;
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