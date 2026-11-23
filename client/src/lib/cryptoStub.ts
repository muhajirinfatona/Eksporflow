export function createHash(_algorithm: string) {
  let buffer = "";
  return {
    update(data: string, _encoding?: string) {
      buffer += data;
      return this;
    },
    digest(_encoding?: string): string {
      let h1 = 0xdeadbeef;
      let h2 = 0x41c6ce57;
      let h3 = 0x811c9dc5;
      let h4 = 0x67452301;
      let h5 = 0xefcdab89;
      let h6 = 0x98badcfe;
      let h7 = 0x10325476;
      let h8 = 0xc3d2e1f0;
      for (let i = 0; i < buffer.length; i++) {
        const ch = buffer.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
        h3 = Math.imul(h3 ^ ch, 3812015801);
        h4 = Math.imul(h4 ^ ch, 2246822507);
        h5 = Math.imul(h5 ^ (ch + 1), 3266489909);
        h6 = Math.imul(h6 ^ (ch + 2), 2718281829);
        h7 = Math.imul(h7 ^ (ch + 3), 3141592653);
        h8 = Math.imul(h8 ^ (ch + 4), 1618033989);
      }
      const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, "0");
      return `${toHex(h1)}${toHex(h2)}${toHex(h3)}${toHex(h4)}${toHex(h5)}${toHex(h6)}${toHex(h7)}${toHex(h8)}`;
    },
  };
}

export default {
  createHash,
};
