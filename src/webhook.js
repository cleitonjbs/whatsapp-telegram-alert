const { generateSuggestion } = require('./suggestion');
const { sendTelegramAlert } = require('./telegram');

const VERIFY_TOKEN = process.env.WABA_VERIFY_TOKEN;

const processedIds = new Set();
const MAX_TRACKED = 2000;
const trackedQueue = [];

function handleWebhookVerification({ 'hub.verify_token': token, 'hub.challenge': challenge }) {
  if (VERIFY_TOKEN && token === VERIFY_TOKEN) {
    return challenge || 'OK';
  }
  return null;
}

async function handleIncomingMessages(payload) {
  if (!payload || !Array.isArray(payload.entry)) {
    throw new Error('invalid webhook payload');
  }

  const events = [];
  payload.entry.forEach((entry) => {
    (entry.changes || []).forEach((change) => {
      const value = change.value || {};
      const contacts = value.contacts || [];
      const contact = contacts[0] || {};
      const messages = value.messages || [];
      messages.forEach((message) => {
        const event = normalizeMessage(entry.id, contact, message);
        if (event) {
          events.push(event);
        }
      });
    });
  });

  await Promise.all(events.map((event) => processEvent(event)));
}

function normalizeMessage(entryId, contact, message) {
  if (!message || !message.id) {
    return null;
  }

  const text = message.text?.body || '';
  const name = contact.profile?.name || contact.wa_id || message.from;
  const snippet = text || message.type || 'conteúdo multimídia';

  return {
    id: message.id,
    entryId,
    from: message.from,
    senderName: name,
    text: snippet,
    type: message.type,
    timestamp: message.timestamp,
    raw: message,
  };
}

async function processEvent(event) {
  if (shouldSkip(event.id)) {
    return;
  }

  const suggestion = await generateSuggestion(event);
  await sendTelegramAlert(event, suggestion);
}

function shouldSkip(messageId) {
  if (!messageId) {
    return true;
  }
  if (processedIds.has(messageId)) {
    return true;
  }
  processedIds.add(messageId);
  trackedQueue.push(messageId);
  if (trackedQueue.length > MAX_TRACKED) {
    const stale = trackedQueue.shift();
    processedIds.delete(stale);
  }
  return false;
}

module.exports = {
  handleWebhookVerification,
  handleIncomingMessages,
  __test: {
    normalizeMessage,
    processedIds,
    shouldSkip,
  },
};
