# Sistema de Gestão de Fiados

![Interface do sistema de gestão de fiados exibida em tela escura, com dois painéis principais: à esquerda, a seção "Gestão de Clientes", contendo campos para adicionar e buscar clientes, além de botões roxos para exportar dados, importar dados e gerar relatórios; à direita, a seção "Registro de Compras", com campos para descrição do produto e valor em reais, botão para registrar compra e área que mostra o total das compras registradas.](https://res.cloudinary.com/dbkobxtnj/image/upload/v1761694365/previadosistema_w95cw5.png)

> Sistema para gestão de fiados em estabelecimentos comerciais de pequeno porte. Permite o registro, monitoramento e liquidação de dívidas de forma totalmente offline, garantindo acessibilidade e independência de conectividade.

---

![Licença: AGPLv3](https://img.shields.io/badge/Licença-AGPLv3-60519b?style=for-the-badge&logo=gnu&logoColor=ffffff)

[![Acesse o Sistema de Fiados](https://img.shields.io/badge/Acesse%20o%20Sistema%20de%20Fiados-60519b?style=for-the-badge&logo=appveyor&logoColor=ffffff)](https://ecstasyvies.github.io/fiado-mercadinho/)

---

## 📝 Introdução e Contexto

Em muitos pequenos comércios, o registro de fiados ainda é feito manualmente, em cadernos. Essa prática, embora tradicional, apresenta limitações — cálculos manuais, risco de perda de informações e dificuldade de acompanhar dívidas antigas — identificadas por meio de pesquisas locais conduzidas pessoalmente.

Alguns comerciantes já possuem sistemas de frente de caixa, mas preferem continuar usando o caderno. Isso demonstra que PDVs comerciais podem ser **complexos, caros ou dependentes de internet**, tornando-os pouco práticos para operações simples e rápidas. É nesse contexto que o meu sistema se mostra relevante: ele digitaliza o processo, mas mantém a simplicidade que comerciantes que entrevistei valorizam.

Meu sistema permite registrar produtos fiados, calcular totais automaticamente e gerenciar pagamentos parciais, oferecendo **uma alternativa direta e intuitiva**. Ele preserva a praticidade do método manual, mas elimina erros, perda de dados e dificuldades de consulta.

---

## FUNCIONALIDADES PRINCIPAIS
- ✅ Cadastro e gerenciamento de clientes
- ✅ Registro de produtos/compras fiadas com valores individualizados
- ✅ **Anotações sobre clientes** (com auto-salvamento)
- ✅ Cálculo automático do total das dívidas
- ✅ Registro de pagamentos parciais (aplicação sequencial)
- ✅ Liquidação completa de dívidas
- ✅ Busca e filtragem rápida de clientes
- ✅ Exportação e importação de dados em JSON (backup)
- ✅ Relatórios detalhados com estatísticas e meta mensal
- ✅ Interface responsiva (desktop e mobile)
- ✅ Navegação completa por teclado (WCAG 2.1 AAA)
- ✅ Proteção por senha local (opcional)
- ✅ Tema claro/escuro
- ✅ Instalável como PWA com funcionamento 100% offline
- ✅ Atualização automática

---

## TECNOLOGIAS UTILIZADAS
- **IndexedDB**: Armazenamento local no navegador
- **JavaScript (ES6)**: Lógica do sistema
- **HTML5 Semântico**: Estrutura acessível e organizada
- **CSS3 Moderno**: Variáveis, Flexbox e Grid
- **Service Worker + Cache Storage**: Offline-first e estratégias de cache
- **Web App Manifest**: Instalação como PWA e integração com sistema

---

## INSTALAÇÃO

### Usuários Finais
Acesse diretamente: [Fiados do Mercadinho](https://ecstasyvies.github.io/fiado-mercadinho/)

O sistema é **100% offline-first** com PWA (Progressive Web App). Após o primeiro acesso em HTTPS, você pode:
- **Instalar** como app nativo usando a opção do navegador
- **Usar offline** mesmo sem internet (dados salvos localmente)
- **Sincronização automática** de atualizações quando conectado

### Desenvolvimento Local
1. Clone o repositório:
   ```bash
   git clone https://github.com/ecstasyvies/fiado-mercadinho
   cd fiado-mercadinho
   ```

2. Abra a pasta completa no editor (ex: Visual Studio Code)

3. Use um servidor local ou extensão de preview

> **Importante**: Sempre abra a pasta inteira no editor. IndexedDB requer que o projeto esteja em um contexto completo, não em arquivo isolado.

---

## 📋 GUIA COMPLETO DE FUNCIONALIDADES

### 🔐 **Gerenciamento de Clientes**

#### Adicionar Cliente
- Preencha o campo "Nome do Cliente" (obrigatório)
- Clique em "Adicionar Cliente"
- Sistema valida duplicatas automaticamente
- Cliente adicionado à lista com data de cadastro registrada

#### Buscar e Filtrar Clientes
- Use o campo "Buscar cliente..." para localização rápida
- Filtro funciona em tempo real durante digitação
- Prioriza nomes que começam com o termo
- Indica quantidade total de clientes (ex: "Total de clientes: 5")
- Ícone 📝 ao lado do nome indica cliente com anotações

#### Selecionar Cliente
- Clique no nome do cliente para selecioná-lo
- Cliente destacado em azul e exibe:
  - Seção de anotações (se houver)
  - Campo de descrição do produto (foco automático)
  - Botões de pagamento e ações
- Desclique para desselecionar (clique novamente no cliente selecionado)
- **Navegação por teclado**: use setas ↑/↓ para navegar entre clientes, Enter para selecionar

#### Remover Cliente
- Selecione o cliente desejado
- Clique em "Remover Cliente"
- **Alerta de dívida**: Se houver saldo pendente, confirma valor antes de remover
- Confirmação obrigatória (não pode ser desfeita)
- Todos os produtos e registros do cliente são removidos

---

### 📝 **Anotações sobre Clientes**

#### Adicionar/Editar Anotações
- Ao selecionar um cliente, a seção "Anotações do Cliente" aparece
- Textarea grande para registrar informações:
  - Preferências de produto
  - Limites de crédito informais
  - Informações de contato
  - Observações especiais
- **Auto-salvamento**: anotações são salvas **automaticamente** ao sair do campo (após 1 segundo de inatividade)
- Também salva ao pressionar Enter (desktop) ou Ctrl+Enter (mobile)
- Botão "Salvar Anotações" para confirmação manual
- Visual de feedback: campo muda cor ao salvar
- **Ícone 📝** aparece na lista indicando clientes com anotações

---

### 🛒 **Registro de Compras Fiadas**

#### Registrar Nova Compra
- Selecione um cliente primeiro (obrigatório)
- Preencha "Descrição do Produto" (nome ou detalhes)
- Preencha "Valor (R$)" com o preço (mínimo R$ 0,01)
- Clique em "Registrar Compra"
- Produto adicionado à lista com:
  - Data de registro (formato: DD/MM/AAAA)
  - Valor total em moeda formatada
  - Status de pagamento (se houver)

#### Listar Compras Registradas
- Aparecem em **ordem cronológica reversa** (mais recentes primeiro)
- Para cada produto exibe:
  - **Nome do produto**
  - **Data da compra**
  - **Valor total** (destacado em azul)
  - **Status de pagamento**:
    - Verde "Quitado" (totalmente pago)
    - Verde "Pago: R$ XXX" + Amarelo "Pendente: R$ YYY" (parcialmente pago)
    - Sem indicação se não houver pagamento
  - **Botão de lixeira** para remover

#### Visualização de Totais
- **"Montante"** ou **"Total"**: valor total de todas as compras
- **"Pago"**: quanto já foi quitado (se houver pagamento)
- **"Pendente"**: quanto ainda deve (se houver diferença)
- Cores padronizadas para fácil identificação:
  - Azul claro: total/montante
  - Verde: valores pagos
  - Amarelo: pendências

#### Remover Produto
- Clique no ícone de lixeira ao lado do produto
- Confirmação obrigatória
- Se havia pagamento no produto, valor é estornado
- Se a remoção deixar saldo zero, dívida é liquidada automaticamente
- Lista é atualizada em tempo real

---

### 💰 **Gerenciamento de Pagamentos**

#### Pagamento Parcial
- Selecione um cliente com dívida pendente
- Clique em "Pagamento Parcial"
- Modal exibe:
  - Cliente selecionado
  - Valor pendente total
  - Campo para digitar valor do pagamento
- Digite o valor (até o limite do pendente)
- Clique "Confirmar"
- Sistema **aplica o pagamento sequencialmente** aos produtos (mais antigos primeiro)
- Produto é marcado como "Quitado" quando totalmente pago
- Feedback visual confirma sucesso

#### Liquidar Dívida
- Selecione um cliente com dívida
- Clique em "Liquidar Dívida"
- Confirmação com valor total e quantidade de produtos
- **Ação irreversível**: confirma antes de executar
- Todos os produtos são removidos
- Saldo zerado
- Histórico de pagamento registrado automaticamente

---

### 📊 **Relatório e Estatísticas**

#### Acessar Relatório
- Clique em "Relatório" (botão no painel superior)
- Botão fica oculto se não houver clientes
- Mostra modal com resumo completo do sistema

#### Seções do Relatório

**1. Estatísticas Gerais (Grid 2x2)**
- **Total em Fiados**: soma de todos os débitos pendentes (em vermelho)
- **Total de Clientes**: contagem de clientes cadastrados (em verde)
- **Com Dívidas**: clientes com saldo pendente (em amarelo)
- **Itens Fiados**: total de produtos registrados (em vermelho)

**2. Meta Mensal de Recebimento**
- Pré-preenchida com **R$ 15.000** como sugestão inicial
- Campo editável: altere conforme necessário
- Salva a preferência localmente (persiste entre acessos)
- **Barra de progresso visual**:
  - Exibe percentual de atingimento
  - Muda cor (azul → verde) quando meta atingida
- Exibe:
  - Valor coletado / Meta
  - Mensagem "Meta atingida!" (verde) ou "Faltam R$ XXX para atingir a meta"

**3. Principais Clientes em Dívida**
- Ranking dos **5 clientes com maior débito**
- Exibe para cada:
  - Posição (1º a 5º)
  - Nome do cliente
  - Quantidade de itens fiados
  - Valor total da dívida (em azul)
- Ordenação automática (maior débito primeiro)

---

### 💾 **Backup e Importação de Dados**

#### Exportar Dados (Backup)
- Clique em "Exportar Dados"
- Cria arquivo JSON (`backup-fiados.json`) com **todos os dados** do sistema:
  - Clientes cadastrados
  - Produtos/compras de cada cliente
  - Anotações
  - Histórico de pagamentos
  - Meta mensal (se configurada)
  - Data/hora do backup
- Arquivo é baixado automaticamente
- **Recomendação**: faça backups regulares (semanal)

#### Importar Dados (Restore)
- Clique em "Importar Dados"
- Selecione arquivo `backup-fiados.json` previamente exportado
- Sistema valida arquivo antes de restaurar:
  - Verifica formato JSON válido
  - Valida estrutura de dados
  - Confirma integridade (não aceita arquivos corrompidos)
- **Aviso importante**: importação **sobrescreve todos os dados atuais**
- Confirmação obrigatória antes de prosseguir
- Feedback visual ao final: "Dados importados com sucesso!"

---

### ⚙️ **Configurações do Sistema**

Acesso: Clique no botão **"Configurações"** (ícone engrenagem) no canto superior

#### 🔐 Proteção por Senha
- **Estado**: mostra se está ativada ou desativada
- **Ativar**:
  - Clique em "Ativar"
  - Defina uma senha (mínimo 4 caracteres)
  - Confirme digitando novamente
  - Senha protege acesso ao sistema
- **Remover**:
  - Se senha já configurada, clique em "Remover"
  - Confirmação de segurança solicitada
  - Sistema fica desprotegido

#### 🎨 Tema Claro/Escuro
- **Padrão**: tema escuro (economia de bateria, menos fadiga visual)
- **Ativar tema claro**:
  - Clique em "Ativar Tema Claro"
  - Interface muda para fundo claro com textos escuros
  - Preferência salva e persiste em reaberturas
  - Útil em ambientes com muita iluminação

---

### ⌨️ **Navegação por Teclado (Acessibilidade Completa)**

O sistema é **100% navegável por teclado**, conforme WCAG 2.1 AAA:

| Tecla | Ação |
|-------|------|
| **Tab** | Navega entre elementos |
| **Shift + Tab** | Navega para trás |
| **Enter** | Ativa botão ou seleciona item |
| **Espaço** | Alterna switches/checkboxes |
| **↑ / ↓** | Seta entre itens em listas (clientes, produtos) |
| **Esc** | Fecha modais |
| **Ctrl+Enter** (mobile) | Salva anotações |

#### Fluxo Automático de Foco
- Após adicionar cliente: foco vai para busca
- Após selecionar cliente: foco vai para campo de produto
- Após adicionar produto: foco volta para descrição
- Modais mantêm foco interno (sem retorno ao fundo)

---

### 📱 **Recursos Técnicos**

#### Offline-First (PWA)
- Funciona **100% sem internet** após primeiro acesso
- Service Worker gerencia cache automático
- Atualizações baixadas em background
- Dados salvos localmente em IndexedDB (não na nuvem)

#### Armazenamento de Dados
- **IndexedDB**: banco de dados local no navegador
- **localStorage**: configurações (tema, meta, senha)
- **Sem sincronização remota**: dados permanecem no dispositivo
- **Recomendado**: máximo ~500 clientes para ótima performance

#### Conformidade de Acessibilidade
- ✅ WCAG 2.1 AAA (maior nível de conformidade)
- ✅ Contraste mínimo 4.5:1 (cores testadas)
- ✅ Navegação completa por teclado
- ✅ Suporte a leitores de tela (ARIA labels/descriptions)
- ✅ Feedback visual e auditivo (notificações)
- ✅ Sem captura de foco inesperada

---

## ESTRUTURA DE ARQUIVOS

| Arquivo         | Função                                      |
|-----------------|---------------------------------------------|
| `index.html`    | Interface principal e entrada do sistema    |
| `principal.js`  | Coordenação geral e escuta de eventos       |
| `clientes.js`   | Gerenciamento de clientes e anotações       |
| `produtos.js`   | Registro e controle de fiados               |
| `dataset.js`    | Configuração e operação do IndexedDB        |
| `interface.js`  | Elementos visuais e notificações            |
| `seguranca.js`  | Sistema de proteção por senha               |
| `configuracoes.js` | Interface de configurações do sistema    |
| `relatorio.js`  | Geração de relatórios e estatísticas        |
| `acessibilidade.js` | Módulo de acessibilidade e navegação    |
| `layout.css`    | Estilização completa da interface           |
| `service-worker.js` | Cache offline, políticas e atualização  |
| `manifest.webmanifest` | Metadados PWA (nome, ícones, tema)   |
| `icons/`        | Ícones do app (SVG)                         |

---

## 🚫 LIMITAÇÕES

- Dados salvos apenas localmente
- Sem sincronização entre dispositivos
- Recomendado para até ~500 clientes por segurança e performance

### Apesar disso...

**Essas limitações não tornam o sistema inútil, mas definem o público-alvo: pequenos comerciantes com operações simples que não precisam de escalabilidade massiva.**

---

## COMPORTAMENTOS DE INTERFACE IMPORTANTES

- Botões de "Exportar Dados" e "Relatório" ficam ocultos quando não há clientes cadastrados. Enquanto ocultos, a área exibe a mensagem: "Cadastre clientes para gerar relatório".
- Ações do cliente (Pagamento Parcial, Liquidar) seguem regras de visibilidade próprias ao selecionar um cliente.
- Ícone 📝 indica automaticamente clientes com anotações salvas

---

## BREVE HISTÓRICO DE MELHORIAS

- Sistema de pagamentos parciais para dívidas totais
- Autocompletar para clientes e produtos
- Importação de dados JSON com validação e segurança
- Proteção por senha local (opcional)
- **Anotações automáticas sobre clientes** (novo)
- **Meta mensal de recebimento editável** (novo)
- Relatórios detalhados e ranking de clientes
- Interface escura, acessível e responsiva
- Modais e botões com contraste aprimorado
- Navegação completa por teclado com foco inteligente
- Conformidade AAA de contraste
- Arquitetura modular e código otimizado

---

## LICENÇA

Este projeto está licenciado sob a [GNU Affero General Public License v3.0](https://www.gnu.org/licenses/agpl-3.0.html). Você tem a liberdade de:
- Uso para qualquer finalidade
- Estudo e modificação do software
- Redistribuição e compartilhamento de versões modificadas

**Importante**: alterações utilizadas em servidores devem disponibilizar o código-fonte completo para os usuários. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## CONTRIBUIÇÕES

Pull requests são bem-vindos, sendo **fortemente recomendado que respeitem a proposta leve, funcional e offline do projeto**. Relate bugs ou envie feedback por mensagens diretas.

---
