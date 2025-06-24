import fs from "fs";
import path from "path";
import crypto from "crypto";

const SCRIPT_DIR = path.resolve(process.cwd(), "scripts");

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("Method Not Allowed");
  if (req.headers["user-agent"] !== "MakalHubExecutor")
    return res.status(403).end("Forbidden");

  const { name, token } = req.query;
  if (!name || !token) return res.status(400).end("Missing name or token");

  const parts = token.split(":");
  if (parts.length !== 4) return res.status(400).end("Malformed token");

  const [userid, username, expires, sig] = parts;
  const expected = crypto
    .createHmac("sha256", process.env.HWID_SECRET)
    .update(`${userid}:${username}:${expires}`)
    .digest("hex");

  if (sig !== expected) return res.status(403).end("Invalid token");
  if (Date.now() > parseInt(expires)) return res.status(403).end("Token expired");

  const filePath = path.join(SCRIPT_DIR, `${name}.lua`);
  if (!fs.existsSync(filePath)) return res.status(404).end("Script not found");

  const script = fs.readFileSync(filePath, "utf8");
  res.setHeader("Content-Type", "text/plain");
  return res.status(200).send(script);
}
