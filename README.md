# Projeto Zircon — Marketplace de Trabalho Remoto

Plataforma de vagas e serviços com foco em oportunidades **home office**, composta por três subprojetos independentes nesta pasta:

```text
projeto-zircon/
├── backend-zircon/   # API REST em Node.js + Express + SQLite (Knex)
├── web-zircon/       # Painel Web em React + Vite (Empresas e Administradores)
└── mobile-zircon/    # Aplicativo Mobile em React Native + Expo Router (Profissionais)
```

## Manuais do Usuário (Passo a Passo com Prints)

- **Backend (API & E-mails)**: [backend-zircon/MANUAL.md](./backend-zircon/MANUAL.md)
- **Painel Web (Empresas & Admin)**: [web-zircon/MANUAL.md](./web-zircon/MANUAL.md)
- **App Mobile Expo (Profissionais)**: [mobile-zircon/MANUAL.md](./mobile-zircon/MANUAL.md)

---

## Tecnologias Utilizadas

### Backend (`backend-zircon`)
- **Runtime & Framework**: Node.js (`>=24.0.0`), Express (`^4.19.2`)
- **Banco de Dados**: SQLite (`sqlite3`) com Knex.js (`^3.1.0`) para migrations e seeds
- **Autenticação & Segurança**: JWT (`jsonwebtoken` — Access Token `15m` + Refresh Token `7d`), `bcryptjs`, `helmet`, `cors`
- **Validação & Documentos**: Zod (`^3.23.8`), `cpf-cnpj-validator` (`^1.0.3`)
- **Upload & E-mail**: Multer (`^1.4.5-lts.1`) para avatares locais (`<= 5 MB`) e Nodemailer (`^6.9.13`) para SMTP
- **Testes**: Jest (`^29.7.0`) e Supertest (`^7.0.0`)

### Web (`web-zircon`)
- **Framework & Build**: React (`^18.3.1`), Vite (`^6.0.5`), TypeScript (`^5.7.2`)
- **Estilização & Ícones**: Tailwind CSS v4 (`@tailwindcss/vite`), sistema visual **Classical (Zircônia)** com fontes `Cormorant Garamond` e `Lora`, e `lucide-react`
- **Roteamento & Estado**: React Router v7 (`react-router-dom`), TanStack Query v5 (`@tanstack/react-query`), TanStack Table v8 (`@tanstack/react-table`), Zustand (`^5.0.2`)
- **HTTP & Validação**: Axios (`^1.7.9` com header `x-platform: web` e refresh automático em `401`), Zod (`^3.24.1`) e `cpf-cnpj-validator`

### Mobile (`mobile-zircon`)
- **Framework & Roteamento**: Expo (`~58.0.24`), React Native (`0.88.1`), React (`19.3.0`), Expo Router (`~58.0.31`), TypeScript
- **Tipografia & Ícones**: `@expo-google-fonts/cormorant-garamond`, `@expo-google-fonts/lora`, `lucide-react-native`
- **Estado & Armazenamento**: TanStack Query v5 (`useInfiniteQuery`), Zustand, `expo-secure-store` (tokens JWT), `@react-native-async-storage/async-storage` (vagas salvas e tema)
- **Recursos Nativos**: `expo-image-picker` (seleção/envio de avatar)
- **HTTP & Validação**: Axios (com header `x-platform: mobile` e refresh automático em `401`), Zod e `cpf-cnpj-validator`

---

## Pré-requisitos

- **Node.js 24+** e **npm**
- Para o aplicativo mobile: **Expo Go** no celular, **Android Studio** (emulador) ou **Xcode** (iOS, macOS)

---

## Como Instalar e Rodar

### 1. Backend (`backend-zircon`)

Entre na pasta `backend-zircon`, instale as dependências, configure o `.env`, execute as migrations e popule o banco com o usuário inicial:

```bash
cd backend-zircon
npm install
cp .env.example .env
npm run migrate
npm run seed
npm run dev
```

> **Windows (PowerShell)**: caso use `Copy-Item .env.example .env` no lugar de `cp`:
> ```powershell
> Copy-Item .env.example .env
> ```

O servidor iniciará em `http://localhost:3000` (health check em `http://localhost:3000/health` e API em `http://localhost:3000/api`).

> **Nota sobre e-mail (SMTP) em desenvolvimento**:
> As variáveis `SMTP_*` em `backend-zircon/.env` determinam o envio dos códigos de verificação de e-mail e recuperação de senha. Caso ainda não tenha um servidor SMTP configurado (como Mailtrap ou Gmail App Password), o cadastro não falha — o código de 6 dígitos fica salvo na coluna `code_email_verification` da tabela `users` em `backend-zircon/data/zircon.db`.

---

### 2. Painel Web (`web-zircon`)

Com o backend rodando na porta `3000`, abra um novo terminal na raiz `projeto-zircon`:

```bash
cd web-zircon
npm install
cp .env.example .env
npm run dev
```

Acesse `http://localhost:5173`.
- O arquivo `vite.config.ts` já possui proxy para `/api` e `/uploads` apontando para `http://localhost:3000`.
- O `backend-zircon` já libera `http://localhost:5173` na configuração padrão de `CORS_ORIGIN`.

---

### 3. Aplicativo Mobile (`mobile-zircon`)

Com o backend rodando na porta `3000`, abra um novo terminal na raiz `projeto-zircon`:

```bash
cd mobile-zircon
npm install
cp .env.example .env
npx expo start
```

Configuração da URL da API (`mobile-zircon/.env`) e rede no backend:
- Para aceitar conexões do emulador ou de outro dispositivo na rede local, garanta que `backend-zircon/.env` esteja com `HOST=0.0.0.0` (com `HOST=localhost`, o Node aceita apenas conexões locais `127.0.0.1`) e que o Firewall do Windows libere a porta `3000`.
- **Emulador Android**: se `EXPO_PUBLIC_API_URL` não for alterada ou estiver com `localhost`, o cliente detecta automaticamente o host do Expo ou utiliza `http://10.0.2.2:3000/api`.
- **Dispositivo físico / emulador na rede (Expo Go)**: edite `mobile-zircon/.env` e informe o IP local da sua máquina na mesma rede Wi-Fi:
  ```env
  EXPO_PUBLIC_API_URL=http://192.168.0.X:3000/api
  EXPO_PUBLIC_UPLOADS_BASE_URL=http://192.168.0.X:3000
  ```
- **Web via Expo (`npx expo start --web`)**: caso rode o Expo no navegador em outra porta, adicione a origem em `CORS_ORIGIN` no `backend-zircon/.env`.

---

## Usuário Inicial (Seed)

Ao executar `npm run seed` no `backend-zircon`, o sistema cria automaticamente a conta administradora padrão:

| Campo | Valor |
|---|---|
| **E-mail** | `admin@admin.com` |
| **Senha** | `Senha123!` |
| **Perfil (`user_type`)** | `ADMIN` |
| **Status** | `ATIVO` (e-mail já verificado) |

> Na tela de login do **Painel Web**, há o botão **"Preencher Admin"** para preencher essas credenciais rapidamente.

---

## Como Usar

O Zircon divide os fluxos por tipo de usuário:

### A. Administrador (`ADMIN` — Painel Web)
1. Acesse `http://localhost:5173` e entre com `admin@admin.com` / `Senha123!`.
2. **Dashboard**: acompanhe métricas globais (usuários ativos, empresas, profissionais e vagas ativas).
3. **Usuários**: filtre por perfil (`Empresas`, `Profissionais`, `Admin`), busque por nome/e-mail/documento e bloqueie ou reative contas.
4. **Vagas**: visualize todas as vagas da plataforma e altere o status diretamente (`Ativa`, `Pausada`, `Finalizada`, `Cancelada`).
5. **Candidaturas**: acompanhe todas as candidaturas e abra os detalhes para análise.

### B. Empresa (`EMPRESA` — Painel Web)
1. Na tela inicial do `web-zircon`, clique em **Cadastrar empresa**.
2. Escolha o tipo de documento (`CNPJ`, `CPF` ou `Passaporte` — validado no cliente e no servidor), informe razão social, e-mail, telefone e senha (mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial).
3. Confirme o **código de 6 dígitos** enviado para o e-mail cadastrado.
4. Após entrar:
   - **Minhas vagas**: clique em **+ Nova vaga** para publicar oportunidades (`HOME_OFFICE`, `HIBRIDO` ou `PRESENCIAL`), pausar, reativar, editar ou excluir.
   - **Candidatos**: clique em qualquer candidatura para visualizar o perfil completo do profissional (bio, e-mail, telefone) e alterar o status:
     - `PENDENTE` → `EM_ANALISE`, `APROVADA` ou `REJEITADA`
     - `EM_ANALISE` → `APROVADA` ou `REJEITADA`
   - **Configurações**: atualize nome, telefone, bio, envie um avatar (`JPEG`, `PNG` ou `WebP` até 5 MB), altere sua senha ou gerencie a sessão.

### C. Profissional (`PROFISSIONAL` — App Mobile Expo)
> Contas de profissional são orientadas exclusivamente ao app mobile (`web-zircon` bloqueia login de `PROFISSIONAL`), assim como contas `EMPRESA`/`ADMIN` são bloqueadas no app mobile.

1. Abra o app no Expo Go ou emulador e toque em **Criar conta**.
2. Preencha nome completo, **CPF válido**, e-mail, celular e senha forte.
3. Insira o **código de verificação de 6 dígitos** enviado ao seu e-mail e faça login.
4. Navegue pelas 4 abas:
   - **Início**: pesquise vagas por título/palavra-chave, filtre por setor, puxe a lista para atualizar e role para carregar mais páginas.
   - **Detalhe da vaga / Empresa**: toque em uma vaga para ver remuneração, benefícios, perfil da empresa e enviar candidatura (**Candidatar-se**). O e-mail da empresa fica visível após a candidatura.
   - **Salvas**: guarde vagas favoritas no aparelho tocando no ícone de marcador.
   - **Candidaturas**: acompanhe o andamento (`Enviada` → `Em análise` → `Aprovada`/`Rejeitada`) ou cancele candidaturas em aberto.
   - **Perfil**: altere foto de avatar pela galeria, edite bio/celular, alterne entre **tema claro e escuro**, troque a senha, encerre a sessão ou exclua a conta.

---

## Scripts Úteis

| Projeto | Comando | Descrição |
|---|---|---|
| `backend-zircon` | `npm run dev` | Inicia API com auto-reload |
| `backend-zircon` | `npm run migrate` / `npm run seed` | Executa migrations e cria usuário admin |
| `backend-zircon` | `npm run db:reset` | Reseta banco, roda migrations e seed |
| `backend-zircon` | `npm test` | Executa testes de integração com Jest |
| `web-zircon` | `npm run dev` / `npm run build` | Inicia Vite (`5173`) ou gera build de produção |
| `mobile-zircon` | `npx expo start` | Inicia o servidor Metro/Expo |
| `mobile-zircon` | `npx tsc --noEmit` | Verifica tipagem TypeScript |
