import json, os, sys, urllib.request

def load_token():
    path = os.path.expanduser("~/.openclaw/secrets/.env")
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line.startswith("NOTION_API_TOKEN="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("NOTION_API_TOKEN NOT SET")

req = urllib.request.Request(f"https://api.notion.com/v1/blocks/{sys.argv[1]}/children")
req.add_header("Authorization", f"Bearer {load_token()}")
req.add_header("Notion-Version", "2022-06-28")
with urllib.request.urlopen(req) as r:
    data = json.load(r)

kinds = {}
total_chars = 0
for b in data.get("results", []):
    t = b["type"]
    kinds[t] = kinds.get(t, 0) + 1
    if t == "code":
        txt = "".join(rt["text"]["content"] for rt in b["code"]["rich_text"])
        total_chars += len(txt)
        print(f"[code] {len(txt)} chars, starts: {txt[:60].strip()!r}")
    elif t in ("heading_2", "heading_3"):
        txt = "".join(rt["text"]["content"] for rt in b[t]["rich_text"])
        print(f"[{t}] {txt}")
    elif t == "paragraph":
        txt = "".join(rt["text"]["content"] for rt in b["paragraph"]["rich_text"])
        if txt: print(f"[para] {txt[:80]}...")
print("\nblock kinds:", kinds)
print(f"code-block chars total: {total_chars}")
print(f"total blocks: {len(data.get('results', []))}")
