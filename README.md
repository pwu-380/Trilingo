# Trilingo

A personal Mandarin Chinese learning app with three modes: an AI-powered chatbot for conversation practice, flash cards for vocabulary building, and language games.

Built as a local web app — runs on your computer and works in any browser, including your phone over Wi-Fi.

## What It Does

**Chatbot** — Have a conversation in Chinese with Al, your AI tutor (powered by Google Gemini). Chinese responses show pinyin above each character. English translations are hidden behind a spoiler you can reveal when needed. After each exchange, you get grammar feedback and tips on your Chinese.

**Flash Cards** — Build a deck of Chinese vocabulary. Quiz yourself with multiple-choice in both directions (Chinese-to-English and English-to-Chinese). Cards you've learned can be deactivated and brought back later.

**Games** — Duolingo-style language games using your flash card vocabulary. *(Coming soon)*

## Requirements

- Python 3.12+
- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/apikey) (free tier works)

## Setup

1. **Clone the repo:**
   ```
   git clone https://github.com/pwu-380/Trilingo.git
   cd Trilingo
   ```

2. **Create a Python virtual environment and install dependencies:**
   ```
   python -m venv venv
   pip install -r requirements.txt
   ```

3. **Install frontend dependencies:**
   ```
   cd frontend
   npm install
   cd ..
   ```

4. **Add your API key:**

   Copy `.env.example` to `.env` and paste your Gemini API key:
   ```
   GEMINI_API_KEY=your-key-here
   ```

## Running

From PowerShell in the project root:

```powershell
.\server-startup.ps1
```

This starts both the backend and frontend in new windows, generates a session password, and prints a clickable link:

```
  Trilingo is starting up!

  Password:  grove-pearl-swift-ember

  Local:     http://localhost:8732?token=grove-pearl-swift-ember
  Phone:     http://192.168.1.42:8732?token=grove-pearl-swift-ember

  Run .\server-shutdown.ps1 to stop.
```

Open the local link in your browser. Use the phone link to play on your phone over Wi-Fi.

To stop everything:

```powershell
.\server-shutdown.ps1
```

### Manual startup (advanced)

If you prefer to run the servers yourself:

```
uvicorn backend.main:app --reload --port 8731
cd frontend && npm run dev
```

Without `TRILINGO_TOKEN` set, auth is disabled.

## Status

This project is under active development. The chatbot is being built first, followed by flash cards, then games.
