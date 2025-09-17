# 🧾 Sistema de Gestão de Fiados para Mercadinhos

> Um sistema simples, direto e funcional para gerenciar fiados em mercadinhos de bairro, feito com tecnologias web e totalmente offline.

![Licença: AGPLv3](https://img.shields.io/badge/Licença-AGPLv3-blue)
![Status](https://img.shields.io/badge/Status-estável-brightgreen)
![Compatibilidade](https://img.shields.io/badge/Navegadores-Modernos-blue)

---

## ✨ Funcionalidades
- Cadastro e gerenciamento de clientes
- Registro de produtos fiados com valores individuais
- Cálculo automático do total das dívidas
- Sistema de pagamentos parciais para dívidas totais
- Autocompletar para nomes de clientes e produtos
- Busca rápida por nome de cliente
- Exportação e importação de dados para backup
- Interface responsiva e leve, otimizada para dispositivos móveis
- Navegação completa por teclado com acessibilidade AAA
- Proteção por senha local (opcional)
- Relatórios de fiados com estatísticas detalhadas

---

## 🛠 Tecnologias Utilizadas
- **IndexedDB**: Banco de dados local no navegador
- **JavaScript (ES6)**: Lógica principal do sistema
- **HTML5 Semântico**: Estrutura acessível e organizada
- **CSS3 Moderno**: Uso de variáveis, Flexbox e Grid

---

## 🔧 Instalação e Uso

1. Clone o repositório usando Git:

	```bash
	git clone https://github.com/ecstasyvies/fiado-mercadinho
	```

	Ou, se preferir, faça o download em formato ZIP e extraia os arquivos.

2. Abra a pasta do projeto em um editor de código (por exemplo, Visual Studio Code).

3. Para desenvolvimento e testes, utilize sempre a estrutura completa do projeto (abra a pasta inteira no editor).  

> **Importante**: Para desenvolvimento e testes, é fundamental abrir a estrutura completa do projeto em um editor de código (como Visual Studio Code). Não execute o arquivo `index.html` isoladamente.

Use as funções diretamente na interface:

- **Adicionar cliente** → Digite o nome e clique em "Adicionar"
- **Registrar fiado** → Escolha cliente, produto e valor
- **Pagamento parcial** → Registre pagamentos parciais da dívida total
- **Liquidar dívida** → Clique no botão correspondente
- **Exportar dados** → Botão na seção de clientes

---

## 🧩 Estrutura de Arquivos

| Arquivo         | Função                                      |
|-----------------|---------------------------------------------|
| `index.html`    | Interface principal e entrada do sistema    |
| `principal.js`  | Coordenação geral e escuta de eventos       |
| `clientes.js`   | Gerenciamento de clientes                   |
| `produtos.js`   | Registro e controle de fiados               |
| `dataset.js`    | Configuração e operação do IndexedDB        |
| `interface.js`  | Elementos visuais e notificações            |
| `seguranca.js`  | Sistema de proteção por senha               |
| `configuracoes.js` | Interface de configurações do sistema    |
| `relatorio.js`  | Geração de relatórios e estatísticas        |
| `acessibilidade.js` | Módulo de acessibilidade e navegação    |
| `layout.css`    | Estilização completa da interface           |

---

## ♿ Acessibilidade

O sistema foi desenvolvido seguindo as diretrizes WCAG 2.1 AAA para máxima acessibilidade:

- **Navegação por teclado completa**: Todos os elementos são acessíveis via Tab/Shift+Tab
- **Contraste AAA**: Cores otimizadas para contraste 4.5:1+ em todos os elementos
- **Foco inteligente**: Navegação contextual que direciona o foco automaticamente
- **Atributos ARIA**: Elementos semânticos com labels e descrições adequadas
- **Suporte a leitores de tela**: Estrutura HTML semântica e aria-live regions
- **Navegação fluída**: Enter/Espaço para ativação, setas para navegação em listas

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

- Sistema de pagamentos parciais para dívidas totais
- Autocompletar para clientes e produtos
- Importação de dados JSON com validação e segurança
- Proteção por senha local (opcional)
- Relatório de fiados com estatísticas e top clientes
- Interface escura, acessível e responsiva
- Modais e botões com contraste e acessibilidade aprimorados
- Navegação completa por teclado com foco inteligente
- Conformidade AAA de contraste de cores
- Arquitetura modular com separação clara de responsabilidades
- Código otimizado com 'use strict' e eliminação de redundâncias

---

## ⚠️ Licença

Este projeto está licenciado sob a [GNU Affero General Public License v3.0](https://www.gnu.org/licenses/agpl-3.0.html). Você tem a liberdade de:
- Usar o software para qualquer finalidade
- Estudar como o software funciona e modificá-lo
- Redistribuir cópias do software
- Distribuir versões modificadas do software

**Importante**: Se você modificar e usar este software em um servidor de rede, DEVE disponibilizar o código fonte completo para os usuários desse servidor. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🤝 Contribuições

Pull requests são bem-vindos **somente para correções e sugestões que respeitem a proposta leve e funcional do projeto**. Relate bugs ou envie feedback por mensagens diretas.
