# Vibra App - PWA

Progressive Web App (PWA) com React, TypeScript e Vite, seguindo as melhores práticas de desenvolvimento frontend.

## 🚀 Tecnologias

- **React 19** - Biblioteca para construção de interfaces
- **TypeScript** - Tipagem estática
- **Vite** - Build tool ultrarrápida
- **React Router** - Roteamento
- **Zustand** - Gerenciamento de estado global
- **PWA Plugin** - Suporte completo a Progressive Web App

## 📁 Estrutura do Projeto

```
vibra-app/
├── public/              # Assets estáticos e ícones PWA
├── src/
│   ├── components/      # Componentes React
│   │   ├── common/      # Componentes reutilizáveis (Button, Card)
│   │   └── layout/      # Componentes de layout (Header, Layout)
│   ├── pages/           # Páginas da aplicação
│   │   ├── Home/
│   │   └── About/
│   ├── services/        # Serviços e API clients
│   │   └── api/         # HTTP client e serviços
│   ├── store/           # Gerenciamento de estado (Zustand)
│   ├── hooks/           # Hooks personalizados
│   ├── utils/           # Funções utilitárias
│   ├── types/           # Tipos TypeScript
│   ├── styles/          # Estilos globais
│   ├── routes.tsx       # Configuração de rotas
│   ├── App.tsx          # Componente raiz
│   └── main.tsx         # Ponto de entrada
├── vite.config.ts       # Configuração do Vite + PWA
└── tsconfig.json        # Configuração TypeScript
```

## 🎯 Recursos

### PWA (Progressive Web App)
- ✅ Service Worker automático
- ✅ Manifest configurado
- ✅ Ícones em múltiplos tamanhos
- ✅ Instalável em dispositivos
- ✅ Funciona offline
- ✅ Cache estratégico de assets

### Arquitetura
- ✅ Clean Architecture
- ✅ Princípios SOLID
- ✅ Separação de responsabilidades
- ✅ Componentes reutilizáveis
- ✅ Path aliases configurados

### Desenvolvimento
- ✅ TypeScript com strict mode
- ✅ ESLint configurado
- ✅ Hot Module Replacement (HMR)
- ✅ Build otimizado para produção

## 🛠️ Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build de produção
npm run preview

# Executar linter
npm run lint
```

## 📦 Path Aliases

O projeto já vem configurado com path aliases para facilitar imports:

```typescript
import { Button } from '@components/common';
import { HomePage } from '@pages/Home';
import { httpClient } from '@services/api';
import { useAppStore } from '@store/appStore';
import { useDebounce } from '@hooks/useDebounce';
import { formatDate } from '@utils/helpers';
import type { User } from '@/types';
```

## 🎨 Componentes Disponíveis

### Button
```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Clique aqui
</Button>
```

### Card
```tsx
<Card title="Título do Card">
  Conteúdo do card
</Card>
```

## 🔧 Hooks Personalizados

- `useDebounce` - Debounce de valores
- `useOnlineStatus` - Detecta status de conexão
- `useMediaQuery` - Detecta breakpoints responsivos

## 🌐 API Service

Exemplo de uso do HTTP client:

```typescript
import { httpClient } from '@services/api';

// GET request
const data = await httpClient.get('/endpoint');

// POST request
const result = await httpClient.post('/endpoint', { name: 'value' });
```

## 💾 Gerenciamento de Estado

```typescript
import { useAppStore } from '@store/appStore';

function MyComponent() {
  const { theme, toggleTheme } = useAppStore();
  
  return <button onClick={toggleTheme}>Toggle Theme</button>;
}
```

## 🚀 Deploy

O projeto está pronto para deploy em:
- **Vercel** - `vercel`
- **Netlify** - `netlify deploy`
- **GitHub Pages** - Configure `base` no `vite.config.ts`

## 📱 PWA - Instalação

Após fazer o deploy, o app pode ser instalado em dispositivos:
1. Acesse o site no navegador
2. Clique em "Instalar" no menu do navegador
3. O app será instalado como aplicativo nativo

## 🔄 Service Worker

O service worker é gerado automaticamente em produção e gerencia:
- Cache de assets estáticos
- Estratégias de cache para API calls
- Funcionamento offline

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_BASE_URL=https://api.example.com
```

Acesse via:
```typescript
import.meta.env.VITE_API_BASE_URL
```

## 📝 Próximos Passos

Este é um template genérico. Para transformá-lo em sua aplicação:

1. **Personalize o manifest** (`vite.config.ts`)
   - Altere `name`, `short_name`, `description`
   - Ajuste `theme_color` e `background_color`

2. **Substitua os ícones** em `public/`
   - pwa-192x192.svg
   - pwa-512x512.svg
   - apple-touch-icon.svg
   - favicon.svg

3. **Adicione suas páginas** em `src/pages/`

4. **Configure suas rotas** em `src/routes.tsx`

5. **Crie seus serviços** em `src/services/`

6. **Adicione seus componentes** em `src/components/`

## 📄 Licença

MIT

---
