const express = require('express');
const bodyParser = express.json;
const { handleWebhookVerification, handleIncomingMessages } = require('./webhook');

function createApp(options = {}) {
  const app = express();
  app.use(bodyParser());

  app.get('/webhook', (req, res) => {
    const challenge = handleWebhookVerification(req.query);
    if (challenge) {
      return res.send(challenge);
    }
    return res.status(403).send('verification failed');
  });

  app.post('/webhook', async (req, res) => {
    try {
      await handleIncomingMessages(req.body);
      return res.sendStatus(200);
    } catch (error) {
      console.error('webhook processing failed', error);
      return res.sendStatus(500);
    }
  });

  app.get('/', (req, res) => {
    res.send('WhatsApp → Telegram alert service');
  });

  return app;
}

module.exports = createApp;
