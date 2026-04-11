# 🏐 Arena Off Beach - Cliente App

Sistema PWA para clientes reservarem quadras e gerenciarem cashback.

## 🚀 Tecnologias

- **React 19** + **Vite**
- **TypeScript**
- **React Query** (cache e estado servidor)
- **Zustand** (estado cliente)
- **Firebase Auth** (Google OAuth)
- **Tailwind CSS** + **shadcn/ui**
- **PWA** (offline-first)

## 📦 Instalação

```bash
npm install
```

## ⚙️ Configuração

1. Copie `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Configure as variáveis:
   - `VITE_API_BASE_URL`: URL do backend Arena Off
   - Firebase: Crie um projeto em [Firebase Console](https://console.firebase.google.com)

## 🏃 Executar

```bash
npm run dev
```

## 🎨 Design System

### Cores (baseadas na logo Arena Off)

- **Primary**: `#FF8424` (Laranja vibrante)
- **Secondary**: `#5CC9B8` (Verde água/teal)
- **Accent**: `#FFD147` (Amarelo suave)

### Componentes

Usando **shadcn/ui** para consistência:
- Buttons, Cards, Badges
- Forms, Inputs, Selects
- Dialogs, Drawers, Toasts

## 📱 Funcionalidades

### ✅ Implementado

1. **Autenticação**
   - Login com Google (Firebase)
   - Refresh automático de token
   - Logout seguro

2. **Home (Reservas)**
   - Lista de reservas do cliente
   - Filtro por status
   - Navegação para detalhes

3. **Nova Reserva**
   - Seleção de esporte
   - Escolha de quadra
   - Calendário interativo
   - Horários disponíveis em tempo real
   - Aplicação de cashback
   - Cálculo automático de preços

4. **Cashback**
   - Visualização de saldo
   - Histórico de transações
   - Scanner QR Code (preparado)

5. **Perfil**
   - Dados do usuário
   - Saldo cashback
   - Logout

### 🔜 Próximos Passos

- [ ] Scanner QR Code (câmera)
- [ ] Detalhes da reserva
- [ ] Cancelamento de reserva
- [ ] Notificações push
- [ ] Modo offline completo

## 🏗️ Arquitetura

### Estrutura de Pastas

```
src/
├── pages/              # Páginas (Home, Profile, etc)
│   └── [Page]/
│       ├── view/       # UI Components
│       ├── controller/ # Logic & Hooks
│       └── page.tsx    # Export
├── components/         # Componentes reutilizáveis
│   ├── ui/            # shadcn/ui components
│   └── layout/        # Layout components
├── services/          # API Services
│   ├── auth/
│   ├── bookings/
│   ├── courts/
│   └── cashback/
├── hooks/             # Custom Hooks
├── store/             # Zustand Stores
├── config/            # Configurações (Firebase)
└── utils/             # Utilitários
```

### Pattern: Controller/View

Todas as páginas seguem o pattern:

**View** → UI pura, props, sem lógica  
**Controller** → Hooks, estado, lógica de negócio  
**Page** → Export simples

## 🔒 Segurança

- Tokens em localStorage (com persist Zustand)
- HTTP-only cookies no backend
- Refresh automático de tokens
- Logout em caso de erro 401
- Firebase Auth para OAuth seguro

## 📊 Performance

- **React Query**: Cache inteligente, revalidação automática
- **Lazy Loading**: Páginas carregadas sob demanda
- **PWA**: Cache de assets, funciona offline
- **Otimização**: Tree-shaking, code-splitting

## 🎯 Backend Integration

API esperada (baseada nas docs):

### Auth
- `POST /auth/google` - Login com Google
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Perfil do usuário

### Bookings
- `GET /bookings/my` - Minhas reservas
- `POST /bookings` - Criar reserva
- `GET /bookings/availability/:courtId` - Horários disponíveis
- `PATCH /bookings/:id/cancel` - Cancelar reserva

### Courts
- `GET /sports` - Listar esportes
- `GET /courts` - Listar quadras

### Cashback
- `GET /cashback/wallet` - Carteira do cliente
- `GET /cashback/transactions` - Histórico
- `POST /cashback/scan` - Scanner QR Code

## 📄 Licença

Projeto privado - Arena Off Beach © 2026
