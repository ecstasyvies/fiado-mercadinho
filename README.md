# Sistema de Gestão de Fiados

![Interface do sistema de gestão de fiados exibida em tela escura, com dois painéis principais: à esquerda, a seção “Gestão de Clientes”, contendo campos para adicionar e buscar clientes, além de botões roxos para exportar dados, importar dados e gerar relatórios; à direita, a seção “Registro de Compras”, com campos para descrição do produto e valor em reais, botão para registrar compra e área que mostra o total das compras registradas.](https://res.cloudinary.com/dbkobxtnj/image/upload/f_auto,q_auto,w_800,r_20/v1758981402/previa_sen8y1.png)

> Sistema para gestão de fiados em estabelecimentos comerciais de pequeno porte. Permite o registro, monitoramento e liquidação de dívidas de forma totalmente offline, garantindo acessibilidade e independência de conectividade.

---

![Licença: AGPLv3](https://img.shields.io/badge/Licença-AGPLv3-60519b?style=for-the-badge&logo=gnu&logoColor=ffffff)

[![Acesse o Sistema de Fiados](https://img.shields.io/badge/Acesse%20o%20Sistema%20de%20Fiados-60519b?style=for-the-badge&logo=appveyor&logoColor=ffffff)](https://ecstasyvies.github.io/fiado-mercadinho/)

---

## 📝 Introdução e Contexto

Em muitos pequenos comércios, o registro de fiados ainda é feito manualmente, em cadernos. Essa prática, embora tradicional, apresenta limitações — cálculos manuais, risco de perda de informações e dificuldade de acompanhar dívidas antigas — identificadas por meio de pesquisas locais conduzidas pessoalmente.

Alguns comerciantes já possuem sistemas de frente de caixa, mas preferem continuar usando o caderno. Isso demonstra que PDVs comerciais podem ser **complexos, caros ou dependentes de internet**, tornando-os pouco práticos para operações simples e rápidas. É nesse contexto que o meu sistema se mostra relevante: ele digitaliza o processo, mas mantém a simplicidade que comerciantes que entrevistei valorizam.

Meu sistema permite registrar produtos fiados, calcular totais automaticamente e gerenciar pagamentos parciais, oferecendo **uma alternativa direta e intuitiva**. Ele preserva a praticidade do método manual, mas elimina erros, perda de dados e dificuldades de consulta.

> Minhas entrevistas confirmam: para pequenos comerciantes, **simplicidade e praticidade valem mais do que sistemas comerciais completos, porém complexos**.

---

## FUNCIONALIDADES
- Cadastro e gerenciamento de clientes
- Registro de produtos fiados com valores individualizados
- Cálculo automático do total das dívidas
- Registro de pagamentos parciais e liquidação de dívidas
- Autocompletar para nomes de clientes e produtos
- Busca rápida por clientes
- Exportação e importação de dados para backup
- Interface responsiva e otimizada para dispositivos móveis
- Navegação completa por teclado com conformidade AAA em acessibilidade
- Proteção por senha local (opcional)
- Relatórios detalhados com estatísticas de fiados

---

## TECNOLOGIAS UTILIZADAS
- **IndexedDB**: Armazenamento local no navegador
- **JavaScript (ES6)**: Lógica do sistema
- **HTML5 Semântico**: Estrutura acessível e organizada
- **CSS3 Moderno**: Variáveis, Flexbox e Grid

---

## INSTALAÇÃO E USO

1. Clone o repositório usando Git:

	```bash
	git clone https://github.com/ecstasyvies/fiado-mercadinho
	```

	Ou, se preferir, faça o download em formato ZIP e extraia os arquivos.

2. Abra a pasta do projeto em um editor de código (por exemplo, Visual Studio Code).

3. Para desenvolvimento e testes, utilize sempre a estrutura completa do projeto (abra a pasta inteira no editor).

> **Observação**: É fundamental abrir a pasta completa no editor de código para que recursos como IndexedDB funcionem corretamente. Não execute apenas o arquivo `index.html` isoladamente. Para visualização, utilize a extensão de preview do editor ou um servidor local.

---

### 📖 Como Usar o Sistema

1. **Acesso**  
   Abra o sistema no navegador. Se houver senha, insira-a; senão, pode criar uma em Configurações.

2. **Adicionar cliente**  
   Digite o nome no campo e clique em Adicionar Cliente.

3. **Buscar/Selecionar cliente**  
   Use a busca para encontrar clientes. Clique em um nome para selecioná-lo.

4. **Registrar fiado**  
   Com o cliente selecionado, preencha o nome do produto e o valor, depois clique em Registrar Compra.

5. **Gerenciar itens**  
   Para remover um produto, use o ícone de lixeira ao lado do item.

6. **Pagamentos**
   * **Parcial:** Clique em Pagamento Parcial e informe o valor pago.
   * **Quitar tudo:** Use Liquidar Dívida para zerar a dívida.

7. **Remover cliente**  
   Clique em Remover Cliente (com confirmação).

8. **Backup e restore**  
   * **Exportar:** Baixe um arquivo de backup com Exportar Dados.
   * **Importar:** Restaure dados com Importar Dados.

9. **Relatório**  
   Veja estatísticas gerais em Relatório.

10. **Configurações**  
    Ative/desative senha e ajustes de usabilidade.

11. **Dicas**  
   * Use **Tab** e **Enter** para navegar pelo teclado.
   * Funciona offline; os dados ficam salvos no próprio dispositivo.
   * Faça backups regulares.
   * Ideal para até algumas centenas de clientes.

---

## ESTRUTURA DE ARQUIVOS

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

## ACESSIBILIDADE

O sistema segue as diretrizes WCAG 2.1 AAA:

- **Navegação por teclado completa**: Todos os elementos são acessíveis via Tab/Shift+Tab
- **Contraste AAA**: Cores otimizadas para contraste ≥4.5:1 em todos os elementos
- **Foco inteligente**: Navegação contextual que direciona o foco automaticamente
- **Atributos ARIA**: Elementos semânticos com labels e descrições adequadas
- **Suporte a leitores de tela**: Estrutura HTML semântica e aria-live regions
- **Navegação fluida**: Enter/Espaço para ativação, setas para navegação em listas

---

## 🚫 LIMITAÇÕES

- Dados salvos apenas localmente
- Sem sincronização entre dispositivos
- Recomendado para até ~500 clientes por segurança e performance

### Apesar disso...

**Essas limitações não tornam o sistema inútil, mas definem o público-alvo: pequenos comerciantes com operações simples que não precisam de escalabilidade massiva.**

---

## BREVE HISTÓRICO DE MELHORIAS

- Sistema de pagamentos parciais para dívidas totais
- Autocompletar para clientes e produtos
- Importação de dados JSON com validação e segurança
- Proteção por senha local (opcional)
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

**Importante**: alterações utilizadas em servidores devem disponibilizar o código-fonte completo para os usuários. Consulte o arquivo  [LICENSE](LICENSE) para mais detalhes.

---

## CONTRIBUIÇÕES

Pull requests são bem-vindos, sendo **fortemente recomendado que respeitem a proposta leve, funcional e offline do projeto**. Relate bugs ou envie feedback por mensagens diretas.

---