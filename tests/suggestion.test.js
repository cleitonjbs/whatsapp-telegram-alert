const { generateSuggestion, __test } = require('../src/suggestion');

describe('suggestion generator', () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it('builds fallback text when no LLM is configured', async () => {
    const event = {
      senderName: 'Cliente Exemplo',
      from: '5511999999999',
      text: 'Preciso de ajuda urgente com meu pedido.',
      id: 'msg-1',
    };

    const suggestion = await generateSuggestion(event);

    expect(suggestion.tone).toBe('Urgente');
    expect(suggestion.telegramText).toMatch(/Razões:/);
    expect(suggestion.actions.length).toBeGreaterThan(0);
  });

  it('guessTone detects keywords', () => {
    expect(__test.guessTone('Isso é urgente e agora mesmo')).toBe('Urgente');
    expect(__test.guessTone('Obrigado pelo suporte')).toBe('Agradecido');
    expect(__test.guessTone('Tem um problema técnico aqui')).toBe('Empático');
    expect(__test.guessTone('Fala mais sobre o produto')).toBe('Profissional');
  });
});
