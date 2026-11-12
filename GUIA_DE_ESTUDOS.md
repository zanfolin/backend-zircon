# Guia de Estudos do Sistema Zircon

> **Para quem é este guia:** para quem nunca programou e precisa entender o Zircon a ponto de explicá-lo para qualquer pessoa. Ele começa do zero (o que é um servidor, o que é uma API) e termina nos detalhes técnicos de cada arquivo.
>
> **De onde vêm as informações:** tudo foi tirado do código e dos documentos que existem nesta pasta (`backend-zircon`, `web-zircon`, `mobile-zircon`, `ZirconDB.dbml`, `Zircon marketplace design.zip`, manuais e READMEs). Quando algo é uma interpretação ou uma sugestão, isso está dito. Quando o próprio projeto se contradiz (ex.: README diz uma coisa, código faz outra), isso está apontado.

---

## Sumário

1. [Como estudar com este guia](#1-como-estudar-com-este-guia)
2. [O Zircon em uma frase (e em um minuto)](#2-o-zircon-em-uma-frase-e-em-um-minuto)
3. [Glossário do zero](#3-glossário-do-zero)
4. [A visão geral: três peças que conversam](#4-a-visão-geral-três-peças-que-conversam)
5. [Por que foi feito assim](#5-por-que-foi-feito-assim)
6. [Os personagens e as regras do jogo](#6-os-personagens-e-as-regras-do-jogo)
7. [Os fluxos, passo a passo](#7-os-fluxos-passo-a-passo)
8. [Backend por dentro (`backend-zircon`)](#8-backend-por-dentro-backend-zircon)
9. [Painel Web por dentro (`web-zircon`)](#9-painel-web-por-dentro-web-zircon)
10. [Aplicativo Mobile por dentro (`mobile-zircon`)](#10-aplicativo-mobile-por-dentro-mobile-zircon)
11. [Identidade visual: cores, formas, fontes, logo](#11-identidade-visual-cores-formas-fontes-logo)
12. [Catálogo de tecnologias e bibliotecas (com links oficiais)](#12-catálogo-de-tecnologias-e-bibliotecas-com-links-oficiais)
13. [Pontos a melhorar (o que ficou de fora)](#13-pontos-a-melhorar-o-que-ficou-de-fora)
14. [Trilha de estudos: do nada ao avançado](#14-trilha-de-estudos-do-nada-ao-avançado)
15. [Roteiro para explicar ao grande público](#15-roteiro-para-explicar-ao-grande-público)
16. [Como rodar o sistema (resumo)](#16-como-rodar-o-sistema-resumo)
17. [Arquivos consultados](#17-arquivos-consultados)

---

## 1. Como estudar com este guia

| Se você tem... | Leia |
|---|---|
| 15 minutos | Seções 2, 4 e 15 |
| 1 hora | Seções 2 a 7 e 11 |
| 1 dia | Tudo, na ordem |
| Semanas | Tudo + a trilha da seção 14, abrindo os links de documentação |

Dica: tenha os prints das pastas `*/docs/images/` abertos enquanto lê. Eles mostram as telas reais do sistema.

---

## 2. O Zircon em uma frase (e em um minuto)

**Em uma frase:** o Zircon é um **mercado de vagas de trabalho, focado em home office**, onde **empresas publicam vagas** por um site e **profissionais se candidatam** por um aplicativo de celular.

**Em um minuto:**

- A ideia original está escrita no arquivo `ZirconDB.dbml`: *"Site/Mobile para Cadastro de Serviço de Oferta de Empregos/Serviços e procura de serviços. Mais voltado para serviços home office, como produção de conteúdo, design, programação, etc."*
- Existem **três tipos de usuário**: o **Administrador** (cuida da plataforma), a **Empresa** (oferece vagas) e o **Profissional** (procura vagas).
- A **empresa** usa um **painel no navegador** para criar vagas, ver quem se candidatou, analisar, aprovar ou rejeitar, e por fim "finalizar" a vaga com o escolhido.
- O **profissional** usa um **app de celular** para procurar vagas, salvar as favoritas, se candidatar e acompanhar o andamento.
- Tudo é ligado por um **servidor central** (o "backend") que guarda os dados, confere quem é quem e envia **e-mails automáticos** (código de confirmação, aviso de nova candidatura, aviso de aprovação/rejeição).
- A conversa entre empresa e profissional, depois da aprovação, acontece **fora do sistema** (por e-mail ou telefone). Um chat interno ficou anotado como "implementação futura" no `ZirconDB.dbml`.

**Por que o nome "Zircon"?** O código não explica a origem. O que se vê é que o sistema visual se chama **"Classical (Zircônia)"** (README do web) e o logo é um **losango**, como uma pedra lapidada. Zircão/zircônia é uma pedra preciosa; a leitura "uma joia de oportunidade" é interpretação, não está no código.

---

## 3. Glossário do zero

Leia esta seção como um dicionário. Cada termo vem com uma analogia do dia a dia.

| Termo | O que é | Analogia |
|---|---|---|
| **Software / sistema** | Conjunto de programas que resolve um problema | Uma empresa com vários setores |
| **Frontend** | A parte que a pessoa vê e toca (telas, botões) | O balcão de atendimento de uma loja |
| **Backend** | A parte que roda escondida num servidor, com as regras e os dados | O estoque e o escritório nos fundos da loja |
| **Servidor** | Computador (ou programa) que fica ligado esperando pedidos | Um garçom esperando pedidos |
| **API** | O "cardápio" de pedidos que o backend aceita | O cardápio do restaurante: você só pede o que está lá |
| **REST** | Um estilo de organizar a API por "endereços" e "verbos" | Pedidos padronizados: "traga", "crie", "altere", "apague" |
| **HTTP** | A língua que navegador/app e servidor usam para conversar | O idioma falado entre cliente e garçom |
| **Verbos HTTP** | `GET` (buscar), `POST` (criar), `PUT` (alterar), `DELETE` (apagar) | "Me mostre", "anote", "troque", "cancele" |
| **Endpoint / rota** | Um endereço específico da API, ex.: `/api/opportunities` | Um prato específico do cardápio |
| **JSON** | Formato de texto para trocar dados: `{"nome": "Ana"}` | Uma ficha preenchida com campos e valores |
| **Código de status** | Número que o servidor devolve: 200 ok, 201 criado, 400 erro seu, 401 não identificado, 403 proibido, 404 não existe, 409 conflito, 500 erro do servidor | A resposta do garçom: "saiu", "não temos", "você não pode" |
| **Banco de dados** | Onde os dados ficam guardados de forma organizada | Um arquivo de fichas, com gavetas (tabelas) |
| **Tabela / coluna / linha** | Tabela = gaveta, coluna = campo da ficha, linha = uma ficha | Planilha do Excel |
| **SQL** | A linguagem para conversar com bancos de dados | Instruções para o arquivista |
| **Migration** | Script que cria ou altera tabelas, versionado | A planta da reforma, etapa por etapa |
| **Seed** | Script que coloca dados iniciais no banco | Mobiliar a casa nova |
| **Autenticação** | Provar quem você é (login) | Mostrar o RG na portaria |
| **Autorização** | O que você pode fazer depois de entrar | O crachá que abre só algumas portas |
| **Token / JWT** | Um "crachá digital" assinado que o app envia a cada pedido | Pulseira de festa: mostra que você pagou a entrada |
| **Access token / refresh token** | Crachá curto (15 min) e crachá de renovação (7 dias) | Ingresso do dia e carteirinha de sócio para pegar novo ingresso |
| **Hash de senha** | Transformar a senha em um código irreversível antes de guardar | Moer o café: não dá para "desmoer" |
| **Validação** | Conferir se os dados enviados fazem sentido | O caixa conferindo se a nota é verdadeira |
| **Middleware** | Uma "etapa de checagem" por onde todo pedido passa | Catracas e detectores na entrada de um prédio |
| **Framework** | Um "esqueleto" pronto para construir programas | Kit de montagem de móveis |
| **Biblioteca (lib) / pacote** | Código pronto de terceiros que você reaproveita | Peças prontas compradas na loja |
| **npm** | O "supermercado" de pacotes JavaScript | Loja de peças |
| **`package.json`** | Lista de pacotes que o projeto usa e seus comandos | Lista de compras + manual de instruções |
| **JavaScript / TypeScript** | Linguagens de programação; o TypeScript é JavaScript com "tipos" que evitam erros | Português formal com corretor ortográfico ligado |
| **Componente** | Pedaço reutilizável de tela (um botão, um card) | Peça de Lego |
| **Estado (state)** | Informação que a tela lembra enquanto você usa | O que está anotado no bloco do garçom agora |
| **Cache** | Cópia guardada para não pedir de novo | Deixar o café já passado na garrafa |
| **Variável de ambiente (`.env`)** | Configurações e segredos fora do código | O cofre com as chaves do prédio |
| **CORS** | Regra do navegador que só deixa um site falar com servidores autorizados | Lista de convidados na porta |
| **Soft delete** | "Apagar" marcando uma data, sem remover de verdade | Mover para a lixeira em vez de queimar o papel |
| **SMTP** | Protocolo de envio de e-mails | Os Correios |
| **Emulador** | Celular "de mentira" rodando no computador | Simulador de voo |

---

## 4. A visão geral: três peças que conversam

```text
                    ┌──────────────────────────────┐
                    │   backend-zircon (servidor)  │
                    │   Node.js + Express          │
                    │   Regras, segurança, e-mails │
                    │   Banco SQLite (zircon.db)   │
                    └──────────────┬───────────────┘
                                   │  API REST em http://localhost:3000/api
                 ┌─────────────────┴──────────────────┐
                 │ cabeçalho x-platform: web          │ cabeçalho x-platform: mobile
   ┌─────────────▼─────────────┐        ┌─────────────▼─────────────┐
   │ web-zircon (navegador)    │        │ mobile-zircon (celular)   │
   │ React + Vite              │        │ React Native + Expo       │
   │ Usado por EMPRESA e ADMIN │        │ Usado pelo PROFISSIONAL   │
   │ http://localhost:5173     │        │ Expo Go / emulador        │
   └───────────────────────────┘        └───────────────────────────┘
```

| Peça | Pasta | Quem usa | O que faz |
|---|---|---|---|
| **Backend (API)** | `backend-zircon/` | Ninguém diretamente; os apps usam | Guarda dados, aplica regras, envia e-mails, recebe fotos |
| **Painel Web** | `web-zircon/` | Empresas e administradores | Criar e gerir vagas, avaliar candidatos, moderar usuários |
| **App Mobile** | `mobile-zircon/` | Profissionais | Buscar vagas, salvar, candidatar-se, acompanhar, editar perfil |

Os três são **projetos independentes**: cada um tem seu `package.json` e é instalado e iniciado separadamente. Os dois "frontends" nunca falam entre si; ambos falam só com o backend.

---

## 5. Por que foi feito assim

Esta seção explica as decisões. Quando a justificativa está escrita no projeto, a fonte é citada. Quando é a razão técnica usual daquela escolha, isso está indicado como "razão usual".

| Decisão | Onde está | Por quê |
|---|---|---|
| **Separar web (empresa/admin) e mobile (profissional)** | `ZirconDB.dbml`: "PROFISSIONAL: uso sempre pelo celular; ADMIN e EMPRESA: uso sempre pelo web" | Quem procura vaga faz isso no celular; quem gere vagas precisa de tela grande, tabelas e filtros. |
| **Um único backend para os dois** | Protótipo `Zircon Arquitetura.dc.html`: "Um back-end, duas superfícies" | Uma só fonte de verdade para regras e dados; evita duas versões das mesmas regras. |
| **JavaScript em tudo (Node, React, React Native)** | `package.json` dos três | Razão usual: uma linguagem só para o time inteiro, reaproveitamento de bibliotecas (Zod, Axios, Zustand, TanStack Query aparecem nos dois frontends). |
| **SQLite** | `knexfile.js`, `ZirconDB.dbml` (`database_type: 'SQLite'`) | Banco em um único arquivo (`data/zircon.db`), sem instalar servidor de banco. Ideal para desenvolvimento, ensino e protótipo. |
| **Knex (migrations/seeds)** | `src/database/` | Permite recriar o banco do zero com um comando e versionar mudanças de estrutura. |
| **JWT com 15 min + 7 dias** | `src/config/jwt.js` | Razão usual: o token curto limita o estrago se vazar; o longo evita pedir senha toda hora. |
| **Validação de CPF/CNPJ no servidor** | `ZirconDB.dbml`: "A validação do CPF ou CNPJ deve ser realizada pelo backend" | O frontend pode ser burlado; o servidor é a barreira real. Os apps também validam, só para dar resposta rápida. |
| **Verificação de e-mail por código de 6 dígitos** | `authController.js` | Garante que o e-mail existe e pertence à pessoa, antes de liberar o login. |
| **Soft delete (`deleted_at`)** | Todas as tabelas | Mantém histórico e evita quebrar vínculos (vagas e candidaturas apontam para usuários). |
| **Cabeçalho `x-platform`** | `platformMiddleware.js`, `lib/api.ts` dos apps | Identificar de onde vem o pedido (web ou mobile). Hoje é só identificado; o bloqueio por papel é feito nas telas (ver seção 13). |
| **Vagas salvas só no celular** | Protótipo de arquitetura: "Vagas salvas não existem na API: ficam locais (Zustand + persist) até haver endpoint." | Foi uma simplificação consciente para caber no prazo. |
| **Visual "editorial" (fontes serifadas, bordas finas)** | Design system "Classical" no `.zip` | Diferenciar o produto do visual genérico de apps de vagas. |

---

## 6. Os personagens e as regras do jogo

### 6.1 Os três papéis (`user_type`)

| Papel | Onde entra | Pode | Não pode |
|---|---|---|---|
| **ADMIN** | Painel Web | Ver todos os usuários, vagas e candidaturas; bloquear/desbloquear contas; mudar status de vagas | (Pela intenção do DBML) criar vagas ou se candidatar. Ver nota abaixo. |
| **EMPRESA** | Painel Web | Criar, editar, pausar, excluir e finalizar **as próprias** vagas; ver e avaliar candidatos **das próprias** vagas | Se candidatar |
| **PROFISSIONAL** | App Mobile | Ver vagas ativas, se candidatar, cancelar candidatura em aberto, salvar vagas | Criar ou gerir vagas |

> **Nota (diferença entre intenção e código):** o DBML diz que o ADMIN "não pode se candidatar a vagas nem criar vagas", mas as rotas do backend permitem ADMIN em `POST /opportunities` e `POST /applications` (`requireRole('EMPRESA','ADMIN')` e `requireRole('PROFISSIONAL','ADMIN')`).

O **seed** cria um administrador inicial: `admin@admin.com` / `Senha123!`.

### 6.2 Situação de um usuário (`status`)

`ATIVO` (pode usar) · `INATIVO` · `BLOQUEADO` (o admin bloqueou). Só `ATIVO` consegue entrar e usar a API.

### 6.3 Ciclo de vida de uma **vaga** (`opportunities.status`)

```text
   criar ──► ATIVA ◄──► PAUSADA
               │
               ├──► CANCELADA
               │
               └──► FINALIZADA  (fim: não pode mais ser reaberta nem editada)
                    exige pelo menos 1 candidatura APROVADA
```

- Modalidades: `HOME_OFFICE` (padrão), `HIBRIDO`, `PRESENCIAL`.
- Só vagas `ATIVA` aparecem na lista pública e aceitam candidaturas.
- **Finalizar** (`opportunityController.js`, função `resolveFinalizationWinner`):
  1. Precisa haver ao menos uma candidatura `APROVADA`.
  2. Se houver mais de uma aprovada, a empresa escolhe a "vencedora" (`winning_application_id`).
  3. Todas as outras candidaturas `PENDENTE`, `EM_ANALISE` ou `APROVADA` viram `REJEITADA` automaticamente e cada profissional recebe e-mail.

### 6.4 Ciclo de vida de uma **candidatura** (`applications.status`)

```text
  PENDENTE ──► EM_ANALISE ──► APROVADA   (final)
     │             │
     │             └────────► REJEITADA  (final)
     ├──────────────────────► APROVADA / REJEITADA (direto)
     └── (profissional cancela) ► CANCELADA (final)
```

Tabela exata do código (`applicationController.js`, `validTransitions`):

| De | Para |
|---|---|
| `PENDENTE` | `EM_ANALISE`, `APROVADA`, `REJEITADA`, `CANCELADA` |
| `EM_ANALISE` | `APROVADA`, `REJEITADA`, `CANCELADA` |
| `APROVADA`, `REJEITADA`, `CANCELADA` | nenhum (estados finais) |

Outras regras da candidatura:
- Um profissional só pode se candidatar **uma vez** por vaga (índice único `user_id + vacancy_id`).
- Ninguém se candidata à própria vaga.
- Ao criar, grava-se `expiration_date` = hoje + 30 dias. **Atenção:** nada no código usa essa data depois (ver seção 13).
- Não é possível mudar candidaturas de vagas `FINALIZADA` ou `CANCELADA`.

### 6.5 Regras de cadastro

- **Senha forte** (`passwordService.js`): mínimo 8 caracteres, com maiúscula, minúscula, número e um destes símbolos: `!@#$%^&*(),.?":{}|<>`.
- **Documento**: `CPF` e `CNPJ` validados pelos dígitos verificadores (biblioteca `cpf-cnpj-validator`). `Passaporte` só confere o tamanho (6 a 20 caracteres).
- E-mail e documento não podem se repetir.
- Profissional se cadastra com **CPF** (o app só oferece CPF). Empresa pode usar **CNPJ, CPF ou Passaporte**.

---

## 7. Os fluxos, passo a passo

### 7.1 Cadastro, verificação e login

```text
App/Web                         Backend                          E-mail
  │ POST /api/auth/register ───►│ valida dados (Zod)              │
  │                             │ confere CPF/CNPJ, senha forte   │
  │                             │ cria hash da senha (bcrypt)     │
  │                             │ gera código de 6 dígitos ───────►│ "Verifique seu e-mail"
  │◄── 201 + tokens ────────────│                                 │
  │ POST /api/auth/verify-email {code} ─►│ marca verified_email=1 │
  │ POST /api/auth/login ──────►│ confere status, verificação e senha
  │◄── accessToken (15m) + refreshToken (7d) + dados do usuário
```

- Sem SMTP configurado, o cadastro **não falha**: o código fica gravado na coluna `code_email_verification` da tabela `users` (`data/zircon.db`). Isso é útil em aula.
- O e-mail também traz um link `FRONTEND_WEB_URL/verify-email?code=...&email=...` que o painel web confirma sozinho.
- Os apps conferem o papel depois do login: o **web recusa PROFISSIONAL** (`AuthPage.tsx`) e o **mobile recusa quem não é PROFISSIONAL** (`login.tsx`).

### 7.2 Renovação automática da sessão

Quando o access token expira (15 min), o servidor responde **401**. Os dois apps têm um "interceptador" no Axios (`src/lib/api.ts`) que:
1. Pausa o pedido que falhou;
2. Chama `POST /api/auth/refresh` **uma única vez**, mesmo que vários pedidos falhem juntos (fila com `refreshingPromise`);
3. Repete o pedido original com o token novo;
4. Se a renovação falhar, apaga a sessão (logout).

### 7.3 Esqueci a senha

`POST /auth/forgot-password` gera um token aleatório de 64 caracteres, envia link `FRONTEND_WEB_URL/reset-password?token=...`. `POST /auth/reset-password` com `token`, `password` e `confirmPassword` troca a senha. A resposta não revela se o e-mail existe ("Se o e-mail existir, você receberá...").

### 7.4 Vida de uma vaga, de ponta a ponta

1. **Empresa** cria a vaga no painel (**+ Nova vaga**), podendo salvar como pausada.
2. **Profissional** vê a vaga no app (aba **Início**, lista infinita de 10 em 10), abre o detalhe e toca **Candidatar-se**.
3. **Backend** grava a candidatura `PENDENTE` e manda e-mail para a empresa com nome, e-mail, telefone e bio do profissional.
4. **Empresa** abre o candidato no painel: **Iniciar análise** → **Aprovar** ou **Rejeitar**. Cada mudança manda e-mail ao profissional.
5. **Empresa** clica em **Finalizar vaga**; os demais candidatos são rejeitados automaticamente e avisados.
6. Contato posterior: por e-mail/telefone, fora do sistema.

---

## 8. Backend por dentro (`backend-zircon`)

### 8.1 Organização em camadas

O backend segue uma arquitetura em **camadas** (também chamada de MVC sem o "V", porque quem desenha telas são os apps):

```text
pedido HTTP
   │
   ▼
app.js ─ helmet ─ cors ─ express.json ─ platformMiddleware   (portaria geral)
   │
   ▼
routes/       "qual endereço chama qual função"           (o mapa)
   │
   ▼
middlewares/  authMiddleware → requireRole → validate      (catracas)
   │
   ▼
controllers/  regras de negócio de cada ação               (o gerente)
   │
   ├──► services/  utilidades: token, senha, e-mail, upload, CPF/CNPJ
   │
   ▼
models/       consultas ao banco via Knex                  (o arquivista)
   │
   ▼
SQLite (data/zircon.db)
   │
   ▼
errorMiddleware  traduz qualquer erro em JSON padronizado   (SAC)
```

| Pasta / arquivo | Papel | Exemplo concreto |
|---|---|---|
| `src/server.js` | Liga o servidor, testa o banco (`SELECT 1`), desliga com elegância (`SIGINT/SIGTERM`, força em 10 s) | Imprime o quadro "🚀 Zircon API Server" |
| `src/app.js` | Monta o Express: segurança, CORS, JSON até 10 MB, arquivos estáticos `/uploads`, `/health`, rotas, 404 e erros | `app.use('/api/opportunities', opportunityRoutes)` |
| `src/config/` | Configurações lidas do `.env` | `jwt.js`, `email.js`, `multer.js`, `database.js` |
| `src/routes/` | Mapa de endereços | `router.post('/', authMiddleware, requireRole('EMPRESA','ADMIN'), validate(...), create)` |
| `src/middlewares/` | Checagens reutilizáveis | `authMiddleware` confere o token e se o usuário ainda está `ATIVO` |
| `src/validations/` | "Moldes" Zod de cada pedido | `job_title` entre 2 e 255 caracteres |
| `src/controllers/` | Regras de negócio | Transições de status, finalização de vaga |
| `src/services/` | Ferramentas | `passwordService.hash` (bcrypt, 12 rodadas) |
| `src/models/` | Acesso ao banco | `opportunityModel.findAll(filtros)` |
| `src/utils/apiResponse.js` | Formato padrão de listas paginadas | `{ data: { opportunities, pagination: { page, limit, total, totalPages, hasNext, hasPrev } } }` |
| `src/database/migrations/` | Criação das 3 tabelas + gatilhos `updated_at` | `20240101000001_create_users_table.js` |
| `src/database/seeds/` | Usuário admin inicial | **Apaga todos os dados** antes de inserir |
| `tests/integration.test.js` | ~40 testes ponta a ponta | Cadastro, login, papéis, finalização |
| `Zircon-Insomnia.json` | Coleção pronta para testar a API no Insomnia | 44 requisições, incluindo casos de erro (401, 403, 400, 404, 409) |
| `ZirconDB.dbml` | Desenho do banco para o site dbdiagram.io, com as regras de negócio comentadas | Base conceitual do projeto |

### 8.2 Formato padrão das respostas

Sucesso:
```json
{ "success": true, "message": "Vaga criada com sucesso", "data": { "opportunity": { "id": 1 } } }
```
Erro de validação:
```json
{ "success": false, "message": "Dados de entrada inválidos", "errors": [ { "field": "body.email", "message": "E-mail inválido" } ] }
```

### 8.3 Todos os endpoints (conferidos nas rotas)

Base: `http://localhost:3000/api`. "Token" = precisa do cabeçalho `Authorization: Bearer <accessToken>`.

**Autenticação (`/auth`)**

| Verbo | Rota | Acesso | Faz |
|---|---|---|---|
| POST | `/auth/register` | Público | Cadastra usuário |
| POST | `/auth/login` | Público | Entra e recebe tokens |
| POST | `/auth/verify-email` | Público | Confirma código de 6 dígitos |
| POST | `/auth/resend-verification` | Público | Reenvia código |
| POST | `/auth/forgot-password` | Público | Envia link de redefinição |
| POST | `/auth/reset-password` | Público | Redefine senha com o token |
| POST | `/auth/refresh` | Público | Troca refresh token por novos tokens |
| POST | `/auth/logout` | Token | Só responde "ok" (o app apaga os tokens) |
| GET | `/auth/me` | Token | Dados do usuário logado |

> O README do backend lista `PUT /auth/change-password`, mas **essa rota não existe**. A troca de senha é `PUT /users/password`.

**Usuários (`/users`)**

| Verbo | Rota | Acesso | Faz |
|---|---|---|---|
| GET | `/users/profile` | Token | Meu perfil |
| PUT | `/users/profile` | Token | Altera nome, bio, telefone |
| PUT | `/users/avatar` | Token | Envia foto (campo `avatar`, JPEG/PNG/WebP, até 5 MB) |
| PUT | `/users/password` | Token | Troca senha (`currentPassword`, `newPassword`, `confirmPassword`) |
| DELETE | `/users/account` | Token | Exclui minha conta (soft delete) |
| GET | `/users` | ADMIN | Lista usuários (filtros `user_type`, `status`, `search`) |
| GET | `/users/:id` | ADMIN | Um usuário |
| PUT | `/users/:id` | ADMIN | Altera qualquer campo (inclusive bloquear) |
| DELETE | `/users/:id` | ADMIN | Exclui (não deixa excluir a si mesmo) |

**Vagas (`/opportunities`)**

| Verbo | Rota | Acesso | Faz |
|---|---|---|---|
| GET | `/opportunities` | Público | Lista (padrão: só `ATIVA`; filtros `page`, `limit` até 100, `status`, `work_modality`, `company_sector`, `search`) |
| GET | `/opportunities/sectors` | Público | Lista de setores existentes |
| GET | `/opportunities/:id` | Público | Detalhe, com nome, e-mail e telefone da empresa |
| GET | `/opportunities/my` | EMPRESA/ADMIN | Minhas vagas |
| POST | `/opportunities` | EMPRESA/ADMIN | Cria vaga |
| PUT | `/opportunities/:id` | Dono ou ADMIN | Edita / muda status / finaliza |
| DELETE | `/opportunities/:id` | Dono ou ADMIN | Exclui (soft delete) |
| GET | `/opportunities/admin/all` | ADMIN | Todas as vagas, qualquer status |
| PUT | `/opportunities/admin/:id/status` | ADMIN | Muda status (inclui finalizar) |

**Candidaturas (`/applications`)**

| Verbo | Rota | Acesso | Faz |
|---|---|---|---|
| POST | `/applications` | PROFISSIONAL/ADMIN | Candidata-se (`{ "vacancy_id": 1 }`) |
| GET | `/applications/my` | PROFISSIONAL/ADMIN | Minhas candidaturas |
| GET | `/applications/:id` | Candidato, empresa dona ou ADMIN | Detalhe com dados do profissional, da vaga e da empresa |
| DELETE | `/applications/:id` | Candidato ou ADMIN | Cancela (muda para `CANCELADA`) |
| GET | `/applications/opportunity/:id` | Empresa dona ou ADMIN | Candidatos de uma vaga |
| PUT | `/applications/:id/status` | Empresa dona ou ADMIN | Muda status |
| GET | `/applications/admin/all` | ADMIN | Todas |

Fora do `/api`: `GET /health` (verificação de vida) e `GET /uploads/avatars/<arquivo>` (fotos).

### 8.4 O banco de dados

Três tabelas, criadas pelas migrations. Todas as datas são texto no formato ISO-8601 (ex.: `2024-01-01T00:00:00Z`).

```text
users (1) ────< opportunities (N)        uma empresa tem várias vagas
users (1) ────< applications  (N)        um profissional tem várias candidaturas
opportunities (1) ────< applications (N) uma vaga tem várias candidaturas
```

**`users`**: `id`, `email` (único), `verified_email` (0/1), `code_email_verification` (código ou token de redefinição), `password` (hash), `user_type`, `status`, `full_name`, `avatar_url`, `bio`, `phone_number`, `document_type`, `document_number`, `created_at`, `updated_at`, `deleted_at`.

**`opportunities`**: `id`, `user_id` (empresa), `company_sector`, `job_title`, `job_description`, `payment_value` (decimal 10,2), `benefits_text`, `work_modality`, `status`, datas.

**`applications`**: `id`, `user_id` (profissional), `vacancy_id` (vaga), `status`, `expiration_date`, datas. Índice único (`user_id`, `vacancy_id`).

Detalhes que valem estudo:
- **Chaves estrangeiras:** `RESTRICT` ao apagar usuário com vagas/candidaturas; `CASCADE` ao apagar vaga (leva as candidaturas). O `PRAGMA foreign_keys = ON` é ligado em cada conexão (`knexfile.js`), porque o SQLite vem com isso desligado.
- **Gatilhos (triggers):** `trg_users_updated_at`, `trg_opportunities_updated_at`, `trg_applications_updated_at` atualizam `updated_at` sozinhos a cada alteração.
- **Índices:** em quase toda coluna usada para filtrar (email, status, setor, datas, `deleted_at`), para buscas rápidas.
- **Diferença DBML × código:** no DBML a tabela se chama `oportunities` (com um "p"); nas migrations é `opportunities`. Vale corrigir o DBML.

### 8.5 Segurança implementada

| Camada | Como | Arquivo |
|---|---|---|
| Cabeçalhos de segurança | Helmet (com `crossOriginResourcePolicy: cross-origin` para as fotos abrirem nos apps) | `app.js` |
| Origem autorizada | CORS com lista de `CORS_ORIGIN` | `app.js` |
| Senhas | bcrypt com 12 rodadas; nunca devolvidas nas respostas (`USER_SELECT_FIELDS` não inclui `password`) | `passwordService.js`, `userModel.js` |
| Identidade | JWT assinado; a cada pedido o usuário é relido do banco e precisa estar `ATIVO` | `authMiddleware.js` |
| Permissão | `requireRole(...)` + checagem de "dono" dentro dos controllers | `roleMiddleware.js`, controllers |
| Dados de entrada | Zod com `.strict()` (rejeita campos desconhecidos) | `validations/` |
| Upload | Só JPEG/PNG/WebP, até 5 MB, nome aleatório | `config/multer.js` |
| Erros | Respostas padronizadas; `stack` só em `development` | `errorMiddleware.js` |
| Privacidade no "esqueci a senha" | Mesma resposta exista ou não o e-mail | `authController.js` |

### 8.6 E-mails automáticos (`emailService.js`)

| E-mail | Quando | Cor do cabeçalho |
|---|---|---|
| Verifique seu e-mail | Cadastro e reenvio | `#23899d` (azul-petróleo) |
| Redefinição de senha | Esqueci a senha | `#dc2626` (vermelho) |
| Nova candidatura | Profissional se candidata (vai para a empresa) | `#059669` (verde) |
| Status da candidatura | Empresa muda para Em análise (`#2563eb` azul), Aprovada (`#059669` verde) ou Rejeitada (`#dc2626` vermelho) | variável |

Todos em HTML simples, fonte Arial, largura máxima 600 px, rodapé "© 2024 Zircon".

### 8.7 Testes

- **Jest** roda os testes; **Supertest** faz pedidos HTTP "de mentira" ao `app` sem abrir porta.
- Usa um banco separado: `data/zircon.test.db` (`knexfile.js`, ambiente `test`).
- Gera CPF/CNPJ válidos na hora, cadastra empresa e profissional, lê o código de verificação direto do banco e testa: health, cadastro, duplicidade, CPF inválido, login, refresh, perfil, troca de senha, permissões por papel, CRUD de vagas, candidaturas, transições e a regra de finalização.
- `npm test` já roda com cobertura (`--coverage`). O comando usa `--experimental-vm-modules` porque o projeto usa módulos ES (`"type": "module"`).

### 8.8 Comandos e configuração

| Comando | Faz |
|---|---|
| `npm run dev` | Sobe com recarga automática (`node --watch`) |
| `npm start` | Sobe em modo normal |
| `npm run migrate` / `migrate:rollback` | Aplica / desfaz migrations |
| `npm run seed` | Cria o admin (**apaga dados existentes**) |
| `npm run db:reset` | Desfaz, refaz e popula |
| `npm test` / `test:watch` | Testes |
| `npm run lint` | ESLint (ver seção 13: não há arquivo de configuração na pasta copiada) |

Principais variáveis do `.env`: `PORT` (3000), `HOST` (`localhost`; use `0.0.0.0` para celular/emulador), `BASE_URL`, `DB_FILENAME`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`, `SMTP_HOST/PORT/SECURE/USER/PASS/FROM`, `FRONTEND_WEB_URL`, `FRONTEND_MOBILE_URL`, `UPLOAD_DIR`, `MAX_FILE_SIZE`, `ALLOWED_MIME_TYPES`, `CORS_ORIGIN`, `AUTO_MIGRATE`.

---

## 9. Painel Web por dentro (`web-zircon`)

### 9.1 Telas

| Rota | Tela | Quem |
|---|---|---|
| `/login`, `/verify-email`, `/reset-password` | `AuthPage.tsx`: login, cadastro de empresa, verificação por código (reenvio a cada 60 s), redefinição de senha, botão "Preencher Admin" | Público |
| `/dashboard` | `DashboardPage.tsx`: indicadores (vagas ativas, candidaturas, aguardando, aprovadas), candidaturas recentes, barras por status. Para ADMIN: totais da plataforma e distribuição de usuários | EMPRESA, ADMIN |
| `/vagas` | `VagasPage.tsx`: tabela de vagas, filtros por status, busca, pausar/reativar/finalizar/editar/excluir | EMPRESA, ADMIN |
| `/candidatos` | `CandidatosPage.tsx`: tabela de candidaturas com filtros; clique abre `ReviewDialog` | EMPRESA, ADMIN |
| `/usuarios` | `UsuariosPage.tsx`: lista, filtro por perfil, busca, bloquear/desbloquear | só ADMIN |
| `/configuracoes` | `ConfiguracoesPage.tsx`: perfil, avatar com barra de progresso, troca de senha, sessão (validade 15 min, renovar, sair, excluir conta) | EMPRESA, ADMIN |

Janelas (modais): `VagaDialog` (nova/editar vaga), `ReviewDialog` (avaliar candidato, com linha do tempo), `FinalizeVagaDialog` (escolher vencedor e confirmar).

Layout: `layouts/AppShell.tsx` (menu lateral, cabeçalho, botão de tema claro/escuro).

### 9.2 Como o código é organizado

| Pasta | Para quê |
|---|---|
| `src/lib/api.ts` | Cliente Axios: endereço base `/api` (ou `VITE_API_URL`), cabeçalho `x-platform: web`, token automático e renovação em 401 |
| `src/services/endpoints.ts` | Uma função para cada endpoint (`authApi`, `userApi`, `opportunityApi`, `applicationApi`) |
| `src/hooks/useZirconQueries.ts` | "Ganchos" do TanStack Query que buscam e guardam em cache (`useMyOpportunities`, `useAllApplications`, `useAdminUsers`) e mutações que invalidam o cache após alterar |
| `src/stores/` | Zustand: `authStore` (sessão, salva no `localStorage` como `zircon-web-auth`), `themeStore` (tema, `zircon-web-theme`), `uiStore` (avisos "toast" que somem em 3,5 s) |
| `src/lib/validation.ts` | Zod + `cpf-cnpj-validator` espelhando as regras do backend |
| `src/lib/format.ts` | Formatar R$ (`A combinar` quando vazio), datas pt-BR, iniciais, mascarar CPF (`•••.456.789-••`), rótulos e cores de status |
| `src/types/api.ts` | Tipos TypeScript de tudo que vem da API |
| `src/styles/classical.css` | Tokens de cor/fonte/espaço e classes (`.btn`, `.tag`, `.table`, `.dialog`...) |
| `vite.config.ts` | Porta 5173 e *proxy*: o que for `/api` ou `/uploads` é repassado para `localhost:3000` |

Proteção de rotas (`App.tsx`, `ProtectedRoute`): sem token vai para `/login`; PROFISSIONAL é mandado para `/login`; `/usuarios` só para ADMIN.

---

## 10. Aplicativo Mobile por dentro (`mobile-zircon`)

### 10.1 Telas (Expo Router: cada arquivo em `src/app/` é uma tela)

| Arquivo | Tela |
|---|---|
| `(auth)/welcome.tsx` | Boas-vindas: "Criar conta" ou "Já tenho conta" |
| `(auth)/register.tsx` | Cadastro do profissional (nome, CPF com máscara, e-mail, celular, senha) |
| `(auth)/verify.tsx` | Código de 6 dígitos, reenvio com contagem de 60 s |
| `(auth)/login.tsx` | Login e "Esqueci minha senha" (token + nova senha em modal) |
| `(tabs)/index.tsx` | **Início**: busca, chips de setor, lista infinita (10 por página), puxar para atualizar, marcador para salvar, selo "✓ Você se candidatou" |
| `(tabs)/salvas.tsx` | **Salvas**: vagas guardadas no aparelho |
| `(tabs)/candidaturas.tsx` | **Candidaturas**: andamento e cancelamento |
| `(tabs)/perfil.tsx` | **Perfil**: avatar pela galeria, bio, celular, tema claro/escuro, trocar senha, sair, excluir conta |
| `vaga/[id].tsx` | Detalhe da vaga, botão Candidatar-se com confirmação em painel inferior; mostra e-mail da empresa depois da candidatura |
| `empresa/[id].tsx` | Perfil da empresa e vagas abertas |
| `_layout.tsx` | Carrega fontes, mantém a tela de abertura (splash) até carregar, e redireciona: quem não é PROFISSIONAL logado vai para `welcome` |

As 4 abas usam ícones Lucide: `House`, `Bookmark`, `Briefcase` (com contador de candidaturas pendentes/em análise) e `User`.

### 10.2 Como o código é organizado

| Pasta | Para quê |
|---|---|
| `src/lib/api.ts` | Igual ao web, com `x-platform: mobile` e mensagem amigável quando o servidor não responde |
| `src/lib/format.ts` | Além das formatações, `getDefaultHost()`: descobre o IP do computador pelo Expo (`hostUri`), ou usa `10.0.2.2` no emulador Android (é o "localhost do computador" visto de dentro do emulador) |
| `src/stores/authStore.ts` | Sessão salva no **cofre do celular** (`expo-secure-store`); no navegador cai para `localStorage` |
| `src/stores/savedStore.ts` | Vagas salvas por usuário no `AsyncStorage` (`zircon-mobile-saved-v2`) |
| `src/stores/themeStore.ts`, `toastStore.ts` | Tema e avisos (2,8 s) |
| `src/hooks/useZirconQueries.ts` | `useInfiniteOpportunities` (paginação infinita), `useMyApplicationsQuery`, `useApplyMutation`, etc. |
| `src/components/ZirconUI.tsx` | Componentes visuais próprios: `ZirconMark` (logo), `Tag`, `EditorialButton`, campos, `ToastBanner`, modais |
| `src/components/VagaCard.tsx` | O card de vaga da lista |
| `src/constants/classical.ts` | Paletas clara e escura, nomes das fontes, raios |
| `app.json` | Nome "Zircon", esquema de link `zircon://`, plugins (router, splash, secure-store), `typedRoutes` e `reactCompiler` ligados |
| `AGENTS.md` | Instruções para assistentes de IA: sempre consultar a documentação da versão do Expo em uso, usar `npx expo install` |

---

## 11. Identidade visual: cores, formas, fontes, logo

### 11.1 A origem: design system "Classical"

Dentro de `Zircon marketplace design.zip` estão os protótipos (`Zircon Web.dc.html`, `Zircon Mobile.dc.html`, `Zircon Arquitetura.dc.html`) e o design system **Classical**. A proposta, nas palavras do `readme.md` do sistema:

> "Classical é um sistema editorial, com cara de livro, sobre um fundo quase branco suave: títulos em Cormorant Garamond sobre texto em Lora, colunas justificadas, linhas finas, e **cor aplicada como traço e não como preenchimento**."

Princípios (do mesmo readme):
- **Botões contornados**, nunca preenchidos com cor sólida.
- **Cards com borda**, sem fundo colorido.
- **Linhas finas (hairlines)** separando seções.
- **Sombras quase imperceptíveis** ("a elevação aqui é um sussurro").
- **Sem negrito pesado**: títulos no máximo seminegrito (600); quanto maior o texto, mais leve.
- **Números tabulares** (`tnum`) em tabelas e indicadores, para alinhar dígitos.
- Foco do teclado com contorno de 2 px na cor de destaque (nunca o azul padrão do navegador).
- Itens desabilitados com 45% de opacidade.

**Mudança importante:** o Classical original tem **um único destaque dourado `#b68235`**. Na implementação do Zircon (web e mobile), o destaque virou **azul-petróleo `#23899d`** com um **segundo destaque roxo `#7658b0`**. O protótipo `Zircon Web.dc.html` já contém as duas versões de paleta. O motivo da troca não está escrito; uma leitura possível é aproximar a cor da pedra zircão azul, mas isso é interpretação.

### 11.2 Paleta implementada (`web-zircon/src/styles/classical.css` e `mobile-zircon/src/constants/classical.ts`)

| Papel | Claro | Escuro | Uso |
|---|---|---|---|
| Fundo (`bg`) | `#f3f2f2` | `#1c1a1a` | Fundo geral (quase branco / quase preto quente) |
| Superfície (`surface`) | `#eae9e9` | `#262424` | Modais, toasts, "mat" das imagens |
| Texto | `#201f1d` | `#eeecea` | Texto principal |
| **Destaque** (`accent`) | **`#23899d`** | **`#5fc0d2`** | Botões, links, abas ativas, foco, logo |
| Destaque 100 | `#e2f4f8` | `#11363e` | Fundo de etiqueta "Ativa"/"Aprovada" |
| Destaque 600 / 700 / 800 | `#1a7182` / `#125866` / `#0c3f49` | `#8fd6e3` / `#9fdbe7` / `#c4ecf3` | Hover, texto sobre fundo claro |
| **Destaque 2** (`accent-2`) | **`#7658b0`** | **`#a68ce0`** | Segundo traço do logo, etiquetas "Em análise", "Finalizada", "Empresa" |
| Destaque 2 100 / 700 / 800 | `#efe9fa` / `#4d3483` / `#372460` | `#2c2344` / `#cdbdf2` / `#e0d6fa` | Fundos e textos das etiquetas roxas |
| Divisória | texto com 16% de opacidade | texto com 15% | Linhas finas e bordas |
| Neutros 100–900 | `#f8f4f4` → `#2d2b2b` | ajustados | Etiquetas neutras, sombras |
| Perigo (`z-danger`) | `#b0432c` | `#e8907a` | Excluir, erros |

**Etiquetas de status** (`format.ts`):

| Status | Cor |
|---|---|
| Vaga Ativa, Candidatura Aprovada, Usuário Ativo, Profissional | azul-petróleo (accent) |
| Em análise, Finalizada, Empresa | roxo (accent-2) |
| Pendente, Cancelada, Inativo | neutro (cinza) |
| Pausada, Rejeitada, Bloqueado, Admin | só contorno azul-petróleo |

**Cores que não seguem a paleta** (sobras do modelo inicial do Expo, em `app.json`): fundo do ícone adaptativo Android `#E6F4FE` e fundo da tela de abertura `#208AEF`. Os e-mails usam cores próprias (seção 8.6).

### 11.3 Tipografia

| Uso | Fonte | Pesos | Onde vem |
|---|---|---|---|
| Títulos e botões | **Cormorant Garamond** (serifada, elegante, de inspiração clássica) | 400 e 600 | Google Fonts no web (`index.html`); `@expo-google-fonts/cormorant-garamond` no mobile |
| Texto corrido | **Lora** (serifada feita para leitura em tela) | 400 e 600 | Google Fonts / `@expo-google-fonts/lora` |
| Alternativa | Georgia, serif | — | Se a fonte não carregar |

Escala do web: h1 40 px, h2 32 px (ambos peso 400), h3 25, h4 20, h5 16, h6 12 px em caixa alta com espaçamento. Corpo 14 px, altura de linha 1,55.

### 11.4 Formas e espaçamento

- **Cantos:** raios de 2, 4 e 7 px. Quase retos, para lembrar papel impresso.
- **Espaçamento:** escala de 4,6 / 9,2 / 13,8 / 18,4 / 27,6 / 36,8 px (múltiplos de 4 × 1,15, a "densidade 1.15×" do Classical, um layout mais arejado).
- **Sombras:** `sm`, `md`, `lg` muito suaves, tingidas com o tom do texto.
- **Botões:** `.btn-primary` (contorno azul-petróleo, fundo transparente, 12% de tinta no hover), `.btn-secondary` (contorno cinza), `.btn-ghost` (só texto), `.btn-danger` (contorno vermelho), `.btn-icon` (36×36 px).
- **Imagens `.plate`:** leve tom sépia, moldura da cor da superfície e contorno fino, como uma foto colada num livro.
- **Tabelas:** cabeçalho em caixa alta pequena, linhas separadas por traço fino, leve destaque ao passar o mouse.

### 11.5 Logo (`ZirconMark`)

Um **quadrado girado 45°** (losango) com **borda azul-petróleo**, envolvido por um **segundo contorno roxo**, sem preenchimento. Remete a uma pedra lapidada vista de cima e aplica o princípio "cor como traço". Existe no web (`components/ZirconMark.tsx`) e no mobile (`components/ZirconUI.tsx`). Os ícones de app em `assets/images/` (`icon.png`, `logo-glow.png`) não foram inspecionados em detalhe aqui.

### 11.6 Ícones e tema escuro

- Ícones: **Lucide** (`lucide-react` no web, `lucide-react-native` no mobile), traço fino (as abas usam `strokeWidth 1.6`).
- **Tema escuro** nos dois apps, ligado por botão, lembrado no aparelho. No web, aplica `data-theme="dark"` e troca as variáveis CSS.

---

## 12. Catálogo de tecnologias e bibliotecas (com links oficiais)

Formato: **o que é** · **analogia** · **para que o Zircon usa** · **versão no `package.json`**.

### 12.1 Fundamentos (valem para tudo)

| Tecnologia | O que é / para que serve aqui | Documentação |
|---|---|---|
| **JavaScript** | A linguagem da web; usada no backend | https://developer.mozilla.org/pt-BR/docs/Web/JavaScript |
| **TypeScript** | JavaScript com tipos; usado no web (`^5.7.2`) e mobile (`~6.0.3`) | https://www.typescriptlang.org/docs/ |
| **HTTP / REST** | A "língua" entre apps e servidor | https://developer.mozilla.org/pt-BR/docs/Web/HTTP |
| **JSON** | Formato dos dados trocados | https://developer.mozilla.org/pt-BR/docs/Learn/JavaScript/Objects/JSON |
| **CORS** | Regra do navegador sobre quem pode chamar a API | https://developer.mozilla.org/pt-BR/docs/Web/HTTP/CORS |
| **npm** | Instalador de pacotes | https://docs.npmjs.com/ |
| **Git** | Controle de versões (não há pasta `.git` na cópia analisada) | https://git-scm.com/doc |

### 12.2 Backend (`backend-zircon/package.json`)

| Biblioteca | Versão | O que é · analogia · uso no Zircon | Documentação |
|---|---|---|---|
| **Node.js** | `>=24` | Motor que roda JavaScript fora do navegador. *O "motor" do servidor.* Usa `--watch` para recarregar | https://nodejs.org/docs/latest/api/ |
| **Express** | `^4.19.2` | Framework web minimalista. *A recepção que encaminha cada pedido.* Rotas e middlewares | https://expressjs.com/pt-br/ · API 4.x: https://expressjs.com/en/4x/api.html |
| **SQLite** | (via `sqlite3`) | Banco de dados em um arquivo só. *Um fichário dentro de uma pasta.* | https://www.sqlite.org/docs.html |
| **sqlite3** | `^5.1.7` | "Driver" que liga o Node ao SQLite | https://github.com/TryGhost/node-sqlite3 |
| **Knex.js** | `^3.1.0` | Construtor de consultas SQL + migrations + seeds. *Tradutor de JavaScript para SQL.* | https://knexjs.org/guide/ · migrations: https://knexjs.org/guide/migrations.html |
| **jsonwebtoken** | `^9.0.2` | Cria e confere JWT. *Fábrica e leitor de crachás.* | https://github.com/auth0/node-jsonwebtoken · conceito: https://jwt.io/introduction |
| **bcryptjs** | `^2.4.3` | Hash de senhas. *O moedor de café.* 12 rodadas | https://github.com/dcodeIO/bcrypt.js |
| **helmet** | `^7.1.0` | Cabeçalhos HTTP de segurança. *Capacete do servidor.* | https://helmetjs.github.io/ |
| **cors** | `^2.8.5` | Middleware de CORS. *Lista de convidados.* | https://expressjs.com/en/resources/middleware/cors.html |
| **dotenv** | `^16.4.5` | Lê o arquivo `.env`. *Abre o cofre de configurações.* | https://github.com/motdotla/dotenv |
| **Zod** | `^3.23.8` | Validação por "moldes" (schemas). *Gabarito de prova.* | https://zod.dev (o site mostra a v4; o backend usa a v3) |
| **cpf-cnpj-validator** | `^1.0.3` | Valida dígitos de CPF e CNPJ | https://www.npmjs.com/package/cpf-cnpj-validator |
| **Multer** | `^1.4.5-lts.1` | Recebe arquivos enviados (`multipart/form-data`). *O protocolo de recebimento de encomendas.* Fotos de avatar | https://github.com/expressjs/multer |
| **Nodemailer** | `^6.9.13` | Envia e-mails por SMTP. *O carteiro.* | https://nodemailer.com/ |
| **Jest** | `^29.7.0` (dev) | Executor de testes | https://jestjs.io/pt-BR/docs/getting-started · ESM: https://jestjs.io/docs/ecmascript-modules |
| **Supertest** | `^7.0.0` (dev) | Faz pedidos HTTP de teste ao Express | https://github.com/ladjs/supertest |
| **ESLint** | `^9.2.0` (dev) | Revisor automático de estilo e erros | https://eslint.org/docs/latest/ |

Ferramentas de apoio do backend:

| Ferramenta | Uso | Documentação |
|---|---|---|
| **Insomnia** | Testar a API com a coleção `Zircon-Insomnia.json` | https://developer.konghq.com/insomnia/ |
| **DBML / dbdiagram.io** | Desenhar o banco (`ZirconDB.dbml`, `ZirconDB.dbdiagram`) | https://dbml.dbdiagram.io/docs |
| **Mailtrap / senha de app do Gmail** | Citados no README como opções de SMTP em desenvolvimento | https://mailtrap.io/ · https://support.google.com/accounts/answer/185833 |

### 12.3 Painel Web (`web-zircon/package.json`)

| Biblioteca | Versão | O que é · analogia · uso no Zircon | Documentação |
|---|---|---|---|
| **React** | `^18.3.1` | Biblioteca para montar telas com componentes. *Lego de telas.* | https://pt-br.react.dev/ |
| **react-dom** | `^18.3.1` | Liga o React ao navegador | https://react.dev/reference/react-dom |
| **Vite** | `^6.0.5` (dev) | Servidor de desenvolvimento e empacotador. *A cozinha que prepara e serve rápido.* Porta 5173 e proxy | https://vite.dev/guide/ |
| **@vitejs/plugin-react** | `^4.3.4` (dev) | Suporte a React no Vite | https://github.com/vitejs/vite-plugin-react |
| **Tailwind CSS v4** + **@tailwindcss/vite** | `^4.0.0` (dev) | CSS por classes utilitárias. Importado em `classical.css`; o visual principal vem das classes e variáveis próprias | https://tailwindcss.com/docs |
| **React Router** (`react-router-dom`) | `^7.1.1` | Navegação entre páginas e rotas protegidas | https://reactrouter.com/ |
| **TanStack Query** | `^5.62.7` | Busca, cache e atualização de dados do servidor. *Garçom que lembra o seu pedido.* | https://tanstack.com/query/latest/docs/framework/react/overview |
| **TanStack Table** | `^8.20.6` | Lógica de tabelas (ordenar, filtrar). Usado em Vagas, Candidatos e Usuários | https://tanstack.com/table/latest/docs/introduction |
| **Zustand** | `^5.0.2` | Estado global simples com `persist`. *Quadro de avisos da casa.* | https://zustand.docs.pmnd.rs/ |
| **Axios** | `^1.7.9` | Cliente HTTP com interceptadores. *O mensageiro.* | https://axios-http.com/docs/intro |
| **Zod** | `^3.24.1` | Validação dos formulários | https://zod.dev |
| **cpf-cnpj-validator** | `^1.0.3` | Valida documento antes de enviar | https://www.npmjs.com/package/cpf-cnpj-validator |
| **lucide-react** | `^0.468.0` | Ícones | https://lucide.dev/guide/packages/lucide-react |
| **Google Fonts** | — | Cormorant Garamond e Lora | https://fonts.google.com/specimen/Cormorant+Garamond · https://fonts.google.com/specimen/Lora |

### 12.4 App Mobile (`mobile-zircon/package.json`)

| Biblioteca | Versão | O que é · uso no Zircon | Documentação |
|---|---|---|---|
| **Expo** (SDK 58) | `~58.0.24` | Plataforma que facilita criar apps React Native. *Kit completo com ferramentas já ligadas.* | https://docs.expo.dev/ · versão usada: https://docs.expo.dev/versions/v58.0.0/ (link indicado no `AGENTS.md`) |
| **React Native** | `0.88.1` | React para telas nativas de Android/iOS | https://reactnative.dev/docs/getting-started |
| **React** | `19.3.0` | Base de componentes | https://react.dev/ |
| **Expo Router** | `~58.0.31` | Navegação por arquivos (`src/app/`), abas e pilha | https://docs.expo.dev/router/introduction/ |
| **Expo Go** | — | App para abrir o projeto no celular sem compilar | https://expo.dev/go |
| **expo-secure-store** | `~58.0.3` | Cofre criptografado do aparelho; guarda os tokens | https://docs.expo.dev/versions/latest/sdk/securestore/ |
| **@react-native-async-storage/async-storage** | `2.2.0` | Armazenamento simples; vagas salvas e tema | https://react-native-async-storage.github.io/async-storage/ |
| **expo-image-picker** | `~58.0.10` | Abre a galeria para escolher a foto | https://docs.expo.dev/versions/latest/sdk/imagepicker/ |
| **expo-font** + **@expo-google-fonts/cormorant-garamond** / **lora** | `~58.0.12`, `^0.4.x` | Carrega as fontes | https://docs.expo.dev/versions/latest/sdk/font/ · https://github.com/expo/google-fonts |
| **expo-splash-screen** | `~58.0.14` | Tela de abertura até carregar fontes e sessão | https://docs.expo.dev/versions/latest/sdk/splash-screen/ |
| **expo-status-bar** | `~58.0.5` | Cor da barra de status (claro/escuro) | https://docs.expo.dev/versions/latest/sdk/status-bar/ |
| **expo-constants** | `~58.0.16` | Lê o `hostUri` para achar o IP do backend | https://docs.expo.dev/versions/latest/sdk/constants/ |
| **react-native-safe-area-context** | `~5.11.1` | Respeita entalhe e barras do celular | https://rnsac.appandflow.com/ |
| **react-native-screens**, **gesture-handler**, **reanimated**, **worklets** | várias | Base de navegação, gestos e animações usada pelo Expo Router | https://docs.swmansion.com/react-native-gesture-handler/ · https://docs.swmansion.com/react-native-reanimated/ |
| **react-native-svg** | `15.16.0` | Desenho vetorial (usado pelos ícones Lucide) | https://github.com/software-mansion/react-native-svg |
| **lucide-react-native** | `^1.72.0` | Ícones | https://lucide.dev/guide/packages/lucide-react-native |
| **TanStack Query** | `^5.107.1` | Cache e lista infinita (`useInfiniteQuery`) | https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries |
| **Zustand** | `^5.1.0` | Estado global com `persist` | https://zustand.docs.pmnd.rs/ |
| **Axios** | `^1.21.1` | Cliente HTTP | https://axios-http.com/docs/intro |
| **Zod** | `^4.6.7` | Validação (v4, diferente da v3 do backend/web) | https://zod.dev |
| **cpf-cnpj-validator** | `^2.1.2` | Valida CPF (v2, diferente da v1 do backend/web) | https://www.npmjs.com/package/cpf-cnpj-validator |
| **react-native-web** / **react-dom** | `~0.21.4` / `19.3.0` | Permite abrir o app no navegador (`expo start --web`) | https://necolas.github.io/react-native-web/ |

Pacotes presentes no `package.json` mas **não importados diretamente** no `src/` (a maioria veio do modelo inicial do Expo): `@expo/ui`, `expo-device`, `expo-glass-effect`, `expo-image`, `expo-symbols`, `expo-web-browser`. Outros, como `expo-linking` e `expo-system-ui`, são usados indiretamente pelo Expo Router/plataforma.

Rede do emulador Android (`10.0.2.2`): https://developer.android.com/studio/run/emulator-networking

---

## 13. Pontos a melhorar (o que ficou de fora)

Todos os itens abaixo foram verificados no código. Estão em ordem de prioridade dentro de cada grupo. Servem como "próximos passos" e também como material de aula sobre o que um produto real precisa.

### 13.1 Segurança (prioridade alta)

1. **Qualquer pessoa pode se cadastrar como ADMIN.** O schema de cadastro aceita `user_type: 'ADMIN'` (`validations/authSchemas.js`) e a rota é pública. Correção: aceitar só `EMPRESA` e `PROFISSIONAL` no cadastro.
2. **O e-mail e o telefone da empresa são públicos na API.** `GET /opportunities/:id` não exige login e devolve `company_email` e `company_phone` (`opportunityModel.findByIdWithCompany`). A regra "o profissional só vê o e-mail da empresa depois de se candidatar" existe apenas na tela do app.
3. **A separação web/mobile por papel é só visual.** O backend identifica `x-platform`, mas o middleware `requirePlatform` nunca é usado. Um profissional consegue usar a API "de web" por fora das telas.
4. **Códigos de verificação e tokens de redefinição não expiram.** O e-mail diz "expira em 10 minutos" e "1 hora", e `config/email.js` tem `verificationExpiry`/`resetExpiry`, mas ninguém usa esses valores.
5. **O código de verificação é procurado sem o e-mail.** `findByVerificationCode(code)` busca só pelo código de 6 dígitos; com muitos usuários pendentes, dois podem ter o mesmo código, e o código de um pode confirmar outra conta. Também permite tentativa por força bruta.
6. **Token de redefinição reaproveita a coluna do código de e-mail** (`code_email_verification`), misturando dois propósitos.
7. **Sem limite de tentativas (rate limit)** em login, verificação e "esqueci a senha". O próprio README sugere `express-rate-limit` (https://github.com/express-rate-limit/express-rate-limit).
8. **Segredos padrão no código:** se o `.env` faltar, os tokens são assinados com `default-access-secret-change-me` (`config/jwt.js`).
9. **Logout não invalida nada no servidor** (comentário em `authController.logout`). Um refresh token roubado vale 7 dias.
10. **Cadastro já devolve tokens** antes de o e-mail ser verificado (o login exige verificação, mas o cadastro não).
11. **Dados do usuário entram sem escape no HTML dos e-mails** (`emailService.js`): um nome ou bio com HTML pode alterar o e-mail recebido.
12. **No web, os tokens ficam no `localStorage`**, vulnerável se algum script malicioso rodar na página. Alternativa usual: cookie `httpOnly`.
13. **A migration de `users` define senha padrão `'Senha123!'` em texto puro** como valor *default* da coluna.
14. **Admin pode alterar documento sem validação** de CPF/CNPJ (`adminUpdateUser`).

### 13.2 Bugs e regras incompletas

1. **Perfil da empresa no app mostra vagas de todas as empresas.** O app envia `user_id` para `GET /opportunities`, o schema aceita, mas o controller `list` ignora esse filtro.
2. **Expiração de candidatura não funciona.** `expiration_date` é gravada (+30 dias), mas nenhuma rotina cancela candidaturas vencidas, como o DBML prevê.
3. **Health check sempre responde "ok".** `/health` devolve `database: 'ok'` e `uploads: 'ok'` fixos, sem testar nada (o manual diz que ele confirma o SQLite).
4. **Paginação de usuários quebrada:** `userModel.findAll` ignora `page`/`limit`, e `count` ignora `search`. Os números de página não batem com a lista.
5. **Candidatos por vaga sem paginação nem filtro:** `listByOpportunity` busca todos e ignora `status`, embora devolva `pagination`.
6. **Finalizar vaga não é transação:** atualiza a vaga e depois rejeita as candidaturas em passos separados; uma falha no meio deixa dados inconsistentes. O Knex tem transações (https://knexjs.org/guide/transactions.html).
7. **Conta excluída "prende" o e-mail:** o soft delete mantém o e-mail na coluna única; recadastrar com o mesmo e-mail dá erro 409.
8. **Seed apaga tudo** (`del()` nas três tabelas) antes de criar o admin. Rodar `npm run seed` num banco com dados reais perde tudo.
9. **Fotos antigas não são apagadas** ao trocar o avatar.
10. **ADMIN pode criar vagas e se candidatar**, contrariando o DBML (seção 6.1).
11. Rodapé dos e-mails com ano fixo "© 2024".

### 13.3 Desempenho

1. **Muitas chamadas em sequência (N+1):** o web busca candidaturas vaga por vaga e, para admin, busca o detalhe de cada candidatura (`useAllApplications`); o mobile faz o mesmo em `useMyApplicationsQuery`. Com 100 candidaturas são 101 pedidos.
2. **Limites fixos de 100** nas listas do web: acima disso, itens somem.
3. **Busca com `LIKE '%texto%'`** não usa índice; para muitos registros, o SQLite tem busca de texto completo (FTS5: https://www.sqlite.org/fts5.html).
4. **SQLite** é ótimo para aula e protótipo, mas limita acessos simultâneos de escrita. Produção normalmente usaria PostgreSQL ou MySQL (o Knex permite trocar com pouca mudança).

### 13.4 Qualidade de código e manutenção

1. **Código duplicado entre web e mobile** (`api.ts`, `endpoints.ts`, `types/api.ts`, `validation.ts`, `format.ts`). O protótipo de arquitetura previa um pacote compartilhado `@zircon/core` que não foi criado.
2. **Versões diferentes das mesmas bibliotecas:** Zod 3 (backend/web) × Zod 4 (mobile); `cpf-cnpj-validator` 1 × 2.
3. **Backend em JavaScript puro**, sem tipos, enquanto os apps usam TypeScript.
4. **Sem testes nos frontends** (nem unitários, nem de tela).
5. **`npm run lint`** existe no backend e no web, mas não há arquivo de configuração do ESLint na cópia analisada.
6. **Restos do modelo do Expo:** `scripts/reset-project.js`, imagens `react-logo*`, `expo-logo`, `tutorial-web.png`, `global.css` com fontes não usadas, cores `#208AEF`/`#E6F4FE` no `app.json`, e pacotes não usados (seção 12.4).
7. **Muito estilo inline:** o web tem cerca de 270 `style={{...}}` contra cerca de 200 `className`. O Tailwind está instalado mas pouco aproveitado; o protótipo previa shadcn/ui no web e NativeWind/gluestack-ui no mobile.
8. **Arquivos grandes:** `AuthPage.tsx` tem 816 linhas, misturando login, cadastro, verificação e redefinição.

### 13.5 Documentação inconsistente

1. README cita `PUT /auth/change-password` (não existe; é `PUT /users/password`).
2. README cita licença MIT e "see LICENSE file", mas só o mobile tem `LICENSE`.
3. README do backend em inglês; os demais em português.
4. DBML chama a tabela de `oportunities`; o banco usa `opportunities`.
5. DBML e README falam de `schema.sql`, que não existe (os gatilhos estão nas migrations).
6. O manual diz que o health check confirma o banco; não confirma (13.2-3).
7. Os arquivos `.env.example` citados nos READMEs não estavam na cópia analisada (podem existir na sua máquina, pois arquivos ocultos às vezes não são copiados).

### 13.6 Funcionalidades previstas e não feitas

1. **Chat interno** entre empresa e profissional (DBML: "implementação futura").
2. **Profissional usando também a web** (DBML: "implementação futura: também mexer pelo web").
3. **Vagas salvas no servidor** (hoje só no aparelho; trocar de celular perde a lista).
4. **Expiração automática** de candidaturas (13.2-2).
5. **Atualização otimista** nas mudanças de status (o protótipo previa; o código só invalida o cache e busca de novo).
6. **Notificações push** no celular (hoje só e-mail).
7. **Deploy:** README sugere Docker, PM2, nginx e backup do SQLite, mas não há `Dockerfile` nem configuração de produção.

---

## 14. Trilha de estudos: do nada ao avançado

Cada etapa tem objetivo, o que ler e um exercício usando o próprio Zircon.

### Nível 0: Como a internet funciona (1 a 2 dias)
- **Objetivo:** entender cliente, servidor, HTTP, JSON.
- **Leia:** MDN "Como a Web funciona": https://developer.mozilla.org/pt-BR/docs/Learn/Getting_started_with_the_web/How_the_Web_works · Visão geral do HTTP: https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Overview
- **Exercício:** com o backend rodando, abra `http://localhost:3000/health` e `http://localhost:3000/api/opportunities` no navegador. Identifique `success`, `data` e `pagination`.

### Nível 1: JavaScript básico (1 a 2 semanas)
- **Leia:** https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide (variáveis, funções, objetos, arrays, `async/await`, módulos `import/export`).
- **Exercício:** leia `src/services/passwordService.js` e explique cada `if` de `validateStrength`.

### Nível 2: Node.js e Express (1 semana)
- **Leia:** https://nodejs.org/learn · https://expressjs.com/pt-br/starter/hello-world.html · middlewares: https://expressjs.com/pt-br/guide/using-middleware.html
- **Exercício:** siga o caminho de `POST /api/opportunities` desde `app.js` até `opportunityModel.create`, anotando cada middleware.

### Nível 3: Banco de dados, SQL, SQLite e Knex (1 semana)
- **Leia:** https://www.sqlite.org/lang.html · https://knexjs.org/guide/query-builder.html · https://knexjs.org/guide/migrations.html
- **Exercício:** abra `data/zircon.db` com o DB Browser for SQLite (https://sqlitebrowser.org/) e encontre o `code_email_verification` de um usuário recém-cadastrado. Cole o `ZirconDB.dbml` em https://dbdiagram.io para ver o diagrama.

### Nível 4: Testar API com Insomnia (2 dias)
- **Leia:** https://developer.konghq.com/insomnia/
- **Exercício:** importe `Zircon-Insomnia.json`, faça login como admin e execute os casos de erro (401, 403, 409). Relacione cada um ao código de status do glossário.

### Nível 5: Segurança web (1 semana)
- **Leia:** JWT: https://jwt.io/introduction · OWASP armazenamento de senhas: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html · OWASP Top 10: https://owasp.org/www-project-top-ten/ · Helmet: https://helmetjs.github.io/
- **Exercício:** cole um access token em https://jwt.io e veja o conteúdo (`id`, `email`, `user_type`, `exp`). Depois corrija o item 13.1-1 (cadastro como ADMIN) e escreva um teste que prove a correção.

### Nível 6: Validação com Zod (2 dias)
- **Leia:** https://zod.dev (atenção à versão: v3 no backend/web, v4 no mobile; guia de mudanças: https://zod.dev/v4/changelog)
- **Exercício:** em `opportunitySchemas.js`, descubra o que acontece se você enviar um campo extra (`.strict()`).

### Nível 7: Testes automatizados (3 dias)
- **Leia:** https://jestjs.io/pt-BR/docs/getting-started · https://github.com/ladjs/supertest
- **Exercício:** rode `npm test` e leia o relatório de cobertura em `coverage/`. Escreva um teste para o bug 13.2-1 (filtro `user_id`).

### Nível 8: React e o painel web (2 semanas)
- **Leia:** https://pt-br.react.dev/learn · https://vite.dev/guide/ · https://reactrouter.com/start/declarative/installation · TanStack Query: https://tanstack.com/query/latest/docs/framework/react/quick-start · Zustand: https://zustand.docs.pmnd.rs/getting-started/introduction
- **Exercício:** em `App.tsx`, explique o `ProtectedRoute`. Em `lib/api.ts`, explique por que existe `refreshingPromise`.

### Nível 9: CSS, design system e acessibilidade (1 semana)
- **Leia:** variáveis CSS: https://developer.mozilla.org/pt-BR/docs/Web/CSS/Using_CSS_custom_properties · `color-mix()`: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix · Tailwind v4: https://tailwindcss.com/docs · contraste WCAG: https://www.w3.org/WAI/WCAG21/quickref/
- **Exercício:** troque `--color-accent` em `classical.css` pelo dourado original `#b68235` e veja o painel inteiro mudar.

### Nível 10: React Native e Expo (2 semanas)
- **Leia:** https://reactnative.dev/docs/getting-started · https://docs.expo.dev/tutorial/introduction/ · https://docs.expo.dev/router/introduction/ · SecureStore: https://docs.expo.dev/versions/latest/sdk/securestore/
- **Exercício:** rode o app no emulador Android, descubra por que o endereço `10.0.2.2` funciona (https://developer.android.com/studio/run/emulator-networking) e mude `HOST=0.0.0.0` no backend.

### Nível 11: Avançado (contínuo)
- **Arquitetura e monorepo:** criar o `@zircon/core` compartilhado (npm workspaces: https://docs.npmjs.com/cli/using-npm/workspaces).
- **Produção:** Docker (https://docs.docker.com/get-started/), PM2 (https://pm2.keymetrics.io/docs/usage/quick-start/), nginx (https://nginx.org/en/docs/), PostgreSQL (https://www.postgresql.org/docs/).
- **Publicação do app:** EAS Build (https://docs.expo.dev/build/introduction/).
- **Exercício final:** resolver três itens da seção 13.1 com testes.

---

## 15. Roteiro para explicar ao grande público

### 15.1 Versão de 30 segundos (elevador)

> "O Zircon é um mercado de vagas de trabalho remoto. Empresas publicam vagas por um site; profissionais procuram e se candidatam pelo celular. Um servidor central guarda tudo, confere quem é quem e avisa todo mundo por e-mail a cada passo, do cadastro até a contratação."

### 15.2 Versão de 5 minutos (apresentação)

1. **O problema (30 s):** trabalho remoto cresceu; empresas e profissionais precisam de um lugar simples para se encontrar.
2. **A solução (1 min):** três peças. Um site para empresas, um app para profissionais, um servidor que liga os dois. Mostre os prints `web-zircon/docs/images/04-empresa-dashboard.png` e `mobile-zircon/docs/images/05-inicio-vagas.png`.
3. **A jornada (1 min 30 s):** empresa publica → profissional encontra e se candidata → empresa recebe e-mail, analisa, aprova → finaliza a vaga, e os demais são avisados automaticamente.
4. **Confiança (1 min):** e-mail confirmado por código, CPF/CNPJ conferidos, senha forte guardada de forma irreversível, sessões que expiram em 15 minutos.
5. **O visual (30 s):** inspiração em livros e revistas: fontes serifadas, linhas finas, cor só nos contornos, azul-petróleo e roxo, modo escuro. O logo é um losango, como uma pedra lapidada.
6. **Próximos passos (30 s):** chat interno, vagas salvas na nuvem, notificações no celular, reforços de segurança.

### 15.3 Perguntas frequentes (com respostas baseadas no código)

| Pergunta | Resposta |
|---|---|
| "É seguro?" | Tem as proteções básicas certas (senha com hash, tokens que expiram, validação de documentos, cabeçalhos de segurança). Como todo projeto em fase de protótipo, há reforços listados para antes de ir ao ar (seção 13.1). |
| "Meus dados ficam onde?" | Num banco SQLite no servidor (`data/zircon.db`). Fotos ficam numa pasta do servidor (`uploads/avatars`). |
| "Posso usar só pelo navegador sendo profissional?" | Hoje não: o profissional usa o app. Está previsto como futuro. |
| "As empresas veem meu CPF?" | No painel, o CPF aparece mascarado (`•••.456.789-••`). Para a empresa vão nome, bio, e-mail e telefone. |
| "E se eu esquecer a senha?" | Há "Esqueci a senha", com link por e-mail. |
| "Tem chat?" | Ainda não. Depois da aprovação, o contato é por e-mail ou telefone. |
| "Funciona offline?" | Não para buscar e se candidatar. As vagas salvas e o tema ficam guardados no aparelho. |
| "Quanto custa?" | O código não tem nenhuma parte de pagamento ou planos. |

### 15.4 Analogia completa para palestras

> Pense num **restaurante**. O **cardápio** é a API. O **salão** com mesas elegantes é o painel web, onde as empresas se sentam. O **delivery** é o app do celular, para os profissionais. A **cozinha** é o backend: só ela mexe nos ingredientes (o banco de dados), confere quem pagou (o crachá JWT) e manda o motoboy avisar o cliente (os e-mails). O **gerente** (administrador) circula por tudo e pode barrar quem se comportar mal.

---

## 16. Como rodar o sistema (resumo)

Pré-requisitos: **Node.js 24+** e npm. Para o celular: **Expo Go** (https://expo.dev/go) ou emulador Android.

```bash
# 1) Backend (terminal 1)
cd backend-zircon
npm install
cp .env.example .env        # no PowerShell: Copy-Item .env.example .env
npm run migrate
npm run seed                # cria admin@admin.com / Senha123! (apaga dados existentes)
npm run dev                 # http://localhost:3000

# 2) Painel Web (terminal 2)
cd web-zircon
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173

# 3) App Mobile (terminal 3)
cd mobile-zircon
npm install
cp .env.example .env        # em celular físico: EXPO_PUBLIC_API_URL=http://SEU_IP:3000/api
npx expo start
```

Para o celular ou emulador acessarem o backend: `HOST=0.0.0.0` no `.env` do backend e porta 3000 liberada no Firewall do Windows. Sem SMTP, pegue o código de verificação na coluna `code_email_verification` do banco.

Manuais com prints: [backend-zircon/MANUAL.md](./backend-zircon/MANUAL.md) · [web-zircon/MANUAL.md](./web-zircon/MANUAL.md) · [mobile-zircon/MANUAL.md](./mobile-zircon/MANUAL.md)

---

## 17. Arquivos consultados

- Raiz: `README.md`
- Backend: `README.md`, `MANUAL.md`, `package.json`, `knexfile.js`, `jest.config.js`, `ZirconDB.dbml`, `Zircon-Insomnia.json`, `Zircon marketplace design.zip` (readme e `styles.css` do Classical, `Zircon Arquitetura.dc.html`, paletas de `Zircon Web.dc.html`), todo o `src/` (app, server, config, routes, middlewares, controllers, services, models, validations, utils, migrations, seeds) e `tests/integration.test.js`
- Web: `README.md`, `MANUAL.md`, `package.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/lib/*`, `src/services/endpoints.ts`, `src/hooks/useZirconQueries.ts`, `src/stores/*`, `src/types/api.ts`, `src/styles/classical.css`, `src/components/ZirconMark.tsx`, trechos de `src/pages/*`
- Mobile: `README.md`, `MANUAL.md`, `AGENTS.md`, `package.json`, `app.json`, `tsconfig.json`, `src/global.css`, `src/constants/classical.ts`, `src/lib/*`, `src/stores/*`, `src/hooks/useZirconQueries.ts`, `src/app/_layout.tsx`, `src/app/index.tsx`, `src/app/(tabs)/_layout.tsx`, `src/components/ZirconUI.tsx`, trechos de `vaga/[id].tsx`, `empresa/[id].tsx`, `(auth)/login.tsx`, `(auth)/verify.tsx`, `(tabs)/perfil.tsx`

*Guia gerado em 12/11/2026 a partir do estado atual da pasta.*
