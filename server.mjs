import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load .env.local
const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const [k, ...v] = line.split("=");
    if (k?.trim()) process.env[k.trim()] = v.join("=").trim().replace(/^"|"$/g, "");
  }
}

// Import the existing API handler
const { default: handler } = await import("./api/generate.js");

const server = http.createServer(async (req, res) => {
  // CORS for Vite dev server
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  if (req.method === "POST" && req.url === "/api/generate") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try { req.body = JSON.parse(body); } catch { req.body = {}; }
      // Wrap res to match Vercel's API
      res.status = (code) => { res.statusCode = code; return res; };
      res.json = (data) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data));
      };
      await handler(req, res);
    });
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(3001, () => console.log("API server running at http://localhost:3001"));
