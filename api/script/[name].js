import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.resolve("data");
const EXEC_FILE = path.join(DATA_DIR, "executions.json");
const USED_TOKENS_FILE = path.join(DATA_DIR, "used_tokens.txt");

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("Method Not Allowed");
  if (req.headers["user-agent"] !== "MakalHubExecutor") return res.status(403).end("Forbidden");

  const { name, token } = req.query;
  if (!name || !token) return res.status(400).end("Missing name or token");

  const parts = token.split(":");
  if (parts.length !== 4) return res.status(400).end("Malformed token");

  const [userid, username, expires, sig] = parts;
  if (Date.now() > parseInt(expires, 10)) return res.status(403).end("Token expired");

  const expectedSig = crypto.createHmac("sha256", process.env.HWID_SECRET)
    .update(`${userid}:${username}:${expires}`)
    .digest("hex");

  if (sig !== expectedSig) return res.status(403).end("Invalid token");

  if (!fs.existsSync(USED_TOKENS_FILE)) fs.writeFileSync(USED_TOKENS_FILE, "");
  const usedTokens = new Set(fs.readFileSync(USED_TOKENS_FILE, "utf8").split("\n"));
  if (usedTokens.has(token)) return res.status(429).end("Token already used");
  fs.appendFileSync(USED_TOKENS_FILE, token + "\n");

  if (!fs.existsSync(EXEC_FILE)) fs.writeFileSync(EXEC_FILE, "{}");
  const executions = JSON.parse(fs.readFileSync(EXEC_FILE, "utf8"));
  executions[name] = (executions[name] || 0) + 1;
  fs.writeFileSync(EXEC_FILE, JSON.stringify(executions, null, 2));

  const filePath = path.resolve("scripts", `${name}.lua`);
  if (!fs.existsSync(filePath)) return res.status(404).end("Script not found");

  const script = fs.readFileSync(filePath, "utf8");
  res.setHeader("Content-Type", "text/plain");
  return res.status(200).send(script);
}
