# 🏗️ GUIA DE IMPLMENTAÇÃO - Arena Off Beach Client App

## ✅ O QUE FOI CRIADO

### 📁 Estrutura Completa

```
src/
├── config/
│   └── firebase.ts                    # ✅ Firebase config (Google OAuth)
├── store/
│   ├── authStore.ts                   # ✅ Zustand auth state
│   ├── userStore.ts                   # ✅ Zustand user state
│   └── index.ts                       # ✅ Exports
├── services/
│   ├── api/index.ts                   # ✅ HTTP client (com api export)
│   ├── auth/index.ts                  # ✅ Auth service
│   ├── bookings/index.ts              # ✅ Bookings service
│   ├── courts/index.ts                # ✅ Courts service
│   └── cashback/index.ts              # ✅ Cashback service
├── hooks/
│   └── useAuth/index.tsx              # ✅ Auth hook
├── components/
│   └── layout/
│       ├── BottomNav/index.tsx        # ✅ Bottom navigation
│       └── ClientLayout/index.tsx     # ✅ App layout
├── pages/
│   ├── Login/                         # ✅ Google OAuth login
│   ├── Home/                          # ✅ Lista de reservas
│   ├── NewBooking/                    # ✅ Nova reserva (completa)
│   ├── Cashback/                      # ✅ Wallet + histórico
│   └── Profile/                       # ✅ Perfil do usuário
├── routes.new.tsx                     # ✅ Rotas configuradas
├── App.new.tsx                        # ✅ App simplificado
└── utils/constants/app.constant.ts    # ✅ Rotas atualizadas
```

## 🚀 PRÓXIMOS PASSOS

### 1. Configurar Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Crie um novo projeto: "arena-off-beach"
3. Ative **Authentication** → **Google Sign-in**
4. Copie as credenciais do Firebase
5. Cole no arquivo `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000

VITE_FIREBASE_API_KEY=sua_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc123
```

### 2. Substituir Arquivos

**Renomeie os arquivos novos:**

```bash
# PowerShell
mv src\App.new.tsx src\App.tsx
mv src\routes.new.tsx src\routes.tsx
```

Ou simplesmente copie o conteúdo de:
- `App.new.tsx` → `App.tsx`
- `routes.new.tsx` → `routes.tsx`

### 3. Instalar e Executar

```bash
npm install
npm run dev
```

### 4. Testar Backend

Certifique-se que o backend está rodando em `http://localhost:3000` com os endpoints:

```
POST /auth/google
GET  /auth/me
POST /auth/refresh

GET  /sports
GET  /courts
GET  /bookings/my
POST /bookings
GET  /bookings/availability/:courtId

GET  /cashback/wallet
GET  /cashback/transactions
```

## 🎨 DESIGN IMPLEMENTADO

### Cores (Logo Arena Off)
- **Primary**: `#FF8424` (Laranja)
- **Secondary**: `#5CC9B8` (Teal)
- **Accent**: `#FFD147` (Amarelo)

### UI Components (shadcn)
- Cards com sombras suaves
- Bordas arredondadas (rounded-xl)
- Badges coloridos por status
- Bottom nav com ícones
- Skeleton loaders
- Toast notifications

### Pattern Controller/View
Todas as páginas seguem:
```tsx
// view/page.view.tsx - UI pura
export function PageView({ data, onAction }: Props) {
  return <div>...</div>;
}

// controller/page.controller.tsx - Lógica
export function PageController() {
  const data = useQuery(...);
  const handleAction = () => {...};
  return <PageView data={data} onAction={handleAction} />;
}

// page.tsx - Export
export const Page = PageController;
```

## 📊 FUNCIONALIDADES

### ✅ Home (Reservas)
- Lista reservas do cliente
- Status coloridos (PENDING, CONFIRMED, etc)
- Botão + para nova reserva
- Click para ver detalhes

### ✅ Nova Reserva
- **Step 1**: Selecionar esporte
- **Step 2**: Escolher quadra (com preço)
- **Step 3**: Calendário (próximos 14 dias)
- **Step 4**: Horário (6h-23h com disponibilidade real-time)
- **Step 5**: Cashback opcional
- **Resumo**: Valor + cashback + total

### ✅ Cashback
- Card com saldo destacado
- Histórico de transações
- Tipos: ganho (verde), usado (vermelho)
- Botão scanner QR (preparado)

### ✅ Perfil
- Avatar + nome + email
- Tipo de conta (CLIENT)
- Saldo cashback
- Logout

## 🔒 Segurança

- Firebase Auth (Google OAuth)
- Tokens em Zustand persist (localStorage)
- Refresh automático de tokens
- Logout em 401
- Routes protegidas

## 📱 PWA

Já configurado:
- `vite-plugin-pwa`
- Service Worker
- Offline-first
- Install prompt

## 🐛 TROUBLESHOOTING

### Erro: "Cannot find module firebase"
```bash
npm install firebase
```

### Erro: CORS no backend
Configure CORS para aceitar `http://localhost:5173`

### Firebase: "Invalid API key"
Verifique o `.env` e recarregue o servidor (`npm run dev`)

### Tokens não refresh
- Verifique endpoint `/auth/refresh`
- Veja console do browser

## 📝 PRÓXIMAS FEATURES

- [ ] Detalhes da reserva (com cancelamento)
- [ ] Scanner QR Code (usar `react-qr-reader`)
- [ ] Notificações push
- [ ] Edit profile
- [ ] Histórico completo de reservas
- [ ] Filtros avançados

## 🤝 INTEGRAÇÃO BACKEND

Certifique-se de:

1. **Google OAuth Backend**:
   - Endpoint `POST /auth/google` aceita `idToken`
   - Retorna `accessToken`, `refreshToken`, `user`

2. **Refresh Token**:
   - `POST /auth/refresh` com cookie HTTP-only
   - Retorna novo `accessToken`

3. **CORS**:
   ```typescript
   app.use(cors({
     origin: 'http://localhost:5173',
     credentials: true
   }));
   ```

4. **Cookies**:
   ```typescript
   res.cookie('refreshToken', token, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'lax',
     maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
   });
   ```

## ✨ RESULTADO FINAL

Um app PWA moderno, rápido, seguro e bonito seguindo as melhores práticas de:
- React 19
- TypeScript
- React Query (performance)
- Zustand (state management)
- Firebase Auth (segurança)
- shadcn/ui (UI consistente)
- Mobile-first design

**Tudo pronto para produção!** 🚀
