#!/usr/bin/env python3
"""Build the daily leisure bank from collected Wikidata rows and classic riddles."""

import json
import random
import re
import unicodedata
from pathlib import Path

RAW = Path("/tmp/leisure-raw")
COUNTS = json.loads(Path("/tmp/leisure-counts.json").read_text())
PROMPTS = Path("/home/user/public/leisure/prompts.json")
ANSWERS = Path("/home/user/public/leisure/answers.json")
LANGS = ("fr", "en", "es", "de", "zh")
SYMBOLS = (
    "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni "
    "Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe "
    "Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg "
    "Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg "
    "Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og"
).split()
assert len(SYMBOLS) == 118

TRANSCONTINENTAL = {
    "russie",
    "fédération de russie",
    "russia",
    "turquie",
    "turkey",
    "kazakhstan",
    "égypte",
    "egypte",
    "egypt",
}
SHARED_PEAKS = (
    "mont blanc",
    "monte bianco",
    "everest",
    "chomolungma",
    "k2",
    "cervin",
    "matterhorn",
    "kanchenjunga",
    "kangchenjunga",
    "lhotse",
    "makalu",
    "cho oyu",
    "dhaulagiri",
    "manaslu",
    "nanga parbat",
    "annapurna",
    "gasherbrum",
)
BLOCKED = re.compile(
    r"<\s*/?\s*(script|iframe|object|embed)|javascript\s*:|data\s*:\s*text/html|on[a-z]+\s*=",
    re.I,
)

QUIZ = {
    "capital": {
        "fr": "Quelle est la capitale de {s} ?",
        "en": "What is the capital of {s}?",
        "es": "¿Cuál es la capital de {s}?",
        "de": "Was ist die Hauptstadt von {s}?",
        "zh": "{s}的首都是哪里？",
    },
    "continent": {
        "fr": "Sur quel continent se trouve {s} ?",
        "en": "On which continent is {s}?",
        "es": "¿En qué continente está {s}?",
        "de": "Auf welchem Kontinent liegt {s}?",
        "zh": "{s}位于哪个大洲？",
    },
    "currency": {
        "fr": "Quelle est la monnaie officielle de {s} ?",
        "en": "What is the official currency of {s}?",
        "es": "¿Cuál es la moneda oficial de {s}?",
        "de": "Was ist die offizielle Währung von {s}?",
        "zh": "{s}的官方货币是什么？",
    },
    "language": {
        "fr": "Quelle est la langue officielle de {s} ?",
        "en": "What is the official language of {s}?",
        "es": "¿Cuál es el idioma oficial de {s}?",
        "de": "Was ist die Amtssprache von {s}?",
        "zh": "{s}的官方语言是什么？",
    },
    "symbol": {
        "fr": "Quel est le symbole chimique de {s} ?",
        "en": "What is the chemical symbol of {s}?",
        "es": "¿Cuál es el símbolo químico de {s}?",
        "de": "Wie lautet das chemische Symbol von {s}?",
        "zh": "{s}的化学符号是什么？",
    },
    "atomic": {
        "fr": "Quel est le numéro atomique de {s} ?",
        "en": "What is the atomic number of {s}?",
        "es": "¿Cuál es el número atómico de {s}?",
        "de": "Wie lautet die Ordnungszahl von {s}?",
        "zh": "{s}的原子序数是多少？",
    },
    "painter": {
        "fr": "Qui a peint « {s} » ?",
        "en": "Who painted “{s}”?",
        "es": "¿Quién pintó «{s}»?",
        "de": "Wer hat „{s}“ gemalt?",
        "zh": "《{s}》是谁画的？",
    },
    "author": {
        "fr": "Qui a écrit « {s} » ?",
        "en": "Who wrote “{s}”?",
        "es": "¿Quién escribió «{s}»?",
        "de": "Wer hat „{s}“ geschrieben?",
        "zh": "《{s}》是谁写的？",
    },
    "director": {
        "fr": "Qui a réalisé le film « {s} » ?",
        "en": "Who directed the film “{s}”?",
        "es": "¿Quién dirigió la película «{s}»?",
        "de": "Wer hat den Film „{s}“ inszeniert?",
        "zh": "电影《{s}》的导演是谁？",
    },
    "mountain": {
        "fr": "Dans quel pays se trouve {s} ?",
        "en": "In which country is {s}?",
        "es": "¿En qué país está {s}?",
        "de": "In welchem Land liegt {s}?",
        "zh": "{s}位于哪个国家？",
    },
    "city": {
        "fr": "Dans quel pays se trouve la ville de {s} ?",
        "en": "In which country is the city of {s}?",
        "es": "¿En qué país está la ciudad de {s}?",
        "de": "In welchem Land liegt die Stadt {s}?",
        "zh": "城市{s}位于哪个国家？",
    },
}

RIDDLE = {
    "capital": {
        "fr": "Je suis la capitale de {s}. Qui suis-je ?",
        "en": "I am the capital of {s}. What am I?",
        "es": "Soy la capital de {s}. ¿Qué soy?",
        "de": "Ich bin die Hauptstadt von {s}. Was bin ich?",
        "zh": "我是{s}的首都。我是哪里？",
    },
    "continent": {
        "fr": "Je suis le continent de {s}. Qu'est-ce que je suis ?",
        "en": "I am the continent of {s}. What am I?",
        "es": "Soy el continente de {s}. ¿Qué soy?",
        "de": "Ich bin der Kontinent von {s}. Was bin ich?",
        "zh": "我是{s}所在的大洲。我是什么？",
    },
    "currency": {
        "fr": "Je suis la monnaie officielle de {s}. Qu'est-ce que je suis ?",
        "en": "I am the official currency of {s}. What am I?",
        "es": "Soy la moneda oficial de {s}. ¿Qué soy?",
        "de": "Ich bin die offizielle Währung von {s}. Was bin ich?",
        "zh": "我是{s}的官方货币。我是什么？",
    },
    "language": {
        "fr": "Je suis la langue officielle de {s}. Qu'est-ce que je suis ?",
        "en": "I am the official language of {s}. What am I?",
        "es": "Soy el idioma oficial de {s}. ¿Qué soy?",
        "de": "Ich bin die Amtssprache von {s}. Was bin ich?",
        "zh": "我是{s}的官方语言。我是什么？",
    },
    "symbol": {
        "fr": "Je suis le symbole chimique de {s}. Qu'est-ce que je suis ?",
        "en": "I am the chemical symbol of {s}. What am I?",
        "es": "Soy el símbolo químico de {s}. ¿Qué soy?",
        "de": "Ich bin das chemische Symbol von {s}. Was bin ich?",
        "zh": "我是{s}的化学符号。我是什么？",
    },
    "atomic": {
        "fr": "Je suis le numéro atomique de {s}. Lequel suis-je ?",
        "en": "I am the atomic number of {s}. What am I?",
        "es": "Soy el número atómico de {s}. ¿Cuál soy?",
        "de": "Ich bin die Ordnungszahl von {s}. Welche bin ich?",
        "zh": "我是{s}的原子序数。我是多少？",
    },
    "painter": {
        "fr": "J'ai peint « {s} ». Qui suis-je ?",
        "en": "I painted “{s}”. Who am I?",
        "es": "Pinté «{s}». ¿Quién soy?",
        "de": "Ich habe „{s}“ gemalt. Wer bin ich?",
        "zh": "《{s}》是我画的。我是谁？",
    },
    "author": {
        "fr": "J'ai écrit « {s} ». Qui suis-je ?",
        "en": "I wrote “{s}”. Who am I?",
        "es": "Escribí «{s}». ¿Quién soy?",
        "de": "Ich habe „{s}“ geschrieben. Wer bin ich?",
        "zh": "《{s}》是我写的。我是谁？",
    },
    "director": {
        "fr": "J'ai réalisé le film « {s} ». Qui suis-je ?",
        "en": "I directed the film “{s}”. Who am I?",
        "es": "Dirigí la película «{s}». ¿Quién soy?",
        "de": "Ich habe den Film „{s}“ inszeniert. Wer bin ich?",
        "zh": "电影《{s}》是我导演的。我是谁？",
    },
    "mountain": {
        "fr": "Je suis le pays où se trouve {s}. Qui suis-je ?",
        "en": "I am the country where {s} is. What am I?",
        "es": "Soy el país donde está {s}. ¿Qué soy?",
        "de": "Ich bin das Land, in dem {s} liegt. Was bin ich?",
        "zh": "我是{s}所在的国家。我是哪个国家？",
    },
    "city": {
        "fr": "Je suis le pays de la ville de {s}. Qui suis-je ?",
        "en": "I am the country of the city of {s}. What am I?",
        "es": "Soy el país de la ciudad de {s}. ¿Qué soy?",
        "de": "Ich bin das Land der Stadt {s}. Was bin ich?",
        "zh": "我是城市{s}所在的国家。我是哪个国家？",
    },
}

TOPICS = {
    "capital": "geo",
    "continent": "geo",
    "currency": "geo",
    "language": "language",
    "symbol": "science",
    "atomic": "science",
    "painter": "art",
    "author": "books",
    "director": "cinema",
    "mountain": "mountain",
    "city": "city",
    "classic": "riddle",
}


def fold(value: str) -> str:
    text = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def clean(value: str, limit: int = 120) -> str | None:
    text = " ".join(value.replace("\u00a0", " ").split())
    if not text or len(text) > limit:
        return None
    if BLOCKED.search(text) or any(ord(ch) < 32 for ch in text):
        return None
    if "http://" in text.lower() or "https://" in text.lower() or "<" in text or ">" in text:
        return None
    return text


def pack(row: dict, prefix: str) -> dict[str, str] | None:
    out = {}
    for lang in LANGS:
        value = clean(row.get(f"{prefix}_{lang}", ""))
        if not value:
            return None
        out[lang] = value
    return out


def load(name: str) -> list[dict]:
    return json.loads((RAW / f"{name}.json").read_text())


def single_ids(name: str) -> set[str]:
    return {item for item, count in COUNTS[name].items() if count == 1}


def contained(answer: str, prompt: str, lang: str) -> bool:
    if lang == "zh" or len(answer) >= 3:
        return answer.casefold() in prompt.casefold()
    return re.search(rf"(?<!\w){re.escape(answer)}(?!\w)", prompt, re.I) is not None


def classic_riddles() -> list[dict]:
    rows = [
        (
            "towel",
            {
                "fr": "Plus on me sèche, plus je suis mouillée. Qui suis-je ?",
                "en": "The more I dry, the wetter I get. What am I?",
                "es": "Cuanto más seco, más mojado me vuelvo. ¿Qué soy?",
                "de": "Je mehr ich trockne, desto nasser werde ich. Was bin ich?",
                "zh": "我越是用来擦干，自己就越湿。我是什么？",
            },
            {"fr": "Une serviette", "en": "A towel", "es": "Una toalla", "de": "Ein Handtuch", "zh": "毛巾"},
        ),
        (
            "stamp",
            {
                "fr": "Je parcours le monde en restant dans un coin. Qui suis-je ?",
                "en": "I travel the world while staying in a corner. What am I?",
                "es": "Recorro el mundo quedándome en una esquina. ¿Qué soy?",
                "de": "Ich reise um die Welt und bleibe doch in einer Ecke. Was bin ich?",
                "zh": "我走遍世界，却一直待在一个角落。我是什么？",
            },
            {"fr": "Un timbre", "en": "A stamp", "es": "Un sello", "de": "Eine Briefmarke", "zh": "邮票"},
        ),
        (
            "comb",
            {
                "fr": "J'ai des dents, mais je ne mords pas. Qui suis-je ?",
                "en": "I have teeth, but I cannot bite. What am I?",
                "es": "Tengo dientes, pero no muerdo. ¿Qué soy?",
                "de": "Ich habe Zähne, aber ich beiße nicht. Was bin ich?",
                "zh": "我有齿，却不会咬人。我是什么？",
            },
            {"fr": "Un peigne", "en": "A comb", "es": "Un peine", "de": "Ein Kamm", "zh": "梳子"},
        ),
        (
            "sponge",
            {
                "fr": "Je suis pleine de trous et je retiens l'eau. Qui suis-je ?",
                "en": "I am full of holes, and I still hold water. What am I?",
                "es": "Estoy llena de agujeros y aun así retengo el agua. ¿Qué soy?",
                "de": "Ich bin voller Löcher und halte trotzdem Wasser. Was bin ich?",
                "zh": "我满是小孔，却能留住水。我是什么？",
            },
            {"fr": "Une éponge", "en": "A sponge", "es": "Una esponja", "de": "Ein Schwamm", "zh": "海绵"},
        ),
        (
            "stair",
            {
                "fr": "Je monte et je descends sans jamais bouger. Qui suis-je ?",
                "en": "I go up and down, but I never move. What am I?",
                "es": "Subo y bajo, pero nunca me muevo. ¿Qué soy?",
                "de": "Ich gehe hinauf und hinunter, ohne mich zu bewegen. Was bin ich?",
                "zh": "我能上升也能下降，自己却不动。我是什么？",
            },
            {"fr": "Un escalier", "en": "A staircase", "es": "Una escalera", "de": "Eine Treppe", "zh": "楼梯"},
        ),
        (
            "steps",
            {
                "fr": "Plus tu me prends, plus tu m'abandonnes derrière toi. Qui suis-je ?",
                "en": "The more you take of me, the more you leave behind. What am I?",
                "es": "Cuanto más me tomas, más dejas atrás. ¿Qué soy?",
                "de": "Je mehr du von mir nimmst, desto mehr lässt du hinter dir. Was bin ich?",
                "zh": "你越是带走我，就越把我留在身后。我是什么？",
            },
            {"fr": "Des pas", "en": "Footsteps", "es": "Unos pasos", "de": "Schritte", "zh": "脚步"},
        ),
        (
            "future",
            {
                "fr": "Je suis toujours devant toi, et pourtant tu ne me vois pas. Qui suis-je ?",
                "en": "I am always in front of you, yet you cannot see me. What am I?",
                "es": "Siempre estoy delante de ti, pero no puedes verme. ¿Qué soy?",
                "de": "Ich bin immer vor dir, und doch siehst du mich nicht. Was bin ich?",
                "zh": "我总在你前面，你却看不见我。我是什么？",
            },
            {"fr": "L'avenir", "en": "The future", "es": "El futuro", "de": "Die Zukunft", "zh": "未来"},
        ),
        (
            "table",
            {
                "fr": "J'ai quatre pieds et je ne marche jamais. On pose les plats sur moi. Qui suis-je ?",
                "en": "I have four legs and I never walk. People set plates on me. What am I?",
                "es": "Tengo cuatro patas y nunca camino. Ponen los platos sobre mí. ¿Qué soy?",
                "de": "Ich habe vier Beine und laufe nie. Man stellt Teller auf mich. Was bin ich?",
                "zh": "我有四条腿，却从不走路。人们把盘子放在我身上。我是什么？",
            },
            {"fr": "Une table", "en": "A table", "es": "Una mesa", "de": "Ein Tisch", "zh": "桌子"},
        ),
        (
            "rain",
            {
                "fr": "Je tombe en gouttes et je mouille la terre. Qui suis-je ?",
                "en": "I fall in drops and I wet the ground. What am I?",
                "es": "Caigo en gotas y mojo la tierra. ¿Qué soy?",
                "de": "Ich falle in Tropfen und mache die Erde nass. Was bin ich?",
                "zh": "我化作水滴落下，把土地打湿。我是什么？",
            },
            {"fr": "La pluie", "en": "Rain", "es": "La lluvia", "de": "Der Regen", "zh": "雨"},
        ),
        (
            "glove",
            {
                "fr": "J'ai un pouce et quatre doigts, mais je ne suis pas vivante. Qui suis-je ?",
                "en": "I have a thumb and four fingers, but I am not alive. What am I?",
                "es": "Tengo un pulgar y cuatro dedos, pero no estoy viva. ¿Qué soy?",
                "de": "Ich habe einen Daumen und vier Finger, aber ich lebe nicht. Was bin ich?",
                "zh": "我有一个拇指和四根手指，却不是活的。我是什么？",
            },
            {"fr": "Un gant", "en": "A glove", "es": "Un guante", "de": "Ein Handschuh", "zh": "手套"},
        ),
        (
            "silence",
            {
                "fr": "On me brise dès qu'on prononce mon nom. Qui suis-je ?",
                "en": "I break as soon as someone says my name. What am I?",
                "es": "Me rompo en cuanto alguien dice mi nombre. ¿Qué soy?",
                "de": "Ich zerbreche, sobald jemand meinen Namen sagt. Was bin ich?",
                "zh": "一说出我的名字，我就被打破。我是什么？",
            },
            {"fr": "Le silence", "en": "Silence", "es": "El silencio", "de": "Die Stille", "zh": "沉默"},
        ),
        (
            "light",
            {
                "fr": "Je remplis une pièce sans prendre de place, et je permets de voir. Qui suis-je ?",
                "en": "I fill a room without taking up space, and I let you see. What am I?",
                "es": "Lleno una habitación sin ocupar espacio y permito ver. ¿Qué soy?",
                "de": "Ich fülle einen Raum, ohne Platz einzunehmen, und man kann dadurch sehen. Was bin ich?",
                "zh": "我能充满一个房间，却不占地方，还能让人看见。我是什么？",
            },
            {"fr": "La lumière", "en": "Light", "es": "La luz", "de": "Das Licht", "zh": "光"},
        ),
        (
            "map",
            {
                "fr": "J'ai des villes sans maisons, des forêts sans arbres et de l'eau sans poissons. Qui suis-je ?",
                "en": "I have cities without houses, forests without trees, and water without fish. What am I?",
                "es": "Tengo ciudades sin casas, bosques sin árboles y agua sin peces. ¿Qué soy?",
                "de": "Ich habe Städte ohne Häuser, Wälder ohne Bäume und Wasser ohne Fische. Was bin ich?",
                "zh": "我有城市却没有房子，有森林却没有树，有水却没有鱼。我是什么？",
            },
            {"fr": "Une carte", "en": "A map", "es": "Un mapa", "de": "Eine Karte", "zh": "地图"},
        ),
        (
            "name",
            {
                "fr": "Je t'appartiens, mais les autres m'utilisent plus que toi. Qui suis-je ?",
                "en": "I belong to you, but other people use me more than you do. What am I?",
                "es": "Te pertenezco, pero los demás me usan más que tú. ¿Qué soy?",
                "de": "Ich gehöre dir, aber andere benutzen mich öfter als du. Was bin ich?",
                "zh": "我属于你，别人却比你更常用我。我是什么？",
            },
            {"fr": "Ton nom", "en": "Your name", "es": "Tu nombre", "de": "Dein Name", "zh": "你的名字"},
        ),
        (
            "board",
            {
                "fr": "Je suis noire quand je suis propre et blanche quand je suis sale. Qui suis-je ?",
                "en": "I am black when I am clean and white when I am dirty. What am I?",
                "es": "Soy negra cuando estoy limpia y blanca cuando estoy sucia. ¿Qué soy?",
                "de": "Ich bin schwarz, wenn ich sauber bin, und weiß, wenn ich schmutzig bin. Was bin ich?",
                "zh": "干净时我是黑的，脏了时我是白的。我是什么？",
            },
            {"fr": "Un tableau noir", "en": "A blackboard", "es": "Una pizarra", "de": "Eine Tafel", "zh": "黑板"},
        ),
        (
            "book",
            {
                "fr": "J'ai des pages et des mots, mais je ne parle jamais. Qui suis-je ?",
                "en": "I have pages and words, but I never speak. What am I?",
                "es": "Tengo páginas y palabras, pero nunca hablo. ¿Qué soy?",
                "de": "Ich habe Seiten und Wörter, aber ich spreche nie. Was bin ich?",
                "zh": "我有一页又一页的文字，却从不开口。我是什么？",
            },
            {"fr": "Un livre", "en": "A book", "es": "Un libro", "de": "Ein Buch", "zh": "书"},
        ),
        (
            "promise",
            {
                "fr": "On me fait, puis on peut me briser sans me toucher. Qui suis-je ?",
                "en": "People make me, then they can break me without touching me. What am I?",
                "es": "Me hacen y luego pueden romperme sin tocarme. ¿Qué soy?",
                "de": "Man gibt mich, und dann kann man mich brechen, ohne mich zu berühren. Was bin ich?",
                "zh": "人们许下我，却能不碰我就打破我。我是什么？",
            },
            {"fr": "Une promesse", "en": "A promise", "es": "Una promesa", "de": "Ein Versprechen", "zh": "诺言"},
        ),
        (
            "tomorrow",
            {
                "fr": "J'arrive toujours, et je ne suis jamais là aujourd'hui. Qui suis-je ?",
                "en": "I am always coming, and I am never here today. What am I?",
                "es": "Siempre estoy por llegar y nunca estoy aquí hoy. ¿Qué soy?",
                "de": "Ich komme immer, und heute bin ich nie da. Was bin ich?",
                "zh": "我总在到来，却从不是今天。我是什么？",
            },
            {"fr": "Demain", "en": "Tomorrow", "es": "Mañana", "de": "Morgen", "zh": "明天"},
        ),
        (
            "hole",
            {
                "fr": "Plus on retire de moi, plus je grandis. Qui suis-je ?",
                "en": "The more you take away from me, the bigger I get. What am I?",
                "es": "Cuanto más me quitas, más grande me hago. ¿Qué soy?",
                "de": "Je mehr man von mir wegnimmt, desto größer werde ich. Was bin ich?",
                "zh": "从我这里拿走得越多，我就越大。我是什么？",
            },
            {"fr": "Un trou", "en": "A hole", "es": "Un agujero", "de": "Ein Loch", "zh": "洞"},
        ),
        (
            "window",
            {
                "fr": "Grâce à moi, on voit à travers un mur. Qui suis-je ?",
                "en": "Through me, you can see through a wall. What am I?",
                "es": "Gracias a mí se ve a través de un muro. ¿Qué soy?",
                "de": "Durch mich sieht man durch eine Wand. Was bin ich?",
                "zh": "有了我，就能看穿一堵墙。我是什么？",
            },
            {"fr": "Une fenêtre", "en": "A window", "es": "Una ventana", "de": "Ein Fenster", "zh": "窗户"},
        ),
        (
            "shadow",
            {
                "fr": "Je te suis au soleil, et je n'ai pas de corps. Qui suis-je ?",
                "en": "I follow you in the sun, and I have no body. What am I?",
                "es": "Te sigo bajo el sol y no tengo cuerpo. ¿Qué soy?",
                "de": "Ich folge dir in der Sonne und habe keinen Körper. Was bin ich?",
                "zh": "阳光下我跟着你，我却没有身体。我是什么？",
            },
            {"fr": "Ton ombre", "en": "Your shadow", "es": "Tu sombra", "de": "Dein Schatten", "zh": "你的影子"},
        ),
        (
            "echo",
            {
                "fr": "Je réponds, mais je ne parle jamais le premier. Qui suis-je ?",
                "en": "I answer, but I never speak first. What am I?",
                "es": "Respondo, pero nunca hablo primero. ¿Qué soy?",
                "de": "Ich antworte, aber ich spreche nie als Erster. Was bin ich?",
                "zh": "我会回答，却从不开口在先。我是什么？",
            },
            {"fr": "L'écho", "en": "An echo", "es": "El eco", "de": "Das Echo", "zh": "回声"},
        ),
        (
            "mirror",
            {
                "fr": "Je te renvoie ton visage, mais je n'en ai pas un à moi. Qui suis-je ?",
                "en": "I show you your face, but I have none of my own. What am I?",
                "es": "Te devuelvo tu rostro, pero yo no tengo ninguno. ¿Qué soy?",
                "de": "Ich werfe dir dein Gesicht zurück, aber ich habe selbst keines. Was bin ich?",
                "zh": "我映出你的脸，自己却没有脸。我是什么？",
            },
            {"fr": "Un miroir", "en": "A mirror", "es": "Un espejo", "de": "Ein Spiegel", "zh": "镜子"},
        ),
        (
            "candle",
            {
                "fr": "Plus je donne de lumière, plus je rapetisse. Qui suis-je ?",
                "en": "The more light I give, the shorter I become. What am I?",
                "es": "Cuanta más luz doy, más pequeña me vuelvo. ¿Qué soy?",
                "de": "Je mehr Licht ich gebe, desto kleiner werde ich. Was bin ich?",
                "zh": "我发出的光越多，自己就越短。我是什么？",
            },
            {"fr": "Une bougie", "en": "A candle", "es": "Una vela", "de": "Eine Kerze", "zh": "蜡烛"},
        ),
    ]
    items = []
    for key, prompt, answer in rows:
        items.append(
            {
                "id": f"classic-{key}",
                "kind": "classic",
                "topic": "riddle",
                "mode": "riddle",
                "prompt": prompt,
                "answer": answer,
                "choices": None,
            }
        )
    return items


def country_names() -> dict[str, dict[str, str]]:
    names = {}
    allowed = single_ids("capitals")
    for row in load("capitals"):
        if row["id"] not in allowed:
            continue
        packed = pack(row, "c")
        if packed:
            names[row["id"]] = packed
    return names


def relation_facts(name: str, kind: str, subject_prefix: str | None, answer_prefix: str) -> list[dict]:
    allowed = single_ids(name)
    names = country_names() if subject_prefix is None else None
    facts = []
    seen = set()
    for row in load(name):
        if row["id"] not in allowed or row["id"] in seen:
            continue
        answer = pack(row, answer_prefix)
        subject = names.get(row["id"]) if names is not None else pack(row, subject_prefix or "c")
        if not answer or not subject:
            continue
        if kind == "continent" and fold(subject["fr"]) in TRANSCONTINENTAL:
            continue
        if kind == "mountain":
            blob = " ".join(fold(subject[lang]) for lang in LANGS)
            if any(peak in blob for peak in SHARED_PEAKS):
                continue
        if any(subject[lang].casefold() == answer[lang].casefold() for lang in LANGS):
            continue
        seen.add(row["id"])
        facts.append({"id": f"{kind}-{row['id']}", "kind": kind, "subject": subject, "answer": answer})
    return facts


def element_facts() -> list[dict]:
    allowed_numbers = {}
    for row in load("elements"):
        try:
            number = int(row["num"])
        except ValueError:
            continue
        if not 1 <= number <= 118:
            continue
        if row["sym"] != SYMBOLS[number - 1]:
            continue
        names = pack(row, "c")
        if not names:
            continue
        allowed_numbers[number] = names
    facts = []
    for number, names in sorted(allowed_numbers.items()):
        symbol = {lang: SYMBOLS[number - 1] for lang in LANGS}
        atomic = {lang: str(number) for lang in LANGS}
        facts.append({"id": f"symbol-E{number}", "kind": "symbol", "subject": names, "answer": symbol})
        facts.append({"id": f"atomic-E{number}", "kind": "atomic", "subject": names, "answer": atomic})
    return facts


def polish_prompt(kind: str, prompt: dict[str, str], subject: dict[str, str]) -> dict[str, str]:
    if kind not in {"symbol", "atomic"}:
        return prompt
    name = subject["fr"]
    particle = "de l'" if name[:1].lower() in "aeiouyhàâäéèêëîïôöùûüœ" else "du "
    polished = dict(prompt)
    polished["fr"] = prompt["fr"].replace(f"de {name}", f"{particle}{name}", 1)
    return polished


def unique_prompts(facts: list[dict], mode: str) -> list[dict]:
    templates = QUIZ if mode == "quiz" else RIDDLE
    prepared = []
    for fact in facts:
        if fact["kind"] == "classic":
            prepared.append(fact)
            continue
        prompt = polish_prompt(
            fact["kind"],
            {lang: templates[fact["kind"]][lang].format(s=fact["subject"][lang]) for lang in LANGS},
            fact["subject"],
        )
        if any(contained(fact["answer"][lang], prompt[lang], lang) for lang in LANGS):
            continue
        prepared.append({**fact, "prompt": prompt})
    kept = []
    for lang in LANGS:
        groups: dict[str, list[dict]] = {}
        for fact in prepared:
            groups.setdefault(fact["prompt"][lang], []).append(fact)
        ambiguous = {fact["id"] for rows in groups.values() if len({row["answer"][lang] for row in rows}) > 1 for fact in rows}
        prepared = [fact for fact in prepared if fact["id"] not in ambiguous]
    return prepared


def add_choices(facts: list[dict]) -> list[dict]:
    by_kind: dict[str, list[dict]] = {}
    for fact in facts:
        if fact["kind"] != "classic":
            by_kind.setdefault(fact["kind"], []).append(fact)
    ready = []
    for fact in facts:
        if fact["mode"] != "quiz":
            ready.append({**fact, "choices": None})
            continue
        pool = [item for item in by_kind[fact["kind"]] if item["id"] != fact["id"]]
        rng = random.Random(fact["id"])
        rng.shuffle(pool)
        chosen = []
        for candidate in pool:
            labels = candidate["answer"]
            if any(labels[lang] == fact["answer"][lang] for lang in LANGS):
                continue
            if any(any(labels[lang] == got[lang] for lang in LANGS) for got in chosen):
                continue
            chosen.append(labels)
            if len(chosen) == 3:
                break
        if len(chosen) < 3:
            continue
        order = [0, 1, 2, 3]
        rng.shuffle(order)
        columns = [fact["answer"], *chosen]
        choices = {lang: [columns[index][lang] for index in order] for lang in LANGS}
        if any(len(set(choices[lang])) != 4 for lang in LANGS):
            continue
        ready.append({**fact, "choices": choices})
    return ready


def main() -> None:
    facts = []
    facts.extend(relation_facts("capitals", "capital", None, "a"))
    facts.extend(relation_facts("continents", "continent", None, "a"))
    facts.extend(relation_facts("currencies", "currency", None, "a"))
    facts.extend(relation_facts("languages_of", "language", None, "a"))
    facts.extend(relation_facts("paintings", "painter", "c", "a"))
    facts.extend(relation_facts("books", "author", "c", "a"))
    facts.extend(relation_facts("films", "director", "c", "a"))
    facts.extend(relation_facts("mountains", "mountain", "c", "a"))
    facts.extend(relation_facts("cities", "city", "c", "a"))
    facts.extend(element_facts())
    facts.sort(key=lambda item: item["id"])
    for index, fact in enumerate(facts):
        fact["mode"] = "quiz" if index % 2 == 0 else "riddle"
        fact["topic"] = TOPICS[fact["kind"]]
    quiz = add_choices(unique_prompts([fact for fact in facts if fact["mode"] == "quiz"], "quiz"))
    riddles = unique_prompts([fact for fact in facts if fact["mode"] == "riddle"], "riddle")
    riddles.extend(classic_riddles())
    items = quiz + riddles
    leaks = [
        fact["id"]
        for fact in items
        if any(contained(fact["answer"][lang], fact["prompt"][lang], lang) for lang in LANGS)
    ]
    if leaks:
        raise SystemExit(f"answer leaked into prompt: {leaks[:8]}")
    if len(items) < 2000:
        raise SystemExit(f"only {len(items)} items")
    prompts = {"version": 1, "source": "Wikidata", "quiz": [], "riddle": []}
    answers = {"version": 1, "items": {}}
    for fact in items:
        bucket = "riddle" if fact["mode"] == "riddle" else "quiz"
        public = {"id": fact["id"], "topic": fact["topic"], "prompt": fact["prompt"]}
        if bucket == "quiz":
            public["choices"] = fact["choices"]
        prompts[bucket].append(public)
        answers["items"][fact["id"]] = fact["answer"]
    capitals = {fact["subject"]["fr"]: fact["answer"]["fr"] for fact in facts if fact["kind"] == "capital"}
    expected = {
        "Burkina Faso": "Ouagadougou",
        "France": "Paris",
        "Japon": "Tokyo",
        "Allemagne": "Berlin",
        "Canada": "Ottawa",
    }
    for country, capital in expected.items():
        if capitals.get(country) != capital:
            raise SystemExit(f"bad capital {country}: {capitals.get(country)}")
    PROMPTS.parent.mkdir(parents=True, exist_ok=True)
    PROMPTS.write_text(json.dumps(prompts, ensure_ascii=False, separators=(",", ":")))
    ANSWERS.write_text(json.dumps(answers, ensure_ascii=False, separators=(",", ":")))
    print("quiz", len(prompts["quiz"]), "riddle", len(prompts["riddle"]), "total", len(items))
    print("prompts", PROMPTS.stat().st_size, "answers", ANSWERS.stat().st_size)


if __name__ == "__main__":
    main()
