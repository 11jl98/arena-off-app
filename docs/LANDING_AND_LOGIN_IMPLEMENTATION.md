# Sistema de Landing Page e Login - Arena Off Beach

## 📋 Visão Geral

Implementação de um sistema de landing page institucional com lógica inteligente de redirecionamento baseado no modo de instalação PWA.

## 🎯 Funcionalidades Implementadas

### 1. Landing Page Institucional (`/src/pages/Landing/`)

Página inicial que apresenta a arena e suas funcionalidades, seguindo o padrão arquitetural do projeto:

**Estrutura:**
```
Landing/
├── landing.page.tsx          # Entry point
├── controller/
│   └── landing.controller.tsx # Controller
└── view/
    └── landing.view.tsx       # View component
```

**Seções da Landing Page:**

1. **Hero Section**
   - Logo animado da arena
   - Título principal com call-to-action
   - Badges de benefícios (Segurança, 24/7, Social, Instantâneo)
   - Botões: "Começar Agora" e "Saiba Mais"

2. **Features Cards** (3 cards principais)
   - **Reservas Online**: Sistema 24h com confirmação instantânea
   - **Cashback Automático**: 5% de retorno em consumos
   - **Promoções Exclusivas**: Horários promocionais e bônus

3. **CTA Section**
   - Chamada para ação principal
   - Destaque para sistema de cashback

4. **Como Funciona** (4 passos)
   - Login com Google
   - Escolha da quadra
   - Reserve e jogue
   - Ganhe cashback

5. **Localização**
   - Card com informações de contato
   - Telefone e e-mail
   - Endereço da arena

6. **Footer**
   - Links de navegação
   - Redes sociais (Instagram, Facebook)
   - Copyright

**Design:**
- Gradientes em tons de laranja (#FF8424, #FF6B35, #FF5722)
- Totalmente responsivo (mobile-first)
- Animações suaves (hover, transitions)
- Ícones do Lucide React
- Interface moderna com Tailwind CSS

### 2. Sistema de Roteamento Inteligente

**Lógica de Redirecionamento:**

```typescript
// Rotas Públicas (PublicRoute)
- Se usuário autenticado → redireciona para /home
- Se não autenticado → permite acesso

// Rotas Protegidas (ProtectedRoute)
- Se autenticado → permite acesso
- Se não autenticado:
  - PWA instalado → redireciona para /login
  - Não instalado → redireciona para /landing
```

**Rotas Configuradas:**

```typescript
ROUTES = {
  LANDING: '/',           // Landing page institucional
  LOGIN: '/login',        // Página de login
  HOME: '/home',          // Home do cliente
  CASHBACK: '/cashback',  // Cashback
  PROFILE: '/profile',    // Perfil
  EDIT_PROFILE: '/edit-profile'
}
```

### 3. Detecção de Dispositivo e PWA

**Hook `useDeviceDetection`:**
- Detecta se app está instalado (modo standalone)
- Identifica tipo de dispositivo (iOS, Android)
- Monitora mudanças no display mode

**Lógica:**
```typescript
const isStandalone = 
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;
```

### 4. Serviço de Autenticação

**Criado: `/src/services/auth.ts`**

Endpoints implementados:
- `signInWithGoogle()` - Login com Google OAuth
- `getProfile()` - Obter perfil do usuário
- `signOut()` - Logout
- `refreshToken()` - Renovar token

**Interface de Resposta:**
```typescript
interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'CLIENT' | 'EMPLOYEE' | 'ADMIN';
    avatarUrl?: string;
    isBlocked: boolean;
  };
  accessToken: string;
  refreshToken: string;
}
```

### 5. Layout do Cliente

**Criado: `/src/components/layout/ClientLayout/index.tsx`**

Layout base para páginas autenticadas:
- Wrapper principal com altura mínima (min-h-dvh)
- Suporte a safe areas (pb-safe)
- Background padrão
- Outlet para renderizar rotas filhas

## 🏗️ Arquitetura

### Padrão de Estrutura de Páginas

Todas as páginas seguem a mesma estrutura:

```
PageName/
├── page-name.page.tsx          # Entry point (exporta Controller)
├── controller/
│   └── page-name.controller.tsx # Lógica de negócio
├── view/
│   └── page-name.view.tsx       # Componente visual
├── components/                  # Componentes específicos da página
│   └── ComponentName.tsx
└── hooks/                       # Hooks customizados da página
    └── useCustomHook.tsx
```

### Separação de Responsabilidades

1. **Page (Entry Point)**
   - Apenas re-exporta o controller
   - Usado nas rotas

2. **Controller**
   - Lógica de negócio
   - Chamadas de API
   - Estado da página
   - Renderiza a View

3. **View**
   - Apenas apresentação
   - Recebe props do controller
   - Sem lógica de negócio

4. **Components**
   - Componentes reutilizáveis específicos da página

5. **Hooks**
   - Lógica personalizada encapsulada

## 🔐 Fluxo de Autenticação

### 1. Usuário Não Logado (Desktop/Browser)
```
Acessa site → Landing Page (/) → 
Clica "Entrar" → Login (/login) → 
Autentica → Home (/home)
```

### 2. Usuário Não Logado (PWA Instalado)
```
Abre App → Login (/login) → 
Autentica → Home (/home)
```

### 3. Usuário Já Logado
```
Acessa qualquer URL → Home (/home)
```

## 🎨 Design System

### Cores Principais
- **Primary Orange**: #FF5722, #FF6B35, #FF8424
- **Neutros**: slate-50 a slate-900
- **Backgrounds**: Gradientes lineares

### Componentes UI Utilizados
- `Button` - Botões com variantes
- `Card` - Cards de conteúdo
- `Badge` - Badges e tags (removido da Landing após análise)

### Padrões de CSS
- Mobile-first design
- Tailwind CSS utility classes
- Gradientes: `bg-gradient-to-*`
- Animações: `hover:`, `transition-*`
- Responsividade: `sm:`, `md:`, `lg:`

## 📱 PWA Features

### Display Modes
- **Browser**: Mostra landing page
- **Standalone**: Mostra login direto
- **Fullscreen**: Tratado como standalone

### Safe Areas
- Suporte a notch (iOS)
- `pb-safe` para padding bottom
- `min-h-dvh` para altura dinâmica

## 🔄 Estado Global

### Auth Store
```typescript
{
  isAuthenticated: boolean;
  isChecking: boolean;
  setAuthenticated: (value: boolean) => void;
  setTokens: (access: string, refresh: string) => void;
  setIsChecking: (value: boolean) => void;
  reset: () => void;
}
```

### User Store
```typescript
{
  user: User | null;
  setUser: (user: User) => void;
  clearUserProfile: () => void;
}
```

## 🚀 Próximos Passos

### Páginas a Implementar
1. **Home** (`/home`)
   - Lista de quadras disponíveis
   - Promoções ativas
   - Atalhos rápidos

2. **Cashback** (`/cashback`)
   - Saldo atual
   - Histórico de transações
   - Scanner de QR Code

3. **Profile** (`/profile`)
   - Informações do usuário
   - Estatísticas de uso
   - Configurações

4. **Edit Profile** (`/edit-profile`)
   - Formulário de edição
   - Upload de avatar
   - Atualizar dados

5. **Bookings** (`/bookings`)
   - Lista de reservas
   - Filtros e busca
   - Detalhes de reserva

### Integrações Necessárias

1. **Firebase/Google Auth**
   - Configurar OAuth
   - Obter tokens do Google
   - Enviar para backend

2. **API Backend**
   - Configurar `VITE_API_BASE_URL`
   - Testar endpoints de autenticação
   - Implementar error handling

3. **Push Notifications**
   - Service Worker
   - FCM integration
   - Gerenciar tokens

4. **Imagens e Assets**
   - Adicionar logo real (`/public/logo.jpg`)
   - Otimizar imagens
   - Configurar CDN se necessário

## 📝 Convenções de Código

### Nomenclatura
- **Componentes**: PascalCase (`LandingPage`)
- **Arquivos**: kebab-case (`landing-page.tsx`)
- **Hooks**: camelCase com `use` (`useAuth`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)

### Organização de Imports
```typescript
// 1. React e bibliotecas externas
import { useNavigate } from 'react-router-dom';

// 2. Ícones
import { Calendar, User } from 'lucide-react';

// 3. Componentes UI
import { Button } from '@/components/ui/button';

// 4. Componentes locais
import { MyComponent } from './MyComponent';

// 5. Hooks
import { useAuth } from '@/hooks/useAuth';

// 6. Utils, constantes, tipos
import { ROUTES } from '@/utils/constants/app.constant';
```

### TypeScript
- Sempre tipar props e retornos
- Usar interfaces para objetos complexos
- Evitar `any`, preferir `unknown`
- Exportar tipos quando reutilizáveis

### Comentários
- Evitar comentários no código
- Código auto-explicativo
- Documentar apenas lógica complexa
- README para documentação macro

## ⚡ Performance

### Otimizações Implementadas
1. **Lazy Loading**: Páginas carregadas sob demanda
2. **Code Splitting**: Separação automática por rota
3. **Memoização**: Hooks com useCallback/useMemo onde necessário
4. **Componentes Leves**: Separação clara de responsabilidades

### Métricas Alvo
- **FCP** (First Contentful Paint): < 1.5s
- **LCP** (Largest Contentful Paint): < 2.5s
- **TTI** (Time to Interactive): < 3.5s
- **Bundle Size**: < 500kb

## 🧪 Testes (Futuros)

### Testes Unitários
- Hooks personalizados
- Funções utilitárias
- Validações

### Testes de Integração
- Fluxos de autenticação
- Navegação entre páginas
- Submissão de formulários

### Testes E2E
- Jornada completa do usuário
- PWA installation flow
- Offline capabilities

## 📚 Referências

### Documentação Backend
- `/docs_backend_implamatation/auth-module-guide.md`
- `/docs_backend_implamatation/prisma-schema-guide.md`

### Projetos de Referência
- `C:\ARENA OFF BEACH\sport-oasis` - Design e estrutura
- `C:\PROJETO_ARENA` - Padrões e convenções

### Tecnologias
- React 18+ com Vite
- TypeScript 5+
- Tailwind CSS
- React Router v6
- Zustand (State Management)
- React Query (Data Fetching)

## 🔧 Configuração do Ambiente

### Variáveis de Ambiente
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
# ... outras configs Firebase
```

### Scripts Disponíveis
```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Preview
npm run preview

# Lint
npm run lint

# Type check
npm run type-check
```

## 📞 Contato e Suporte

Para dúvidas sobre implementação, consulte:
1. Esta documentação
2. Documentação do backend
3. Comentários no código (quando presentes)
4. READMEs específicos de módulos

---

**Versão**: 1.0.0  
**Data**: 19/03/2026  
**Autor**: Sistema Arena Off Beach  
**Status**: ✅ Implementação Base Concluída
