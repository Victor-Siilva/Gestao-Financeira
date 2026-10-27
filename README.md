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
- Com Supabase configurado: login por e-mail/senha e armazenamento remoto de funcionários, lançamentos e registros de trabalho.
- Sem Supabase configurado: modo local, com dados salvos no `localStorage` do navegador.

## Regras do cálculo

- Lucros: soma dos lançamentos de entrada no mês selecionado.
- Despesas operacionais: soma dos lançamentos de despesa no mês selecionado.
- Funcionários ativos com pagamento mensal: soma dos valores mensais cadastrados.
- Funcionários pagos por hora ou dia: cada registro soma quantidade trabalhada multiplicada pelo valor por hora ou diária definido no cadastro.
- Resultado estimado: lucros menos despesas operacionais e folha calculada.
- Horas extras não recebem multiplicador. Não registre novamente os valores já calculados na folha como despesas, para evitar duplicidade.

Os registros de trabalho guardam uma cópia do nome, cargo e valor-base do funcionário no momento do lançamento. Salários mensais usam o cadastro atual de funcionários ativos; o histórico de alterações salariais não é mantido.

## Configurar Supabase

1. Crie um projeto no Supabase e abra o **SQL Editor**.
2. Execute o conteúdo completo de `supabase/schema.sql` para criar/atualizar as tabelas e as políticas RLS.
3. Copie `.env.example` para `.env.local` e informe a URL do projeto e a chave **anon/public** em `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Reinicie o Vite (`npm run dev`) e crie o primeiro usuário na tela de acesso.
5. Se a confirmação de e-mail estiver habilitada no Supabase, confirme o endereço antes de entrar.

No painel Supabase, deixe habilitado o provedor de autenticação por e-mail/senha. As políticas Row Level Security limitam cada conta aos próprios dados. Este projeto está configurado para **uma conta responsável por conjunto de dados**; compartilhar os dados com outras contas da equipe exige implementar organizações e associação de membros. Nunca use a chave `service_role` no frontend ou em `.env.local`.

Na primeira autenticação, se o banco estiver vazio, os dados já salvos neste navegador são migrados para a conta. Se o banco já possuir registros, os dados locais não são importados automaticamente e permanecem no navegador. Mantenha uma cópia antes de mudar de conta ou limpar os dados do navegador.

O modo local continua disponível quando as variáveis não estão configuradas, mas seus dados não são enviados à nuvem. O Supabase Free tem limites de uso e disponibilidade; acompanhe o painel do projeto e mantenha cópias de segurança.

Os dados iniciais são demonstrativos. Revise o escopo antes do uso real, especialmente impostos, pró-labore, recorrências, faltas, adiantamentos, anexos e permissões de acesso.
