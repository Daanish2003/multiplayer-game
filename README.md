# 🎮 Real-Time Collaborative Grid Game

A multiplayer web application for a collaborative 10x10 grid challenge, built as a take-home project for the interview process. This project demonstrates real-time state management, full-stack TypeScript development, and modern monorepo practices.

## 🎯 Project Goal

The primary objective is to build a high-performance, real-time web application where multiple concurrent players interact with and update a single, shared 10x10 grid.

## ✨ Core Features Implemented

* **Shared 10x10 Grid:** All connected players view and interact with the same grid state.
* **Real-Time Sync:** Grid updates are instantly reflected across all connected clients using **Socket.io**.
* **Unique Character Submission:** A player selects a block and updates it with a single Unicode character.
* **Per-Player Restriction:** After a successful submission, the player **cannot update any block again** until a specific condition (timed restriction) is met.
* **Online Player Count:** Displays the count of currently connected players in real-time.

### 🌟 Extra Features (Optional but Encouraged)

* **Timed Restriction:** After a player submits a character, they are restricted from updating for **1 minute** before they can interact with the grid again.
* **Historical Updates (Time Travel):** Implemented the ability to **"go back in time"** to view all past grid states.

---

## ⚙️ Tech Stack & Architecture

The stack aligns with the preferred technologies and utilizes a **Monorepo** structure for cohesive full-stack development.

### Preferred Stack Alignment
| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend (Client)** | **ReactJS** / TypeScript | Renders the 10x10 grid and handles user interaction. |
| **Backend (Server)** | **NodeJs (Express)** / TypeScript | Manages the shared grid state and handles business logic. |
| **Real-Time Layer** | **Socket.io** (inferred via package analysis) | Facilitates bi-directional, low-latency communication between client and server. |

### Development Tooling
| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Monorepo** | **Turborepo** | High-performance build system for parallel task execution. |
| **Package Manager**| **pnpm** | Fast, disk-space efficient dependency management. |
| **Code Quality** | **TypeScript**, **Biome**, **Oxlint** | Strong typing and consistent, enforced code style/linting. |

---

## ⚠️ AI Tool Disclosure

As requested in the assignment requirements:

I have utilized **Google Gemini** (specifically, the Gemini Pro model via a conversational interface) to assist in generating the structure and initial boilerplate text of this **README.md** file and to refine complex explanations related to the monorepo setup (`pnpm`, `Turborepo`).

1.  **Google Gemini**: Used to generate the structure and initial boilerplate text of this **README.md** file and to refine complex explanations related to the monorepo setup (`pnpm`, `Turborepo`) and the **Historical Updates** implementation strategy.
2.  **Claude** and **v0**: Used exclusively for **UI generation** (e.g., component styling, basic layout structure for the grid and controls).

**All core game logic, component architecture, server implementation, and feature fulfillment (including the grid state management, real-time sync, and restriction logic) were designed and written by me.**

---

## 🚀 Getting Started

### Prerequisites

You must have **Node.js (v18+)** and **pnpm** installed.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Daanish2003/multiplayer-game.git
    cd multiplayer-game
    ```
2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

### 🛠️ Instructions to Run the Application

The monorepo is set up to run both the client and server concurrently using a single command:

```bash
pnpm dev
```

1. Wait for the command to finish starting the client and server.

2. Open your browser to: http://localhost:3001 (or the client's configured port).

3. To test the multiplayer functionality, open the same URL in a second browser window or a different browser. You should see the online player count update immediately.

---

## Demo

https://github.com/user-attachments/assets/6d7a660a-7913-436e-a59a-8c5234aa7e4d
