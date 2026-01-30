# Controle de VT Provisorios

App Next.js (App Router) com TypeScript, TailwindCSS e shadcn/ui.

## Como rodar
```bash
npm i
npm run dev
```
Abra http://localhost:3000.

## Variaveis de ambiente
Crie `.env.local`:
```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
ALLOWED_EMAILS=usuario@empresa.com,outra@empresa.com
# ou
ALLOWED_DOMAIN=empresa.com
ADMIN_EMAILS=admin@empresa.com
SHEETS_SPREADSHEET_ID=...
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
DRIVE_FOLDER_ID=...
LOW_BALANCE_THRESHOLD=50
ENABLE_SEED=false
```

Notas:
- `NEXTAUTH_SECRET` e obrigatorio para assinar sessoes.
- `ALLOWED_EMAILS` ou `ALLOWED_DOMAIN` libera acesso.
- `ADMIN_EMAILS` controla acesso ao `/admin`.
- `GOOGLE_PRIVATE_KEY` deve manter `\n` escapados.

## Saude e seed
- Health check: `GET /api/health` (Sheets + Drive).
- Seed do schema:
  1) Defina `ENABLE_SEED=true`.
  2) `POST /api/admin/seed`.
  3) O endpoint cria abas ausentes e adiciona headers se a linha 1 estiver vazia.

## Validacao de env
- As variaveis sao validadas na inicializacao do servidor (Zod).
- Mensagens claras sao exibidas se algo estiver faltando.

## Google Cloud (Service Account)
1) Crie um projeto no Google Cloud Console.
2) Habilite as APIs:
   - Google Sheets API
   - Google Drive API
3) Crie uma Service Account e gere uma chave JSON.
4) Copie:
   - `client_email` -> `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` -> `GOOGLE_PRIVATE_KEY` (com `\n` escapados)

## Compartilhamentos obrigatorios
- Planilha: compartilhe com `GOOGLE_SERVICE_ACCOUNT_EMAIL` (acesso Editor).
- Pasta do Drive: compartilhe com `GOOGLE_SERVICE_ACCOUNT_EMAIL` (acesso Editor).
- Use o id da planilha em `SHEETS_SPREADSHEET_ID`.
- Use o id da pasta em `DRIVE_FOLDER_ID`.

## OAuth Google (Login)
Configure o OAuth no Google Cloud:
- Authorized redirect URI (dev):
  `http://localhost:3000/api/auth/callback/google`
- Em producao, adicione o dominio do deploy.

## Deploy na Vercel
1) Crie um projeto e configure todas as variaveis de ambiente.
2) Garanta que o dominio de producao esteja no OAuth.
3) Execute `npm run build` localmente para validar.

Variaveis na Vercel (Production):
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- NEXTAUTH_SECRET
- ALLOWED_EMAILS ou ALLOWED_DOMAIN
- ADMIN_EMAILS
- SHEETS_SPREADSHEET_ID
- GOOGLE_SERVICE_ACCOUNT_EMAIL
- GOOGLE_PRIVATE_KEY
- DRIVE_FOLDER_ID
- LOW_BALANCE_THRESHOLD
- ENABLE_SEED

## Seguranca
- Credenciais e chaves ficam apenas no server.
- Nenhuma chave deve ser usada em componentes client-side.

## Estrutura
- `src/app`: rotas e layouts
- `src/components`: UI
- `src/server`: integracoes (Sheets/Drive) e regras server-side
- `docs`: documentacao de schema do Sheets

## Build
```bash
npm run build
npm run start
```
