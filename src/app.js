const express = require('express');
const { handleWebhookVerification, handleIncomingMessages } = require('./webhook');

const START_TIME = Date.now();

function log(level, message, meta = {}) {
  const entry = { level, time: new Date().toISOString(), message, ...meta };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

function createApp() {
  const app = express();

  // Limite de 1 MB para o body JSON (proteção básica contra payloads gigantes)
  app.use(express.json({ limit: '1mb' }));

  // ------------------------------------------------------------------
  // Health check — usado pelo Docker/proxy para verificar se está de pé
  // ------------------------------------------------------------------
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: Math.floor((Date.now() - START_TIME) / 1000),
      timestamp: new Date().toISOString(),
    });
  });

  // ------------------------------------------------------------------
  // Verificação de webhook (GET) — desafio da Meta
  // ------------------------------------------------------------------
  app.get('/webhook', (req, res) => {
    const challenge = handleWebhookVerification(req.query);
    if (challenge) {
      return res.send(challenge);
    }
    log('warn', 'webhook GET verification rejected', { ip: req.ip });
    return res.status(403).json({ error: 'verification failed' });
  });

  // ------------------------------------------------------------------
  // Recebimento de mensagens (POST)
  // ------------------------------------------------------------------
  app.post('/webhook', async (req, res) => {
    try {
      await handleIncomingMessages(req.body);
      return res.sendStatus(200);
    } catch (error) {
      log('error', 'webhook POST processing failed', { reason: error.message });
      // A Meta espera 200 mesmo em falhas de processamento interno para não
      // reenviar infinitamente. Erros de payload inválido retornam 400.
      if (error.message === 'invalid webhook payload') {
        return res.status(400).json({ error: error.message });
      }
      return res.sendStatus(200);
    }
  });

  // ------------------------------------------------------------------
  // Rota raiz
  // ------------------------------------------------------------------
  app.get('/', (_req, res) => {
    res.json({ service: 'WhatsApp → Telegram alert bridge', status: 'running' });
  });

  // ------------------------------------------------------------------
  // 404 genérico
  // ------------------------------------------------------------------
  app.use((_req, res) => {
    res.status(404).json({ error: 'not found' });
  });

  return app;
}

module.exports = createApp;
