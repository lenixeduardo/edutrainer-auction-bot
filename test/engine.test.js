import test from 'node:test';
import assert from 'node:assert/strict';
import { AuctionEngine } from '../src/engine.js';

const make = () => new AuctionEngine([
  { id: 'a', name: 'Zapdos', priceCents: 15000 },
  { id: 'b', name: 'Pikachu', priceCents: 8500 },
  { id: 'c', name: 'Mewtwo', priceCents: 12000 }
]);
const vote = (e, eventId, cardId, participantId, option = 'Interesse') =>
  e.vote({ eventId, cardId, participantId, option });

test('spark does not advance; first interest does', () => {
  const e = make(); e.start();
  assert.equal(vote(e, '1', 'a', 'Ana', '✨').type, 'VOTE_RECORDED');
  assert.equal(e.current, 0);
  assert.equal(vote(e, '2', 'a', 'Ana').type, 'NEXT_CARD');
  assert.equal(e.current, 1);
});
test('duplicate event does not advance twice', () => {
  const e = make(); e.start();
  vote(e, '1', 'a', 'Ana');
  assert.equal(vote(e, '1', 'a', 'Ana').type, 'DUPLICATE');
  assert.equal(e.current, 1);
});
test('last interest finishes immediately and late votes ignored', () => {
  const e = make(); e.start();
  vote(e, '1', 'a', 'Ana'); vote(e, '2', 'b', 'Pedro');
  assert.equal(vote(e, '3', 'c', 'Carlos').type, 'AUCTION_FINISHED');
  assert.equal(vote(e, '4', 'a', 'Late').type, 'IGNORED_CLOSED');
  assert.deepEqual(e.result[0].interested, ['Ana']);
});
test('unpublished card vote ignored', () => {
  const e = make(); e.start();
  assert.equal(vote(e, '1', 'c', 'Ana').type, 'IGNORED_UNPUBLISHED');
});
test('withdrawal removes interest from queue', () => {
  const e = make(); e.start();
  vote(e, '1', 'a', 'Ana'); vote(e, '2', 'a', 'Pedro');
  vote(e, '3', 'a', 'Ana', null);
  vote(e, '4', 'b', 'Pedro'); vote(e, '5', 'c', 'Carlos');
  assert.deepEqual(e.result[0].interested, ['Pedro']);
});
test('interest ordering follows processed sequence', () => {
  const e = make(); e.start();
  vote(e, '1', 'a', 'Ana'); vote(e, '2', 'a', 'Pedro');
  vote(e, '3', 'a', 'Carlos'); vote(e, '4', 'b', 'Pedro');
  vote(e, '5', 'c', 'Carlos');
  assert.deepEqual(e.result[0].interested, ['Ana', 'Pedro', 'Carlos']);
});
