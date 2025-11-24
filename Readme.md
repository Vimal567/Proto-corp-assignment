# Proto Corp assignment

This project demonstrates a full end-to-end pipeline to ingest a live RTSP stream (or local MP4 for development), produce multiple HLS endpoints, serve those via HTTP, and present them in a React dashboard with synchronized playback.

## Prerequisites

- Docker & Docker Compose (or Docker Desktop) installed and running
- Node.js and npm (only if you build/run the React frontend locally)

---

![Screenshot](https://github.com/user-attachments/assets/11870838-23bf-4424-80ec-67a2af5bdab5)

## How to Run

### 1. Clone the repository

```bash
git clone https://github.com/Vimal567/Proto-corp-assignment.git
```

---

## 3. Backend setup

```bash
cd video-backend/node-server
npm install
```
---

## 4. Backend start

```bash
docker compose down
docker compose up -d --build
docker compose logs -f ffmpeg
```
---

## 5. Frontend start

```bash
cd video-frontend
npm install
npm run dev
```

Enjoy Testing!
