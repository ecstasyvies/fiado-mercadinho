# 🧾 Sistema de Gestão de Fiados para Mercadinhos

> Um sistema simples, direto e funcional para gerenciar fiados em mercadinhos de bairro, feito com tecnologias web e totalmente offline.

![Licença: CC BY-NC-ND 4.0](https://img.shields.io/badge/Licença-CC%20BY--NC--ND%204.0-orange)
![Status](https://img.shields.io/badge/Status-estável-brightgreen)
![Compatibilidade](https://img.shields.io/badge/Navegadores-Modernos-blue)

---

## ✨ Funcionalidades
- Cadastro e gerenciamento de clientes
- Registro de produtos fiados com valores individuais
- Cálculo automático do total das dívidas
- Busca rápida por nome de cliente
- Exportação e importação de dados para backup
- Interface responsiva e leve, otimizada para dispositivos móveis

---

## 🛠 Tecnologias Utilizadas
- **IndexedDB**: Banco de dados local no navegador
- **JavaScript (ES6)**: Lógica principal do sistema
- **HTML5 Semântico**: Estrutura acessível e organizada
- **CSS3 Moderno**: Uso de variáveis, Flexbox e Grid
- **PWA-ready**: Estrutura compatível com instalação como aplicativo

---

## 💾 Como Usar

1. Baixe ou clone o repositório
2. Abra o arquivo `index.html` em um navegador moderno
3. Use as funções diretamente na interface:

   - **Adicionar cliente** → Digite o nome e clique em "Adicionar"
   - **Registrar fiado** → Escolha cliente, produto e valor
   - **Liquidar dívida** → Clique no botão correspondente
   - **Exportar dados** → Botão na seção de clientes

---

## 🧩 Estrutura de Arquivos

| Arquivo         | Função                                      |
|-----------------|---------------------------------------------|
| `index.html`| Interface principal e entrada do sistema    |
| `principal.js`  | Coordenação geral e escuta de eventos       |
| `clientes.js`   | Gerenciamento de clientes                   |
| `produtos.js`   | Registro e controle de fiados               |
| `dataset.js`    | Configuração e operação do IndexedDB        |
| `interface.js`  | Elementos visuais e notificações            |
| `layout.css`    | Estilização completa da interface           |

---

## 📋 Requisitos

- Navegador moderno (Chrome 89+, Firefox 86+, Edge 89+)
- JavaScript habilitado
- Pelo menos 5MB de espaço livre no dispositivo

---

## 🚫 Limitações Conhecidas

- Dados ficam salvos apenas no navegador usado
- Sem sincronização entre dispositivos ou múltiplos pontos de acesso
- Recomendado para até ~500 clientes por segurança e performance

---

## 💡 Melhorias Futuras

- **`importarDados()`**: Permitir carregamento de arquivos JSON previamente exportados, com validação da estrutura para evitar corrupção do banco. Melhora a confiabilidade de backups manuais.
- **Senha local**: Implementar proteção básica via `localStorage` com `btoa()` para armazenar um hash local. O sistema exibe um prompt ao iniciar. Serve como barreira para usuários casuais, sem pretensão de segurança forte.
- **Relatório de fiados**: Exibir painel com:
  - Total de dívidas ativas (ex: "R$ 5.200 em fiados")
  - Top 5 clientes com maior número de registros  
  Pode ser feito com `reduce()` ou com uma biblioteca leve como `Chart.js`, mantendo o foco em simplicidade e clareza visual.

Essas sugestões seguem a filosofia do projeto e são compatíveis com IndexedDB, agregando valor sem aumentar a complexidade.

---

## ⚠️ Licença

Este projeto está licenciado sob a [Creative Commons BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/).  
**Uso não comercial apenas**. Modificações e redistribuições não são permitidas sem autorização.  
Todos os direitos reservados à autora original.

---

## 🤝 Contribuições

Pull requests são bem-vindos **somente para correções e sugestões que respeitem a proposta leve e funcional do projeto**.  
Relate bugs ou envie feedback por mensagens diretas.
