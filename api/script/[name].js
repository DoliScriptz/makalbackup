import fs from "fs";
import path from "path";
import crypto from "crypto";

const EXEC_FILE = path.resolve(process.cwd(), "data", "executions.json");
const USED_TOKENS_FILE = path.resolve(process.cwd(), "data", "used_tokens.txt");

function ensureFiles() {
  if (!fs.existsSync(EXEC_FILE)) fs.writeFileSync(EXEC_FILE, JSON.stringify({ total: 0 }, null, 2));
  if (!fs.existsSync(USED_TOKENS_FILE)) fs.writeFileSync(USED_TOKENS_FILE, "");
}

function incrementExecutions(token) {
  ensureFiles();

  const used = new Set(fs.readFileSync(USED_TOKENS_FILE, "utf8").split("\n"));
  if (used.has(token)) return;

  const data = JSON.parse(fs.readFileSync(EXEC_FILE, "utf8"));
  data.total += 1;

  fs.writeFileSync(EXEC_FILE, JSON.stringify(data, null, 2));
  fs.appendFileSync(USED_TOKENS_FILE, token + "\n");
}

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("Method Not Allowed");
  if (req.headers["user-agent"] !== "MakalHubExecutor") return res.status(403).end("Forbidden");

  const { name, token } = req.query;
  if (!name || !token) return res.status(400).end("Missing name or token");

  const parts = token.split(":");
  if (parts.length !== 4) return res.status(400).end("Malformed token");

  const [userid, username, expires, sig] = parts;
  const expiresAt = parseInt(expires, 10);
  if (Date.now() > expiresAt) return res.status(403).end("Token expired");

  const expectedSig = crypto
    .createHmac("sha256", process.env.HWID_SECRET)
    .update(`${userid}:${username}:${expires}`)
    .digest("hex");

  if (sig !== expectedSig) return res.status(403).end("Invalid token signature");

  const filePath = path.resolve(process.cwd(), "scripts", `${name}.lua`);
  if (!fs.existsSync(filePath)) return res.status(404).end("Script not found");

  const script = fs.readFileSync(filePath, "utf8");

  incrementExecutions(token);

  res.setHeader("Content-Type", "text/plain");
  return res.status(200).send(script);
}
