# Zircon Web

Painel web do marketplace **Zircon**, voltado para **Empresas** (publicação e gestão de vagas, triagem e avaliação de candidaturas) e **Administradores** (visão geral da plataforma, moderação de vagas e gestão de usuários).

## Stack

- **React 18 + Vite + TypeScript**
- **Tailwind CSS v4** + tokens do sistema editorial **Classical (Zircônia)** em [classical.css](src/styles/classical.css)
- **React Router v7** com rotas protegidas por papel (`EMPRESA` e `ADMIN`)
- **TanStack Query v5** + **TanStack Table v8**
- **Zustand** (sessão, tema claro/escuro e toasts)
- **Axios** com cabeçalho `x-platform: web` e renovação automática de JWT (`POST /api/auth/refresh` em fila única)
- **Zod** + `cpf-cnpj-validator` espelhando as validações de `backend-zircon`

## Como executar

1. Certifique-se de que o `backend-zircon` esteja rodando em `http://localhost:3000`:
   ```bash
   cd ../backend-zircon
   npm install
   cp .env.example .env
   npm run migrate
   npm run seed
   npm run dev
   ```
2. Configure o frontend web:
   ```bash
   cp .env.example .env
   npm install
   npm run dev
   ```
3. Acesse `http://localhost:5173`.
   - O Vite já faz proxy de `/api` e `/uploads` para `http://localhost:3000`.
   - Seed padrão de administrador: `admin@admin.com` / `Senha123!`.
   - Contas `PROFISSIONAL` são bloqueadas no painel web e orientadas a utilizar o aplicativo mobile Expo.
