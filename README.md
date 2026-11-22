<div align="center">

# HireSphere AI
### Full-Stack Talent Intelligence, AI Code Auditor, Cross-Platform Flutter Client & Serverpod Cloud Backend

[![Live Web App](https://img.shields.io/badge/Live%20Web%20App-Vercel-black?style=for-the-badge&logo=vercel)](https://hackathon-ats.vercel.app)
[![Serverpod Cloud](https://img.shields.io/badge/Serverpod%20Cloud-Live%20200%20OK-02569B?style=for-the-badge&logo=dart)](https://hiresphere-ai.api.serverpod.space)
[![Flutter](https://img.shields.io/badge/Flutter-3.29%20Client-02569B?style=for-the-badge&logo=flutter)](https://flutter.dev)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-orange?style=for-the-badge&logo=googlegemini)](https://ai.google.dev/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)

<br/>

**Transforming candidate code audits and technical hiring from hours of manual fatigue into seconds of algorithmic, objective, bias-free evaluation.**

[Live Web App](https://hackathon-ats.vercel.app) • [Serverpod API](https://hiresphere-ai.api.serverpod.space) • [GitHub Repository](https://github.com/AnshGour16/HACKATHON_BUILDERTHEORY) • [Features](#-key-features) • [Architecture](#-project-architecture) • [Quickstart](#-quickstart)

</div>

---

## 📌 Live Deployment & Verified Submission Links

| Component | Target URL / Path | Status |
|---|---|---|
| **Live Web Application (Vercel)** | [https://hackathon-ats.vercel.app](https://hackathon-ats.vercel.app) | Active & Online |
| **Serverpod Cloud Backend (API)** | [https://hiresphere-ai.api.serverpod.space](https://hiresphere-ai.api.serverpod.space) | Verified Live (HTTP 200 OK) |
| **Serverpod Cloud Web Host** | [https://hiresphere-ai.serverpod.space](https://hiresphere-ai.serverpod.space) | Active & Online |
| **GitHub Primary Repository** | [https://github.com/AnshGour16/HACKATHON_BUILDERTHEORY](https://github.com/AnshGour16/HACKATHON_BUILDERTHEORY) | Main Branch Synced |
| **Flutter Mobile App Directory** | [`flutter_app/`](file:///flutter_app) | Material 3 & Inter Design System |
| **Serverpod Server Directory** | [`hiresphere_server/`](file:///hiresphere_server) | Serverpod 2.9 & `scloud.yaml` |

---

## 🏗️ Project Architecture

```
AI-SAAS /
├── flutter_app/                # Flutter Cross-Platform Client (Web, Android, iOS)
│   ├── lib/
│   │   ├── models/             # Candidate & Job entities
│   │   ├── screens/            # Dashboard, Candidate Details, Jobs, Copilot
│   │   ├── services/           # ApiService connecting to Serverpod Cloud
│   │   ├── widgets/            # Metric Cards, Radial Painters, Candidate Cards
│   │   └── main.dart           # Flutter Material 3 entrypoint with Inter typography
│   └── pubspec.yaml
│
├── hiresphere_server/          # Serverpod Backend Server (Dart Cloud Native)
│   ├── bin/
│   │   └── main.dart           # Production server entrypoint
│   ├── config/                 # development.yaml, production.yaml & passwords.yaml
│   ├── lib/
│   │   ├── src/endpoints/      # CandidateEndpoint & JobEndpoint
│   │   └── server.dart         # Serverpod Protocol & Server Lifecycle
│   ├── scloud.yaml             # Serverpod Cloud Deployment Specification
│   ├── Dockerfile              # Containerized build for Serverpod Cloud
│   └── pubspec.yaml
│
├── hiresphere_client/          # Generated Serverpod Client SDK Package
│
└── src/                        # Next.js 16 Web Dashboard & Recruiter Portal
    ├── app/
    │   ├── admin/              # Leaderboard, Hackathons, Submission Audits
    │   ├── recruiter/          # Recruiter Pipeline & AI Job Creation
    │   ├── candidate/          # Profile, Resume & Application Tracker
    │   ├── jobs/               # Career Portal & Role Listings
    │   └── api/                # API Routes (Gemini Evaluation, Auth, Submissions)
    ├── components/             # High-contrast Light SaaS UI Components
    ├── lib/                    # Gemini 2.5 Flash, MongoDB, GitHub Scraper, Auth
    └── models/                 # Mongoose Data Schemas (Submission, Team, Hackathon)
```

---

## ✨ Key Features

### 1. 🐙 Automated Repository Scraping & Code Audit
* Server-side GitHub repository inspection with anti-SSRF protections.
* Parses dependency manifests (`package.json`, `pubspec.yaml`, `requirements.txt`), architecture trees, test suites, and authentic git commit cadence.
* Safe and non-intrusive: never executes participant-submitted code.

### 2. 🤖 Objective AI Technical Review with Gemini 2.5 Flash
* Analyzes verifiable source code evidence rather than promotional README claims.
* Hardened against prompt injection to prevent tampering with evaluations.
* Generates structured evaluations across a strict **100-Point Rubric**:
  - Code Quality and Maintainability (25 pts)
  - Technical Implementation Depth (25 pts)
  - System Architecture & Modularity (20 pts)
  - Automated Testing & Error Boundaries (15 pts)
  - Documentation & Git Cadence (15 pts)

### 3. 📱 Cross-Platform Flutter Client (`flutter_app/`)
* Built with Flutter 3.29 & Dart 3.14.
* Adheres to the YouKT executive design system:
  - Clean light SaaS theme with high-contrast slate borders.
  - Inter Google Fonts typography.
  - Custom radial score painters and metric overview cards.
  - Real-time candidate evaluation inspector and AI recruiter copilot.
  - Zero unicode emojis; pure Lucide & Material Symbols.

### 4. ☁️ Serverpod Cloud Backend (`hiresphere_server/`)
* Dart-native backend running on **Serverpod Cloud** with Google Cloud infrastructure.
* Endpoints for candidates and job matching:
  - `CandidateEndpoint.evaluateCandidate`
  - `JobEndpoint.listJobs`
* Live public endpoints responding with HTTP 200 OK:
  - API: `https://hiresphere-ai.api.serverpod.space`
  - Web: `https://hiresphere-ai.serverpod.space`

### 5. ⚖️ Deterministic Server-Side Ranking Engine
* Highest score receives **Rank 1**.
* Discrete integer-cent precision (`Math.round(score * 100)`) eliminates floating-point epsilon cycles.
* 5-Stage deterministic tie-breaker (Composite Score -> Technical Score -> Pitch Score -> Timestamp -> ObjectId).
* Atomic `isRankingDirty` safeguard prevents publishing outdated or invalidated leaderboards.

---

## 📊 100-Point Technical Evaluation Rubric

| Criteria | Weight | Focus Areas |
|---|---:|---|
| **Code Quality & Maintainability** | 25 | Readability, naming conventions, separation of concerns, clean interfaces, error management. |
| **Technical Implementation Depth** | 25 | Non-trivial engineering logic, API/database integrations, framework depth, real logic vs boilerplate templates. |
| **Architecture & Modularity** | 20 | Directory organization, decoupling of frontend/backend/services, state management. |
| **Testing & Error Handling** | 15 | Automated unit/integration test presence, test coverage, robust error boundaries, graceful fallbacks. |
| **Documentation & Git Cadence** | 15 | Setup instructions, prerequisites, environment configuration guidance, meaningful commit cadence. |
| **Total** | **100** | **Normalized Technical Score** |

---

## 🚀 Quickstart

### Prerequisites
* **Node.js**: v20 or higher
* **Dart SDK**: v3.0+ (Installed at `C:\Users\anshg\dart-sdk`)
* **Flutter**: v3.20+ (Optional for mobile compilation)

---

### 1. Web Application (Next.js)

```bash
# Clone the repository
git clone https://github.com/AnshGour16/HACKATHON_BUILDERTHEORY.git
cd HACKATHON_BUILDERTHEORY

# Install dependencies
npm install

# Configure environment variables (.env.local)
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the web dashboard.

---

### 2. Flutter Mobile & Web Client (`flutter_app/`)

```bash
cd flutter_app

# Fetch Flutter dependencies
flutter pub get

# Run on Chrome
flutter run -d chrome

# Or build for Android
flutter build apk --release
```

---

### 3. Serverpod Backend Server (`hiresphere_server/`)

```bash
cd hiresphere_server

# Install Dart dependencies
dart pub get

# Run Serverpod server locally
dart run bin/main.dart

# Or deploy to Serverpod Cloud
serverpod cloud deploy -p hiresphere-ai
```

---

## 🔑 Test Credentials (Judge & Admin Access)

For evaluation and testing out-of-the-box:
* **Login URL:** [https://hackathon-ats.vercel.app/login](https://hackathon-ats.vercel.app/login)
* **Email:** `admin@hackathon.com`
* **Password:** `admin123`

*(The database automatically auto-provisions this account on first sign-in if not present).*

---

## 🛡️ Security & Integrity

* **Zero Arbitrary Execution:** Never runs untrusted user code on host environments.
* **Serverless Resilience:** In-memory PDF parsing and GitHub REST API integration prevents container exhaustion.
* **Role-Based Access Control:** All admin mutation endpoints are secured via NextAuth session validation.
* **Anti-SSRF Protection:** GitHub repository URLs are verified against official GitHub domains before processing.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
