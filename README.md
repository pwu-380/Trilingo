# Trilingo

A personal Mandarin Chinese learning app with three modes: an AI-powered chatbot for conversation practice, flash cards for vocabulary building, and language games.

Built as a local web app — runs on your computer and works in any browser, including your phone over Wi-Fi.

## What It Does

**Chatbot** — Have a conversation in Chinese with Alister, your AI tutor (powered by Google Gemini). Chinese responses show pinyin above each character. English translations are hidden behind a spoiler you can reveal when needed. After each exchange, you get grammar feedback and tips on your Chinese.

**Flash Cards** — Build and review Chinese vocabulary. Comes pre-loaded with 50 HSK Level 2 words. Each card automatically gets TTS audio (via edge-tts) and a Creative Commons image (via Openverse) generated in the background. Review in sessions of 10, 20, or endless cards — the quiz weights questions toward words you've gotten wrong more often. During review, English-to-Chinese questions show the card's image as a visual hint, and clicking an answer plays the pronunciation. Cards you know can be shelved to the inactive pool and brought back later. Use the "Regen" button on any card to regenerate its audio, image, and study tip.

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

## Project Structure

Chinese language reference data (HSK curriculum, vocabulary lists) lives in `backend/chinese/hsk/`. See `.claude/HSK_LIBRARY_PLAN.md` for the schema and API design.

## Status

The chatbot and flash cards are functional. Games tab coming next.
