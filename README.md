# WhatsApp → Telegram alert bridge

This service listens for incoming WhatsApp Business API (WABA) webhook events, summarizes each message, and pushes a notification (with inline action buttons) to a pre-configured Telegram bot/chat.

## Features

- Verifies WABA `hub.verify_token` and ingests every incoming message.
- Normalizes the Meta payload into an event, deduplicates message IDs, and generates a “texto livre com tom e razões”.
- Optionally uses OpenAI (via `OPENAI_API_KEY`) to enhance summaries.
- Sends a composed Telegram alert with inline keyboard actions.
- Ships as a Docker container and exposes `/webhook` on port 3000 by default.

## Configuration

1. Copy `.env.example` to `.env` (not checked in) and fill in your secrets:
   - `WABA_VERIFY_TOKEN`: usado para validar a inscrição de webhook.
   - `WABA_ACCESS_TOKEN`: mantido para referência (não usado neste MVP).
   - `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`: bot + chat onde os alertas devem chegar.
   - `OPENAI_API_KEY`: opcional, usado para gerar summaries mais naturais.
   - `PORT`: porta do Express (padrão 3000).

2. Registre a URL do webhook (`https://example.com/webhook`) no painel da Meta com o `verify_token` acima. O serviço responde ao desafio GET automaticamente.

## Executando localmente

```bash
npm install
npm run start
```

O serviço estará em `http://localhost:3000` e aceita POSTs em `/webhook`.

## Dockerização

1. Construa a imagem:
   ```bash
   docker build -t waba-telegram-alert .
   ```

2. Ou use o `docker-compose` para usar `.env` e mapear a porta:
   ```bash
   docker compose up --build -d
   ```

Certifique-se de que o host (Ubuntu 22 + Docker) expoe a porta 3000 para a Meta registrar o webhook.

## Testes

- `npm test`: executa os testes unitários de webhook/sugestão/Telegram.

## Operação no servidor Ubuntu 22

1. Copie o repositório para o servidor.
2. Configure `.env` com os tokens válidos.
3. Rode `docker compose up --build -d` para manter o container sempre de pé.
4. A partir da sua console do Telegram, verifique se o bot chega e confirma o chat ID, depois envie mensagens de teste para a conta WhatsApp vinculada.

## Observações

- O serviço só propõe sugestões e não envia respostas automáticas ao WhatsApp.
- Ajuste o resumo e as ações nos arquivos `src/suggestion.js` conforme o estilo desejado.
