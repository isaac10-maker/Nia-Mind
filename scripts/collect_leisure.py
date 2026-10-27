#!/usr/bin/env python3
"""Collect multilingual general-culture rows from Wikidata. Raw files stay in /tmp."""

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

OUT = Path("/tmp/leisure-raw")
OUT.mkdir(parents=True, exist_ok=True)
ENDPOINT = "https://query.wikidata.org/sparql"
UA = "NiaMindLeisure/1.0 (https://nia-mind.vercel.app)"


def run(name: str, query: str) -> None:
    dest = OUT / f"{name}.json"
    if dest.exists() and dest.stat().st_size > 40:
        rows = json.loads(dest.read_text())
        print(f"cached {name}: {len(rows)}", flush=True)
        return
    url = ENDPOINT + "?" + urllib.parse.urlencode({"query": query})
    req = urllib.request.Request(
        url,
        headers={"Accept": "application/sparql-results+json", "User-Agent": UA},
    )
    last = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as res:
                payload = json.loads(res.read().decode())
            break
        except Exception as exc:
            last = exc
            print(f"retry {name} {attempt}: {exc}", flush=True)
            time.sleep(4 + attempt * 3)
    else:
        print(f"FAILED {name}: {last}", flush=True)
        dest.write_text("[]")
        return
    rows = [{key: value["value"] for key, value in row.items()} for row in payload["results"]["bindings"]]
    dest.write_text(json.dumps(rows, ensure_ascii=False))
    print(f"fetched {name}: {len(rows)}", flush=True)
    time.sleep(1.5)


def lab(var: str) -> str:
    return "\n".join(
        f'?{var} rdfs:label ?{var}_{lang} . FILTER(LANG(?{var}_{lang})="{lang}")'
        for lang in ("fr", "en", "es", "de", "zh")
    )


QUERIES = {
    "capitals": f"""
SELECT ?id ?c_fr ?c_en ?c_es ?c_de ?c_zh ?a_fr ?a_en ?a_es ?a_de ?a_zh WHERE {{
  ?c wdt:P31 wd:Q3624078 .
  FILTER NOT EXISTS {{ ?c wdt:P31 wd:Q3024240 }}
  ?c wdt:P36 ?a .
  BIND(STRAFTER(STR(?c), "entity/") AS ?id)
  {lab("c")}
  {lab("a")}
}}
""",
    "continents": f"""
SELECT ?id ?a_fr ?a_en ?a_es ?a_de ?a_zh WHERE {{
  ?c wdt:P31 wd:Q3624078 .
  FILTER NOT EXISTS {{ ?c wdt:P31 wd:Q3024240 }}
  ?c wdt:P30 ?a .
  BIND(STRAFTER(STR(?c), "entity/") AS ?id)
  {lab("a")}
}}
""",
    "currencies": f"""
SELECT ?id ?a_fr ?a_en ?a_es ?a_de ?a_zh WHERE {{
  ?c wdt:P31 wd:Q3624078 .
  FILTER NOT EXISTS {{ ?c wdt:P31 wd:Q3024240 }}
  ?c wdt:P38 ?a .
  BIND(STRAFTER(STR(?c), "entity/") AS ?id)
  {lab("a")}
}}
""",
    "languages_of": f"""
SELECT ?id ?a_fr ?a_en ?a_es ?a_de ?a_zh WHERE {{
  ?c wdt:P31 wd:Q3624078 .
  FILTER NOT EXISTS {{ ?c wdt:P31 wd:Q3024240 }}
  ?c wdt:P37 ?a .
  BIND(STRAFTER(STR(?c), "entity/") AS ?id)
  {lab("a")}
}}
""",
    "elements": f"""
SELECT ?id ?c_fr ?c_en ?c_es ?c_de ?c_zh ?sym ?num WHERE {{
  ?c wdt:P31 wd:Q11344 .
  BIND(STRAFTER(STR(?c), "entity/") AS ?id)
  {lab("c")}
  ?c wdt:P246 ?sym .
  ?c wdt:P1086 ?num .
}}
""",
    "constellations": f"""
SELECT ?id ?c_fr ?c_en ?c_es ?c_de ?c_zh WHERE {{
  ?c wdt:P31 wd:Q8928 .
  BIND(STRAFTER(STR(?c), "entity/") AS ?id)
  {lab("c")}
}}
""",
    "planets": f"""
SELECT ?id ?c_fr ?c_en ?c_es ?c_de ?c_zh WHERE {{
  ?c wdt:P31 wd:Q3504248 .
  BIND(STRAFTER(STR(?c), "entity/") AS ?id)
  {lab("c")}
}}
""",
    "lang_family": f"""
SELECT ?id ?c_fr ?c_en ?c_es ?c_de ?c_zh ?a_fr ?a_en ?a_es ?a_de ?a_zh WHERE {{
  ?c wdt:P31 wd:Q34770 .
  ?c wdt:P279 ?a .
  FILTER(?a != wd:Q34770)
  BIND(STRAFTER(STR(?c), "entity/") AS ?id)
  {lab("c")}
  {lab("a")}
}} LIMIT 600
""",
    "paintings": f"""
SELECT ?id ?c_fr ?c_en ?c_es ?c_de ?c_zh ?a_fr ?a_en ?a_es ?a_de ?a_zh WHERE {{
  ?c wdt:P31 wd:Q3305213 .
  ?c wdt:P170 ?a .
  BIND(STRAFTER(STR(?c), "entity/") AS ?id)
  {lab("c")}
  {lab("a")}
}} LIMIT 400
""",
    "books": f"""
SELECT ?id ?c_fr ?c_en ?c_es ?c_de ?c_zh ?a_fr ?a_en ?a_es ?a_de ?a_zh WHERE {{
  ?c wdt:P31 wd:Q7725634 .
  ?c wdt:P50 ?a .
  BIND(STRAFTER(STR(?c), "entity/") AS ?id)
  {lab("c")}
  {lab("a")}
}} LIMIT 400
""",
    "films": f"""
SELECT ?id ?c_fr ?c_en ?c_es ?c_de ?c_zh ?a_fr ?a_en ?a_es ?a_de ?a_zh WHERE {{
  ?c wdt:P31 wd:Q11424 .
  ?c wdt:P57 ?a .
  BIND(STRAFTER(STR(?c), "entity/") AS ?id)
  {lab("c")}
  {lab("a")}
}} LIMIT 400
""",
    "mountains": f"""
SELECT ?id ?c_fr ?c_en ?c_es ?c_de ?c_zh ?a_fr ?a_en ?a_es ?a_de ?a_zh WHERE {{
  ?c wdt:P31 wd:Q8502 .
  ?c wdt:P17 ?a .
  BIND(STRAFTER(STR(?c), "entity/") AS ?id)
  {lab("c")}
  {lab("a")}
}} LIMIT 250
""",
    "rivers": f"""
SELECT ?id ?c_fr ?c_en ?c_es ?c_de ?c_zh ?a_fr ?a_en ?a_es ?a_de ?a_zh WHERE {{
  ?c wdt:P31 wd:Q4022 .
  ?c wdt:P17 ?a .
  BIND(STRAFTER(STR(?c), "entity/") AS ?id)
  {lab("c")}
  {lab("a")}
}} LIMIT 200
""",
    "instruments": f"""
SELECT ?id ?c_fr ?c_en ?c_es ?c_de ?c_zh ?fam WHERE {{
  VALUES ?fam {{ wd:Q1798603 wd:Q173551 wd:Q133163 wd:Q52954 }}
  ?c wdt:P279 ?fam .
  BIND(STRAFTER(STR(?c), "entity/") AS ?id)
  {lab("c")}
}} LIMIT 400
""",
    "animals": f"""
SELECT ?id ?c_fr ?c_en ?c_es ?c_de ?c_zh ?fam WHERE {{
  VALUES ?fam {{ wd:Q729 wd:Q5113 wd:Q10908 wd:Q1390 wd:Q25371 }}
  ?c wdt:P31 wd:Q16521 .
  ?c wdt:P171 ?fam .
  BIND(STRAFTER(STR(?c), "entity/") AS ?id)
  {lab("c")}
}} LIMIT 400
""",
    "cities": f"""
SELECT ?id ?c_fr ?c_en ?c_es ?c_de ?c_zh ?a_fr ?a_en ?a_es ?a_de ?a_zh WHERE {{
  ?c wdt:P31 wd:Q515 .
  ?c wdt:P17 ?a .
  ?c wdt:P1082 ?pop .
  FILTER(?pop > 800000)
  BIND(STRAFTER(STR(?c), "entity/") AS ?id)
  {lab("c")}
  {lab("a")}
}} LIMIT 350
""",
    "inventions": f"""
SELECT ?id ?c_fr ?c_en ?c_es ?c_de ?c_zh ?a_fr ?a_en ?a_es ?a_de ?a_zh WHERE {{
  ?c wdt:P31 wd:Q1183543 .
  ?c wdt:P61 ?a .
  BIND(STRAFTER(STR(?c), "entity/") AS ?id)
  {lab("c")}
  {lab("a")}
}} LIMIT 250
""",
    "deities": f"""
SELECT ?id ?c_fr ?c_en ?c_es ?c_de ?c_zh ?a_fr ?a_en ?a_es ?a_de ?a_zh WHERE {{
  ?c wdt:P31 wd:Q22989102 .
  ?c wdt:P361 ?a .
  BIND(STRAFTER(STR(?c), "entity/") AS ?id)
  {lab("c")}
  {lab("a")}
}} LIMIT 200
""",
}

if __name__ == "__main__":
    only = __import__("sys").argv[1:]
    for name, query in QUERIES.items():
        if only and name not in only:
            continue
        run(name, query)
