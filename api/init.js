import crypto from "crypto";

const usedTokens = new Set();

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  if (req.headers["user-agent"] !== "MakalHubExecutor") return res.status(403).end();

  const { userid, username } = req.query;
  if (!userid || !username) return res.status(400).end();

  const expires = Date.now() + 2 * 60 * 1000;
  const payload = `${userid}:${username}:${expires}`;
  const sig = crypto.createHmac("sha256", process.env.HWID_SECRET).update(payload).digest("hex");

  const token = `${payload}:${sig}`;
  usedTokens.add(token);
  setTimeout(() => usedTokens.delete(token), 2 * 60 * 1000);

  return res.status(200).json({ token });
}

export { usedTokens };
