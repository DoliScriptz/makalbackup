import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("Method Not Allowed");

  const execPath = path.resolve("data", "executions.json");
  if (!fs.existsSync(execPath)) return res.status(200).json({});

  const executions = JSON.parse(fs.readFileSync(execPath, "utf8"));
  return res.status(200).json(executions);
}
