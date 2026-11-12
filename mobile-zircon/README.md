# Zircon Mobile (Expo)

Aplicativo mobile em **React Native + Expo Router** do marketplace **Zircon**, voltado para **Profissionais** em busca de vagas home office.

## Stack

- **Expo SDK 58 + Expo Router + TypeScript**
- **Sistema visual Classical (Zircônia)** com fontes `Cormorant Garamond` e `Lora` e suporte a tema claro/escuro
- **TanStack Query v5** (`useInfiniteQuery` com pull-to-refresh e paginação infinita)
- **Zustand** + **expo-secure-store** (tokens JWT), **AsyncStorage** (vagas salvas localmente e tema)
- **Axios** com cabeçalho `x-platform: mobile` e renovação automática de token (`POST /api/auth/refresh`)
- **Zod** + `cpf-cnpj-validator` espelhando as validações de `backend-zircon`
- **expo-image-picker** para upload de avatar (`PUT /api/users/avatar`)

## Como executar

1. Certifique-se de que o `backend-zircon` esteja rodando na porta `3000`:
   ```bash
   cd ../backend-zircon
   npm install
   cp .env.example .env
   npm run migrate
   npm run seed
   npm run dev
   ```
2. Configure o app mobile:
   ```bash
   cp .env.example .env
   # Em dispositivo físico na rede local, ajuste EXPO_PUBLIC_API_URL para http://SEU_IP_LOCAL:3000/api
   npm install
   npx expo start
   ```
   - No Emulador Android, caso `EXPO_PUBLIC_API_URL` não seja definido, o cliente detecta automaticamente o host do Expo ou utiliza `http://10.0.2.2:3000/api`.
   - Contas `EMPRESA` e `ADMIN` são orientadas a utilizar o painel `web-zircon`.
