/**
 * GymBro stack service registry.
 * Ports: Frontend 3000 | API 5000 | Calorie ML 5001 | Form Checker 8000 | Recovery 8001
 */
const path = require("path");

const ROOT = path.join(__dirname, "..");

module.exports = {
  ROOT,
  services: [
    {
      id: "mongodb",
      name: "MongoDB",
      port: null,
      type: "external",
      required: true,
      description: "Database (via MONGO_URL in server/.env)",
    },
    {
      id: "backend",
      name: "Backend API (Express)",
      port: 5000,
      host: "127.0.0.1",
      healthUrl: "http://127.0.0.1:5000/",
      healthMatch: (body) => body === "API is running" || body?.includes?.("API is running"),
      command: { exec: process.execPath, args: [path.join("server", "app.js")] },
      cwd: ROOT,
      required: true,
      aiRelated: false,
    },
    {
      id: "frontend",
      name: "Frontend (Vite)",
      port: 3000,
      host: "127.0.0.1",
      healthUrl: "http://127.0.0.1:3000/",
      healthMatch: (body, status) =>
        status === 200 &&
        String(body).includes('id="root"'),
      command: { script: path.join("scripts", "e2e-frontend.js") },
      cwd: ROOT,
      required: true,
      aiRelated: false,
    },
    {
      id: "calorie-ml",
      name: "Calorie Predictor (FastAPI)",
      port: 5001,
      host: "127.0.0.1",
      healthUrl: "http://127.0.0.1:5001/health",
      healthMatch: (body) => body?.status === "ok",
      python: true,
      cwd: path.join(ROOT, "ai-services", "calorie-predictor"),
      requirements: "requirements-minimal.txt",
      uvicornModule: "main:app",
      required: true,
      aiRelated: true,
    },
    {
      id: "form-checker",
      name: "Form Checker AI (FastAPI)",
      port: 8000,
      host: "127.0.0.1",
      healthUrl: "http://127.0.0.1:8000/health",
      healthMatch: (body) => body?.status === "ok",
      python: true,
      cwd: path.join(ROOT, "ai-services", "form-checker"),
      requirements: "requirements.txt",
      uvicornModule: "main:app",
      required: true,
      aiRelated: true,
    },
    {
      id: "recovery-ai",
      name: "Sleep & Recovery AI (FastAPI)",
      port: 8001,
      host: "127.0.0.1",
      healthUrl: "http://127.0.0.1:8001/",
      healthMatch: (body) => body?.status === "online",
      python: true,
      cwd: path.join(ROOT, "ai-services", "sleep-quality-analysis"),
      requirements: "requirements.txt",
      uvicornModule: "main:app",
      required: true,
      aiRelated: true,
    },
    {
      id: "fitbot",
      name: "FitBot (Groq via Express)",
      port: null,
      type: "embedded",
      healthUrl: "http://127.0.0.1:5000/api/v1/fitbot/chat",
      healthMethod: "POST",
      healthBody: { message: "Reply with exactly: OK", history: [] },
      healthAuth: true,
      required: true,
      aiRelated: true,
      dependsOn: ["backend"],
    },
  ],
};
