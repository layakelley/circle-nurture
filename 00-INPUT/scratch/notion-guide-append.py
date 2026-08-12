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
        print(f"HTTP {e.code}: {e.read().decode()[:600]}", file=sys.stderr)
        raise SystemExit(1)

TXT = lambda t: {"type": "text", "text": {"content": t}}
def h2(t): return {"object": "block", "type": "heading_2", "heading_2": {"rich_text": [TXT(t)]}}
def para(t): return {"object": "block", "type": "paragraph", "paragraph": {"rich_text": [TXT(t)]}}
def bullet(t): return {"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {"rich_text": [TXT(t)]}}

blocks = [
    h2("Bring in your people (import) — now on the front page"),
    para("The home screen now has a big “Bring My People” button at the top, right under the title — always there, not hidden. Tap it to add several people you already know at once."),
    bullet("On Android (Chrome): tap “Choose contacts” → your phone’s contact picker opens → tick the people you want → they’re staged for review → “Add N to Circle Nurture.” You can tap “Choose contacts” again for more batches."),
    bullet("On iPhone (Safari): Apple doesn’t let websites open your contacts, so the screen explains that and offers “Upload a .vcf file” instead — export a contacts file and upload it. (Same option on a computer.)"),
    bullet("Either way it dedupes: anyone you already have is tagged “already have this person” and won’t be added twice."),
    bullet("After importing, the same screen lets you drop them all into a circle at once — pick an existing circle or create a new one."),
]

r = api("PATCH", f"https://api.notion.com/v1/blocks/3ba27406-07fe-810d-8352-ec256f3cbe29/children", {"children": blocks})
print(json.dumps({"appended": len(r.get("results", [])), "guide_total_now": "see verify"}))
