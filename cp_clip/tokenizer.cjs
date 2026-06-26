const fs = require('fs');
const path = require('path');

function ord(c) {
  return c.charCodeAt(0);
}

function range(start, stop, step = 1) {
  if (stop === undefined) {
    stop = start;
    start = 0;
  }
  if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
    return [];
  }
  const result = [];
  for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
    result.push(i);
  }
  return result;
}

function bytesToUnicode() {
  let bs = [
    ...range(ord("!"), ord("~") + 1),
    ...range(ord("¡"), ord("¬") + 1),
    ...range(ord("®"), ord("ÿ") + 1),
  ];
  let cs = bs.slice(0);
  let n = 0;
  for (let b of range(256)) {
    if (!bs.includes(b)) {
      bs.push(b);
      cs.push(256 + n);
      n += 1;
    }
  }
  cs = cs.map(n => String.fromCharCode(n));
  return Object.fromEntries(bs.map((v, i) => [v, cs[i]]));
}

function getPairs(word) {
  let pairs = [];
  let prevChar = word[0];
  for (let char of word.slice(1)) {
    pairs.push([prevChar, char]);
    prevChar = char;
  }
  return pairs;
}

class SimpleTokenizer {
  constructor(mergesText) {
    this.byteEncoder = bytesToUnicode();
    this.byteDecoder = Object.fromEntries(Object.entries(this.byteEncoder).map(([k, v]) => [v, k]));
    
    // Parse merges
    const merges = mergesText.split(/\r?\n/).filter(line => line.trim().length > 0).map(line => line.split(" "));
    
    // Build vocabulary
    let vocab = [
      ...range(ord("!"), ord("~") + 1),
      ...range(ord("¡"), ord("¬") + 1),
      ...range(ord("®"), ord("ÿ") + 1),
    ].map(n => String.fromCharCode(n));
    
    let n = 0;
    for (let b = 0; b < 256; b++) {
      if (!vocab.includes(String.fromCharCode(b))) {
        vocab.push(String.fromCharCode(256 + n));
        n += 1;
      }
    }
    
    vocab = [...vocab, ...vocab.map(v => v + '</w>')];
    for (let merge of merges) {
      vocab.push(merge.join(""));
    }
    vocab.push('<|startoftext|>', '<|endoftext|>');
    
    this.encoder = Object.fromEntries(vocab.map((v, i) => [v, i]));
    this.decoder = Object.fromEntries(Object.entries(this.encoder).map(([k, v]) => [v, k]));
    this.bpeRanks = Object.fromEntries(merges.map((v, i) => [v.join("·😎·"), i]));
    this.cache = { '<|startoftext|>': '<|startoftext|>', '<|endoftext|>': '<|endoftext|>' };
    this.pat = /<\|startoftext\|>|<\|endoftext\|>|'s|'t|'re|'ve|'m|'ll|'d|[\p{L}]+|[\p{N}]|[^\s\p{L}\p{N}]+/gui;
  }

  bpe(token) {
    if (this.cache[token] !== undefined) {
      return this.cache[token];
    }
    let word = [...token.slice(0, -1), token.slice(-1) + '</w>'];
    let pairs = getPairs(word);
    if (pairs.length === 0) {
      return token + '</w>';
    }
    while (true) {
      let bigram = null;
      let minRank = Infinity;
      for (let p of pairs) {
        let r = this.bpeRanks[p.join("·😎·")];
        if (r === undefined) continue;
        if (r < minRank) {
          minRank = r;
          bigram = p;
        }
      }
      if (bigram === null) break;
      let [first, second] = bigram;
      let newWord = [];
      let i = 0;
      while (i < word.length) {
        let j = word.indexOf(first, i);
        if (j === -1) {
          newWord.push(...word.slice(i));
          break;
        }
        newWord.push(...word.slice(i, j));
        i = j;
        if (word[i] === first && i < word.length - 1 && word[i + 1] === second) {
          newWord.push(first + second);
          i += 2;
        } else {
          newWord.push(word[i]);
          i += 1;
        }
      }
      word = newWord;
      if (word.length === 1) break;
      else pairs = getPairs(word);
    }
    word = word.join(" ");
    this.cache[token] = word;
    return word;
  }

  encode(text) {
    let bpeTokens = [];
    text = text.replace(/\s+/g, " ").trim().toLowerCase();
    for (let token of [...text.matchAll(this.pat)].map(m => m[0])) {
      token = [...token].map(c => this.byteEncoder[c.charCodeAt(0)] || c).join("");
      const bpeRes = this.bpe(token);
      bpeTokens.push(...bpeRes.split(' ').map(bpe_token => this.encoder[bpe_token]));
    }
    return bpeTokens;
  }

  encodeForCLIP(text) {
    let tokens = this.encode(text);
    tokens.unshift(49406); // startoftext
    tokens = tokens.slice(0, 76);
    tokens.push(49407); // endoftext
    while (tokens.length < 77) {
      tokens.push(0);
    }
    return tokens;
  }
}

module.exports = {
  SimpleTokenizer
};
