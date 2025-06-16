import { listarClientes } from './clientes.js';
import { mostrarNotificacao, MENSAGENS } from './interface.js';

let db;

export function abrirBancoDados() {
  const requisicao = indexedDB.open('mercadinhoDB', 4);
  
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