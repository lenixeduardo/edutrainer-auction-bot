// Manual GO/NO-GO spike. Never run against an unapproved group.
import makeWASocket, { useMultiFileAuthState, DisconnectReason, getAggregateVotesInPollMessage } from '@whiskeysockets/baileys';
import P from 'pino';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { mkdir, writeFile } from 'node:fs/promises';

const groupJid = process.env.TEST_GROUP_JID;
if (!groupJid?.endsWith('@g.us') || process.env.CONFIRM_TEST_GROUP !== 'yes') {
  throw new Error('Set TEST_GROUP_JID=<approved-group>@g.us and CONFIRM_TEST_GROUP=yes');
}
const { state, saveCreds } = await useMultiFileAuthState('.local-auth');
const sent = new Map();
const evidence = [];
const record = async (type, data = {}) => {
  const event = { type, at: new Date().toISOString(), ...data };
  evidence.push(event);
  await mkdir('.local-evidence', { recursive: true });
  await writeFile('.local-evidence/poll-events.json', JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(event));
};
const sock = makeWASocket({
  auth: state, logger: P({ level: 'warn' }),
  getMessage: async key => sent.get(key.id)?.message
});
sock.ev.on('creds.update', saveCreds);
sock.ev.on('messages.update', async updates => {
  for (const { key, update } of updates) {
    if (!update.pollUpdates || !sent.has(key.id)) continue;
    const poll = sent.get(key.id);
    try {
      const aggregate = getAggregateVotesInPollMessage({ message: poll.message, pollUpdates: update.pollUpdates });
      await record('POLL_VOTE_AGGREGATE', {
        pollId: key.id,
        options: aggregate.map(v => ({ option: v.name, voters: (v.voters || []).map(p => p.slice(0, 5) + '…') })),
        updateCount: update.pollUpdates.length
      });
    } catch (error) { await record('POLL_DECRYPT_ERROR', { message: String(error) }); }
  }
});
sock.ev.on('connection.update', async ({ connection, qr, lastDisconnect }) => {
  if (qr) await record('QR_AVAILABLE', { note: 'Pair in WhatsApp linked devices; QR is not logged' });
  if (connection === 'close') await record('DISCONNECTED', {
    status: lastDisconnect?.error?.output?.statusCode ?? 'unknown',
    loggedOut: lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut
  });
  if (connection !== 'open') return;
  await record('CONNECTED');
  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question('Type SEND to post ONE test poll to approved group: ');
    if (answer !== 'SEND') return;
    const msg = await sock.sendMessage(groupJid, {
      poll: { name: 'TESTE EduTrainer TCG — Interesse?', values: ['Interesse', '✨'], selectableCount: 1, toAnnouncementGroup: false }
    });
    if (!msg?.key?.id || !msg.message) throw new Error('Poll response missing key or message');
    sent.set(msg.key.id, msg);
    await record('POLL_SENT', { pollId: msg.key.id });
    console.log('Ask two consenting participants to vote/change votes. Press Ctrl+C after testing.');
  } finally { rl.close(); }
});
