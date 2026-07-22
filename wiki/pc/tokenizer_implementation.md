# CLIP BPE Tokenizer 纯手工实现详解 (tokenizer.cjs)

本系统采用了一个极简、零依赖的纯原生 JavaScript 实现的 **BPE (Byte Pair Encoding) Tokenizer**。它的主要作用是将用户输入的搜索文本，切割并映射为可以直接送入 MobileCLIP 文本编码器（ONNX）的 Token ID 数组 `[1, 77]`。

采用手工实现而不是引入成熟第三方库（如 `@xenova/transformers`）的原因是：
1. **零外部依赖**：极大减小应用体积，保持 Electron 客户端的轻量化。
2. **纯原生 JS**：免去了引入底层 C++ / Rust 分词库带来的跨平台 ABI 编译报错噩梦，做到“无痛部署”。
3. **原生兼容外语**：由于完全复刻了 OpenAI 的 BPE 逻辑，它对英文及其他拥有相似字母体系的外语支持极其完美，完全契合本系统未来的出海与国际化战略。

---

## 核心工作原理

CLIP 采用的分词机制叫做 **BPE (Byte Pair Encoding)**。它介于“按单词拆分”和“按字母拆分”之间。它通过统计大规模语料库中字母对（Byte Pair）的出现频率，生成一个**合并规则表 (`merges.txt`)**。
在切分陌生单词时，Tokenizer 会查表，将相邻的、在训练集中经常一起出现的碎片合并，直到不能再合并为止。这就使得模型在遇到没见过的生僻词时，也不会直接变成未知的 `[UNK]`，而是将其拆解为几个它认识的 Subword（子词）。

## 代码逐行详细解析

接下来，我们将逐段解析 `cp_clip/tokenizer.cjs` 文件的实现：

### 1. 基础辅助函数

```javascript
const fs = require('fs');
const path = require('path');

// 获取字符的 Unicode 编码值 (ASCII)
function ord(c) {
  return c.charCodeAt(0);
}

// 仿 Python 的 range 函数，用于生成连续的数字数组
function range(start, stop, step = 1) {
  // ...略去边界检查代码
  const result = [];
  for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
    result.push(i);
  }
  return result;
}
```
**解析**：纯 JS 实现，缺少了 Python 丰富的内置函数库，所以手工实现了类似于 Python 的 `ord()` 和 `range()`，用于后续构建字符表。

### 2. 构建字节到 Unicode 字符的映射表

```javascript
function bytesToUnicode() {
  // 把 ASCII 打印字符（! 到 ~，¡ 到 ¬，® 到 ÿ）加入白名单
  let bs = [
    ...range(ord("!"), ord("~") + 1),
    ...range(ord("¡"), ord("¬") + 1),
    ...range(ord("®"), ord("ÿ") + 1),
  ];
  let cs = bs.slice(0); // 复制一份作为对应字符的编码
  let n = 0;
  
  // 对于 0-255 字节中不在上述打印字符范围内的控制字符或不可见字符
  for (let b of range(256)) {
    if (!bs.includes(b)) {
      bs.push(b);
      // 把它们强行映射到一个更高的、安全的 Unicode 编码位置（从 256 开始递增）
      cs.push(256 + n);
      n += 1;
    }
  }
  // 将数字编码转换回真实的 String 字符
  cs = cs.map(n => String.fromCharCode(n));
  
  // 返回 { 字节数值: 映射后的 Unicode 字符 } 的字典
  return Object.fromEntries(bs.map((v, i) => [v, cs[i]]));
}
```
**解析**：
这是 CLIP BPE 最具天才设计的一步：**Byte-level BPE**。
为了确保 Tokenizer 可以处理**任何语言**或**任何二进制符号**而绝对不会遇到 Unknown (`[UNK]`) Token，代码将输入的文本先打散成纯粹的 0~255 字节（Byte），然后将这 256 种可能的字节强制映射为 256 个安全的 Unicode 字符。在此基础上再进行合并（Merge）。

### 3. 获取相邻字符对

```javascript
// 获取单词中所有相邻的字符对 (Bigram)
function getPairs(word) {
  let pairs = [];
  let prevChar = word[0];
  for (let char of word.slice(1)) {
    pairs.push([prevChar, char]);
    prevChar = char;
  }
  return pairs;
}
```
**解析**：把一个词切成相邻的两两组合。例如：词 `['h', 'e', 'l', 'l', 'o']` 会产生 `[ ['h','e'], ['e','l'], ['l','l'], ['o',''] ]`。这用于下一步去 `merges.txt` 中查表看哪些可以合并。

### 4. SimpleTokenizer 初始化

```javascript
class SimpleTokenizer {
  constructor(mergesText) {
    // 构建基础的字节编解码器
    this.byteEncoder = bytesToUnicode();
    this.byteDecoder = Object.fromEntries(Object.entries(this.byteEncoder).map(([k, v]) => [v, k]));
    
    // 解析传入的 merges.txt（BPE 合并规则表）
    const merges = mergesText.split(/\r?\n/).filter(line => line.trim().length > 0).map(line => line.split(" "));
    
    // 构造包含 256 个基础字节字符的初始词表 (Vocabulary)
    let vocab = [/* ...与 bytesToUnicode 逻辑相同的初始化... */];
    
    // 复制基础词表并加上 `</w>` 后缀，表示“一个单词的结尾”
    vocab = [...vocab, ...vocab.map(v => v + '</w>')];
    
    // 把 merges.txt 中的所有组合词加入到词表中
    for (let merge of merges) {
      vocab.push(merge.join(""));
    }
    
    // 加入 CLIP 必备的特殊控制 Token
    vocab.push('<|startoftext|>', '<|endoftext|>');
    
    // 生成 string -> ID 的 encoder 字典，和 ID -> string 的 decoder 字典
    this.encoder = Object.fromEntries(vocab.map((v, i) => [v, i]));
    
    // 生成合并对的优先级表 (Rank)，合并表里越靠前的行，优先级越高，越早合并
    this.bpeRanks = Object.fromEntries(merges.map((v, i) => [v.join("·😎·"), i]));
    this.cache = { '<|startoftext|>': '<|startoftext|>', '<|endoftext|>': '<|endoftext|>' };
    
    // 核心正则：先把原始句子按规则切成一个一个独立的“粗略单词”，以便后续在单词内部做 BPE
    this.pat = /<\|startoftext\|>|<\|endoftext\|>|'s|'t|'re|'ve|'m|'ll|'d|[\p{L}]+|[\p{N}]|[^\s\p{L}\p{N}]+/gui;
  }
```

### 5. 核心 BPE 循环逻辑 (`bpe` 方法)

```javascript
  bpe(token) {
    // 缓存机制，处理过的单词直接返回，极大地提升效率
    if (this.cache[token] !== undefined) {
      return this.cache[token];
    }
    // 把当前单词拆成单个字符的数组，并且在最后一个字符后面打上 `</w>` 结束标记
    let word = [...token.slice(0, -1), token.slice(-1) + '</w>'];
    let pairs = getPairs(word);
    
    if (pairs.length === 0) return token + '</w>';

    // 无限循环，直到无法再进行任何合并
    while (true) {
      let bigram = null;
      let minRank = Infinity;
      
      // 1. 遍历当前词产生的所有相邻对，查表找到在 merges.txt 中排位最高（Rank 最小，即最应该先合并）的对
      for (let p of pairs) {
        let r = this.bpeRanks[p.join("·😎·")]; // 使用特殊符号拼接查询
        if (r === undefined) continue;
        if (r < minRank) {
          minRank = r;
          bigram = p;
        }
      }
      // 如果没有任何对在 merges 表中，说明合并结束，跳出循环
      if (bigram === null) break;
      
      let [first, second] = bigram;
      let newWord = [];
      let i = 0;
      
      // 2. 将找到的优先级最高的一对字符在数组中实际合并起来
      while (i < word.length) {
        let j = word.indexOf(first, i);
        if (j === -1) {
          newWord.push(...word.slice(i));
          break;
        }
        newWord.push(...word.slice(i, j));
        i = j;
        
        // 遇到连续的 first + second，将它们合并成一个新元素放入 newWord
        if (word[i] === first && i < word.length - 1 && word[i + 1] === second) {
          newWord.push(first + second);
          i += 2;
        } else {
          newWord.push(word[i]);
          i += 1;
        }
      }
      
      // 将合并后的数组覆盖旧词
      word = newWord;
      if (word.length === 1) break;
      else pairs = getPairs(word); // 重新生成字符对，进入下一轮更高阶的合并
    }
    
    word = word.join(" ");
    this.cache[token] = word;
    return word;
  }
```

### 6. 外层分发与 UTF-8 支持 (`encode` 方法)

```javascript
  encode(text) {
    let bpeTokens = [];
    // 整理空格并转小写
    text = text.replace(/\s+/g, " ").trim().toLowerCase();
    
    // 使用构造函数中的正则，把句子切成一坨一坨的词或标点符号
    for (let token of [...text.matchAll(this.pat)].map(m => m[0])) {
      // 【关键】将 JS 字符串强行转换为 UTF-8 的 Buffer 字节数组。
      // 这保证了即便遇到非 ASCII 字符（如中文或特殊符号），也会被转化为 0~255 的标准字节，
      // 从而完美走通后续的 byteEncoder 映射和 BPE 合并逻辑。
      const tokenBytes = Buffer.from(token, 'utf-8');
      
      // 根据 byteEncoder 字典，将 UTF-8 字节流映射成安全的 Unicode 字符流
      const byteString = [...tokenBytes].map(b => this.byteEncoder[b]).join("");
      
      // 送入内部进行 BPE 合并处理
      const bpeRes = this.bpe(byteString);
      
      // 将处理完后的多个 Subword 去查 this.encoder 字典，得到最终的 Token ID 并放入结果数组
      bpeTokens.push(...bpeRes.split(' ').map(bpe_token => this.encoder[bpe_token]));
    }
    return bpeTokens;
  }
```

### 7. 对齐模型输入规范 (`encodeForCLIP` 方法)

```javascript
  encodeForCLIP(text) {
    let tokens = this.encode(text);
    
    // CLIP 强制要求开头必须是特殊 Token 49406 (<|startoftext|>)
    tokens.unshift(49406); 
    
    // 如果超长，直接截断（除去开头结尾，最多容纳 75 个真实词）
    tokens = tokens.slice(0, 76);
    
    // CLIP 强制要求文本结束处必须打上 49407 (<|endoftext|>)
    tokens.push(49407); 
    
    // 模型的输入张量大小是固定的 [1, 77]，对于长度不足的，用 0 (Pad) 填充到 77 位
    while (tokens.length < 77) {
      tokens.push(0);
    }
    
    return tokens;
  }
}
```
**解析**：
这一步就是最后一道“包装工序”。无论输入的句子有多长多短，都会被它削峰填谷，死死地打包成一个长度永远是 `77` 的整数数组，以便于 `main.cjs` 里面用它去创建 `new BigInt64Array(77)` 送给 ONNX 推理模块。

---
> 综上所述：该组件充分考虑了无依赖性、UTF-8 多语言泛用性与 BPE 本质的逻辑。对于主打英文环境的应用而言，这是工程实现上极为完美的零负担解决方案。
