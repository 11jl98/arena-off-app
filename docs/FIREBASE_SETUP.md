# Configuração do Firebase

## ⚡ Passo a Passo Rápido

### 1. Criar Projeto Firebase (se não tiver)

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"** ou **"Add project"**
3. Nome do projeto: `arena-off-beach` (ou qualquer nome)
4. Pode desabilitar o Google Analytics (opcional)
5. Clique em **"Criar projeto"**

### 2. Obter as Credenciais

1. No Firebase Console, clique no **ícone de engrenagem** ⚙️ ao lado de "Visão geral do projeto"
2. Selecione **"Configurações do projeto"**
3. Role a página até a seção **"Seus aplicativos"**
4. Se não tiver um app web, clique no ícone **`</>`** (Web)
   - Apelido do app: `Arena Off Web`
   - **NÃO** marque Firebase Hosting
   - Clique em **"Registrar app"**
5. Copie os valores do objeto `firebaseConfig`:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",              // ← VITE_FIREBASE_API_KEY
  authDomain: "projeto.firebaseapp.com",  // ← VITE_FIREBASE_AUTH_DOMAIN
  projectId: "projeto-id",         // ← VITE_FIREBASE_PROJECT_ID
  storageBucket: "projeto.appspot.com",   // ← VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456",     // ← VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123:web:abc"          // ← VITE_FIREBASE_APP_ID
};
```

### 3. Preencher o arquivo `.env`

Abra o arquivo `.env` na raiz do projeto e cole os valores:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4. Ativar Autenticação com Google

1. No Firebase Console, vá em **"Authentication"** (menu lateral esquerdo)
2. Clique na aba **"Sign-in method"**
3. Clique em **"Google"**
4. **Ative** o provedor Google
5. Configure o email de suporte do projeto
6. Clique em **"Salvar"**

### 5. Configurar Domínios Autorizados

Ainda em **Authentication > Settings**:

1. Role até **"Authorized domains"**
2. Adicione:
   - `localhost` (já vem por padrão)
   - Seu domínio de produção (se tiver)

### 6. Reiniciar o Servidor

Após preencher o `.env`, **reinicie o servidor de desenvolvimento**:

```powershell
# Pare o servidor (Ctrl+C) e rode novamente:
npm run dev
```

## ✅ Verificação

Se tudo estiver correto, você verá a tela de login com o botão **"Entrar com Google"**.

## 🔧 Troubleshooting

### Erro: "auth/invalid-api-key"
- Verifique se copiou o `apiKey` corretamente do Firebase Console
- Certifique-se que não há espaços extras no arquivo `.env`

### Erro: "auth/unauthorized-domain"
- Vá em Authentication > Settings > Authorized domains
- Adicione o domínio que está usando (ex: localhost)

### Login não funciona
- Verifique se ativou o provedor Google em Authentication > Sign-in method
- Teste com uma conta Google válida

## 📝 Resumo

Arquivos que você editou:
- ✅ `.env` - Credenciais do Firebase preenchidas
- ✅ Reiniciou o servidor de desenvolvimento

Agora pode fazer login com sua conta Google! 🎉
