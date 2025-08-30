import { listarClientes } from './clientes.js';
import { mostrarNotificacao, mostrarConfirmacao, MENSAGENS } from './interface.js';

let db;

export function abrirBancoDados() {
  const requisicao = indexedDB.open('mercadinhoDB', 5);
  
  requisicao.onupgradeneeded = function(e) {
    const db = e.target.result;
    if (!db.objectStoreNames.contains('clientes')) {
      const armazenamento = db.createObjectStore('clientes', { keyPath: 'id', autoIncrement: true });
      armazenamento.createIndex('porNome', 'nome', { unique: false });
    }
  };
  
  requisicao.onsuccess = function(e) {
    db = e.target.result;
    listarClientes();
  };
  
  requisicao.onerror = function(e) {
    mostrarNotificacao('Erro ao conectar com o banco de dados', 'erro');
  };
}

function validarEstruturaDados(dados) {
  if (!Array.isArray(dados)) {
    throw new Error('Formato inválido: dados devem ser um array');
  }
  
  for (let i = 0; i < dados.length; i++) {
    const cliente = dados[i];
    
    if (typeof cliente !== 'object' || cliente === null) {
      throw new Error(`Cliente ${i + 1}: deve ser um objeto válido`);
    }
    
    if (!cliente.nome || typeof cliente.nome !== 'string' || cliente.nome.trim() === '') {
      throw new Error(`Cliente ${i + 1}: nome é obrigatório e deve ser uma string válida`);
    }
    
    if (cliente.produtos !== undefined && !Array.isArray(cliente.produtos)) {
      throw new Error(`Cliente ${i + 1}: produtos deve ser um array`);
    }
    
    if (cliente.produtos && cliente.produtos.length > 0) {
      for (let j = 0; j < cliente.produtos.length; j++) {
        const produto = cliente.produtos[j];
        
        if (typeof produto !== 'object' || produto === null) {
          throw new Error(`Cliente ${i + 1}, Produto ${j + 1}: deve ser um objeto válido`);
        }
        
        if (!produto.nome || typeof produto.nome !== 'string' || produto.nome.trim() === '') {
          throw new Error(`Cliente ${i + 1}, Produto ${j + 1}: nome é obrigatório`);
        }
        
        if (typeof produto.preco !== 'number' || produto.preco <= 0) {
          throw new Error(`Cliente ${i + 1}, Produto ${j + 1}: preço deve ser um número positivo`);
        }
        
        if (cliente.valorPago !== undefined && (typeof cliente.valorPago !== 'number' || cliente.valorPago < 0)) {
          throw new Error(`Cliente ${i + 1}: valorPago deve ser um número não negativo`);
        }
        
        if (cliente.pagamentos !== undefined && !Array.isArray(cliente.pagamentos)) {
          throw new Error(`Cliente ${i + 1}: pagamentos deve ser um array`);
        }
      }
    }
  }
  
  return true;
}

export function importarDados() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.style.display = 'none';
  
  input.addEventListener('change', (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    
    const leitor = new FileReader();
    leitor.onload = function(e) {
      try {
        const dados = JSON.parse(e.target.result);
        
        validarEstruturaDados(dados);
        
        mostrarConfirmacao(
          'Importar Dados',
          `Encontrados ${dados.length} clientes para importar.\n\nATENÇÃO: Esta operação irá substituir todos os dados atuais!\n\nDeseja continuar?`,
          'warning',
          () => {
            const transacao = db.transaction(['clientes'], 'readwrite');
            const armazenamento = transacao.objectStore('clientes');
            
            const requisicaoLimpar = armazenamento.clear();
            
            requisicaoLimpar.onsuccess = () => {
              let importados = 0;
              let erros = 0;
              
              dados.forEach((cliente, index) => {
                const clienteLimpo = { ...cliente };
                delete clienteLimpo.id;
                
                const requisicao = armazenamento.add(clienteLimpo);
                
                requisicao.onsuccess = () => {
                  importados++;
                  if (importados + erros === dados.length) {
                    listarClientes();
                    mostrarNotificacao(
                      `Importação concluída: ${importados} clientes importados${erros > 0 ? `, ${erros} erros` : ''}`,
                      erros > 0 ? 'alerta' : 'sucesso'
                    );
                  }
                };
                
                requisicao.onerror = () => {
                  erros++;
                  if (importados + erros === dados.length) {
                    listarClientes();
                    mostrarNotificacao(
                      `Importação concluída: ${importados} clientes importados${erros > 0 ? `, ${erros} erros` : ''}`,
                      erros > 0 ? 'alerta' : 'sucesso'
                    );
                  }
                };
              });
            };
            
            requisicaoLimpar.onerror = () => {
              mostrarNotificacao('Erro ao limpar dados existentes', 'erro');
            };
          }
        );
        
      } catch (error) {
        if (error.name === 'SyntaxError') {
          mostrarNotificacao('Arquivo JSON inválido', 'erro');
        } else {
          mostrarNotificacao(`Erro na validação: ${error.message}`, 'erro');
        }
      }
    };
    
    leitor.onerror = () => {
      mostrarNotificacao('Erro ao ler arquivo', 'erro');
    };
    
    leitor.readAsText(arquivo);
  });
  
  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

export function exportarDados() {
  const btnBackup = document.getElementById('btnBackup');
  btnBackup.classList.add('loading');
  
  const transacao = db.transaction(['clientes'], 'readonly');
  const armazenamento = transacao.objectStore('clientes');
  const contador = armazenamento.count();
  
  contador.onsuccess = (e) => {
    if (e.target.result === 0) {
      mostrarNotificacao('Nenhum dado para exportar', 'alerta');
      btnBackup.classList.remove('loading');
      return;
    }
    
    const requisicao = armazenamento.getAll();
    
    requisicao.onsuccess = (e) => {
      const dados = JSON.stringify(e.target.result, null, 2);
      const blob = new Blob([dados], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-fiados-${new Date().toLocaleDateString('pt-BR')}.json`;
      a.click();
      mostrarNotificacao(MENSAGENS.backupExportado, 'sucesso');
      btnBackup.classList.remove('loading');
    };
    
    requisicao.onerror = (e) => {
      mostrarNotificacao(MENSAGENS.erroGeral, 'erro');
      btnBackup.classList.remove('loading');
    };
  };
}

export { db };