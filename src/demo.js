import { AuctionEngine } from './engine.js';
const auction = new AuctionEngine([
  { id: 'a', name: 'Zapdos LV.30', priceCents: 15000 },
  { id: 'b', name: 'Pikachu', priceCents: 8500 },
  { id: 'c', name: 'Mewtwo', priceCents: 12000 }
]);
auction.start();
auction.vote({ eventId: 'v1', cardId: 'a', participantId: 'Ana', option: 'Interesse' });
auction.vote({ eventId: 'v2', cardId: 'a', participantId: 'Pedro', option: 'Interesse' });
auction.vote({ eventId: 'v3', cardId: 'b', participantId: 'Pedro', option: 'Interesse' });
auction.vote({ eventId: 'v4', cardId: 'c', participantId: 'Carlos', option: 'Interesse' });
console.log(auction.summary());
