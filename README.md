# GymBro

Clean project layout:

- `client/` - React + Vite frontend
- `server/` - Express API, models, routes, uploads, and backend environment file

## Scripts

```bash
npm install
npm run dev
npm run client:dev
npm run client:build
```

The backend defaults to port `5000`; the client dev server runs on `http://localhost:3000` and proxies `/api` requests to the backend.
