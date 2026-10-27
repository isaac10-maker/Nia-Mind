#!/usr/bin/env python3
"""Localize new leisure labels that were stored in Latin script."""

import json
from pathlib import Path

PROMPTS = Path("/home/user/public/leisure/prompts.json")
ANSWERS = Path("/home/user/public/leisure/answers.json")

ZH = {
    "Masashi Kishimoto": "岸本齐史",
    "Eiichiro Oda": "尾田荣一郎",
    "Akira Toriyama": "鸟山明",
    "Hayao Miyazaki": "宫崎骏",
    "Gosho Aoyama": "青山刚昌",
    "Hajime Isayama": "谏山创",
    "Kohei Horikoshi": "堀越耕平",
    "Gege Akutami": "芥见下下",
    "Tsugumi Ohba": "大场鸫",
    "Takeshi Obata": "小畑健",
    "Naoko Takeuchi": "武内直子",
    "Hiromu Arakawa": "荒川弘",
    "Nobuhiro Watsuki": "和月伸宏",
    "Kentaro Miura": "三浦建太郎",
    "Satoshi Tajiri": "田尻智",
    "Shigeru Miyamoto": "宫本茂",
    "Hideo Kojima": "小岛秀夫",
    "Yoshihiro Togashi": "冨樫义博",
    "Tatsuki Fujimoto": "藤本树",
    "Rumiko Takahashi": "高桥留美子",
    "Osamu Tezuka": "手冢治虫",
    "Usagi Tsukino": "月野兔",
    "Rei Hino": "火野丽",
    "Ami Mizuno": "水野亚美",
    "One Piece": "海贼王",
    "Naruto": "火影忍者",
    "Bleach": "死神",
    "Vegeta": "贝吉塔",
    "Namek": "那美克星",
    "Earth": "地球",
    "Eren Jäger": "艾伦·耶格尔",
    "Levi Ackerman": "利威尔·阿克曼",
    "Armin Arlert": "阿尔敏·阿诺德",
    "Light Yagami": "夜神月",
    "Ryuk": "琉克",
    "Tanjiro Kamado": "灶门炭治郎",
    "Zenitsu Agatsuma": "我妻善逸",
    "Inosuke Hashibira": "嘴平伊之助",
    "Pikachu": "皮卡丘",
    "Eevee": "伊布",
    "Charizard": "喷火龙",
    "Isao Takahata": "高畑勋",
    "Makoto Shinkai": "新海诚",
    "Edward Elric": "爱德华·艾尔利克",
    "Alphonse Elric": "阿尔冯斯·艾尔利克",
    "Roy Mustang": "罗伊·马斯坦",
    "All Might": "欧尔麦特",
    "Bakugo": "爆豪胜己",
    "Yuji Itadori": "虎杖悠仁",
    "Megumi Fushiguro": "伏黑惠",
    "Satoru Gojo": "五条悟",
    "Arthur Conan Doyle": "阿瑟·柯南·道尔",
    "Agatha Christie": "阿加莎·克里斯蒂",
    "Edgar Allan Poe": "埃德加·爱伦·坡",
    "Dr Watson": "华生医生",
    "Professor Moriarty": "莫里亚蒂教授",
    "Inspector Lestrade": "雷斯垂德探长",
    "Bram Stoker": "布莱姆·斯托克",
    "Mary Shelley": "玛丽·雪莱",
    "Oscar Wilde": "奥斯卡·王尔德",
    "Jane Austen": "简·奥斯汀",
    "Miguel de Cervantes": "米格尔·德·塞万提斯",
    "Lope de Vega": "洛佩·德·维加",
    "Federico García Lorca": "费德里科·加西亚·洛尔卡",
    "Lewis Carroll": "刘易斯·卡罗尔",
    "J. M. Barrie": "J.M.巴里",
    "Roald Dahl": "罗尔德·达尔",
    "Antoine de Saint-Exupéry": "安托万·德·圣埃克苏佩里",
    "Jules Verne": "儒勒·凡尔纳",
    "Victor Hugo": "维克多·雨果",
    "William Shakespeare": "威廉·莎士比亚",
    "Christopher Marlowe": "克里斯托弗·马洛",
    "Molière": "莫里哀",
    "Carlo Collodi": "卡洛·科洛迪",
    "Hans Christian Andersen": "安徒生",
    "Brothers Grimm": "格林兄弟",
    "J. R. R. Tolkien": "J.R.R.托尔金",
    "C. S. Lewis": "C.S.刘易斯",
    "George R. R. Martin": "乔治·R·R·马丁",
    "J. K. Rowling": "J.K.罗琳",
    "Philip Pullman": "菲利普·普尔曼",
    "Rick Riordan": "里克·赖尔丹",
    "New York": "纽约",
    "Gotham": "哥谭",
    "Metropolis": "大都会",
    "Star City": "星城",
    "Krypton": "氪星",
    "Kryptonopolis": "氪星城",
    "Hergé": "埃尔热",
    "Albert Uderzo": "阿尔贝·乌德佐",
    "Peyo": "皮约",
    "René Goscinny": "勒内·戈西尼",
    "Neverland": "永无岛",
    "Wonderland": "仙境",
    "Narnia": "纳尼亚",
    "Paris": "巴黎",
    "Tokyo": "东京",
    "Los Angeles": "洛杉矶",
    "Beijing": "北京",
    "Rio de Janeiro": "里约热内卢",
    "London": "伦敦",
    "Athens": "雅典",
    "Sydney": "悉尼",
    "Seoul": "首尔",
    "Alexander Fleming": "亚历山大·弗莱明",
    "Louis Pasteur": "路易·巴斯德",
    "Marie Curie": "玛丽·居里",
    "Albert Einstein": "阿尔伯特·爱因斯坦",
    "Isaac Newton": "艾萨克·牛顿",
    "Niels Bohr": "尼尔斯·玻尔",
}

EN = {
    "Eren Jäger": "Eren Yeager",
}
ES = {
    "Eren Jäger": "Eren Jaeger",
}


def main():
    prompts = json.loads(PROMPTS.read_text())
    answers = json.loads(ANSWERS.read_text())
    maps = {"zh": ZH, "en": EN, "es": ES}
    changed = 0
    for kind in ("quiz", "riddle"):
        for item in prompts[kind]:
            book = answers["items"][item["id"]]
            for lang, table in maps.items():
                before = item["choices"][lang]
                item["choices"][lang] = [table.get(choice, choice) for choice in before]
                book[lang] = table.get(book[lang], book[lang])
                if item["choices"][lang] != before:
                    changed += 1
    PROMPTS.write_text(json.dumps(prompts, ensure_ascii=False, separators=(",", ":")))
    ANSWERS.write_text(json.dumps(answers, ensure_ascii=False, separators=(",", ":")))
    print("relabeled", changed)


if __name__ == "__main__":
    main()
