# If the power goes out (or the computer restarts)

**Do not worry. Your work is safe.**

The build writes its state to one file after every step — `CONTROL/LEDGER.md` in this project folder. That file is the memory of the whole run: which pieces are done, which are next, where the run stopped.

If the power goes out or the computer restarts:

1. Turn the computer back on.
2. Open a terminal.
3. Paste the same two commands from `CONTROL/LAUNCH.md` again (the build command, and the watch command if you were using it).
4. The build reads the ledger and picks up exactly where it stopped. Nothing is lost.

That is the whole procedure. There is nothing else to remember.

**One thing to know:** the ledger only advances when the build is running. If you restart in the middle of the night and the build is mid-piece, the piece starts over from the last completed step — never from zero.

If something is genuinely wrong (the build keeps failing at the same spot), the morning report and the ledger will say what it is, plainly, and what would unblock it. It is never a silent failure.
