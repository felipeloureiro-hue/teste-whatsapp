# WhatsApp Template Manager

Ferramenta local para criar e testar templates da WhatsApp Cloud API (Meta Business).

## Como rodar

### 1. Instalar dependências

```bash
# Na raiz do projeto:
npm install

# Backend:
cd backend && npm install && cd ..

# Frontend:
cd frontend && npm install && cd ..
```

Ou tudo de uma vez:
```bash
npm run install:all
```

### 2. Iniciar

```bash
npm run dev
```

Isso inicia o backend (porta **3001**) e o frontend (porta **5173**) simultaneamente.

Acesse: **http://localhost:5173**

---

## Como obter as credenciais no Meta Business Manager

### Access Token (System User — longa duração)
1. Acesse [business.facebook.com](https://business.facebook.com) → **Configurações do negócio**
2. Vá em **Usuários** → **Usuários do sistema**
3. Crie ou selecione um usuário do sistema
4. Clique em **Gerar novo token** → selecione o App e as permissões:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
5. Copie o token gerado (token de longa duração, válido por 60 dias ou sem expiração dependendo do tipo)

### WABA ID (WhatsApp Business Account ID)
1. Acesse [business.facebook.com](https://business.facebook.com) → **Configurações do negócio**
2. Vá em **Contas** → **Contas do WhatsApp**
3. O número exibido ao lado do nome da conta é o **WABA ID**

### App ID
1. Acesse [developers.facebook.com](https://developers.facebook.com) → **Meus Aplicativos**
2. Clique no app vinculado à sua WABA
3. O **App ID** aparece no painel principal do app ou na URL

### Phone Number ID
1. No [developers.facebook.com](https://developers.facebook.com), abra seu app
2. Vá em **WhatsApp** → **Configuração da API**
3. Na seção **De**, o número exibido tem um ID associado — clique em **Gerenciar números de telefone** ou use a API:
   ```
   GET https://graph.facebook.com/v21.0/{WABA_ID}/phone_numbers
   Authorization: Bearer {ACCESS_TOKEN}
   ```

---

## Estrutura do projeto

```
/
├── package.json          # Script raiz com concurrently
├── .env                  # GRAPH_VERSION=v21.0
├── .gitignore
├── backend/
│   ├── server.js         # Express porta 3001
│   ├── db.js             # lowdb (persistência em db.json)
│   ├── db.json           # Gerado automaticamente — NÃO COMMITAR
│   └── routes/
│       ├── brands.js     # CRUD marcas/WABAs/números
│       ├── templates.js  # Criar/listar templates Meta
│       └── messages.js   # Enviar mensagem de teste
└── frontend/
    ├── vite.config.js    # Proxy /api → localhost:3001
    └── src/
        ├── App.jsx
        ├── context/AppContext.jsx
        └── components/
            ├── Sidebar.jsx
            ├── CreateTemplate.jsx
            ├── SendTest.jsx
            └── ManageModal.jsx
```

---

## ⚠️ Aviso de segurança

O arquivo `backend/db.json` armazena **Access Tokens em texto puro**.

- Ele está no `.gitignore` e **não deve ser commitado**
- Não compartilhe a pasta do projeto nem faça upload para serviços de nuvem
- Use apenas tokens de **System Users** (não tokens pessoais)
- Revogue tokens no Business Manager se suspeitar de vazamento

---

## Variáveis de ambiente (.env)

| Variável       | Valor padrão | Descrição                        |
|----------------|--------------|----------------------------------|
| GRAPH_VERSION  | v21.0        | Versão da Graph API da Meta      |
