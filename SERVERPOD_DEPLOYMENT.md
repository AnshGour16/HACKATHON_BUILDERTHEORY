# HireSphere AI - Serverpod Cloud Deployment Guide

This project includes a complete **Serverpod** (Dart-native cloud backend) and **Flutter** full-stack architecture built for the Builderbase / Serverpod Hackathon.

---

## 1. Project Architecture
```
├── hiresphere_server/          # Serverpod Backend Server (Dart)
│   ├── config/                 # development.yaml & production.yaml
│   ├── lib/                    # Endpoints (CandidateEndpoint, JobEndpoint)
│   ├── scloud.yaml             # Serverpod Cloud Deployment Spec
│   └── Dockerfile              # Production container build
├── hiresphere_client/          # Generated Serverpod Client Package
└── flutter_app/                # Flutter Cross-Platform Client (Web, Android, iOS)
    ├── lib/                    # Screens & Widgets matching YouKT design
    └── pubspec.yaml
```

---

## 2. Deploying to Serverpod Cloud (1-Command Launch)

### Option A: Using the Serverpod Cloud CLI (`scloud`)
1. From inside `hiresphere_server/`, run:
   ```bash
   scloud launch
   # or
   serverpod cloud launch
   ```
2. The CLI will:
   - Open browser for **Serverpod Cloud Console authentication**.
   - Create your managed project with Postgres database.
   - Deploy your endpoints to a live HTTPS URL:
     `https://<your-project-id>.serverpod.cloud`
3. To update an existing deployment:
   ```bash
   scloud deploy
   ```

---

## 3. Submitting to Hackathon Judges
When submitting to the hackathon form:
- **Serverpod Cloud Live Endpoint:** `https://hiresphere-ai.serverpod.cloud` (or your assigned subdomain)
- **Frontend / Web Demo:** `https://hiresphere-ai.serverpod.cloud/app` (or Vercel link: `https://hackathon-ats.vercel.app`)
- **GitHub Repository:** `https://github.com/AnshGour16/HACKATHON_BUILDERTHEORY`
