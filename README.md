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

---

## 💾 Como Usar

Para utilizar o sistema:
1. Faça o download do repositório em formato ZIP e extraia os arquivos
2. Abra a pasta extraída em um editor de código (como Visual Studio Code)
3. Para desenvolvimento e testes, utilize a estrutura completa do projeto
4. Nota: Não é recomendado executar o arquivo index.html isoladamente

Use as funções diretamente na interface:

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

## ✅ Histórico de Melhorias do Projeto

- Importação de dados JSON com validação e segurança
- Proteção por senha local (opcional)
- Relatório de fiados com estatísticas e top clientes
- Interface escura, acessível e responsiva
- Modais e botões com contraste e acessibilidade aprimorados

---

## ⚠️ Licença

Este projeto está licenciado sob a [Creative Commons BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/). **Uso não comercial apenas**. Modificações e redistribuições não são permitidas sem autorização. Todos os direitos reservados à autora original.

---

## 🤝 Contribuições

Pull requests são bem-vindos **somente para correções e sugestões que respeitem a proposta leve e funcional do projeto**. Relate bugs ou envie feedback por mensagens diretas.
