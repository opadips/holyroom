# 🌌 Holyroom

> **Futuristic real‑time communication platform.**
> Enter a name, talk with everyone in the room, share your screen in any quality — all running on your own machine, with a cinematic interface.

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/react-18-61dafb.svg" alt="React">
  <img src="https://img.shields.io/badge/node-18%2B-green.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/webrtc-live-ff69b4.svg" alt="WebRTC">
</p>

---

## 📖 Table of Contents

- [✨ Features](#-features)
- [🔒 Privacy & Security](#-privacy--security)
- [🧱 Tech Stack](#-tech-stack)
- [🧠 Architecture](#-architecture)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [🎨 Design System](#-design-system)
- [⚙️ Environment Variables](#%EF%B8%8F-environment-variables)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

- **Instant text chat** – no accounts needed, just a display name
- **Voice mesh** – every participant hears everyone else in real time (requires HTTPS)
- **Screen sharing** – share any monitor or window up to 4K at 60 fps, or set a custom resolution and frame rate (requires HTTPS)
- **Mute / unmute** – one‑click microphone control with visual feedback
- **Cinematic full‑screen focus** – click any shared screen to enter an immersive, distraction‑free view
- **Live connection status** – see who's connected, connecting, or offline
- **Futuristic UI** – glass panels, ambient lighting, volumetric glows, spring animations, micro‑interactions
- **CSS‑variable design system** – change the entire visual theme by editing a single file (`theme.css`)
- **Runs without HTTPS** – you can test the chat immediately without setting up certificates; voice and screen sharing will be unavailable in that mode

---

## 🔒 Privacy & Security

Holyroom is designed with **privacy first**.
- **Nothing is stored** – no messages, no voice, no screen recordings are ever saved. The server keeps only an in‑memory chat history (the last 200 messages) that is lost on restart.
- **No accounts, no tracking** – you just pick a display name; there are no emails, passwords, or personal data.
- **Peer‑to‑peer media** – voice and screen sharing travel directly between browsers via WebRTC; they never pass through the server.
- **Self‑hosted** – everything runs on your own machine. No third‑party cloud services, no telemetry, no ads.
- **HTTPS by default (optional)** – when SSL certificates are provided, all communication is encrypted. Even without them, the text chat still works for quick local testing.

> Holyroom respects your privacy: what happens in a room stays in that room – literally, because nothing leaves your network.

---

## 🧱 Tech Stack

| Category         | Technology                                                                 |
|------------------|----------------------------------------------------------------------------|
| **Frontend**     | React 18, Tailwind CSS 3, Framer Motion                                   |
| **Realtime**     | Socket.io 4                                                                |
| **WebRTC**       | getUserMedia, getDisplayMedia, RTCPeerConnection (browser APIs)            |
| **Backend**      | Node.js, Express, HTTPS (self‑signed via mkcert) or plain HTTP             |
| **State**        | React hooks (useState, useRef, useCallback)                                |
| **Styling**      | Tailwind CSS + custom CSS variables for theming                            |
| **Animation**    | Framer Motion (spring animations, AnimatePresence)                         |
| **Audio**        | Web Audio API (mute/unmute), basic browser echo cancellation               |

---

## 🧠 Architecture

Holyroom follows a **peer‑to‑peer mesh architecture** for both voice and screen sharing.

- Each client establishes a **full mesh of audio connections** with all other users via `RTCPeerConnection`.
- Screen sharing uses a **one‑to‑many broadcasting model**: the sharer creates a dedicated `RTCPeerConnection` for each viewer and adds the captured video track.
- Signaling is handled through a **single Socket.io server** that relays offers, answers, and ICE candidates.
- The server also manages **text chat** (in‑memory history, last 200 messages) and user lists.

```
Browser A  ←── RTCPeerConnection ──→  Browser B
   │                                       │
   └───────── Socket.io ──────────┘
               signaling
```

> ⚠️ **Current limitation**: Only a free STUN server (`stun.l.google.com:19302`) is configured. A TURN server is required for reliable connectivity across different networks.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **npm** (comes with Node)
- (Optional) **mkcert** – for HTTPS and full media features – [download here](https://github.com/FiloSottile/mkcert/releases)

### 1. Clone the repository

```bash
git clone https://github.com/opadips/holyroom.git
cd holyroom
```

### 2. (Optional) Generate SSL certificates for voice and screen sharing

If you skip this step, the app will run on HTTP and you can still use **text chat**.
To enable microphone and screen sharing, generate certificates with **mkcert**:

```powershell
# Place mkcert.exe in the project root, then run:
.\mkcert.exe -install
.\mkcert.exe localhost 127.0.0.1 ::1 YOUR_LOCAL_IP

# Rename the generated files:
Move-Item -Path "localhost+*.pem" -Destination "cert.pem"
Move-Item -Path "localhost+*-key.pem" -Destination "key.pem"
```

> Replace `YOUR_LOCAL_IP` with the actual IP of your computer (e.g., `192.168.1.10`).

### 3. Launch the application

| Command | Location | Description |
|---------|----------|-------------|
| `.\start.bat` | Root | Launch everything (install deps if missing) |
| `npm run dev` | `server/` | Start the backend with hot reload (nodemon) |
| `npm start` | `client/` | Start the React dev server with HTTPS |


The first run will automatically install all dependencies.
If certificates are found, the server starts with HTTPS; otherwise it falls back to HTTP and prints a warning.

### 4. Open the app

- On the host machine:
  - With HTTPS: `https://localhost:3000`
  - Without HTTPS: `http://localhost:3000`
- On other devices in your network: use the same URL with your computer's IP.

> When running with HTTPS, accept the self‑signed certificate warning once per device.

---

## 📁 Project Structure

```
holyroom/
├── start.bat                    ← Windows launcher (install + run)
├── server/
│   └── src/index.js             ← HTTP/HTTPS server, Socket.io, all event routing
└── client/
    ├── public/index.html
    └── src/
        ├── theme.css            ← Design tokens – edit only this file to change the look
        ├── index.css            ← Global styles, animations, particles
        ├── App.js               ← Root component, state management, Socket.io setup
        ├── hooks/
        │   └── useWebRTC.js     ← Voice mesh, screen sharing, mute logic
        └── components/
            ├── LoginPage.js
            ├── MainLayout.js
            ├── Header.js
            ├── Sidebar.js
            ├── ScreenShareBar.js
            ├── ChatArea.js
            ├── InputBar.js
            ├── SettingsPanel.js
            ├── NotificationBar.js
            ├── CinematicFocus.js          ← Full‑screen stream view
            ├── AtmosphericBackground.js
            ├── AmbientLight.js             ← Volumetric glow system
            ├── MotionWrapper.js            ← Spring page transitions
            └── MicroComponents.js          ← Typing indicator, message status, skeletons
```

---

## 🎨 Design System

Holyroom uses a **CSS‑variable design system** (`theme.css`).
To change the entire visual identity (colors, glass blur, button glow, shadows) you only edit that one file — no JSX modifications needed.

All components rely on semantic utility classes:

- `.glass` – glassmorphism cards
- `.panel-header` / `.panel-sidebar` / `.panel-footer`
- `.btn-primary` / `.btn-danger`
- `.input-field`

This separation keeps the UI **modular, consistent, and instantly re‑themeable**.

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` (server) | `3001` | Port on which the HTTP/HTTPS server listens |
| `HTTPS` (client) | `true` or `false` | Set automatically by `start.bat` based on certificate presence |
| `SSL_CRT_FILE` (client) | `../cert.pem` | Path to the SSL certificate (only if available) |
| `SSL_KEY_FILE` (client) | `../key.pem` | Path to the SSL private key (only if available) |

These are automatically configured by `start.bat`. No manual editing required.

---

## 🤝 Contributing

Contributions are welcome!
If you'd like to improve Holyroom, feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Made with ❤️ for a calm, futuristic, and immersive communication experience.
</p>
```