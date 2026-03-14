const axios = require('axios');

const TELEGRAM_BASE = 'https://api.telegram.org';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function createKeyboard(messageId) {
  const safeId = messageId ? messageId.replace(/:/g, '_') : 'unknown';
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
  if (!BOT_TOKEN || !CHAT_ID) {
    throw new Error('Telegram bot ou chat não configurado');
  }

  const url = `${TELEGRAM_BASE}/bot${BOT_TOKEN}/sendMessage`;
  const payload = {
    chat_id: CHAT_ID,
    text: suggestion.telegramText,
    parse_mode: 'HTML',
    reply_markup: createKeyboard(event.id),
  };

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await axios.post(url, payload);
    } catch (error) {
      if (attempt === maxAttempts) {
        console.error('Falha ao enviar alerta ao Telegram', error.message);
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
}

module.exports = {
  sendTelegramAlert,
  __test: {
    createKeyboard,
  },
};
