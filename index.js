// 1 App sucht jedes wort eines hier als variable hinzugefügtes text in wikipedia und wiedergibt es mit phonetik in einem html seite.
//beim suchen werden die wörter gleichzeiteig in einem 'abkuerzung' object gespeichert damit jedes wort nur ein mal in wiki gerufen wird
// node sollte aber es geht noch nicht die html seite selber öffen
// 2 Auf der html seite man kan durch select/option das passende Phonetik auswählen wenn der vorschlag falsch ist

const puppeteer = require("puppeteer"); //um an wikipedia ran zu kommen
var fs = require("fs"); //to write files
var http = require("http"); //to start server
var opn = require("opn"); // to open npage

const text = [
  //der text zum umschreiben in Phonetik, jede Seite als trings in array
  // const text = ["Lorsque j’avais six ans.", "J’ai montré mon chef-d’œuvre"];
  // `Lorsque j’avais six ans j’ai vu,
  //  une fois, une magnifique image,
  //  dans un livre sur la forêt vierge qui
  //  s’appelait Histoires vécues.
  //  Ça représentait un serpent boa qui avalait
  //  un fauve. Voilà la copie du dessin. On disait dans le livre:
  //  «Les serpents boas avalent leur proie tout entière, sans la mâcher.
  //  Ensuite ils ne peuvent plus bouger et ils dorment pendant les six mois de leur digestion.»
  //  J’ai alors beaucoup réfléchi sur les aventures de la jungle et, à mon tour, j’ai réussi,
  //  avec un crayon de couleur, à tracer mon premier dessin. Mon dessin numéro 1. Il était comme ça:`,
  // `J’ai montré mon chef-d’œuvre aux grandes personnes et je leur ai demandé si mon dessin leur faisait peur.
  // Elles m’ont répondu: «Pourquoi un chapeau ferait-il peur?» Mon dessin ne représentait pas un chapeau.
  // Il représentait un serpent boa qui digérait un éléphant. J’ai alors dessiné l’intérieur du serpent boa,
  // afin que les grandes personnes puissent comprendre. Elles ont toujours besoin d’explications.
  // Mon dessin numéro 2 était comme ça: Les grandes personnes m’ont conseillé de laisser
  // de côté les dessins de serpents boas ouverts ou fermés, et de m’intéresser plutôt à la géographie,
  // à l’histoire, au calcul et à la grammaire. C’est ainsi que j’ai abandonné, à l’âge de six ans,
  // une magnifique carrière de peintre. J’avais été découragé par l’insuccès de mon dessin numéro 1 et de mon dessin numéro 2.`,

  `Les grandes personnes ne comprennent jamais rien
  toutes seules, et c’est fatigant, pour les enfants, de toujours
  et toujours leur donner des explications …`,
  `J’ai donc dû choisir un autre métier et j’ai appris à piloter
  des avions. J’ai volé un peu partout dans le monde. Et la
  géographie, c’est exact, m’a beaucoup servi. Je savais reconnaître, du premier coup d’œil, la Chine de l’Arizona. C’est
  très utile, si l’on s’est égaré pendant la nuit.`,
  `J’ai ainsi eu, au cours de ma vie, des tas de contacts avec
  des tas de gens sérieux. J’ai beaucoup vécu chez les grandes
  personnes. Je les ai vues de très près. Ça n’a pas trop amélioré mon opinion.
  `,
  `Quand j’en rencontrais une qui me paraissait un peu lucide, je faisais l’expérience sur elle de mon dessin numéro 1
que j’ai toujours conservé. Je voulais savoir si elle était vraiment compréhensive. Mais toujours elle me répondait:
«C’est un chapeau.» Alors je ne lui parlais ni de serpents
boas, ni de forêts vierges, ni d’étoiles. Je me mettais à sa portée. Je lui parlais de bridge, de golf, de politique et de
cravates. Et la grande personne était bien contente de
connaître un homme aussi raisonnable …`,
];

//fuer testing gedacht
const text2 = ["Lorsque j’avais six ans", "une fois, une magnifique image"];

//regex um wörter und zahl und punctuation zuschneiden
const reg = /chef-d’œuvre|[a-zà-ž]+|[:,;.!?:'’«»-]|\d+/gi;

const wordsSingle = []; //wörter oder zahl oder zeichen einzeln als strings in einnem array in einem array pro seite
// [
//     ['wort1', 'wort2'], seite 1
//     ['wort1', 'wort2'], seite 2
// ]

const wordsObject = []; //wörter oder zahl oder zeichen einzeln als object in einnem array in einem array pro seite
//     [
//{        wort: 'wort1',
//         link: 'link wiki wort1',
//         phonetik:'phonetik wort1'},

//{        wort: 'wort2',
//         link: 'link wiki wort 2',
//         phonetik:'phonetik wort 2'},
// ],
//     [ seite 2
//{         wort: 'wort1',
//         link: 'link wiki wort1',
//         phonetik:'phonetik wort1'},

//{        wort: 'wort2',
//         link: 'link wiki wort 2',
//         phonetik:'phonetik wort 2'},
// ]

const abkuerzungen = {
  //einige Wörter die immer wieder kommen und nicht wiki brauchen
  a: {},
  à: { à: ["a"] },

  d: { de: ["də"], des: ["de", "dez"], du: ["dy"] },
  e: { elle: ["ɛl"], elles: ["ɛl", "ɛlz"] },

  i: { il: ["il"], ils: ["il", "ilz"] },
  j: { j: ["ʒ"], je: ["ʒə"] },

  l: { le: ["lə"], la: ["la"], les: ["le", "lez"] },

  n: { nous: ["nu", "nuz"], n: ["n"] },
  o: { on: ["ɔ̃", "ɔ̃n"] },
  p: { pas: ["pa", "paz"] },

  t: { tu: ["ty"] },
  u: { un: ["ɛ̃", "ɛ̃n"], une: ["yn"] },
  v: { vous: ["vu", "vuz"] },
};

function start(arr) {
  console.log("1 start");
  // function macht wordsSingle
  arr.forEach((element) => cutWords(element));
  prepare();
}

function prepare() {
  //baut wordsSingle array zu
  console.log("2 prepare");
  //wordsSingle array to wordsObject array of object
  const arr = wordsSingle;
  console.log("wordsingle");
  console.log(typeof arr);
  console.log(arr.length);

  for (const [key, value] of Object.entries(arr)) {
    //jede seite wird gecheckt
    console.log(key + " " + value);
    const mainSub = []; //werte der seite werden hier hinzugefuegt

    value.map((element, k) => {
      //jedes wort kriegt 3 entries wort, link und phonetik
      const sub = {};
      sub.wort = element;

      //if element starts with letter generate wikilink sonst ist null

      const regOnlyLetters = /[a-zà-ž]/i;
      element[0].match(regOnlyLetters)
        ? (sub.link = "https://fr.wiktionary.org/wiki/" + element.toLowerCase())
        : (sub.link = null);

      sub.phonetik = ""; // platzhalter

      mainSub.push(sub); //jedes wort wird zu der seite hinzugefuegt
    }, wordsObject.push(mainSub)); //jedes seite wird zu der object hinzugefuegt
  }

  console.log("wordsObject");
  console.log(wordsObject);

  lookUp();
}

// auf die wiki seite gehen und phonetik abkopieren und in abkurzungen speichern oder einfach von abkuerzungen ablesen
async function lookUp() {
  console.log("3 lookup");
  const arr = wordsObject;
  for (var j = 0; j < arr.length; j++) {
    //jede seite
    console.log("######################### seite: " + j);
    for (let i = 0; i < arr[j].length; i++) {
      if (arr[j][i].link !== null) {
        //if not symbol or number es hat link in wiki oder eintragin abkuerzung
        let myfonetik = "";
        let str = arr[j][i].wort.toLowerCase();
        let letter = str.charAt(0);

        console.log(
          "**************************************WORKING ON letter: " +
            letter +
            " wort: " +
            str +
            " **************************+"
        );

        //das ergibt kein SINN??
        console.log(typeof abkuerzungen[letter]); //object
        console.log(typeof abkuerzungen.letter); //undefined
        console.log(typeof abkuerzungen.j); //objet

        if (typeof abkuerzungen[letter] == "undefined") {
          //wenn abkuerzung kein eintrag hat fuer diesen buchhstab wird s hinzugefügt
          abkuerzungen[letter] = {};
          console.log(
            "-------------------ADDING to abkuerzung___________________________________"
          );
        }
        console.log(
          "typeof abkuerzungen[" +
            letter +
            "][" +
            str +
            "] " +
            typeof abkuerzungen[letter][str]
        );
        if (typeof abkuerzungen[letter][str] !== "undefined") {
          //wenn abkuerzung ein eintrag hat, wird die Phonetik von hier abkopiert
          console.log(str + " IS in abkuerzungen");
          myfonetik = abkuerzungen[letter][str];
        } else {
          console.log(str + " is NOT in abkuerzungen"); //wenn abkuerzung KEIN eintrag hat, wird in wiki gekuckt und das wort in abkuerzung hinzugefuegt
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.goto(arr[j][i].link);
          const fon = await page.evaluate(() => {
            //all die phonetik vorschläge fuer das wort
            return Array.from(document.querySelectorAll(".API")).map(
              (x) => x.textContent
            );
          });

          myfonetik = removeDuplicateAndCharacters(fon); //dupliziert entfernen und komishe characters auch
          abkuerzungen[letter][str] = myfonetik; //in abkuerzung hinzugefuegt
          await browser.close();
        }
        arr[j][i].phonetik = myfonetik;
      }
    }
    console.log("finished arr!!");
    console.log(arr);
    console.log("abkuerzungen");
    console.log(abkuerzungen);
  }

  buildPage();
}

function removeDuplicateAndCharacters(fonArr) {
  console.log("3 A removeDuplicateAndCharacters");
  console.log("..............removeDuplicateCharacters");
  console.log(typeof fonArr + " " + fonArr.length);
  console.log("fonArr start");
  console.log(fonArr);
  let myRegex = /[\\.()'’[\]]/g;
  for (var i = 0; i < fonArr.length; i++) {
    //komische character entfernen

    let x = fonArr[i];
    console.log("x: " + x);

    fonArr[i] = x.replaceAll(myRegex, "");
  }
  fonArr = fonArr.filter((value, index) => fonArr.indexOf(value) === index); //dupliziert entfernen

  //return fonArr;
  return fonArr;
}

function rebuildText() {
  //baut den text fuer die html seite
  console.log("4A rebuildText");
  const arr = wordsObject;
  let html = "";
  for (const [key, value] of Object.entries(arr)) {
    console.log(`${key} ${value.length}`);
    html += "<ul>";
    value.map((x) => {
      console.log("x");
      console.log(x);
      let selects = "";

      if (typeof x.phonetik == "object" && x.phonetik.length > 0) {
        console.log("...........................is array: " + x.phonetik);
        selects += "<select name=" + x.wort + ">";
        x.phonetik.map((val) => {
          selects += '<option value="' + val + '">' + val + "</option>";
        });
        selects += "</select>";
      } else {
        selects += "";
      }

      html +=
        "<li><label for='" +
        x.wort +
        "'>" +
        x.wort +
        "</label>" +
        selects +
        "</li>";
    });
    html += "</ul>";
  }

  return html;
}

function buildPage() {
  //baut eine html seite
  console.log("4 buildPage");

  console.log("rebuilding");

  let head = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="script.js"></script>
    <link rel="stylesheet" href="style.css" />
    <title>Document</title>
</head>
<body>`;

  let footer = `</body>
</html>`;

  let htmlText = rebuildText();
  const myHtml = head + htmlText + footer;

  fs.writeFile("openMe.html", myHtml, function (err) {
    if (err) throw err;
    console.log("Saved!");
    openPageforMe(); // das geht noch nicht
  });
}

function openPageforMe() {
  // console.log("5 openPageforMe");
  // http
  //   .createServer(function (req, res) {
  //     res.read("openMe.html");
  //     res.end(); //end the response
  //   })
  //   .listen(8080);
  //opn("http://sindresorhus.com");
}

// init
start(text);

function cutWords(element) {
  console.log("1A cutWords");
  wordsSingle.push(element.match(reg));
}

// console.log("wordsObject");
// console.log(wordsObject);
