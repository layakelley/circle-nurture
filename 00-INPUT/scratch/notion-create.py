import json, os, sys, urllib.request

def load_token():
    path = os.path.expanduser("~/.openclaw/secrets/.env")
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line.startswith("NOTION_API_TOKEN="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("NOTION_API_TOKEN NOT SET")

def api(method, url, payload=None):
    req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", f"Bearer {load_token()}")
    req.add_header("Notion-Version", "2022-06-28")
    req.add_header("Content-Type", "application/json")
    body = json.dumps(payload).encode() if payload is not None else None
    try:
        with urllib.request.urlopen(req, data=body) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()[:800]}", file=sys.stderr)
        raise SystemExit(1)

TXT = lambda t: {"type": "text", "text": {"content": t}}
LINK = lambda t, u: {"type": "text", "text": {"content": t, "link": {"url": u}}}
def h2(t): return {"object": "block", "type": "heading_2", "heading_2": {"rich_text": [TXT(t)]}}
def h3(t): return {"object": "block", "type": "heading_3", "heading_3": {"rich_text": [TXT(t)]}}
def para(rt): return {"object": "block", "type": "paragraph", "paragraph": {"rich_text": rt}}
def bullet(rt): return {"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {"rich_text": rt}}
def code(t): return {"object": "block", "type": "code", "code": {"rich_text": [TXT(t)], "language": "shell"}}
def divider(): return {"object": "block", "type": "divider", "divider": {}}

blocks = []

blocks.append(para([TXT("This is everything you need to start the Circle Nurture build. Paste the two commands below into two terminal windows on your Mac and you can walk away — you'll come back to a built, quality-checked app live on the internet.")]))

blocks.append(h2("Your app's home on GitHub"))
blocks.append(para([TXT("Repo (public, needed for free hosting): "), LINK("github.com/layakelley/circle-nurture", "https://github.com/layakelley/circle-nurture")]))
blocks.append(bullet([TXT("What becomes public: the code and the build plans.")]))
blocks.append(bullet([TXT("What never leaves your phone: your people, your memories, your messages. That privacy is built into the app's core.")]))

blocks.append(h2("The measure"))
blocks.append(para([TXT("Every finished piece is held up against Day One — the app you picked. A tie counts as done. If a piece is right but not yet as good as Day One, it gets written down plainly for you — \"here's the one gap\" — and it waits. Nothing sits waiting for a win it may never score.")]))

blocks.append(h2("How to start — two terminals"))
blocks.append(para([TXT("Open two terminal windows. Paste the matching command into each. They work together, so the order doesn't matter.")]))
blocks.append(h3("Terminal 1 — the build (does the whole job)"))
blocks.append(code("cd ~/Downloads/projects/circle-nurture && claude --dangerously-skip-permissions \"Build Circle Nurture. Read CONTROL/EXECUTION-PLAN.md section 5 (THE TASK, THE BUILD METHOD, THE BAR TO HIT) plus CONTROL/LOOPS.md, CONTROL/LEDGER.md, CONTROL/QC-RULEBOOK.md, SPEC/MASTER-SPEC.md, SPEC/CHECKLIST.md, SPEC/GOAL.md. Drive the build, review, and merge loops from them — dispatch one builder subagent per work item (small prompts, [MODEL xN] prefix), judge each via the three-gate stack in CONTROL/QC-RULEBOOK.md, and merge one atomic batch every 15 minutes (version + tag + changelog + README + update-script). Deploy to GitHub Pages when the completion definition allows. Stop when the four C5 boxes in CONTROL/LEDGER.md are green at HEAD, then write CONTROL/MORNING-REPORT.md. Keep CONTROL/LEDGER.md, CONTROL/HEARTBEAT.md, CONTROL/DISPATCH-LOG.md, and CONTROL/CHANGELOG.md current as you go.\""))
blocks.append(h3("Terminal 2 — the watch (the safety net, optional)"))
blocks.append(code("cd ~/Downloads/projects/circle-nurture && claude --dangerously-skip-permissions \"Run the WATCH LOOP from CONTROL/LOOPS.md section 4: every 5 minutes, check that the build in the other terminal is alive, dispatched work carries the [MODEL xN] prefix, no capacity sits idle while work waits, and CONTROL/HEARTBEAT.md stamps are fresh. Log any violation to CONTROL/HEARTBEAT.md and keep watching until the build loop finishes.\""))
blocks.append(bullet([TXT("That's it. Once Terminal 1 is running, you can walk away.")]))

blocks.append(h2("Two small things, written down so nothing waits up for you"))
blocks.append(bullet([TXT("TrueTone (the optional AI that helps you phrase a message) needs a key to run. If the build finds none handy, it will ask you when it gets there — or build everything else around it.")]))
blocks.append(bullet([TXT("If your computer restarts or the power goes out, don't worry — your work is safe. Paste the same commands again and it picks up exactly where it left off.")]))

blocks.append(h2("When you come back"))
blocks.append(bullet([TXT("If the build finished, CONTROL/MORNING-REPORT.md has the plain-language summary: the four done-boxes, what got built, and any \"not yet as good as Day One\" gaps.")]))
blocks.append(bullet([TXT("The live link for your phone is in that report — open it, add it to your home screen, and try it.")]))
blocks.append(bullet([TXT("The four things that will be proven for you: it opens on your phone, you can add a person, jot a memory, and send a blast message.")]))

blocks.append(divider())
blocks.append(para([TXT("See you in the morning. 🌙")]))

assert len(blocks) <= 100, "too many blocks"

payload = {
    "parent": {"page_id": "3ba27406-07fe-811f-bc64-f3dffb3c7ecb"},
    "properties": {"title": [{"text": {"content": "Circle Nurture — Start the build (links & launch)"}}]},
    "children": blocks,
}
p = api("POST", "https://api.notion.com/v1/pages", payload)
print(json.dumps({"id": p["id"], "url": p["url"]}))
