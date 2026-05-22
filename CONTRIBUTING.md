# Contributing to Supply Chain Analyst Agent

This repository consists of a Python FastAPI backend and a Next.js (React) frontend. Follow the instructions below to configure the full stack for local development.

---

## 1. Setup Backend (FastAPI)

Prerequisites: **Python 3.10+** and a **Gemini API Key**.

1. **Navigate to the Repository and Setup Virtual Environment**:
   ```bash
   cd supply-chain-analyst
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Google Gemini API Key inside `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Launch Backend Server**:
   Start the FastAPI development server:
   ```bash
   cd backend
   python3 main.py
   ```
   The backend will start running on `http://localhost:8000`.

---

## 2. Setup Frontend (Next.js)

Prerequisites: **Node.js 18+** and **npm**.

1. **Install NPM Modules**:
   Open a separate terminal window, navigate to the `frontend` folder, and run:
   ```bash
   cd supply-chain-analyst/frontend
   npm install
   ```

2. **Launch Dev Server**:
   ```bash
   npm run dev
   ```
   The frontend dashboard will be available at `http://localhost:3000`.

---

## 3. Core Development Standards

* **Monorepo Etiquette**: Keep backend python dependencies restricted to `requirements.txt` and frontend next.js dependencies limited to `frontend/package.json`.
* **API Documentation**: The backend automatically generates Swagger documentation at `http://localhost:8000/docs`. Ensure any new endpoint is properly documented with standard model classes.
* **Component Styling**: We use TailwindCSS for layout styling. Maintain glassmorphic, deep-slate design structures and ensure layout responsive responsiveness across different screen ratios.
