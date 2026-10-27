#!/usr/bin/env python3
"""Rebuild riddle choices from the same family so the three options stay plausible."""

import json
import random
from pathlib import Path

PROMPTS = Path("/home/user/public/leisure/prompts.json")
ANSWERS = Path("/home/user/public/leisure/answers.json")
LANGS = ("fr", "en", "es", "de", "zh")


def family(item_id: str) -> str:
    return item_id.split("-", 1)[0]


def distinct(labels: dict, chosen: list[dict], answer: dict) -> bool:
    if any(labels[lang] == answer[lang] for lang in LANGS):
        return False
    return not any(any(labels[lang] == got[lang] for lang in LANGS) for got in chosen)


def main() -> None:
    prompts = json.loads(PROMPTS.read_text())
    answers = json.loads(ANSWERS.read_text())["items"]
    riddles = prompts["riddle"]
    for item in riddles:
        answer = answers[item["id"]]
        same = [other for other in riddles if other["id"] != item["id"] and family(other["id"]) == family(item["id"])]
        pool = same or [other for other in riddles if other["id"] != item["id"]]
        rng = random.Random(f"{item['id']}-qcm3")
        rng.shuffle(pool)
        chosen = []
        for candidate in pool:
            labels = answers[candidate["id"]]
            if distinct(labels, chosen, answer):
                chosen.append(labels)
            if len(chosen) == 2:
                break
        if len(chosen) < 2:
            raise SystemExit(f"not enough choices for {item['id']}")
        order = [0, 1, 2]
        rng.shuffle(order)
        columns = [answer, *chosen]
        item["choices"] = {lang: [columns[index][lang] for index in order] for lang in LANGS}
        item.pop("answer", None)
    PROMPTS.write_text(json.dumps(prompts, ensure_ascii=False, separators=(",", ":")))
    sample = next(item for item in riddles if item["id"] == "classic-tomorrow")
    print(sample["prompt"]["fr"])
    print(sample["choices"]["fr"])


if __name__ == "__main__":
    main()
