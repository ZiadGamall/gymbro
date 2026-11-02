# GymBro

GymBro is a full-stack fitness web application that combines workout tracking, nutrition logging, and several AI-assisted coaching tools. It was built as a team graduation project.

This repository contains a React frontend, an Express API with MongoDB, and three Python FastAPI microservices used for form analysis, calorie prediction, and sleep/recovery recommendations.

## Project overview

GymBro is meant to sit in one place for the daily fitness loop: plan a session, log what you trained, track what you ate, and get targeted AI help when you need it.

The app stores user profiles, onboarding goals, saved training splits, workout templates, completed sessions, and meal entries in MongoDB. The Express API is the only service the browser talks to for application data. AI features are either embedded in that API (FitBot via Groq, food-image analysis via Gemini) or forwarded to local Python services.

This is a team project. The sections below describe the product as implemented in the codebase. A later section describes my contributions specifically.

## Features

The following features exist in the current codebase.

### Accounts and profile

- Registration with profile fields (name, username, email, password, gender, date of birth, height, weight) and optional photo upload
- Email verification before login
- Login with JWT (returned in the response and set as an HTTP-only cookie)
- Password reset via email, token exchange, and a time-limited reset cookie
- Authenticated password change and account update (including photo)
- Account deletion by email and password

### Onboarding and daily use

- Onboarding profile: goal, experience level, training days, diet preference, allergies, calorie/macro targets, and limitations
- Dashboard and hub pages for today, training, nutrition, progress, and profile
- Light/dark theme stored in `localStorage`

### Training

- Exercise library search
- Custom workout template creation and retrieval
- Catalog of training splits, with save/set-active/advance-day for the signed-in user
- Workout session logging (sets, reps, weight, duration) and weekly progress
- Interactive muscle map (Muscle Lab) for exploring muscle groups and related work

### Nutrition

- Food database search by name (calories and macros per 100g)
- Daily meal diary with breakfast, lunch, dinner, and snack entries
- Daily nutrition summary
- Meal-photo analysis through the backend (Gemini)

### AI tools

- **FitBot**: authenticated chat assistant with Groq tool-calling. It can search exercises and foods, create workout templates, log meals and sessions, recommend/save splits, read today’s nutrition totals, and save a generated nutrition plan after confirmation
- **Form checker**: upload a video of squats, biceps curls, or shoulder press; a FastAPI service scores reps and errors; results and an annotated video are stored
- **Calorie estimator**: Random Forest model that estimates calories burned from gender, age, height, weight, duration, and heart rate
- **Sleep and recovery**: Random Forest model that returns a training recommendation (`Train Hard` / `Train Light` / `Rest`). The UI currently fills wearable metrics with a client-side simulator rather than a live watch API
- **AI Lab** (`/ai-lab`): hub that links FitBot and the other AI tools

### Global FitBot UI

FitBot is available as a floating launcher on non-auth pages. Chat history is kept in `localStorage` and sent back to the API with each message.

## Tech stack

| Layer                | Technologies                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| Frontend             | React 18, React Router 6, Vite 4, Axios, Tailwind CSS, Lucide React, Framer Motion, GSAP, Lenis              |
| Backend              | Node.js, Express 5, Mongoose, JWT (`jsonwebtoken`), bcryptjs, Multer, cookie-parser, CORS, dotenv            |
| Database             | MongoDB                                                                                                      |
| Auth and email       | JWT (Bearer header or `jwt` cookie), Brevo transactional email                                               |
| Media                | Local disk uploads for images/videos; Cloudinary for processed form-check videos                             |
| AI (in the Node API) | Groq SDK (`openai/gpt-oss-120b`) for FitBot; Google GenAI (`gemini-2.5-flash`) for food photos               |
| AI (Python services) | FastAPI, Uvicorn, Pydantic, scikit-learn, joblib, NumPy, pandas; form checker also uses OpenCV and MediaPipe |
| Testing              | Playwright (Chromium), plus Node smoke and stack-health scripts                                              |

The repo is a single npm workspace: one root `package.json` covers both `client/` and `server/`. Python services live under `ai-services/` with their own virtualenvs.

## Architecture

```
Browser (Vite, port 3000)
    |  /api proxied to :5000
    v
Express API (port 5000)
    |-- MongoDB (MONGO_URL)
    |-- Groq  (FitBot chat + tools)
    |-- Gemini (food image analysis)
    |-- Cloudinary (form-check output video)
    |-- FastAPI calorie predictor  (:5001)
    |-- FastAPI form checker       (:8000)
    |-- FastAPI sleep/recovery     (:8001)
```

The frontend never calls the Python services directly. Typical AI request paths:

1. **FitBot** — `POST /api/v1/fitbot/chat` → `fitbot.service.js` calls Groq with a user-context system prompt and tool definitions. Tool calls hit MongoDB through `fitbotTools.js` (exercises, foods, workouts, meals, splits, nutrition plans). The final text reply is returned to the FitBot UI.
2. **Form check** — the client uploads a video to `POST /api/v1/form-check/analyze`. Express stores it with Multer, forwards it to FastAPI `/analyze-form`, saves the JSON result in `FormCheckHistory`, uploads the annotated video to Cloudinary (authenticated), and returns the record. Playback uses a signed Cloudinary URL from `GET /api/v1/form-check/video-url/:recordId`.
3. **Calories** — `POST /api/v1/calories/predict` validates the body and posts JSON to FastAPI `/predict`.
4. **Recovery** — `POST /api/v1/status/daily-status` adds gender and derived age from the user document, then posts to FastAPI `/predict-recovery`.
5. **Food photo** — `POST /api/v1/foodAnalysis/analyze-food` reads the uploaded image and sends it to Gemini; the JSON nutrition estimate is returned to the client.

Auth for protected routes uses `authController.protect`: a Bearer token from `Authorization` or, if missing, the `jwt` cookie. The React app stores the token in `localStorage` and attaches it on API calls from `client/src/lib/healthApi.js`. Some pages also keep a local fallback snapshot in `gymbro.health.v1`.

CORS allows `FRONTEND_URL`, optional comma-separated `CORS_ORIGINS`, and local Vite origins (`localhost` / `127.0.0.1` on ports 3000 and 5173), with credentials enabled.

## My contributions

This was a team project. I did not build the entire application. My work concentrated on the backend, wiring AI into that backend, connecting the relevant frontend screens to those APIs, and some UI polish.

**Backend**

- Express application structure: routes, controllers, Mongoose models, error handling, and MongoDB connection
- Authentication flows: registration, email verification, login, logout, JWT protect middleware, password reset, password update
- Domain APIs for onboarding, nutrition entries, workout templates and sessions, exercise search, splits, and user account updates
- File upload handling (images and form-check video) and Cloudinary storage for processed form-check videos
- Email delivery through Brevo for verification and password reset

**AI integration**

- FitBot service: Groq client, system prompt built from the user and onboarding profile, retry/quota handling, and tool-calling loop that writes back to the database
- Proxies from Express to the FastAPI services (form checker, calorie predictor, sleep/recovery), including request validation and error mapping
- Food-image analysis through Gemini on the Node server
- Frontend API helpers and pages that call those endpoints (FitBot chat, form checker, calorie estimator, sleep/recovery, food scanner)

**Frontend polish**

- Incremental UI work on the AI-related screens and shared FitBot launcher, plus other small presentation and integration fixes so the client matched the backend contracts

Other teammates owned substantial frontend design, ML model training, and pose-processing logic inside the Python services. The calorie and sleep services load pre-trained `.pkl` artifacts; the form checker’s per-exercise processors live under `ai-services/form-checker/`.

## Project structure

```
GymBro/
├── client/                 React + Vite app
│   ├── src/pages/          Routes (auth, hubs, AI tools, account)
│   ├── src/components/     Navbar, FitBot, muscle map, dashboard widgets
│   └── src/lib/            healthApi.js, healthStore.js, smartWatch.js
├── server/                 Express API
│   ├── app.js              Entry point, CORS, route mounting
│   ├── config/             MongoDB connection
│   ├── routes/             HTTP routers under /api/v1/...
│   ├── controllers/        Request handlers
│   ├── models/             Mongoose schemas
│   ├── services/           FitBot and form-checker forwarding
│   ├── utils/              Auth helpers, uploads, email, Cloudinary, errors
│   └── .env                Local secrets (not committed)
├── ai-services/
│   ├── form-checker/       MediaPipe pose form analysis (port 8000)
│   ├── calorie-predictor/  Calories-burned model (port 5001)
│   └── sleep-quality-analysis/  Recovery recommendation (port 8001)
├── e2e/                    Playwright specs
├── scripts/                Stack start, health, smoke, and demo helpers
├── playwright.config.js
└── package.json            Frontend, backend, and script commands
```

## Getting started

### Prerequisites

- Node.js and npm (the project uses a single root `package.json`)
- Python 3, with the ability to create virtualenvs (`python -m venv`)
- A MongoDB instance reachable from `MONGO_URL` (local or Atlas)
- API keys for the services you want to use: Brevo (email), Groq (FitBot), Gemini (food photos), Cloudinary (form-check videos)

The stack scripts look for `python` on Windows and `python3` on other platforms.

### Installation

```bash
git clone <repository-url>
cd GymBro
npm install
```

Create `server/.env` using the variables listed below. That file is gitignored.

Python dependencies are installed automatically when you start the full stack (`npm run stack:start` or `npm run stack:ensure`). Each AI service gets a `venv/` under its directory and installs from:

- `ai-services/calorie-predictor/requirements-minimal.txt`
- `ai-services/form-checker/requirements.txt`
- `ai-services/sleep-quality-analysis/requirements.txt`

Trained model files expected on disk:

- `ai-services/calorie-predictor/calories_model.pkl` and `gender_encoder.pkl`
- `ai-services/sleep-quality-analysis/models/*.pkl`

### Run the API and frontend only

```bash
npm run dev          # Express API, default http://localhost:5000
npm run client:dev   # Vite, http://localhost:3000, proxies /api to :5000
```

`npm run server:dev` is the same as `npm run dev` (nodemon on `server/app.js`).

### Run the full stack

```bash
npm run stack:start
```

This checks MongoDB, then starts the API, Vite frontend, and the three FastAPI services in this order and on these ports:

| Service           | Port |
| ----------------- | ---- |
| Frontend (Vite)   | 3000 |
| Backend (Express) | 5000 |
| Calorie predictor | 5001 |
| Form checker      | 8000 |
| Sleep / recovery  | 8001 |

FitBot is not a separate process; it runs inside Express and needs `GROQ_API_KEY`.

To start missing services in the background (used before some tests):

```bash
npm run stack:ensure
npm run stack:health
```

## Environment variables

Place these in `server/.env`. Do not commit real values. The backend loads this file from `server/app.js`.

### Required for the API

| Variable       | Purpose                                                                   | Example (placeholder)               |
| -------------- | ------------------------------------------------------------------------- | ----------------------------------- |
| `MONGO_URL`    | MongoDB connection string                                                 | `mongodb://127.0.0.1:27017/gymbro`  |
| `JWT_SECRET`   | Secret used to sign and verify JWTs                                       | `replace-with-a-long-random-string` |
| `PORT`         | Express listen port                                                       | `5000`                              |
| `FRONTEND_URL` | Frontend origin for CORS, email-verify redirect, and password-reset links | `http://localhost:3000`             |

### Optional API / CORS

| Variable           | Purpose                                                                       | Example (placeholder)   |
| ------------------ | ----------------------------------------------------------------------------- | ----------------------- |
| `NODE_ENV`         | When set to `production`, auth cookies are marked `secure`                    | `development`           |
| `MONGO_TIMEOUT_MS` | MongoDB server selection timeout in milliseconds (default `30000` in the API) | `30000`                 |
| `CORS_ORIGINS`     | Extra allowed origins, comma-separated                                        | `http://127.0.0.1:3000` |

### Email (Brevo)

| Variable        | Purpose                               | Example (placeholder)  |
| --------------- | ------------------------------------- | ---------------------- |
| `BREVO_API_KEY` | Brevo API key for transactional email | `your-brevo-api-key`   |
| `EMAIL_FROM`    | Sender address                        | `no-reply@example.com` |

### AI and media

| Variable                   | Purpose                                                         | Example (placeholder)    |
| -------------------------- | --------------------------------------------------------------- | ------------------------ |
| `GROQ_API_KEY`             | FitBot (Groq chat completions)                                  | `your-groq-api-key`      |
| `GEMINI_API_KEY`           | Food image analysis                                             | `your-gemini-api-key`    |
| `CLOUDINARY_CLOUD_NAME`    | Cloudinary cloud name                                           | `your-cloud-name`        |
| `CLOUDINARY_API_KEY`       | Cloudinary API key                                              | `your-cloudinary-key`    |
| `CLOUDINARY_API_SECRET`    | Cloudinary API secret                                           | `your-cloudinary-secret` |
| `CALORIE_SERVICE_URL`      | Calorie FastAPI base URL (default `http://localhost:5001`)      | `http://127.0.0.1:5001`  |
| `FORM_CHECKER_SERVICE_URL` | Form-checker FastAPI base URL (default `http://127.0.0.1:8000`) | `http://127.0.0.1:8000`  |
| `RECOVERY_SERVICE_URL`     | Recovery FastAPI base URL (default `http://127.0.0.1:8001`)     | `http://127.0.0.1:8001`  |

The Vite client does not require its own env file; `/api` is proxied to `http://localhost:5000`.

### Testing / Playwright (optional)

These have defaults in the scripts if unset:

| Variable               | Purpose                                   | Default in code           |
| ---------------------- | ----------------------------------------- | ------------------------- |
| `SMOKE_USERNAME`       | Smoke-test user                           | `gymbro_smoke`            |
| `SMOKE_PASSWORD`       | Smoke-test password                       | `SmokeTest123!`           |
| `SMOKE_EMAIL`          | Smoke-test email                          | `gymbro.smoke@test.local` |
| `SMOKE_BASE_URL`       | API base for `npm run smoke-test`         | `http://127.0.0.1:5000`   |
| `SMOKE_FRONTEND_PORTS` | Frontend ports probed by the smoke script | `3000,3001`               |
| `PLAYWRIGHT_BASE_URL`  | Playwright app URL                        | `http://127.0.0.1:3000`   |
| `PLAYWRIGHT_API_URL`   | Playwright API URL                        | `http://127.0.0.1:5000`   |

## Available scripts

From the repository root:

| Command                                                        | What it does                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------ |
| `npm start`                                                    | `node server/app.js`                                         |
| `npm run dev` / `npm run server:dev`                           | API with nodemon                                             |
| `npm run client:dev`                                           | Vite dev server on port 3000                                 |
| `npm run client:build`                                         | Production build to `client/dist`                            |
| `npm run client:preview`                                       | Preview the production build                                 |
| `npm run frontend:dev` / `frontend:build` / `frontend:preview` | Aliases of the client scripts                                |
| `npm run stack:start`                                          | Start Mongo-dependent full stack in the foreground           |
| `npm run stack:ensure`                                         | Ensure services are up (background)                          |
| `npm run stack:health`                                         | Probe Mongo, API, Python services, and FitBot                |
| `npm run smoke-test`                                           | HTTP smoke tests against the running API                     |
| `npm run playwright:install`                                   | Install Playwright Chromium                                  |
| `npm run playwright:verify`                                    | Check Playwright installation                                |
| `npm run test:e2e`                                             | Playwright tests (`e2e/`), starts API and frontend if needed |
| `npm run test:e2e:smoke`                                       | Home-page smoke spec only                                    |
| `npm run test:e2e:ai`                                          | Ensure stack + health check, then `e2e/ai-smoke.spec.js`     |
| `npm run demo:record`                                          | Product demo Playwright run (`playwright.demo.config.js`)    |
| `npm run demo:gallery`                                         | Build the demo screenshot gallery                            |
| `npm run release:validate`                                     | Stack health, demo run, and related checks                   |

Helper scripts under `scripts/` also include `kill-port.js`, `verify-user-email.js`, `e2e-backend.js`, `e2e-frontend.js`, and `generate-form-check-sample.py` (used by stack health to produce a sample squat video when missing).

## Testing

There is no separate unit-test suite in `package.json`. Coverage is Playwright plus Node scripts.

```bash
npx playwright install chromium   # or: npm run playwright:install

# Home page smoke (headed Chromium by default in playwright.config.js)
npm run test:e2e:smoke

# Full Playwright folder (starts API + Vite via webServer)
npm run test:e2e

# AI smoke: FitBot, calorie predict, recovery, form-check sample, hub pages
npm run test:e2e:ai

# API-level smoke against a running backend
npm run smoke-test
```

`e2e/smoke-home.spec.js` loads `/` and asserts the GymBro title and a “Future Physique” heading.

`e2e/ai-smoke.spec.js` logs in as the smoke user and hits the AI API routes. It also navigates to `/coach` in the browser. The React router currently mounts the AI Lab at `/ai-lab`, so that browser assertion may not match the live routes until it is updated.

`e2e/product-demo.spec.js` is a longer headed walkthrough used with `npm run demo:record`.

Playwright defaults to headed Chromium (`headless: false` in `playwright.config.js`) unless you override it.

## API surface (backend)

All application routes are under `/api/v1`. `GET /` returns `API is running`.

| Prefix             | Role                                                                               |
| ------------------ | ---------------------------------------------------------------------------------- |
| `/users`           | Register, login, verify, logout, me, account update, password reset/update, delete |
| `/onboarding`      | Get / upsert onboarding profile (`protect`)                                        |
| `/food`            | Search and list foods                                                              |
| `/nutrition`       | Meal entries and today’s summary (`protect`)                                       |
| `/workouts`        | Create and list workout templates (`protect`)                                      |
| `/workout-session` | Session CRUD and weekly progress (`protect`)                                       |
| `/exercises`       | Search (`protect`)                                                                 |
| `/split`           | List splits; saved/today/active/advance/save (`protect` where noted)               |
| `/fitbot`          | `POST /chat` (`protect`)                                                           |
| `/calories`        | `POST /predict` (`protect`), `GET /health`                                         |
| `/form-check`      | Analyze, history, signed video URL (`protect`)                                     |
| `/status`          | `POST /daily-status` recovery (`protect`)                                          |
| `/foodAnalysis`    | `POST /analyze-food` (`protect`)                                                   |

Static uploads are served from `/upload` → `server/uploads`.

## Future improvements

These are gaps visible in the current code, not a product roadmap.

- Sleep recovery is driven by `SmartWatchSimulator` on the client; there is no live wearable integration in this repo.
- AI smoke tests still open `/coach`, while the AI Lab page is registered at `/ai-lab`.
- The root `package.json` name is still `mini-auth-project`.
- `client/README.md` describes an older, smaller set of pages than `client/src/App.jsx`.
- There are no dedicated unit tests for controllers or Python models; checks are smoke/e2e oriented.
- Account deletion authenticates with email and password on the request body and does not use the JWT `protect` middleware.

## License

The root `package.json` lists `ISC`.
