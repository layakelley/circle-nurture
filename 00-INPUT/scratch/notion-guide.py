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
def h2(t): return {"object": "block", "type": "heading_2", "heading_2": {"rich_text": [TXT(t)]}}
def para(rt): return {"object": "block", "type": "paragraph", "paragraph": {"rich_text": rt if isinstance(rt, list) else [TXT(rt)]}}
def bullet(rt): return {"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {"rich_text": rt if isinstance(rt, list) else [TXT(rt)]}}
def code(t): return {"object": "block", "type": "code", "code": {"rich_text": [TXT(t)], "language": "plain text"}}
def divider(): return {"object": "block", "type": "divider", "divider": {}}

blocks = []
A = "https://layakelley.github.io/circle-nurture/"

blocks.append(para([TXT("The app is built and live. This guide takes you from not having it to using it, step by step — and it's meant to be shared with anyone testing it. The app's address is "), TXT(A)]))
blocks.append(h2("First, the short version"))
blocks.append(para("Circle Nurture is a private app for staying in touch with the people in your life. All your data stays on your device. It is a website, not an app-store download — you open it in your browser."))
blocks.append(h2("Phone or computer?"))
blocks.append(para("It is designed for a phone, and it works on BOTH Android and iPhone. It also works on a computer in a web browser, but it is built for a phone screen, so a phone is the best way to try it. Same address everywhere — no app store, nothing to download."))
blocks.append(h2("Part 1 — Get it on your phone (Android)"))
blocks.append(bullet("1. On your Android phone, open the Chrome browser."))
blocks.append(bullet("2. In the address bar, type or paste: https://layakelley.github.io/circle-nurture/"))
blocks.append(bullet("3. The app loads — you'll see the calm Circle Nurture home screen."))
blocks.append(bullet("4. Add it to your home screen: tap the three-dot menu (top-right corner), then choose \"Add to Home screen\" (or \"Install app\" if Chrome offers it)."))
blocks.append(bullet("5. Done — it now lives on your home screen like an app. Tap the icon to open it anytime, even without internet."))
blocks.append(h2("On an iPhone instead?"))
blocks.append(para("Same idea: open the address in Safari, tap the Share button (the square with an arrow), then \"Add to Home Screen\". It appears on your home screen like an app."))
blocks.append(h2("Part 2 — What you'll see first"))
blocks.append(para("The home screen is calm on purpose — no charts, no scores, no \"overdue\" lists. You'll see your people and your circles. A round + button adds a new person."))
blocks.append(h2("Part 3 — Add a person"))
blocks.append(bullet("1. Tap the + button."))
blocks.append(bullet("2. Type their name. That's all you need — everything else is optional and can be added later."))
blocks.append(bullet("3. If you like, add when you met, their phone number, and so on."))
blocks.append(bullet("4. Save. They appear on your home screen."))
blocks.append(h2("Part 4 — Jot a memory"))
blocks.append(bullet("1. Tap the person's card to open their profile."))
blocks.append(bullet("2. Add a memory — a note like \"First time we met — coffee downtown\"."))
blocks.append(bullet("3. Save. It stays with that person, and you can edit, pin, or delete it later."))
blocks.append(h2("Part 5 — Message one person"))
blocks.append(bullet("1. Open their profile and tap the message action."))
blocks.append(bullet("2. Your phone's own texting app opens with the message ready to go."))
blocks.append(bullet("3. You tap Send in your texting app. The app never sends anything for you — by design."))
blocks.append(h2("Part 6 — Send one message to several people (the \"blast\")"))
blocks.append(para("This is the signature feature: write once, and each person gets their own private message — never a group thread."))
blocks.append(bullet("1. Start a blast and write your message once."))
blocks.append(bullet("2. Pick the people (or pick a whole circle)."))
blocks.append(bullet("3. Your phone opens the texting app for each person, one at a time — every message is private, one-to-one."))
blocks.append(bullet("4. Send each one. People without a saved number are skipped and named, so you're never left wondering."))
blocks.append(h2("Part 7 — Circles"))
blocks.append(para("Make a circle like \"Family\" or \"Old friends\" and add people to it. A circle is just a way to group people — it never becomes a group chat."))
blocks.append(h2("Part 8 — Gentle nudges & Next Connect"))
blocks.append(bullet("If it's been a while since you connected with someone, the app gently reminds you. It's a suggestion, never homework — you can dismiss it and it stays dismissed."))
blocks.append(bullet("You can also plan a \"Next Connect\" with someone (coffee, a call, a visit) and mark it done when it happens."))
blocks.append(h2("Part 9 — Settings & privacy"))
blocks.append(bullet("All your data stays on your device. No account, no cloud sync, no analytics, no ads."))
blocks.append(bullet("Settings → Export my data gives you a backup file any time."))
blocks.append(bullet("TrueTone (optional AI help writing a message) is off by default. If you want it, add your own key in Settings — it only helps draft, and you always review before sending."))
blocks.append(h2("Good to know for testers"))
blocks.append(bullet("This first version includes everything above. Four small extras are still being built (a calendar link, a memory prompt after you connect, a \"context\" line, and a \"your year\" summary) — none are needed to use the app."))
blocks.append(bullet("Works offline: after the first load, your people and memories are available even without internet."))
blocks.append(bullet("Messages always go through your own phone's texting app — the app can't (and never will) send a text on its own."))
blocks.append(bullet("Everything is stored on the device. If you clear your phone's browser data, it removes the app's data too — use Export first if you ever want a backup."))
blocks.append(h2("The address"))
blocks.append(code(A))
blocks.append(divider())
blocks.append(para("To share this guide with testers: open this page in Notion, tap Share (top right), turn on \"Anyone with the link\", and send them this page's link plus the app address above."))

assert len(blocks) <= 100, f"too many blocks: {len(blocks)}"

payload = {
    "parent": {"page_id": "3ba27406-07fe-811f-bc64-f3dffb3c7ecb"},
    "properties": {"title": [{"text": {"content": "Circle Nurture — How to use the app (tester guide)"}}]},
    "children": blocks,
}
p = api("POST", "https://api.notion.com/v1/pages", payload)
print(json.dumps({"id": p["id"], "url": p["url"], "blocks": len(blocks)}))
