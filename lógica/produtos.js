'use strict';

import { db } from './dataset.js';
import { mostrarNotificacao, mostrarConfirmacao, MENSAGENS, setButtonLoading } from './interface.js';
import { idClienteSelecionado, nomeClienteSelecionado } from './clientes.js';
import { configurarModalAcessibilidade } from './acessibilidade.js';

function validarPrecoProduto(precoProduto) {
    if (typeof precoProduto !== 'string') {
        throw new Error('Formato de preço inválido');
    }
    
    const precoValidado = parseFloat(precoProduto.replace(',', '.'));
    if (isNaN(precoValidado) || !/^\d+([.,]\d{1,2})?$/.test(precoProduto)) {
        throw new Error('Formato inválido (use: 12 ou 12,50)');
    }
    
    if (precoValidado <= 0.01) {
        throw new Error('Valor mínimo: R$ 0,01');
    }
    
    return precoValidado;
}

function obterDadosFormularioProduto() {
    const nomeProduto = document.getElementById('nomeProduto').value.trim().replace(/<[^>]*>/g, '');
    const precoProduto = document.getElementById('precoProduto').value;
    return { nomeProduto, precoProduto };
}

function criarNovoProduto(nomeProduto, precoValidado) {
    return {
        nome: nomeProduto,
        preco: precoValidado,
        dataCompra: new Date().toISOString()
    };
}

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
        
        const { nomeProduto, precoProduto } = obterDadosFormularioProduto();
        
        if (!nomeProduto || !precoProduto) {
            elementoErro.textContent = MENSAGENS.erroCamposObrigatorios;
            elementoErro.style.display = 'block';
            return;
        }
        
        const precoValidado = validarPrecoProduto(precoProduto);
        
        elementoErro.style.display = 'none';
        setButtonLoading(btnAdicionar, true);
        
        if (!db) {
            throw new Error('Banco de dados não inicializado');
        }
        
        const produto = criarNovoProduto(nomeProduto, precoValidado);
        
        const transacao = db.transaction(['clientes'], 'readwrite');
        const armazenamento = transacao.objectStore('clientes');
        const requisicao = armazenamento.get(idClienteSelecionado);
        
        requisicao.onsuccess = function(e) {
            const cliente = e.target.result;
            if (!cliente) {
                throw new Error('Cliente não encontrado');
            }
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
            
            requisicaoAtualizar.onerror = function() {
                throw new Error(MENSAGENS.erroGeral);
            };
        };
        
        requisicao.onerror = function() {
            throw new Error(MENSAGENS.erroGeral);
        };
    } catch (error) {
        elementoErro.textContent = error.message || MENSAGENS.erroGeral;
        elementoErro.style.display = 'block';
    } finally {
        setButtonLoading(btnAdicionar, false);
    }
}

function encontrarIndiceOriginalProduto(cliente, index) {
    if (!cliente.produtos || cliente.produtos.length === 0) {
        mostrarNotificacao('Nenhum produto para remover', 'alerta');
        return -1;
    }
    
    const produtosOrdenados = [...cliente.produtos].sort((a, b) => new Date(b.dataCompra) - new Date(a.dataCompra));
    if (index < 0 || index >= produtosOrdenados.length) {
        mostrarNotificacao('Índice de produto inválido', 'erro');
        return -1;
    }
    
    const produtoSelecionado = produtosOrdenados[index];
    const indiceOriginal = cliente.produtos.findIndex(produto =>
        produto.nome === produtoSelecionado.nome &&
        produto.preco === produtoSelecionado.preco &&
        produto.dataCompra === produtoSelecionado.dataCompra
    );
    
    if (indiceOriginal === -1) {
        mostrarNotificacao('Produto não encontrado na lista original', 'erro');
    }
    
    return indiceOriginal;
}

function removerProdutoDoCliente(indiceOriginal) {
    const transacao = db.transaction(['clientes'], 'readwrite');
    const armazenamento = transacao.objectStore('clientes');
    const requisicao = armazenamento.get(idClienteSelecionado);
    
    requisicao.onsuccess = function(e) {
        const cliente = e.target.result;
        if (!cliente) {
            mostrarNotificacao('Cliente não encontrado', 'erro');
            return;
        }
        if (cliente.produtos && cliente.produtos.length > indiceOriginal) {
            cliente.produtos.splice(indiceOriginal, 1);
            
            const requisicaoAtualizar = armazenamento.put(cliente);
            
            requisicaoAtualizar.onsuccess = function() {
                listarProdutos(idClienteSelecionado);
                mostrarNotificacao(MENSAGENS.produtoRemovido, 'sucesso');
            };
            
            requisicaoAtualizar.onerror = function() {
                mostrarNotificacao('Erro ao remover produto', 'erro');
            };
        } else {
            mostrarNotificacao('Produto não encontrado', 'erro');
        }
    };
    
    requisicao.onerror = function() {
        mostrarNotificacao('Erro ao recuperar cliente para remover produto', 'erro');
    };
}

export function removerProduto(index) {
    if (!idClienteSelecionado) {
        mostrarNotificacao('Nenhum cliente selecionado', 'alerta');
        return;
    }
    
    if (!db) {
        mostrarNotificacao('Banco de dados não inicializado', 'erro');
        return;
    }
    
    const transacao = db.transaction(['clientes'], 'readonly');
    const armazenamento = transacao.objectStore('clientes');
    const requisicao = armazenamento.get(idClienteSelecionado);
    
    requisicao.onsuccess = function(e) {
        const cliente = e.target.result;
        if (!cliente) {
            mostrarNotificacao('Cliente não encontrado', 'erro');
            return;
        }
        
        const indiceOriginal = encontrarIndiceOriginalProduto(cliente, index);
        if (indiceOriginal === -1) return;
        
        mostrarConfirmacao(
            'Remover Produto',
            'Deseja realmente remover este produto da lista de compras?',
            'question',
            () => removerProdutoDoCliente(indiceOriginal)
        );
    };
    
    requisicao.onerror = function() {
        mostrarNotificacao('Erro ao recuperar cliente para remover produto', 'erro');
    };
}

function criarElementoProduto(produto, index) {
    const item = document.createElement('li');
    item.className = 'item-produto';
    
    item.innerHTML = `
        <div class="produto-info">
            <div class="produto-nome">${produto.nome}</div>
            <div class="produto-detalhes">${new Date(produto.dataCompra).toLocaleDateString('pt-BR')}</div>
        </div>
        <div class="produto-valor">
         ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco)}
        </div>
        <div class="acoes-produto">
            <button class="btn-acao btn-perigo" title="Remover produto">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    
    const btnRemover = item.querySelector('.btn-acao.btn-perigo');
    btnRemover.addEventListener('click', () => removerProduto(index));
    
    return item;
}

function calcularTotaisProdutos(produtos, valorPagoCliente) {
    let total = 0;
    let totalPago = valorPagoCliente || 0;
    
    produtos.forEach((produto) => {
        const preco = Number(produto.preco);
        if (!isNaN(preco) && preco > 0) {
            total += preco;
        }
    });
    
    const totalPendente = total - totalPago;
    return { total, totalPago, totalPendente };
}

function formatarTextoTotal(totalPago, totalPendente) {
    const totalPendenteTexto = totalPendente > 0 ?
        `Pendente: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPendente)}` : '';
    const totalPagoTexto = totalPago > 0 ?
        `Pago: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPago)}` : '';
    
    return { totalPagoTexto, totalPendenteTexto };
}

export function listarProdutos(idCliente) {
    if (!db) {
        console.error('Banco de dados não inicializado');
        return;
    }
    
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
        
        const { total, totalPago, totalPendente } = calcularTotaisProdutos(cliente.produtos, cliente.valorPago);
        const { totalPagoTexto, totalPendenteTexto } = formatarTextoTotal(totalPago, totalPendente);
        
        cliente.produtos.forEach((produto, index) => {
            const item = criarElementoProduto(produto, index);
            lista.appendChild(item);
        });
        
        document.getElementById('totalCompra').innerHTML = `
            <div>Total: <span class="total-valor">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span></div>
            ${totalPagoTexto ? `<div style="font-size: 0.9rem; color: var(--sucesso);">${totalPagoTexto}</div>` : ''}
            ${totalPendenteTexto ? `<div style="font-size: 0.9rem; color: var(--alerta);">${totalPendenteTexto}</div>` : ''}
        `;
    };
    
    requisicao.onerror = function(e) {
        console.error(`Erro ao recuperar produtos do cliente ID ${idCliente}:`, e.target.error);
    };
}

function criarModalPagamentoParcial(valorPendente) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay-modal-escuro';
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
            <p style="color: #adb5bd;">Cliente em questão: ${nomeClienteSelecionado}</p>
            <p style="color: #adb5bd;">
                Valor pendente: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorPendente)}
            </p>
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
    try { modal.showModal(); } catch (_) {}
    
    return overlay;
}

function configurarEventosModalPagamento(overlay, valorPendente, resetButton) {
  const modal = overlay.querySelector('.modal-escuro');

  const inputValor = overlay.querySelector('#valorPagamento');
  const btnCancelar = overlay.querySelector('#cancelarPagamento');
  const btnConfirmar = overlay.querySelector('#confirmarPagamento');
  const erroPagamento = overlay.querySelector('#erroPagamento');

  setTimeout(() => {
      inputValor.focus();
      inputValor.select();
  }, 100);

  const limparErro = () => { erroPagamento.style.display = 'none'; };
  const mostrarErro = (mensagem) => {
      erroPagamento.textContent = mensagem;
      erroPagamento.style.display = 'block';
  };

  const processarPagamento = () => {
      const originalText = btnConfirmar.innerHTML;
      btnConfirmar.classList.add('loading');
      btnConfirmar.innerHTML = `<span style="visibility: hidden;">${originalText}</span>`;

      const valor = parseFloat(inputValor.value.replace(',', '.'));

      if (!valor || valor <= 0) {
          mostrarErro('Digite um valor válido');
          btnConfirmar.classList.remove('loading');
          btnConfirmar.innerHTML = originalText;
          return;
      }

      if (valor > valorPendente) {
          mostrarErro(`Valor não pode ser maior que ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorPendente)}`);
          btnConfirmar.classList.remove('loading');
          btnConfirmar.innerHTML = originalText;
          return;
      }

      const transacaoRW = db.transaction(['clientes'], 'readwrite');
      const armazenamentoRW = transacaoRW.objectStore('clientes');
      const reqAtualizar = armazenamentoRW.get(idClienteSelecionado);

      reqAtualizar.onsuccess = function(e) {
          const clienteAtual = e.target.result;

          if (!clienteAtual) {
              mostrarNotificacao('Cliente não encontrado', 'erro');
              resetButton();
              return;
          }

          if (valor >= valorPendente) {
              clienteAtual.produtos = [];
              clienteAtual.valorPago = 0;
              clienteAtual.pagamentos = [];
          } else {
              clienteAtual.valorPago = (clienteAtual.valorPago || 0) + valor;
              clienteAtual.pagamentos = clienteAtual.pagamentos || [];
              clienteAtual.pagamentos.push({ valor: valor, data: new Date().toISOString() });
          }

          const requisicaoAtualizar = armazenamentoRW.put(clienteAtual);

          requisicaoAtualizar.onsuccess = function() {
              overlay.remove();
              listarProdutos(idClienteSelecionado);
              mostrarNotificacao(valor >= valorPendente ?
                  `Dívida liquidada com sucesso! Valor pago: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)}` :
                  `Pagamento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)} registrado com sucesso!`, 'sucesso');
              resetButton();
          };

          requisicaoAtualizar.onerror = function() {
              mostrarNotificacao('Erro ao registrar pagamento', 'erro');
              resetButton();
          };
      };

      reqAtualizar.onerror = function() {
          mostrarNotificacao('Erro ao atualizar cliente', 'erro');
          resetButton();
      };
  };

  inputValor.addEventListener('input', limparErro);
  inputValor.addEventListener('keypress', (e) => { if (e.key === 'Enter') processarPagamento(); });
  btnConfirmar.addEventListener('click', processarPagamento);
  btnCancelar.addEventListener('click', () => { overlay.remove(); resetButton(); });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); resetButton(); } });

  configurarModalAcessibilidade(overlay, modal);
}

export function registrarPagamentoParcial() {
    if (!idClienteSelecionado) return;
    
    const btnPagamentoParcial = document.getElementById('btnPagamentoParcial');
    if (!btnPagamentoParcial) {
        mostrarNotificacao('Botão de pagamento parcial não encontrado', 'erro');
        return;
    }
    
    const originalText = btnPagamentoParcial.innerHTML;
    
    const setLoading = () => {
        btnPagamentoParcial.classList.add('loading');
        btnPagamentoParcial.innerHTML = `<span style="visibility: hidden;">${originalText}</span>`;
    };
    
    const resetButton = () => {
        btnPagamentoParcial.classList.remove('loading');
        btnPagamentoParcial.innerHTML = originalText;
    };
    
    setLoading();
    
    if (!db) {
        mostrarNotificacao('Banco de dados não inicializado', 'erro');
        resetButton();
        return;
    }
    
    const transacao = db.transaction(['clientes'], 'readonly');
    const armazenamento = transacao.objectStore('clientes');
    const requisicao = armazenamento.get(idClienteSelecionado);
    
    requisicao.onsuccess = function(e) {
        const cliente = e.target.result;
        
        if (!cliente) {
            mostrarNotificacao('Cliente não encontrado', 'erro');
            resetButton();
            return;
        }
        
        if (!cliente.produtos || cliente.produtos.length === 0) {
            mostrarNotificacao('Este cliente não possui dívidas', 'alerta');
            resetButton();
            return;
        }
        
        const totalDivida = cliente.produtos.reduce((sum, produto) => {
            const preco = Number(produto.preco);
            return isNaN(preco) || preco <= 0 ? sum : sum + preco;
        }, 0);
        
        const valorPago = cliente.valorPago || 0;
        const valorPendente = totalDivida - valorPago;
        
        if (valorPendente <= 0) {
            mostrarNotificacao('Este cliente não possui dívidas pendentes', 'alerta');
            resetButton();
            return;
        }
        
        const overlay = criarModalPagamentoParcial(valorPendente);
        configurarEventosModalPagamento(overlay, valorPendente, resetButton);
    };
    
    requisicao.onerror = function() {
        mostrarNotificacao('Erro ao verificar dívidas do cliente', 'erro');
        resetButton();
    };
}

function executarLiquidacaoDivida(quantidadeDividas) {
    const transacao = db.transaction(['clientes'], 'readwrite');
    const armazenamento = transacao.objectStore('clientes');
    const requisicao = armazenamento.get(idClienteSelecionado);
    
    requisicao.onsuccess = function(e) {
        const cliente = e.target.result;
        if (!cliente) {
            mostrarNotificacao('Cliente não encontrado', 'erro');
            return;
        }
        cliente.produtos = [];
        cliente.valorPago = 0;
        cliente.pagamentos = [];
        
        const requisicaoAtualizar = armazenamento.put(cliente);
        
        requisicaoAtualizar.onsuccess = function() {
            listarProdutos(idClienteSelecionado);
            mostrarNotificacao(MENSAGENS.divididaLiquidada(quantidadeDividas), 'sucesso');
        };
        
        requisicaoAtualizar.onerror = function() {
            mostrarNotificacao(MENSAGENS.erroGeral, 'erro');
        };
    };
}

export function liquidarDivida() {
    if (!idClienteSelecionado) {
        mostrarNotificacao('Nenhum cliente selecionado', 'alerta');
        return;
    }
    
    if (!db) {
        mostrarNotificacao('Banco de dados não inicializado', 'erro');
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
        if (!cliente) {
            mostrarNotificacao('Cliente não encontrado', 'erro');
            resetButton();
            return;
        }
        
        const temDivida = cliente.produtos && cliente.produtos.length > 0;
        
        if (!temDivida) {
            mostrarNotificacao('Este cliente não possui dívidas para liquidar', 'alerta');
            resetButton();
            return;
        }
        
        const quantidadeDividas = cliente.produtos.length;
        
        mostrarConfirmacao(
            'Liquidar Dívida',
            `Tem certeza que deseja liquidar ${quantidadeDividas === 1 ? 'a dívida' : `TODOS os ${quantidadeDividas} débitos`} de ${nomeClienteSelecionado}? Esta ação não pode ser desfeita.`,
            'warning',
            () => {
                executarLiquidacaoDivida(quantidadeDividas);
                resetButton();
            },
            () => {
                resetButton();
            }
        );
    };
    
    requisicao.onerror = function() {
        mostrarNotificacao('Erro ao verificar dívidas do cliente', 'erro');
        resetButton();
    };
}