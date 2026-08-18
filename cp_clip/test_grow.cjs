const mem = new WebAssembly.Memory({ initial: 1, maximum: 10, shared: true });
let buf = mem.buffer;
console.log("Initial byteLength:", buf.byteLength);
mem.grow(1);
console.log("After grow byteLength (old buf):", buf.byteLength);
console.log("After grow byteLength (new buf):", mem.buffer.byteLength);
console.log("Are they same?", buf === mem.buffer);
