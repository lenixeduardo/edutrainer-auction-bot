export class AuctionEngine {
  constructor(cards) {
    if (!Array.isArray(cards) || cards.length === 0) throw new Error('Cards required');
    if (cards.some(c => !c.id || !c.name || !Number.isInteger(c.priceCents) || c.priceCents < 0)) throw new Error('Invalid card');
    if (new Set(cards.map(c => c.id)).size !== cards.length) throw new Error('Duplicate card ID');
    this.cards = cards.map((card, index) => ({ ...card, index, status: 'PENDING', votes: new Map() }));
    this.status = 'DRAFT';
    this.current = -1;
    this.events = [];
    this.seen = new Set();
    this.result = null;
    this.sequence = 0;
  }
  start() {
    if (this.status !== 'DRAFT') throw new Error('Already started');
    this.status = 'RUNNING';
    this.current = 0;
    this.cards[0].status = 'WAITING_INTEREST';
    this.events.push({ type: 'CARD_READY', cardId: this.cards[0].id });
    return this.cards[0];
  }
  vote({ eventId, cardId, participantId, option, timestamp }) {
    if (!eventId || !cardId || !participantId || !['Interesse', '✨', null].includes(option)) throw new Error('Invalid vote');
    if (this.seen.has(eventId)) return { type: 'DUPLICATE' };
    this.seen.add(eventId);
    if (this.status !== 'RUNNING') return { type: 'IGNORED_CLOSED' };
    const card = this.cards.find(c => c.id === cardId);
    if (!card || card.status === 'PENDING') return { type: 'IGNORED_UNPUBLISHED' };
    const previous = card.votes.get(participantId);
    const sequence = ++this.sequence;
    const vote = {
      participantId, option, sequence, timestamp: timestamp ?? null,
      firstInterestSequence: option === 'Interesse'
        ? (previous?.option === 'Interesse' ? previous.firstInterestSequence : sequence) : null
    };
    card.votes.set(participantId, vote);
    this.events.push({ type: 'VOTE_UPDATED', cardId, participantId, option, sequence });
    if (option !== 'Interesse' || card.status !== 'WAITING_INTEREST') return { type: 'VOTE_RECORDED' };
    card.status = 'UNLOCKED';
    if (this.current === this.cards.length - 1) {
      this.status = 'FINISHED';
      this.result = this.snapshot();
      this.events.push({ type: 'AUCTION_FINISHED' });
      return { type: 'AUCTION_FINISHED', result: this.result };
    }
    this.current += 1;
    this.cards[this.current].status = 'WAITING_INTEREST';
    this.events.push({ type: 'CARD_READY', cardId: this.cards[this.current].id });
    return { type: 'NEXT_CARD', card: this.cards[this.current] };
  }
  snapshot() {
    return this.cards.map(card => ({
      id: card.id, name: card.name, priceCents: card.priceCents,
      interested: [...card.votes.values()].filter(v => v.option === 'Interesse')
        .sort((a, b) => a.firstInterestSequence - b.firstInterestSequence).map(v => v.participantId)
    }));
  }
  summary() {
    if (!this.result) throw new Error('Auction not finished');
    const money = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return ['RESULTADO DO LEILÃO — EduTrainer TCG', ...this.result.flatMap((c, i) => [
      `${i + 1}. ${c.name} — ${money(c.priceCents)}`,
      `1º interessado: ${c.interested[0] ?? 'Nenhum'}`,
      `Fila: ${c.interested.slice(1).join(' → ') || 'Sem fila'}`
    ]), 'Prioridade provisória, sujeita à confirmação de compra.'].join('\n');
  }
}
