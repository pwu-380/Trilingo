# Session Context — 2026-02-12

## What Was Done This Session

### Bug Fixes
1. **Quiz type not alternating** — User reported quiz was stuck showing the same type (zh_to_en) 9/10 times. Root cause: browser caching GET `/api/flashcards/quiz` responses. Fix: added `cache: "no-store"` to the fetch call in `frontend/src/api/flashcards.ts`. Quiz type selection remains `random.choice` on the backend (user explicitly wants random, NOT alternating).

2. **Shutdown script not closing popup windows** — `Stop-Process` only killed the parent PID, not child processes. Fix: replaced with `taskkill /PID ... /T /F` in `server-shutdown.ps1` to kill entire process trees.

3. **Auth bypass bug (ONGOING)** — User reports being able to access the app with a wrong token in incognito. Root cause identified: **orphan uvicorn processes** from previous sessions still listening on port 8731 WITHOUT `TRILINGO_TOKEN` set. Windows allows multiple processes to bind the same port, so the old no-auth process receives all requests while the new auth-enabled process sits idle.
   - Confirmed via `netstat -ano | findstr 8731` showing two PIDs listening
   - Added orphan-killing logic to `server-startup.ps1` (kills all processes on ports 8731/8732 before launching)
   - However, `taskkill /F` didn't reliably kill the orphan on the user's machine
   - **User is restarting their computer to clear all orphans**
   - **AFTER RESTART**: Test auth in incognito with wrong token. If it still fails, the problem is elsewhere (not orphan processes). If it works, the fix is confirmed.
   - The env var method (`$env:TRILINGO_TOKEN` + `Start-Process python.exe`) IS working — confirmed via startup log `Auth enabled (token: cide...)`

### Things That Were Tried and Reverted
- Alternating quiz types (tracking `last_quiz_type`) — reverted, user wants random
- Token file approach (`.trilingo.token`) — reverted, user prefers env var
- `cmd.exe /c "set TOKEN=val&& python ..."` approach — reverted back to direct `Start-Process python.exe`

## Current State

### Phases
- Phase 2A (backend): COMPLETE
- Phase 2B (frontend UI): COMPLETE
- Phase 2C (asset worker — Edge TTS + Openverse images): NOT STARTED (next task)
- See `.claude/PHASE2.md` for full plan

### Beads Tasks
- `Trilingo-wle: P2-asset-worker` — open, ready to start
- `Trilingo-3pl: P3-segmentation` — open, unblocked

### Outstanding Issues
1. **Auth bug** — needs verification after computer restart. If orphan processes were the sole cause, the startup script's port-clearing logic should prevent recurrence. If auth still fails after clean restart, dig deeper into middleware or Vite proxy behavior.
2. **Debug print in main.py** — `Auth enabled (token: xxxx...)` / `Auth DISABLED` print is still in the lifespan. Can be left as useful diagnostic or removed later.

### Key Files Modified This Session
- `server-startup.ps1` — orphan process cleanup on ports 8731/8732
- `server-shutdown.ps1` — `taskkill /T /F` for process tree cleanup
- `backend/main.py` — auth diagnostic print in lifespan
- `frontend/src/api/flashcards.ts` — `cache: "no-store"` on quiz fetch
- `backend/services/flashcard_service.py` — reverted to `random.choice` for quiz type
- `backend/routers/flashcards.py` — removed `last_type` param (reverted)
- `frontend/src/hooks/useFlashcards.ts` — removed `lastType` passing (reverted)
