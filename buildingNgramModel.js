// buildNgramModel.js
const fs = require("fs");
const natural = require("natural");
const NGrams = natural.NGrams;

const corpus = fs.readFileSync("corpus.txt", "utf8").toLowerCase();
const tokens = new natural.WordTokenizer().tokenize(corpus);
const trigrams = NGrams.trigrams(tokens);

const trigramMap = {};

trigrams.forEach(([w1, w2, w3]) => {
    const context = `${w1} ${w2}`;
    if (!trigramMap[context]) trigramMap[context] = {};
    trigramMap[context][w3] = (trigramMap[context][w3] || 0) + 1;
});

fs.writeFileSync("trigramMap.json", JSON.stringify(trigramMap, null, 2));
console.log("✅ trigramMap.json created!");
