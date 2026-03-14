const axios = require('axios');

const TELEGRAM_BASE = 'https://api.telegram.org';
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 8000;

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

function getChatId() {
  return process.env.TELEGRAM_CHAT_ID;
}

function log(level, message, meta = {}) {
  const entry = { level, time: new Date().toISOString(), message, ...meta };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createKeyboard(messageId) {
  const safeId = messageId ? messageId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'unknown';
  return {
    inline_keyboard: [
      [
        { text: 'Responder', callback_data: `reply:${safeId}` },
        { text: 'Agendar follow-up', callback_data: `followup:${safeId}` },
        { text: 'Ignorar', callback_data: `ignore:${safeId}` },
      ],
    ],
  };
}

async function sendTelegramAlert(event, suggestion) {
  const botToken = getBotToken();
  const chatId = getChatId();

  if (!botToken || !chatId) {
    throw new Error('Telegram bot ou chat não configurado (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)');
  }

  const url = `${TELEGRAM_BASE}/bot${botToken}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: suggestion.telegramText,
    parse_mode: 'HTML',
    reply_markup: createKeyboard(event.id),
  };

  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await axios.post(url, payload, { timeout: REQUEST_TIMEOUT_MS });
      log('info', 'telegram message sent', { messageId: event.id, attempt });
      return response;
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      log('warn', 'telegram send attempt failed', {
        messageId: event.id,
        attempt,
        status,
        reason: error.message,
      });

      // Não faz retry em erros de autenticação ou chat inválido (4xx exceto 429)
      if (status && status >= 400 && status !== 429 && status < 500) {
        break;
      }

      if (attempt < MAX_ATTEMPTS) {
        await sleep(attempt * BASE_DELAY_MS);
      }
    }
  }

  log('error', 'all telegram attempts exhausted', { messageId: event.id, reason: lastError.message });
  throw lastError;
}

module.exports = {
  sendTelegramAlert,
  __test: {
    createKeyboard,
    sleep,
  },
};
