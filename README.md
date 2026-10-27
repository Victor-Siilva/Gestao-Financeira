# Gestão de Finanças

Frontend responsivo em React, Vite e TypeScript para acompanhar lucros, despesas, funcionários e folha de pagamento.

## Requisitos

- Node.js LTS (npm incluído)
- VS Code (recomendado)

## Executar

```bash
npm install
npm run dev
```

Abra o endereço local informado pelo Vite (normalmente `http://localhost:5173`).

## Formatação do código

```bash
npm run format
npm run format:check
```

## Funcionalidades

- Dashboard financeiro com filtro mensal.
- Cadastro, edição e exclusão de funcionários, lucros e despesas.
- Registro de horas ou diárias por funcionário e data.
- Cálculo automático da folha mensal e do resultado financeiro do período selecionado.
- Exportação de relatório em PDF com gráfico geral, apuração da folha, todos os funcionários e os lançamentos do mês.
- Dados armazenados no `localStorage` do navegador.
- Schema SQL inicial em `supabase/schema.sql`.

## Regras do cálculo

- Lucros: soma dos lançamentos de entrada no mês selecionado.
- Despesas operacionais: soma dos lançamentos de despesa no mês selecionado.
- Funcionários ativos com pagamento mensal: soma dos valores mensais cadastrados.
- Funcionários pagos por hora ou dia: cada registro soma quantidade trabalhada multiplicada pelo valor por hora ou diária definido no cadastro.
- Resultado estimado: lucros menos despesas operacionais e folha calculada.
- Horas extras não recebem multiplicador. Não registre novamente os valores já calculados na folha como despesas, para evitar duplicidade.

Os registros de trabalho guardam uma cópia do nome, cargo e valor-base do funcionário no momento do lançamento. Salários mensais usam o cadastro atual de funcionários ativos; o histórico de alterações salariais não é mantido.

## Integração e segurança

A aplicação ainda usa armazenamento local do navegador. A conexão client-side do Supabase está preparada em `src/lib/supabase.ts`, mas CRUD remoto, autenticação, segregação por empresa e policies de produção **não estão implementados**. Não coloque credenciais secretas no frontend. Antes de usar com dados reais, implemente autenticação e Row Level Security (RLS) com escopo por empresa.

Para configurar as variáveis, copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Isso, por si só, não conecta os formulários ao banco.

Os dados iniciais são demonstrativos. Revise o escopo antes do uso real, especialmente impostos, pró-labore, recorrências, faltas, adiantamentos, anexos e permissões de acesso.
