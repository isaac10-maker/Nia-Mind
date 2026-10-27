#!/usr/bin/env python3
"""Keep only relations that have exactly one Wikidata value."""

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

RAW = Path("/tmp/leisure-raw")
OUT = Path("/tmp/leisure-counts.json")
ENDPOINT = "https://query.wikidata.org/sparql"
UA = "NiaMindLeisure/1.0 (https://nia-mind.vercel.app)"

TASKS = {
    "capitals": "wdt:P36",
    "continents": "wdt:P30",
    "currencies": "wdt:P38",
    "languages_of": "wdt:P37",
    "paintings": "wdt:P170",
    "books": "wdt:P50",
    "films": "wdt:P57",
    "mountains": "wdt:P17",
    "rivers": "wdt:P17",
    "cities": "wdt:P17",
    "deities": "wdt:P361",
}


def chunks(items, size):
    for i in range(0, len(items), size):
        yield items[i : i + size]


def query(ids, prop):
    values = " ".join(f"wd:{item}" for item in ids)
    sparql = f"""
SELECT ?id (COUNT(DISTINCT ?a) AS ?n) WHERE {{
  VALUES ?c {{ {values} }}
  ?c {prop} ?a .
  BIND(STRAFTER(STR(?c), "entity/") AS ?id)
}} GROUP BY ?id
"""
    url = ENDPOINT + "?" + urllib.parse.urlencode({"query": sparql})
    req = urllib.request.Request(url, headers={"Accept": "application/sparql-results+json", "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as res:
        payload = json.loads(res.read().decode())
    found = {}
    for row in payload["results"]["bindings"]:
        found[row["id"]["value"]] = int(row["n"]["value"])
    return found


def main():
    result = {}
    if OUT.exists():
        result = json.loads(OUT.read_text())
    for name, prop in TASKS.items():
        if name in result and result[name]:
            print("cached", name, len(result[name]), flush=True)
            continue
        rows = json.loads((RAW / f"{name}.json").read_text())
        ids = sorted({row["id"] for row in rows})
        found = {}
        for group in chunks(ids, 60):
            for attempt in range(4):
                try:
                    found.update(query(group, prop))
                    break
                except Exception as exc:
                    print("retry", name, attempt, exc, flush=True)
                    time.sleep(3 + attempt)
            else:
                raise SystemExit(f"failed {name}")
            time.sleep(0.6)
        result[name] = found
        OUT.write_text(json.dumps(result))
        singles = sum(1 for value in found.values() if value == 1)
        print(name, "ids", len(ids), "counted", len(found), "single", singles, flush=True)
    print("done", flush=True)


if __name__ == "__main__":
    main()
