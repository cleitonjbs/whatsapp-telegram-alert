const eventSample = {
  entry: [
    {
      id: 'entry-id',
      changes: [
        {
          value: {
            contacts: [
              {
                wa_id: '5511912345678',
                profile: { name: 'Teste' },
              },
            ],
            messages: [
              {
                id: 'msg-1',
                from: '5511912345678',
                text: { body: 'Olá' },
                type: 'text',
                timestamp: '1690000000',
              },
            ],
          },
        },
      ],
    },
  ],
};

describe('webhook helpers', () => {
  beforeEach(() => {
    process.env.WABA_VERIFY_TOKEN = 'verify-me';
  });

  afterEach(() => {
    jest.resetModules();
    delete process.env.WABA_VERIFY_TOKEN;
  });

  it('returns challenge when verify token matches', () => {
    const { handleWebhookVerification } = require('../src/webhook');
    const challenge = handleWebhookVerification({ 'hub.verify_token': 'verify-me', 'hub.challenge': 'abc' });
    expect(challenge).toBe('abc');
  });

  it('throws on invalid payload', async () => {
    const { handleIncomingMessages } = require('../src/webhook');
    await expect(handleIncomingMessages({})).rejects.toThrow('invalid webhook payload');
  });

  it('normalizes message entries', () => {
    const { __test } = require('../src/webhook');
    const normalized = __test.normalizeMessage('entry-id', eventSample.entry[0].changes[0].value.contacts[0], eventSample.entry[0].changes[0].value.messages[0]);
    expect(normalized.id).toBe('msg-1');
    expect(normalized.senderName).toBe('Teste');
  });
});
