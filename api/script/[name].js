const fetch = require('node-fetch');
const crypto = require('crypto');

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, token } = req.body || {};
  if (!name || !token) return res.status(400).end();

  const [uid, usr, exp, sig] = token.split(':');
  if (!uid || !usr || !exp || !sig || Date.now() > +exp) return res.status(403).end();

  const valid = crypto
    .createHmac('sha256', process.env.HWID_SECRET)
    .update(`${uid}:${usr}:${exp}`)
    .digest('hex') === sig;
  if (!valid) return res.status(403).end();

  const scriptRes = await fetch(`https://makalhub.vercel.app/scripts/${name}.lua`);
  if (!scriptRes.ok) return res.status(404).end();
  const script = await scriptRes.text();

  const redisResponse = await fetch(`${UPSTASH_URL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      command: ['INCR', `executions:${name}`]
    })
  });

  if (!redisResponse.ok) return res.status(502).end();

  res.setHeader('Content-Type', 'text/plain');
  res.send(script);
};
