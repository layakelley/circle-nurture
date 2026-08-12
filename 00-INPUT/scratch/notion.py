import json, os, sys, urllib.request

def load_token():
    # read NOTION_API_TOKEN from ~/.openclaw/secrets/.env by NAME; never print the value
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
        print(f"HTTP {e.code}: {e.read().decode()[:500]}", file=sys.stderr)
        raise SystemExit(1)

if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "get":
        pid = sys.argv[2]
        p = api("GET", f"https://api.notion.com/v1/pages/{pid}")
        print(json.dumps({"id": p["id"], "title": p.get("properties", {}).get("title", {}).get("title", [{}])[0].get("plain_text", ""), "url": p.get("url")}))
    elif mode == "children":
        bid = sys.argv[2]
        r = api("GET", f"https://api.notion.com/v1/blocks/{bid}/children")
        for b in r.get("results", []):
            if b["type"] == "child_page":
                print(f"PAGE {b['id']}  {b['child_page']['title']}")
            else:
                print(f"BLK  {b['id']}  {b['type']}")
    elif mode == "search":
        payload = {"filter": {"property": "object", "value": "page"}, "query": sys.argv[2]}
        r = api("POST", "https://api.notion.com/v1/search", payload)
        for p in r.get("results", []):
            t = p.get("properties", {}).get("title", {}).get("title", [{}])[0].get("plain_text", "") if p.get("properties") else ""
            print(f"{p['id']}  {p['parent'].get('page_id') or p['parent'].get('type')}  {t}")
