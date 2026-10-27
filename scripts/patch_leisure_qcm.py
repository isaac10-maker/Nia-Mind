#!/usr/bin/env python3
"""Give every leisure item exactly three choices, including riddles."""

import json
import random
from pathlib import Path

PROMPTS = Path("/home/user/public/leisure/prompts.json")
ANSWERS = Path("/home/user/public/leisure/answers.json")
LANGS = ("fr", "en", "es", "de", "zh")


def distinct(labels: dict, chosen: list[dict], answer: dict) -> bool:
    if any(labels[lang] == answer[lang] for lang in LANGS):
        return False
    return not any(any(labels[lang] == got[lang] for lang in LANGS) for got in chosen)


def pack_choices(answer: dict, distractors: list[dict], seed: str) -> dict:
    rng = random.Random(seed)
    order = [0, 1, 2]
    rng.shuffle(order)
    columns = [answer, *distractors]
    return {lang: [columns[index][lang] for index in order] for lang in LANGS}


def trim_quiz(item: dict, answers: dict) -> None:
    answer = answers[item["id"]]
    indexes = {item["choices"][lang].index(answer[lang]) for lang in LANGS}
    if len(indexes) != 1:
        raise SystemExit(f"unaligned quiz choices: {item['id']}")
    correct = indexes.pop()
    others = [index for index in range(len(item["choices"]["fr"])) if index != correct]
    rng = random.Random(item["id"])
    keep = [correct, *rng.sample(others, 2)]
    rng.shuffle(keep)
    item["choices"] = {lang: [item["choices"][lang][index] for index in keep] for lang in LANGS}


def add_riddle_choices(items: list[dict], answers: dict) -> None:
    for item in items:
        answer = answers[item["id"]]
        pool = [other for other in items if other["id"] != item["id"]]
        rng = random.Random(f"{item['id']}-qcm")
        rng.shuffle(pool)
        chosen = []
        for candidate in pool:
            labels = answers[candidate["id"]]
            if distinct(labels, chosen, answer):
                chosen.append(labels)
            if len(chosen) == 2:
                break
        if len(chosen) < 2:
            raise SystemExit(f"not enough riddle choices: {item['id']}")
        item["choices"] = pack_choices(answer, chosen, item["id"])
        item.pop("answer", None)


def main() -> None:
    prompts = json.loads(PROMPTS.read_text())
    answers = json.loads(ANSWERS.read_text())["items"]
    for item in prompts["quiz"]:
        trim_quiz(item, answers)
    add_riddle_choices(prompts["riddle"], answers)
    for bucket in ("quiz", "riddle"):
        for item in prompts[bucket]:
            if set(item) - {"id", "topic", "prompt", "choices"}:
                raise SystemExit(f"extra fields on {item['id']}")
            for lang in LANGS:
                choices = item["choices"][lang]
                if len(choices) != 3 or len(set(choices)) != 3:
                    raise SystemExit(f"bad choices {item['id']} {lang}")
                if answers[item["id"]][lang] not in choices:
                    raise SystemExit(f"answer missing from choices {item['id']} {lang}")
    PROMPTS.write_text(json.dumps(prompts, ensure_ascii=False, separators=(",", ":")))
    print("quiz", len(prompts["quiz"]), "riddle", len(prompts["riddle"]), "bytes", PROMPTS.stat().st_size)


if __name__ == "__main__":
    main()
