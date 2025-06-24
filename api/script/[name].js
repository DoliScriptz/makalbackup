import fs from "fs";
import path from "path";
import crypto from "crypto";

const USED_TOKENS_FILE = "/tmp/used_tokens.txt";

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  if (req.headers["user-agent"] !== "MakalHubExecutor") return res.status(403).end("Forbidden");

  const { name, token } = req.query;
  if (!name || !token) return res.status(400).end("Missing name or token");

  const [userid, username, expires, sig] = token.split(":");
  if (!userid || !username || !expires || !sig) return res.status(400).end("Malformed token");
  if (Date.now() > parseInt(expires, 10)) return res.status(403).end("Token expired");

  try {
    const used = fs.readFileSync(USED_TOKENS_FILE, "utf8").split("\n");
    if (used.includes(token)) return res.status(403).end("Token already used");
    fs.appendFileSync(USED_TOKENS_FILE, token + "\n");
  } catch {
    fs.writeFileSync(USED_TOKENS_FILE, token + "\n");
  }

  const expectedSig = crypto
    .createHmac("sha256", process.env.HWID_SECRET)
    .update(`${userid}:${username}:${expires}`)
    .digest("hex");

  if (sig !== expectedSig) return res.status(403).end("Invalid token");

  const filePath = path.resolve("scripts", `${name}.lua`);
  if (!fs.existsSync(filePath)) return res.status(404).end("Script not found");

  const script = fs.readFileSync(filePath, "utf8");
  res.setHeader("Content-Type", "text/plain");
  return res.status(200).send(script);
}
