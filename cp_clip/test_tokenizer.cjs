const tokenizer = require('./src/workers/tokenizer.cjs');
const tokens = tokenizer.encodeForCLIP("dog");
console.log(tokens);
