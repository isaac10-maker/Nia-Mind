#!/usr/bin/env python3
"""Add manga, fiction, events, science, nature, and a real riddle branch."""

import json
import random
from pathlib import Path

PROMPTS = Path("/home/user/public/leisure/prompts.json")
ANSWERS = Path("/home/user/public/leisure/answers.json")
LANGS = ("fr", "en", "es", "de", "zh")


def L(fr, en, es, de, zh):
    return {"fr": fr, "en": en, "es": es, "de": de, "zh": zh}


def S(text):
    return {lang: text for lang in LANGS}


QUIZ = [
    ("manga-naruto", "manga", L("Qui a créé le manga Naruto ?", "Who created the manga Naruto?", "¿Quién creó el manga Naruto?", "Wer hat den Manga Naruto erschaffen?", "《火影忍者》的作者是谁？"), S("Masashi Kishimoto"), [S("Eiichiro Oda"), S("Akira Toriyama")]),
    ("manga-onepiece", "manga", L("Qui a créé le manga One Piece ?", "Who created the manga One Piece?", "¿Quién creó el manga One Piece?", "Wer hat den Manga One Piece erschaffen?", "《海贼王》的作者是谁？"), S("Eiichiro Oda"), [S("Masashi Kishimoto"), S("Yoshihiro Togashi")]),
    ("manga-dragonball", "manga", L("Qui a créé Dragon Ball ?", "Who created Dragon Ball?", "¿Quién creó Dragon Ball?", "Wer hat Dragon Ball erschaffen?", "《龙珠》的作者是谁？"), S("Akira Toriyama"), [S("Hayao Miyazaki"), S("Gosho Aoyama")]),
    ("manga-aot", "manga", L("Qui a créé L'Attaque des Titans ?", "Who created Attack on Titan?", "¿Quién creó Ataque a los Titanes?", "Wer hat Attack on Titan erschaffen?", "《进击的巨人》的作者是谁？"), S("Hajime Isayama"), [S("Kohei Horikoshi"), S("Gege Akutami")]),
    ("manga-deathnote", "manga", L("Qui a écrit l'histoire de Death Note ?", "Who wrote the story of Death Note?", "¿Quién escribió la historia de Death Note?", "Wer hat die Geschichte von Death Note geschrieben?", "《死亡笔记》的故事作者是谁？"), S("Tsugumi Ohba"), [S("Takeshi Obata"), S("Naoko Takeuchi")]),
    ("manga-demon", "manga", L("Qui a créé Demon Slayer ?", "Who created Demon Slayer?", "¿Quién creó Guardianes de la Noche?", "Wer hat Demon Slayer erschaffen?", "《鬼灭之刃》的作者是谁？"), S("Koyoharu Gotouge"), [S("Hiromu Arakawa"), S("Rumiko Takahashi")]),
    ("manga-sailor", "manga", L("Qui a créé Sailor Moon ?", "Who created Sailor Moon?", "¿Quién creó Sailor Moon?", "Wer hat Sailor Moon erschaffen?", "《美少女战士》的作者是谁？"), S("Naoko Takeuchi"), [S("CLAMP"), S("Hiromu Arakawa")]),
    ("manga-fma", "manga", L("Qui a créé Fullmetal Alchemist ?", "Who created Fullmetal Alchemist?", "¿Quién creó Fullmetal Alchemist?", "Wer hat Fullmetal Alchemist erschaffen?", "《钢之炼金术师》的作者是谁？"), S("Hiromu Arakawa"), [S("Nobuhiro Watsuki"), S("Kentaro Miura")]),
    ("manga-pokemon", "manga", L("Qui est le créateur de Pokémon ?", "Who is the creator of Pokémon?", "¿Quién es el creador de Pokémon?", "Wer ist der Schöpfer von Pokémon?", "宝可梦的创作者是谁？"), S("Satoshi Tajiri"), [S("Shigeru Miyamoto"), S("Hideo Kojima")]),
    ("manga-hxh", "manga", L("Qui a créé Hunter × Hunter ?", "Who created Hunter × Hunter?", "¿Quién creó Hunter × Hunter?", "Wer hat Hunter × Hunter erschaffen?", "《全职猎人》的作者是谁？"), S("Yoshihiro Togashi"), [S("Masashi Kishimoto"), S("Eiichiro Oda")]),
    ("manga-mha", "manga", L("Qui a créé My Hero Academia ?", "Who created My Hero Academia?", "¿Quién creó My Hero Academia?", "Wer hat My Hero Academia erschaffen?", "《我的英雄学院》的作者是谁？"), S("Kohei Horikoshi"), [S("Gege Akutami"), S("Tatsuki Fujimoto")]),
    ("manga-jjk", "manga", L("Qui a créé Jujutsu Kaisen ?", "Who created Jujutsu Kaisen?", "¿Quién creó Jujutsu Kaisen?", "Wer hat Jujutsu Kaisen erschaffen?", "《咒术回战》的作者是谁？"), S("Gege Akutami"), [S("Kohei Horikoshi"), S("Hajime Isayama")]),
    ("manga-conan", "manga", L("Qui a créé Détective Conan ?", "Who created Detective Conan?", "¿Quién creó Detective Conan?", "Wer hat Detektiv Conan erschaffen?", "《名侦探柯南》的作者是谁？"), S("Gosho Aoyama"), [S("Akira Toriyama"), S("Osamu Tezuka")]),
    ("manga-usagi", "manga", L("Quel est le nom civil de Sailor Moon ?", "What is Sailor Moon's civilian name?", "¿Cuál es el nombre civil de Sailor Moon?", "Wie heißt Sailor Moon im Alltag?", "月野兔是哪位角色的本名？"), S("Usagi Tsukino"), [S("Rei Hino"), S("Ami Mizuno")]),
    ("manga-luffy", "manga", L("Dans quel manga Luffy est-il le héros ?", "In which manga is Luffy the hero?", "¿En qué manga es Luffy el héroe?", "In welchem Manga ist Luffy der Held?", "路飞是哪部漫画的主角？"), S("One Piece"), [S("Naruto"), S("Bleach")]),
    ("manga-goku", "manga", L("De quelle planète vient Son Goku ?", "Which planet does Son Goku come from?", "¿De qué planeta viene Son Goku?", "Von welchem Planeten kommt Son Goku?", "孙悟空来自哪颗星球？"), S("Vegeta"), [S("Namek"), S("Earth")]),
    ("manga-eren", "manga", L("Qui est le protagoniste de L'Attaque des Titans ?", "Who is the protagonist of Attack on Titan?", "¿Quién es el protagonista de Ataque a los Titanes?", "Wer ist der Protagonist von Attack on Titan?", "《进击的巨人》的主角是谁？"), S("Eren Jäger"), [S("Levi Ackerman"), S("Armin Arlert")]),
    ("manga-light", "manga", L("Qui trouve le Death Note au début de l'histoire ?", "Who finds the Death Note at the start of the story?", "¿Quién encuentra el Death Note al inicio?", "Wer findet am Anfang das Death Note?", "故事开头捡到死亡笔记的是谁？"), S("Light Yagami"), [S("L"), S("Ryuk")]),
    ("manga-tanjiro", "manga", L("Qui est le héros de Demon Slayer ?", "Who is the hero of Demon Slayer?", "¿Quién es el héroe de Guardianes de la Noche?", "Wer ist der Held von Demon Slayer?", "《鬼灭之刃》的主角是谁？"), S("Tanjiro Kamado"), [S("Zenitsu Agatsuma"), S("Inosuke Hashibira")]),
    ("manga-pikachu", "manga", L("Quelle créature est la mascotte de Pokémon ?", "Which creature is the Pokémon mascot?", "¿Qué criatura es la mascota de Pokémon?", "Welche Kreatur ist das Maskottchen von Pokémon?", "哪只宝可梦是系列的吉祥物？"), S("Pikachu"), [S("Eevee"), S("Charizard")]),
    ("manga-chihiro", "manga", L("Qui réalise Le Voyage de Chihiro ?", "Who directed Spirited Away?", "¿Quién dirigió El viaje de Chihiro?", "Wer hat Chihiros Reise ins Zauberland inszeniert?", "《千与千寻》的导演是谁？"), S("Hayao Miyazaki"), [S("Isao Takahata"), S("Makoto Shinkai")]),
    ("manga-edward", "manga", L("Qui est l'alchimiste principal de Fullmetal Alchemist ?", "Who is the main alchemist in Fullmetal Alchemist?", "¿Quién es el alquimista principal de Fullmetal Alchemist?", "Wer ist der Hauptalkimist in Fullmetal Alchemist?", "《钢之炼金术师》的主角炼金术师是谁？"), S("Edward Elric"), [S("Alphonse Elric"), S("Roy Mustang")]),
    ("manga-deku", "manga", L("Quel est le nom de héros de Izuku Midoriya ?", "What is Izuku Midoriya's hero name?", "¿Cuál es el nombre de héroe de Izuku Midoriya?", "Wie lautet Izuku Midoriyas Heldenname?", "绿谷出久的英雄名是什么？"), S("Deku"), [S("All Might"), S("Bakugo")]),
    ("manga-yuji", "manga", L("Qui est le protagoniste de Jujutsu Kaisen ?", "Who is the protagonist of Jujutsu Kaisen?", "¿Quién es el protagonista de Jujutsu Kaisen?", "Wer ist der Protagonist von Jujutsu Kaisen?", "《咒术回战》的主角是谁？"), S("Yuji Itadori"), [S("Megumi Fushiguro"), S("Satoru Gojo")]),
    ("fiction-holmes", "fiction", L("Qui a créé Sherlock Holmes ?", "Who created Sherlock Holmes?", "¿Quién creó a Sherlock Holmes?", "Wer hat Sherlock Holmes erschaffen?", "谁创造了夏洛克·福尔摩斯？"), S("Arthur Conan Doyle"), [S("Agatha Christie"), S("Edgar Allan Poe")]),
    ("fiction-watson", "fiction", L("Qui accompagne Sherlock Holmes ?", "Who accompanies Sherlock Holmes?", "¿Quién acompaña a Sherlock Holmes?", "Wer begleitet Sherlock Holmes?", "谁是夏洛克·福尔摩斯的搭档？"), S("Dr Watson"), [S("Professor Moriarty"), S("Inspector Lestrade")]),
    ("fiction-dracula", "fiction", L("Qui a écrit Dracula ?", "Who wrote Dracula?", "¿Quién escribió Drácula?", "Wer hat Dracula geschrieben?", "《德古拉》的作者是谁？"), S("Bram Stoker"), [S("Mary Shelley"), S("Oscar Wilde")]),
    ("fiction-frankenstein", "fiction", L("Qui a écrit Frankenstein ?", "Who wrote Frankenstein?", "¿Quién escribió Frankenstein?", "Wer hat Frankenstein geschrieben?", "《弗兰肯斯坦》的作者是谁？"), S("Mary Shelley"), [S("Bram Stoker"), S("Jane Austen")]),
    ("fiction-quixote", "fiction", L("Qui a écrit Don Quichotte ?", "Who wrote Don Quixote?", "¿Quién escribió Don Quijote?", "Wer hat Don Quijote geschrieben?", "《堂吉诃德》的作者是谁？"), S("Miguel de Cervantes"), [S("Lope de Vega"), S("Federico García Lorca")]),
    ("fiction-alice", "fiction", L("Qui a écrit Alice au pays des merveilles ?", "Who wrote Alice's Adventures in Wonderland?", "¿Quién escribió Alicia en el país de las maravillas?", "Wer hat Alice im Wunderland geschrieben?", "《爱丽丝梦游仙境》的作者是谁？"), S("Lewis Carroll"), [S("J. M. Barrie"), S("Roald Dahl")]),
    ("fiction-prince", "fiction", L("Qui a écrit Le Petit Prince ?", "Who wrote The Little Prince?", "¿Quién escribió El principito?", "Wer hat Der kleine Prinz geschrieben?", "《小王子》的作者是谁？"), S("Antoine de Saint-Exupéry"), [S("Jules Verne"), S("Victor Hugo")]),
    ("fiction-hamlet", "fiction", L("Qui a écrit Hamlet ?", "Who wrote Hamlet?", "¿Quién escribió Hamlet?", "Wer hat Hamlet geschrieben?", "《哈姆雷特》的作者是谁？"), S("William Shakespeare"), [S("Christopher Marlowe"), S("Molière")]),
    ("fiction-odyssey", "fiction", L("Quelle épopée raconte le retour d'Ulysse ?", "Which epic tells of Odysseus's return?", "¿Qué epopeya cuenta el regreso de Ulises?", "Welches Epos erzählt die Heimkehr des Odysseus?", "哪部史诗讲述奥德修斯返乡？"), L("L'Odyssée", "The Odyssey", "La Odisea", "Die Odyssee", "《奥德赛》"), [L("L'Iliade", "The Iliad", "La Ilíada", "Die Ilias", "《伊利亚特》"), L("L'Énéide", "The Aeneid", "La Eneida", "Die Aeneis", "《埃涅阿斯纪》")]),
    ("fiction-peter", "fiction", L("Qui a créé Peter Pan ?", "Who created Peter Pan?", "¿Quién creó a Peter Pan?", "Wer hat Peter Pan erschaffen?", "谁创造了彼得·潘？"), S("J. M. Barrie"), [S("Lewis Carroll"), S("Charles Dickens")]),
    ("fiction-pinocchio", "fiction", L("Qui a écrit Pinocchio ?", "Who wrote Pinocchio?", "¿Quién escribió Pinocho?", "Wer hat Pinocchio geschrieben?", "《木偶奇遇记》的作者是谁？"), S("Carlo Collodi"), [S("Hans Christian Andersen"), S("Brothers Grimm")]),
    ("fiction-hobbit", "fiction", L("Qui a écrit Le Hobbit ?", "Who wrote The Hobbit?", "¿Quién escribió El hobbit?", "Wer hat Der Hobbit geschrieben?", "《霍比特人》的作者是谁？"), S("J. R. R. Tolkien"), [S("C. S. Lewis"), S("George R. R. Martin")]),
    ("fiction-potter", "fiction", L("Qui a écrit Harry Potter ?", "Who wrote Harry Potter?", "¿Quién escribió Harry Potter?", "Wer hat Harry Potter geschrieben?", "《哈利·波特》的作者是谁？"), S("J. K. Rowling"), [S("Philip Pullman"), S("Rick Riordan")]),
    ("fiction-spiderman", "fiction", L("Dans quelle ville vit Spider-Man ?", "In which city does Spider-Man live?", "¿En qué ciudad vive Spider-Man?", "In welcher Stadt lebt Spider-Man?", "蜘蛛侠住在哪座城市？"), S("New York"), [S("Gotham"), S("Metropolis")]),
    ("fiction-batman", "fiction", L("Dans quelle ville fictive agit Batman ?", "In which fictional city does Batman act?", "¿En qué ciudad ficticia actúa Batman?", "In welcher fiktiven Stadt handelt Batman?", "蝙蝠侠活动的虚构城市是哪里？"), S("Gotham"), [S("Metropolis"), S("Star City")]),
    ("fiction-superman", "fiction", L("De quelle planète vient Superman ?", "Which planet does Superman come from?", "¿De qué planeta viene Superman?", "Von welchem Planeten kommt Superman?", "超人来自哪颗星球？"), S("Krypton"), [S("Mars"), S("Kryptonopolis")]),
    ("fiction-tintin", "fiction", L("Qui a créé Tintin ?", "Who created Tintin?", "¿Quién creó a Tintín?", "Wer hat Tim erschaffen?", "谁创造了丁丁？"), S("Hergé"), [S("Albert Uderzo"), S("Peyo")]),
    ("fiction-asterix", "fiction", L("Qui a dessiné Astérix ?", "Who drew Asterix?", "¿Quién dibujó Astérix?", "Wer hat Asterix gezeichnet?", "谁绘制了《高卢英雄传》？"), S("Albert Uderzo"), [S("René Goscinny"), S("Hergé")]),
    ("fiction-neverland", "fiction", L("Où vit Peter Pan ?", "Where does Peter Pan live?", "¿Dónde vive Peter Pan?", "Wo lebt Peter Pan?", "彼得·潘住在哪里？"), S("Neverland"), [S("Wonderland"), S("Narnia")]),
    ("fiction-b612", "fiction", L("D'où vient le Petit Prince ?", "Where does the Little Prince come from?", "¿De dónde viene el Principito?", "Woher kommt der kleine Prinz?", "小王子来自哪里？"), S("B-612"), [S("B-614"), S("Earth")]),
    ("event-moon", "events", L("En quelle année des humains ont-ils marché sur la Lune ?", "In which year did humans walk on the Moon?", "¿En qué año caminaron humanos sobre la Luna?", "In welchem Jahr betraten Menschen den Mond?", "人类哪一年登上月球？"), S("1969"), [S("1961"), S("1972")]),
    ("event-wall", "events", L("En quelle année le mur de Berlin est-il tombé ?", "In which year did the Berlin Wall fall?", "¿En qué año cayó el muro de Berlín?", "In welchem Jahr fiel die Berliner Mauer?", "柏林墙哪一年倒塌？"), S("1989"), [S("1991"), S("1985")]),
    ("event-burkina-indep", "events", L("En quelle année le Burkina Faso, alors Haute-Volta, devient-il indépendant ?", "In which year did Burkina Faso, then Upper Volta, become independent?", "¿En qué año se independizó Burkina Faso, entonces Alto Volta?", "In welchem Jahr wurde Burkina Faso, damals Obervolta, unabhängig?", "布基纳法索（当时的上沃尔特）哪一年独立？"), S("1960"), [S("1958"), S("1984")]),
    ("event-burkina-name", "events", L("En quelle année la Haute-Volta devient-elle le Burkina Faso ?", "In which year did Upper Volta become Burkina Faso?", "¿En qué año Alto Volta pasó a llamarse Burkina Faso?", "In welchem Jahr wurde Obervolta zu Burkina Faso?", "上沃尔特哪一年改名为布基纳法索？"), S("1984"), [S("1960"), S("1987")]),
    ("event-wc2022-host", "events", L("Quel pays a accueilli la Coupe du monde de football 2022 ?", "Which country hosted the 2022 FIFA World Cup?", "¿Qué país acogió el Mundial de fútbol 2022?", "Welches Land richtete die Fußball-WM 2022 aus?", "2022年足球世界杯在哪个国家举办？"), L("Le Qatar", "Qatar", "Catar", "Katar", "卡塔尔"), [L("La Russie", "Russia", "Rusia", "Russland", "俄罗斯"), L("Le Brésil", "Brazil", "Brasil", "Brasilien", "巴西")]),
    ("event-wc2022-winner", "events", L("Qui a gagné la Coupe du monde de football 2022 ?", "Who won the 2022 FIFA World Cup?", "¿Quién ganó el Mundial de fútbol 2022?", "Wer gewann die Fußball-WM 2022?", "谁赢得了2022年足球世界杯？"), L("L'Argentine", "Argentina", "Argentina", "Argentinien", "阿根廷"), [L("La France", "France", "Francia", "Frankreich", "法国"), L("Le Brésil", "Brazil", "Brasil", "Brasilien", "巴西")]),
    ("event-wc2018-host", "events", L("Quel pays a accueilli la Coupe du monde 2018 ?", "Which country hosted the 2018 World Cup?", "¿Qué país acogió el Mundial 2018?", "Welches Land richtete die WM 2018 aus?", "2018年世界杯在哪个国家举办？"), L("La Russie", "Russia", "Rusia", "Russland", "俄罗斯"), [L("Le Qatar", "Qatar", "Catar", "Katar", "卡塔尔"), L("L'Allemagne", "Germany", "Alemania", "Deutschland", "德国")]),
    ("event-wc2018-winner", "events", L("Qui a gagné la Coupe du monde 2018 ?", "Who won the 2018 World Cup?", "¿Quién ganó el Mundial 2018?", "Wer gewann die WM 2018?", "谁赢得了2018年世界杯？"), L("La France", "France", "Francia", "Frankreich", "法国"), [L("La Croatie", "Croatia", "Croacia", "Kroatien", "克罗地亚"), L("Le Brésil", "Brazil", "Brasil", "Brasilien", "巴西")]),
    ("event-wc2014", "events", L("Quel pays a accueilli la Coupe du monde 2014 ?", "Which country hosted the 2014 World Cup?", "¿Qué país acogió el Mundial 2014?", "Welches Land richtete die WM 2014 aus?", "2014年世界杯在哪个国家举办？"), L("Le Brésil", "Brazil", "Brasil", "Brasilien", "巴西"), [L("L'Afrique du Sud", "South Africa", "Sudáfrica", "Südafrika", "南非"), L("L'Allemagne", "Germany", "Alemania", "Deutschland", "德国")]),
    ("event-wc2010", "events", L("Quel pays a accueilli la Coupe du monde 2010 ?", "Which country hosted the 2010 World Cup?", "¿Qué país acogió el Mundial 2010?", "Welches Land richtete die WM 2010 aus?", "2010年世界杯在哪个国家举办？"), L("L'Afrique du Sud", "South Africa", "Sudáfrica", "Südafrika", "南非"), [L("Le Brésil", "Brazil", "Brasil", "Brasilien", "巴西"), L("Le Japon", "Japan", "Japón", "Japan", "日本")]),
    ("event-wc1998", "events", L("Quel pays a accueilli et gagné la Coupe du monde 1998 ?", "Which country hosted and won the 1998 World Cup?", "¿Qué país acogió y ganó el Mundial 1998?", "Welches Land richtete die WM 1998 aus und gewann sie?", "哪个国家举办并赢得了1998年世界杯？"), L("La France", "France", "Francia", "Frankreich", "法国"), [L("Le Brésil", "Brazil", "Brasil", "Brasilien", "巴西"), L("L'Italie", "Italy", "Italia", "Italien", "意大利")]),
    ("event-wc1930", "events", L("Où a eu lieu la première Coupe du monde de football ?", "Where was the first FIFA World Cup held?", "¿Dónde fue el primer Mundial de fútbol?", "Wo fand die erste Fußball-WM statt?", "第一届足球世界杯在哪里举办？"), L("En Uruguay", "Uruguay", "Uruguay", "Uruguay", "乌拉圭"), [L("Au Brésil", "Brazil", "Brasil", "Brasilien", "巴西"), L("En Italie", "Italy", "Italia", "Italien", "意大利")]),
    ("event-olympics2024", "events", L("Quelle ville a accueilli les Jeux olympiques d'été 2024 ?", "Which city hosted the 2024 Summer Olympics?", "¿Qué ciudad acogió los Juegos Olímpicos de verano 2024?", "Welche Stadt richtete die Olympischen Sommerspiele 2024 aus?", "2024年夏季奥运会在哪座城市举办？"), S("Paris"), [S("Tokyo"), S("Los Angeles")]),
    ("event-olympics2021", "events", L("Quelle ville a accueilli les Jeux olympiques d'été reportés à 2021 ?", "Which city hosted the Summer Olympics postponed to 2021?", "¿Qué ciudad acogió los Juegos de verano aplazados a 2021?", "Welche Stadt richtete die auf 2021 verschobenen Sommerspiele aus?", "推迟到2021年的夏季奥运会在哪座城市举办？"), S("Tokyo"), [S("Paris"), S("Beijing")]),
    ("event-olympics2016", "events", L("Quelle ville a accueilli les Jeux olympiques de 2016 ?", "Which city hosted the 2016 Olympics?", "¿Qué ciudad acogió los Juegos de 2016?", "Welche Stadt richtete die Spiele 2016 aus?", "2016年奥运会在哪座城市举办？"), S("Rio de Janeiro"), [S("London"), S("Athens")]),
    ("event-olympics2008", "events", L("Quelle ville a accueilli les Jeux olympiques de 2008 ?", "Which city hosted the 2008 Olympics?", "¿Qué ciudad acogió los Juegos de 2008?", "Welche Stadt richtete die Spiele 2008 aus?", "2008年奥运会在哪座城市举办？"), S("Beijing"), [S("Sydney"), S("Seoul")]),
    ("event-euro2024", "events", L("Quel pays a accueilli l'Euro de football 2024 ?", "Which country hosted Euro 2024?", "¿Qué país acogió la Eurocopa 2024?", "Welches Land richtete die EM 2024 aus?", "2024年欧洲足球锦标赛在哪个国家举办？"), L("L'Allemagne", "Germany", "Alemania", "Deutschland", "德国"), [L("La France", "France", "Francia", "Frankreich", "法国"), L("L'Italie", "Italy", "Italia", "Italien", "意大利")]),
    ("event-titanic", "events", L("En quelle année le Titanic a-t-il coulé ?", "In which year did the Titanic sink?", "¿En qué año se hundió el Titanic?", "In welchem Jahr sank die Titanic?", "泰坦尼克号哪一年沉没？"), S("1912"), [S("1905"), S("1920")]),
    ("event-ww2", "events", L("En quelle année s'est achevée la Seconde Guerre mondiale en Europe ?", "In which year did the Second World War end in Europe?", "¿En qué año terminó la Segunda Guerra Mundial en Europa?", "In welchem Jahr endete der Zweite Weltkrieg in Europa?", "第二次世界大战在欧洲哪一年结束？"), S("1945"), [S("1944"), S("1946")]),
    ("event-mandela", "events", L("En quelle année Nelson Mandela a-t-il été libéré ?", "In which year was Nelson Mandela released?", "¿En qué año fue liberado Nelson Mandela?", "In welchem Jahr wurde Nelson Mandela freigelassen?", "纳尔逊·曼德拉哪一年获释？"), S("1990"), [S("1994"), S("1986")]),
    ("science-mercury", "science", L("Quelle planète est la plus proche du Soleil ?", "Which planet is closest to the Sun?", "¿Qué planeta está más cerca del Sol?", "Welcher Planet ist der Sonne am nächsten?", "哪颗行星离太阳最近？"), L("Mercure", "Mercury", "Mercurio", "Merkur", "水星"), [L("Vénus", "Venus", "Venus", "Venus", "金星"), L("Mars", "Mars", "Marte", "Mars", "火星")]),
    ("science-jupiter", "science", L("Quelle est la plus grande planète du Système solaire ?", "What is the largest planet in the Solar System?", "¿Cuál es el planeta más grande del Sistema Solar?", "Was ist der größte Planet des Sonnensystems?", "太阳系最大的行星是哪颗？"), L("Jupiter", "Jupiter", "Júpiter", "Jupiter", "木星"), [L("Saturne", "Saturn", "Saturno", "Saturn", "土星"), L("Neptune", "Neptune", "Neptuno", "Neptun", "海王星")]),
    ("science-mars", "science", L("Quelle planète est appelée la planète rouge ?", "Which planet is called the red planet?", "¿Qué planeta se llama el planeta rojo?", "Welcher Planet heißt der rote Planet?", "哪颗行星被称为红色行星？"), L("Mars", "Mars", "Marte", "Mars", "火星"), [L("Vénus", "Venus", "Venus", "Venus", "金星"), L("Mercure", "Mercury", "Mercurio", "Merkur", "水星")]),
    ("science-planets", "science", L("Combien de planètes compte le Système solaire ?", "How many planets are in the Solar System?", "¿Cuántos planetas tiene el Sistema Solar?", "Wie viele Planeten hat das Sonnensystem?", "太阳系有多少颗行星？"), S("8"), [S("9"), S("7")]),
    ("science-water", "science", L("Quelle est la formule chimique de l'eau ?", "What is the chemical formula of water?", "¿Cuál es la fórmula química del agua?", "Wie lautet die chemische Formel von Wasser?", "水的化学式是什么？"), S("H2O"), [S("CO2"), S("O2")]),
    ("science-bones", "science", L("Combien d'os compte environ un squelette humain adulte ?", "About how many bones are in an adult human skeleton?", "¿Cuántos huesos tiene aproximadamente un esqueleto humano adulto?", "Wie viele Knochen hat ein erwachsenes menschliches Skelett ungefähr?", "成年人体大约有多少块骨头？"), S("206"), [S("186"), S("256")]),
    ("science-dna", "science", L("Quelle forme a la molécule d'ADN ?", "What shape is the DNA molecule?", "¿Qué forma tiene la molécula de ADN?", "Welche Form hat das DNA-Molekül?", "DNA分子是什么形状？"), L("Une double hélice", "A double helix", "Una doble hélice", "Eine Doppelhelix", "双螺旋"), [L("Un cercle simple", "A single circle", "Un círculo simple", "Ein einfacher Kreis", "单环"), L("Un cube", "A cube", "Un cubo", "Ein Würfel", "立方体")]),
    ("science-oxygen", "science", L("Quel gaz les plantes libèrent-elles pendant la photosynthèse ?", "Which gas do plants release during photosynthesis?", "¿Qué gas liberan las plantas durante la fotosíntesis?", "Welches Gas geben Pflanzen bei der Photosynthese ab?", "植物光合作用释放什么气体？"), L("L'oxygène", "Oxygen", "Oxígeno", "Sauerstoff", "氧气"), [L("Le dioxyde de carbone", "Carbon dioxide", "Dióxido de carbono", "Kohlenstoffdioxid", "二氧化碳"), L("L'azote", "Nitrogen", "Nitrógeno", "Stickstoff", "氮气")]),
    ("science-moon", "science", L("Quel est le satellite naturel de la Terre ?", "What is Earth's natural satellite?", "¿Cuál es el satélite natural de la Tierra?", "Was ist der natürliche Satellit der Erde?", "地球的天然卫星是什么？"), L("La Lune", "The Moon", "La Luna", "Der Mond", "月球"), [L("Mars", "Mars", "Marte", "Mars", "火星"), L("Vénus", "Venus", "Venus", "Venus", "金星")]),
    ("science-boil", "science", L("À quelle température l'eau bout-elle au niveau de la mer ?", "At what temperature does water boil at sea level?", "¿A qué temperatura hierve el agua al nivel del mar?", "Bei welcher Temperatur kocht Wasser auf Meereshöhe?", "海平面上水的沸点是多少？"), S("100 °C"), [S("90 °C"), S("80 °C")]),
    ("science-fleming", "science", L("Qui a découvert la pénicilline ?", "Who discovered penicillin?", "¿Quién descubrió la penicilina?", "Wer entdeckte das Penicillin?", "谁发现了青霉素？"), S("Alexander Fleming"), [S("Louis Pasteur"), S("Marie Curie")]),
    ("science-einstein", "science", L("Qui a formulé la théorie de la relativité ?", "Who formulated the theory of relativity?", "¿Quién formuló la teoría de la relatividad?", "Wer formulierte die Relativitätstheorie?", "谁提出了相对论？"), S("Albert Einstein"), [S("Isaac Newton"), S("Niels Bohr")]),
    ("science-heart", "science", L("Quel organe pompe le sang ?", "Which organ pumps blood?", "¿Qué órgano bombea la sangre?", "Welches Organ pumpt das Blut?", "哪个器官泵送血液？"), L("Le cœur", "The heart", "El corazón", "Das Herz", "心脏"), [L("Le poumon", "The lung", "El pulmón", "Die Lunge", "肺"), L("Le foie", "The liver", "El hígado", "Die Leber", "肝脏")]),
    ("science-saturn", "science", L("Quelle planète est célèbre pour ses anneaux ?", "Which planet is famous for its rings?", "¿Qué planeta es famoso por sus anillos?", "Welcher Planet ist für seine Ringe berühmt?", "哪颗行星以光环闻名？"), L("Saturne", "Saturn", "Saturno", "Saturn", "土星"), [L("Mars", "Mars", "Marte", "Mars", "火星"), L("Mercure", "Mercury", "Mercurio", "Merkur", "水星")]),
    ("science-chromosomes", "science", L("Combien de chromosomes possède une cellule humaine typique ?", "How many chromosomes does a typical human cell have?", "¿Cuántos cromosomas tiene una célula humana típica?", "Wie viele Chromosomen hat eine typische menschliche Zelle?", "典型人体细胞有多少条染色体？"), S("46"), [S("23"), S("48")]),
    ("science-vitamin-d", "science", L("Quelle vitamine la peau aide-t-elle à produire au soleil ?", "Which vitamin does the skin help produce in sunlight?", "¿Qué vitamina ayuda a producir la piel con el sol?", "Welches Vitamin hilft die Haut in der Sonne zu bilden?", "皮肤在阳光下帮助产生哪种维生素？"), S("D"), [S("C"), S("B12")]),
    ("science-venus", "science", L("Quelle planète est souvent appelée l'étoile du berger ?", "Which planet is often called the evening star?", "¿Qué planeta se llama a menudo el lucero?", "Welcher Planet wird oft Abendstern genannt?", "哪颗行星常被称为昏星？"), L("Vénus", "Venus", "Venus", "Venus", "金星"), [L("Mars", "Mars", "Marte", "Mars", "火星"), L("Jupiter", "Jupiter", "Júpiter", "Jupiter", "木星")]),
    ("science-nitrogen", "science", L("Quel gaz est le plus abondant dans l'air ?", "Which gas is most abundant in the air?", "¿Qué gas es el más abundante en el aire?", "Welches Gas ist in der Luft am häufigsten?", "空气中含量最多的气体是什么？"), L("L'azote", "Nitrogen", "Nitrógeno", "Stickstoff", "氮气"), [L("L'oxygène", "Oxygen", "Oxígeno", "Sauerstoff", "氧气"), L("Le dioxyde de carbone", "Carbon dioxide", "Dióxido de carbono", "Kohlenstoffdioxid", "二氧化碳")]),
    ("science-vacuum", "science", L("Le son peut-il voyager dans le vide ?", "Can sound travel through a vacuum?", "¿Puede el sonido viajar en el vacío?", "Kann Schall durch ein Vakuum reisen?", "声音能在真空中传播吗？"), L("Non", "No", "No", "Nein", "不能"), [L("Oui", "Yes", "Sí", "Ja", "能"), L("Seulement la nuit", "Only at night", "Solo de noche", "Nur nachts", "只有夜里可以")]),
    ("science-lightyear", "science", L("Une année-lumière sert à mesurer quoi ?", "What does a light-year measure?", "¿Qué mide un año luz?", "Was misst ein Lichtjahr?", "光年用来衡量什么？"), L("Une distance", "A distance", "Una distancia", "Eine Entfernung", "距离"), [L("Un temps", "A time", "Un tiempo", "Eine Zeit", "时间"), L("Une température", "A temperature", "Una temperatura", "Eine Temperatur", "温度")]),
    ("nature-whale", "nature", L("Quel est le plus grand animal de la Terre ?", "What is the largest animal on Earth?", "¿Cuál es el animal más grande de la Tierra?", "Was ist das größte Tier der Erde?", "地球上最大的动物是什么？"), L("La baleine bleue", "The blue whale", "La ballena azul", "Der Blauwal", "蓝鲸"), [L("L'éléphant d'Afrique", "The African elephant", "El elefante africano", "Der Afrikanische Elefant", "非洲象"), L("Le grand requin blanc", "The great white shark", "El gran tiburón blanco", "Der Weiße Hai", "大白鲨")]),
    ("nature-giraffe", "nature", L("Quel animal terrestre est le plus grand en hauteur ?", "Which land animal is the tallest?", "¿Qué animal terrestre es el más alto?", "Welches Landtier ist das höchste?", "哪种陆生动物最高？"), L("La girafe", "The giraffe", "La jirafa", "Die Giraffe", "长颈鹿"), [L("L'éléphant", "The elephant", "El elefante", "Der Elefant", "大象"), L("L'autruche", "The ostrich", "El avestruz", "Der Strauß", "鸵鸟")]),
    ("nature-cheetah", "nature", L("Quel animal terrestre est le plus rapide ?", "Which land animal is the fastest?", "¿Qué animal terrestre es el más rápido?", "Welches Landtier ist das schnellste?", "哪种陆生动物跑得最快？"), L("Le guépard", "The cheetah", "El guepardo", "Der Gepard", "猎豹"), [L("Le lion", "The lion", "El león", "Der Löwe", "狮子"), L("Le cheval", "The horse", "El caballo", "Das Pferd", "马")]),
    ("nature-pacific", "nature", L("Quel est le plus grand océan ?", "What is the largest ocean?", "¿Cuál es el océano más grande?", "Was ist der größte Ozean?", "最大的海洋是哪个？"), L("L'océan Pacifique", "The Pacific Ocean", "El océano Pacífico", "Der Pazifische Ozean", "太平洋"), [L("L'océan Atlantique", "The Atlantic Ocean", "El océano Atlántico", "Der Atlantische Ozean", "大西洋"), L("L'océan Indien", "The Indian Ocean", "El océano Índico", "Der Indische Ozean", "印度洋")]),
    ("nature-sahara", "nature", L("Quel est le plus grand désert chaud du monde ?", "What is the largest hot desert in the world?", "¿Cuál es el desierto cálido más grande del mundo?", "Was ist die größte heiße Wüste der Welt?", "世界上最大的热沙漠是哪个？"), L("Le Sahara", "The Sahara", "El Sáhara", "Die Sahara", "撒哈拉"), [L("Le Gobi", "The Gobi", "El Gobi", "Die Gobi", "戈壁"), L("Le Kalahari", "The Kalahari", "El Kalahari", "Die Kalahari", "卡拉哈里")]),
    ("nature-amazon", "nature", L("Quelle est la plus grande forêt tropicale ?", "What is the largest tropical rainforest?", "¿Cuál es la mayor selva tropical?", "Was ist der größte tropische Regenwald?", "最大的热带雨林是哪里？"), L("L'Amazonie", "The Amazon", "La Amazonia", "Das Amazonasgebiet", "亚马逊"), [L("Le Congo", "The Congo", "El Congo", "Der Kongo", "刚果"), L("Bornéo", "Borneo", "Borneo", "Borneo", "婆罗洲")]),
    ("nature-nile", "nature", L("Quel fleuve traverse l'Égypte ?", "Which river flows through Egypt?", "¿Qué río atraviesa Egipto?", "Welcher Fluss fließt durch Ägypten?", "哪条河流经埃及？"), L("Le Nil", "The Nile", "El Nilo", "Der Nil", "尼罗河"), [L("Le Niger", "The Niger", "El Níger", "Der Niger", "尼日尔河"), L("Le Congo", "The Congo", "El Congo", "Der Kongo", "刚果河")]),
    ("nature-bee", "nature", L("Quel insecte fabrique le miel ?", "Which insect makes honey?", "¿Qué insecto fabrica la miel?", "Welches Insekt macht Honig?", "哪种昆虫酿造蜂蜜？"), L("L'abeille", "The bee", "La abeja", "Die Biene", "蜜蜂"), [L("La guêpe", "The wasp", "La avispa", "Die Wespe", "黄蜂"), L("Le papillon", "The butterfly", "La mariposa", "Der Schmetterling", "蝴蝶")]),
    ("nature-bat", "nature", L("Quel est le seul mammifère capable de voler vraiment ?", "What is the only mammal that can truly fly?", "¿Cuál es el único mamífero que vuela de verdad?", "Was ist das einzige Säugetier, das wirklich fliegen kann?", "唯一真正会飞的哺乳动物是什么？"), L("La chauve-souris", "The bat", "El murciélago", "Die Fledermaus", "蝙蝠"), [L("L'écureuil volant", "The flying squirrel", "La ardilla voladora", "Das Flughörnchen", "鼯鼠"), L("Le pingouin", "The penguin", "El pingüino", "Der Pinguin", "企鹅")]),
    ("nature-spider", "nature", L("Combien de pattes a une araignée ?", "How many legs does a spider have?", "¿Cuántas patas tiene una araña?", "Wie viele Beine hat eine Spinne?", "蜘蛛有几条腿？"), S("8"), [S("6"), S("10")]),
    ("nature-insect", "nature", L("Combien de pattes a un insecte ?", "How many legs does an insect have?", "¿Cuántas patas tiene un insecto?", "Wie viele Beine hat ein Insekt?", "昆虫有几条腿？"), S("6"), [S("8"), S("4")]),
    ("nature-polar", "nature", L("Où vit l'ours blanc des glaces ?", "Where does the white ice bear live?", "¿Dónde vive el oso blanco de los hielos?", "Wo lebt der weiße Eisbär?", "白熊主要生活在哪里？"), L("Dans l'Arctique", "In the Arctic", "En el Ártico", "In der Arktis", "北极"), [L("En Antarctique", "In Antarctica", "En la Antártida", "In der Antarktis", "南极"), L("Dans le Sahara", "In the Sahara", "En el Sáhara", "In der Sahara", "撒哈拉")]),
    ("nature-emperor", "nature", L("Où vivent les manchots empereurs ?", "Where do emperor penguins live?", "¿Dónde viven los pingüinos emperador?", "Wo leben Kaiserpinguine?", "帝企鹅生活在哪里？"), L("En Antarctique", "In Antarctica", "En la Antártida", "In der Antarktis", "南极"), [L("Dans l'Arctique", "In the Arctic", "En el Ártico", "In der Arktis", "北极"), L("En Australie", "In Australia", "En Australia", "In Australien", "澳大利亚")]),
    ("nature-koala", "nature", L("Que mange principalement le koala ?", "What does the koala mainly eat?", "¿Qué come principalmente el koala?", "Was frisst der Koala hauptsächlich?", "考拉主要吃什么？"), L("Des feuilles d'eucalyptus", "Eucalyptus leaves", "Hojas de eucalipto", "Eukalyptusblätter", "桉树叶"), [L("Du bambou", "Bamboo", "Bambú", "Bambus", "竹子"), L("Du poisson", "Fish", "Pescado", "Fisch", "鱼")]),
    ("nature-camel", "nature", L("Que stocke surtout la bosse du chameau ?", "What does a camel's hump mainly store?", "¿Qué almacena sobre todo la joroba del camello?", "Was speichert der Höcker des Kamels vor allem?", "骆驼的驼峰主要储存什么？"), L("De la graisse", "Fat", "Grasa", "Fett", "脂肪"), [L("De l'eau", "Water", "Agua", "Wasser", "水"), L("Du sable", "Sand", "Arena", "Sand", "沙子")]),
    ("nature-octopus", "nature", L("Combien de cœurs a une pieuvre ?", "How many hearts does an octopus have?", "¿Cuántos corazones tiene un pulpo?", "Wie viele Herzen hat ein Oktopus?", "章鱼有几颗心脏？"), S("3"), [S("1"), S("2")]),
    ("nature-bamboo", "nature", L("Le bambou est surtout classé parmi quoi ?", "Bamboo is mainly classified as what?", "¿El bambú se clasifica sobre todo como qué?", "Als was wird Bambus vor allem eingeordnet?", "竹子主要属于哪一类？"), L("Une herbe", "A grass", "Una hierba", "Ein Gras", "草"), [L("Un arbre", "A tree", "Un árbol", "Ein Baum", "树"), L("Une fougère", "A fern", "Un helecho", "Ein Farn", "蕨类")]),
    ("nature-baobab", "nature", L("Le baobab est surtout un arbre de quel continent ?", "The baobab is mainly a tree of which continent?", "¿El baobab es sobre todo un árbol de qué continente?", "Der Baobab ist vor allem ein Baum welchen Kontinents?", "猴面包树主要生长在哪个大洲？"), L("L'Afrique", "Africa", "África", "Afrika", "非洲"), [L("L'Europe", "Europe", "Europa", "Europa", "欧洲"), L("L'Antarctique", "Antarctica", "La Antártida", "Die Antarktis", "南极洲")]),
    ("nature-beaver", "nature", L("Quel animal construit des barrages avec des branches ?", "Which animal builds dams with branches?", "¿Qué animal construye presas con ramas?", "Welches Tier baut Dämme aus Ästen?", "哪种动物用树枝筑坝？"), L("Le castor", "The beaver", "El castor", "Der Biber", "河狸"), [L("La loutre", "The otter", "La nutria", "Der Otter", "水獭"), L("Le ragondin", "The coypu", "El coipo", "Die Nutria", "海狸鼠")]),
    ("nature-coral", "nature", L("Un récif de corail est surtout formé par quoi ?", "A coral reef is mainly formed by what?", "¿Un arrecife de coral está formado sobre todo por qué?", "Ein Korallenriff wird vor allem von was gebildet?", "珊瑚礁主要由什么形成？"), L("Des animaux", "Animals", "Animales", "Tieren", "动物"), [L("Des roches seules", "Rocks alone", "Solo rocas", "Nur Gestein", "单独的岩石"), L("Des algues mortes", "Dead algae", "Algas muertas", "Toten Algen", "死去的藻类")]),
    ("nature-chameleon", "nature", L("Quel reptile est connu pour changer de couleur ?", "Which reptile is known for changing color?", "¿Qué reptil es conocido por cambiar de color?", "Welches Reptil ist dafür bekannt, die Farbe zu wechseln?", "哪种爬行动物以变色闻名？"), L("Le caméléon", "The chameleon", "El camaleón", "Das Chamäleon", "变色龙"), [L("Le crocodile", "The crocodile", "El cocodrilo", "Das Krokodil", "鳄鱼"), L("La tortue", "The turtle", "La tortuga", "Die Schildkröte", "乌龟")]),
    ("nature-elephant", "nature", L("Quel est le plus grand animal terrestre ?", "What is the largest land animal?", "¿Cuál es el animal terrestre más grande?", "Was ist das größte Landtier?", "最大的陆生动物是什么？"), L("L'éléphant d'Afrique", "The African elephant", "El elefante africano", "Der Afrikanische Elefant", "非洲象"), [L("Le rhinocéros", "The rhinoceros", "El rinoceronte", "Das Nashorn", "犀牛"), L("L'hippopotame", "The hippopotamus", "El hipopótamo", "Das Flusspferd", "河马")]),
]

# Fix the accidental bad expressions in QUIZ by rebuilding those three entries cleanly below if needed.
QUIZ = [item for item in QUIZ if isinstance(item[2], dict) and isinstance(item[3], dict) and isinstance(item[4], list) and all(isinstance(w, dict) for w in item[4])]

RIDDLES = [
    ("riddle-fire", L("Je grandis si on me nourrit et je meurs si on me donne de l'eau. Qui suis-je ?", "I grow when fed and die if given water. What am I?", "Crezco si me alimentan y muero si me dan agua. ¿Qué soy?", "Ich wachse, wenn man mich füttert, und sterbe, wenn man mir Wasser gibt. Was bin ich?", "喂我我就变大，给我水我就熄灭。我是什么？"), L("Le feu", "Fire", "El fuego", "Das Feuer", "火")),
    ("riddle-breath", L("Je suis léger, pourtant tu ne peux pas me retenir longtemps. Qui suis-je ?", "I am light, yet you cannot hold me for long. What am I?", "Soy ligero, pero no puedes retenerme mucho tiempo. ¿Qué soy?", "Ich bin leicht, doch du kannst mich nicht lange halten. Was bin ich?", "我很轻，你却不能长久抓住我。我是什么？"), L("Le souffle", "Breath", "El aliento", "Der Atem", "呼吸")),
    ("riddle-road", L("Je traverse villes et champs, mais je ne bouge jamais. Qui suis-je ?", "I cross towns and fields, but I never move. What am I?", "Atravieso pueblos y campos, pero nunca me muevo. ¿Qué soy?", "Ich durchquere Städte und Felder, bewege mich aber nie. Was bin ich?", "我穿过城镇和田野，自己却不动。我是什么？"), L("Une route", "A road", "Un camino", "Eine Straße", "路")),
    ("riddle-riverbed", L("J'ai un lit, mais je ne dors jamais. Qui suis-je ?", "I have a bed, but I never sleep. What am I?", "Tengo una cama, pero nunca duermo. ¿Qué soy?", "Ich habe ein Bett, aber ich schlafe nie. Was bin ich?", "我有床，却从不睡觉。我是什么？"), L("Une rivière", "A river", "Un río", "Ein Fluss", "河")),
    ("riddle-fence", L("Je fais le tour du jardin sans me déplacer. Qui suis-je ?", "I go around the garden without moving. What am I?", "Rodeo el jardín sin moverme. ¿Qué soy?", "Ich umrunde den Garten, ohne mich zu bewegen. Was bin ich?", "我绕着花园一圈，自己却不移动。我是什么？"), L("Une clôture", "A fence", "Una valla", "Ein Zaun", "篱笆")),
    ("riddle-battery", L("Je ne suis pas vivant, et pourtant je peux mourir. Qui suis-je ?", "I am not alive, yet I can die. What am I?", "No estoy vivo, y aun así puedo morir. ¿Qué soy?", "Ich lebe nicht, und doch kann ich sterben. Was bin ich?", "我不是活的，却会耗尽。我是什么？"), L("Une pile", "A battery", "Una pila", "Eine Batterie", "电池")),
    ("riddle-photo", L("On me prend avant de m'avoir. Qui suis-je ?", "People take me before they have me. What am I?", "Me toman antes de tenerme. ¿Qué soy?", "Man nimmt mich, bevor man mich hat. Was bin ich?", "人们先拍下我，然后才拥有我。我是什么？"), L("Une photo", "A photograph", "Una foto", "Ein Foto", "照片")),
    ("riddle-shirt", L("J'ai un col, pas de tête, deux manches et pas de mains. Qui suis-je ?", "I have a collar, no head, two sleeves and no hands. What am I?", "Tengo cuello, no cabeza, dos mangas y ninguna mano. ¿Qué soy?", "Ich habe einen Kragen, keinen Kopf, zwei Ärmel und keine Hände. Was bin ich?", "我有领子没有头，有袖子没有手。我是什么？"), L("Une chemise", "A shirt", "Una camisa", "Ein Hemd", "衬衫")),
    ("riddle-mountain", L("J'ai des racines que personne ne voit et je dépasse les arbres, sans grandir. Qui suis-je ?", "I have roots nobody sees and I rise above the trees, without growing. What am I?", "Tengo raíces que nadie ve y supero a los árboles, sin crecer. ¿Qué soy?", "Ich habe Wurzeln, die niemand sieht, und ich rage über die Bäume, ohne zu wachsen. Was bin ich?", "我有无人看见的根，高过树木，却不生长。我是什么？"), L("Une montagne", "A mountain", "Una montaña", "Ein Berg", "山")),
    ("riddle-rhino", L("J'ai une corne et je ne joue pas de musique. Qui suis-je ?", "I have a horn and I do not play music. What am I?", "Tengo un cuerno y no toco música. ¿Qué soy?", "Ich habe ein Horn und spiele keine Musik. Was bin ich?", "我有一只角，却不演奏音乐。我是什么？"), L("Un rhinocéros", "A rhinoceros", "Un rinoceronte", "Ein Nashorn", "犀牛")),
    ("riddle-snow", L("Je suis blanc, je tombe du ciel et je ne me blesse pas. Qui suis-je ?", "I am white, I fall from the sky, and I do not get hurt. What am I?", "Soy blanco, caigo del cielo y no me lastimo. ¿Qué soy?", "Ich bin weiß, falle vom Himmel und verletze mich nicht. Was bin ich?", "我是白的，从天上落下，自己却不会受伤。我是什么？"), L("La neige", "Snow", "La nieve", "Der Schnee", "雪")),
    ("riddle-clock", L("J'ai un visage et deux aiguilles, mais pas de bras. Qui suis-je ?", "I have a face and two hands, but no arms. What am I?", "Tengo una esfera y dos manecillas, pero ningún brazo. ¿Qué soy?", "Ich habe ein Zifferblatt und zwei Zeiger, aber keine Arme. Was bin ich?", "我有一张脸和两根指针，却没有手臂。我是什么？"), L("Une horloge", "A clock", "Un reloj", "Eine Uhr", "钟")),
    ("riddle-stars", L("On me voit la nuit et je me cache le jour. Qui suis-je ?", "You see me at night and I hide by day. What am I?", "Me ves de noche y me escondo de día. ¿Qué soy?", "Du siehst mich nachts, und tags verstecke ich mich. Was bin ich?", "夜里能看见我，白天我躲起来。我是什么？"), L("Les étoiles", "The stars", "Las estrellas", "Die Sterne", "星星")),
    ("riddle-mind", L("Plus on m'utilise, plus je deviens vif. Qui suis-je ?", "The more you use me, the sharper I become. What am I?", "Cuanto más me usas, más ágil me vuelvo. ¿Qué soy?", "Je mehr du mich benutzt, desto wacher werde ich. Was bin ich?", "你越用我，我就越灵敏。我是什么？"), L("L'esprit", "The mind", "La mente", "Der Verstand", "头脑")),
    ("riddle-ice", L("Je suis de l'eau devenue dure. Qui suis-je ?", "I am water that has become hard. What am I?", "Soy agua que se ha vuelto dura. ¿Qué soy?", "Ich bin Wasser, das hart geworden ist. Was bin ich?", "我是变硬的水。我是什么？"), L("La glace", "Ice", "El hielo", "Das Eis", "冰")),
    ("riddle-wind", L("Tu me sens, tu ne me vois pas, et je fais bouger les arbres. Qui suis-je ?", "You feel me, you cannot see me, and I move the trees. What am I?", "Me sientes, no me ves y muevo los árboles. ¿Qué soy?", "Du spürst mich, siehst mich nicht, und ich bewege die Bäume. Was bin ich?", "你感觉到我，看不见我，我还能吹动树木。我是什么？"), L("Le vent", "The wind", "El viento", "Der Wind", "风")),
    ("riddle-seed", L("Je suis petit, je me cache dans la terre, et un arbre peut sortir de moi. Qui suis-je ?", "I am small, I hide in the earth, and a tree can come from me. What am I?", "Soy pequeño, me escondo en la tierra y de mí puede salir un árbol. ¿Qué soy?", "Ich bin klein, verstecke mich in der Erde, und aus mir kann ein Baum werden. Was bin ich?", "我很小，藏在土里，一棵树可以从我这里长出。我是什么？"), L("Une graine", "A seed", "Una semilla", "Ein Samen", "种子")),
    ("riddle-bridge", L("Je laisse passer les gens au-dessus de l'eau sans les mouiller. Qui suis-je ?", "I let people cross above the water without getting wet. What am I?", "Dejo pasar a la gente sobre el agua sin mojarla. ¿Qué soy?", "Ich lasse Menschen über das Wasser gehen, ohne dass sie nass werden. Was bin ich?", "我让人从水上过去，却不把他们打湿。我是什么？"), L("Un pont", "A bridge", "Un puente", "Eine Brücke", "桥")),
    ("riddle-key", L("J'ouvre une porte, mais je ne suis pas la porte. Qui suis-je ?", "I open a door, but I am not the door. What am I?", "Abro una puerta, pero no soy la puerta. ¿Qué soy?", "Ich öffne eine Tür, aber ich bin nicht die Tür. Was bin ich?", "我能打开门，自己却不是门。我是什么？"), L("Une clé", "A key", "Una llave", "Ein Schlüssel", "钥匙")),
    ("riddle-cloud", "skip"),
]


def clean_quiz():
    fixed = []
    for row in QUIZ:
        if len(row) != 5:
            continue
        item_id, topic, prompt, answer, wrongs = row
        if not isinstance(prompt, dict) or not isinstance(answer, dict):
            continue
        if any(not isinstance(wrong, dict) for wrong in wrongs):
            continue
        fixed.append((item_id, topic, prompt, answer, wrongs))
    return fixed


def add_cloud():
    RIDDLES.append((
        "riddle-cloud",
        L("Je voyage dans le ciel et je peux pleuvoir. Qui suis-je ?", "I travel in the sky and I can rain. What am I?", "Viajo por el cielo y puedo llover. ¿Qué soy?", "Ich ziehe über den Himmel und kann regnen. Was bin ich?", "我在天上旅行，还能落下雨来。我是什么？"),
        L("Un nuage", "A cloud", "Una nube", "Eine Wolke", "云"),
    ))
    RIDDLES.append((
        "riddle-rainbow",
        L("J'apparais quand le soleil et la pluie se rencontrent. Qui suis-je ?", "I appear when sun and rain meet. What am I?", "Aparezco cuando se encuentran el sol y la lluvia. ¿Qué soy?", "Ich erscheine, wenn Sonne und Regen sich treffen. Was bin ich?", "太阳和雨相遇时，我就出现。我是什么？"),
        L("Un arc-en-ciel", "A rainbow", "Un arcoíris", "Ein Regenbogen", "彩虹"),
    ))
    RIDDLES.append((
        "riddle-nest",
        L("Les oiseaux me construisent, et je ne suis pas une maison pour les gens. Qui suis-je ?", "Birds build me, and I am not a house for people. What am I?", "Los pájaros me construyen y no soy una casa para personas. ¿Qué soy?", "Vögel bauen mich, und ich bin kein Haus für Menschen. Was bin ich?", "鸟儿建造我，我却不是给人住的房子。我是什么？"),
        L("Un nid", "A nest", "Un nido", "Ein Nest", "巢"),
    ))
    RIDDLES.append((
        "riddle-salt",
        L("Je viens de la mer et je relève le goût des plats. Qui suis-je ?", "I come from the sea and I strengthen the taste of food. What am I?", "Vengo del mar y realzo el sabor de la comida. ¿Qué soy?", "Ich komme aus dem Meer und verstärke den Geschmack des Essens. Was bin ich?", "我来自大海，能让菜更有味道。我是什么？"),
        L("Le sel", "Salt", "La sal", "Das Salz", "盐"),
    ))
    RIDDLES.append((
        "riddle-ladder",
        L("Je t'aide à monter et je reste là où tu me poses. Qui suis-je ?", "I help you climb and I stay where you put me. What am I?", "Te ayudo a subir y me quedo donde me dejas. ¿Qué soy?", "Ich helfe dir hinauf und bleibe, wo du mich hinstellst. Was bin ich?", "我帮你往上爬，你把我放在哪里我就停在哪里。我是什么？"),
        L("Une échelle", "A ladder", "Una escalera de mano", "Eine Leiter", "梯子"),
    ))
    RIDDLES.append((
        "riddle-drum",
        L("On me frappe et je réponds par un son. Qui suis-je ?", "You strike me and I answer with a sound. What am I?", "Me golpean y respondo con un sonido. ¿Qué soy?", "Man schlägt mich, und ich antworte mit einem Ton. Was bin ich?", "敲我一下，我就发出声音。我是什么？"),
        L("Un tambour", "A drum", "Un tambor", "Eine Trommel", "鼓"),
    ))
    RIDDLES.append((
        "riddle-footprint",
        L("Je montre où tu as marché, et la pluie peut m'effacer. Qui suis-je ?", "I show where you walked, and rain can erase me. What am I?", "Muestro por dónde caminaste y la lluvia puede borrarme. ¿Qué soy?", "Ich zeige, wo du gingst, und Regen kann mich löschen. Was bin ich?", "我显示你走过的地方，雨能把我抹去。我是什么？"),
        L("Une empreinte", "A footprint", "Una huella", "Eine Fußspur", "脚印"),
    ))
    RIDDLES.append((
        "riddle-moonshape",
        L("Je change de forme et j'emprunte ma lumière. Qui suis-je ?", "I change shape and I borrow my light. What am I?", "Cambio de forma y tomo prestada mi luz. ¿Qué soy?", "Ich ändere meine Form und leihe mir mein Licht. Was bin ich?", "我不断改变形状，光也是借来的。我是什么？"),
        L("La Lune", "The Moon", "La Luna", "Der Mond", "月亮"),
    ))


def choices_for(answer, wrongs, seed):
    rng = random.Random(seed)
    columns = [answer, *wrongs[:2]]
    order = [0, 1, 2]
    rng.shuffle(order)
    return {lang: [columns[index][lang] for index in order] for lang in LANGS}


def main():
    add_cloud()
    prompts = json.loads(PROMPTS.read_text())
    answers = json.loads(ANSWERS.read_text())
    existing = {item["id"] for item in prompts["quiz"] + prompts["riddle"]}
    added = 0
    for item_id, topic, prompt, answer, wrongs in clean_quiz():
        if item_id in existing:
            continue
        if any(answer[lang].casefold() in prompt[lang].casefold() and (lang == "zh" or len(answer[lang]) >= 3) for lang in LANGS):
            print("skip leak", item_id)
            continue
        prompts["quiz"].append({
            "id": item_id,
            "topic": topic,
            "prompt": prompt,
            "choices": choices_for(answer, wrongs, item_id),
        })
        answers["items"][item_id] = answer
        existing.add(item_id)
        added += 1
    riddle_rows = [row for row in RIDDLES if row[0] != "riddle-cloud" or True]
    riddle_rows = [row for row in RIDDLES if len(row) == 3]
    # Build choices from other riddle answers after all are known.
    new_riddles = []
    for item_id, prompt, answer in riddle_rows:
        if item_id in existing:
            continue
        if any(answer[lang].casefold() in prompt[lang].casefold() and (lang == "zh" or len(answer[lang]) >= 3) for lang in LANGS):
            print("skip riddle leak", item_id)
            continue
        new_riddles.append((item_id, prompt, answer))
    for index, (item_id, prompt, answer) in enumerate(new_riddles):
        others = [row[2] for i, row in enumerate(new_riddles) if i != index]
        rng = random.Random(item_id)
        rng.shuffle(others)
        wrongs = []
        for candidate in others:
            if any(candidate[lang] == answer[lang] for lang in LANGS):
                continue
            if any(any(candidate[lang] == got[lang] for lang in LANGS) for got in wrongs):
                continue
            wrongs.append(candidate)
            if len(wrongs) == 2:
                break
        if len(wrongs) < 2:
            print("skip riddle choices", item_id)
            continue
        prompts["riddle"].append({
            "id": item_id,
            "topic": "riddle",
            "prompt": prompt,
            "choices": choices_for(answer, wrongs, item_id),
        })
        answers["items"][item_id] = answer
        added += 1
    PROMPTS.write_text(json.dumps(prompts, ensure_ascii=False, separators=(",", ":")))
    ANSWERS.write_text(json.dumps(answers, ensure_ascii=False, separators=(",", ":")))
    print("added", added, "quiz", len(prompts["quiz"]), "riddle", len(prompts["riddle"]))


if __name__ == "__main__":
    main()
