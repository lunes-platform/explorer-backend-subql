# Lunes Explorer API

Lightweight REST API for project CRUD, verification, and social interactions.

## Quick Start

```bash
cd api
npm install
node seed.js     # Seed initial project data (run once)
npm run dev      # Start with --watch (auto-reload)
# or
npm start        # Production start
```

Server runs on **http://localhost:4000** by default. Set `API_PORT` env var to change.

## Endpoints

### Projects
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List all projects (with social stats) |
| GET | `/api/projects/:slug` | Get single project |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:slug` | Update project (owner only) |
| DELETE | `/api/projects/:slug` | Delete project |

### Verification
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/projects/:slug/verify` | Submit verification request |
| POST | `/api/projects/:slug/review` | Admin review (approve/reject) |

### Social
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/social/like` | Toggle like `{projectSlug, userAddress}` |
| POST | `/api/social/follow` | Toggle follow `{projectSlug, userAddress}` |
| GET | `/api/social/project/:slug` | Get likes/follows for project |
| GET | `/api/social/user/:address` | Get all interactions by user |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |

## Data Storage

JSON files in `api/data/`:
- `projects.json` — All project records
- `social.json` — Like/follow interactions

## Frontend Integration

The frontend connects via `VITE_API_URL` env var (defaults to `http://localhost:4000`).
When the API is unavailable, the frontend falls back to hardcoded data in `knownProjects.ts`.

Key frontend files:
- `frontend/src/services/projectsApi.ts` — API client
- `frontend/src/hooks/useProjects.ts` — React hooks with API+fallback
- `frontend/src/hooks/useSocialInteractions.ts` — Social hooks synced to API
