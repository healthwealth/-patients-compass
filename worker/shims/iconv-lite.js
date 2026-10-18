// Minimal iconv-lite replacement for Cloudflare Workers.
// Express's body parser only needs to decode request bodies, which on this site
// are UTF-8 JSON/form data. iconv-lite's Node stream wiring does not bundle for
// workerd, so it is swapped for this TextDecoder-based version (see wrangler.jsonc "alias").
const ALIASES = {
  utf8: "utf-8", "utf-8": "utf-8", "unicode-1-1-utf-8": "utf-8",
  utf16le: "utf-16le", "utf-16le": "utf-16le", ucs2: "utf-16le", "ucs-2": "utf-16le",
  latin1: "windows-1252", "iso-8859-1": "windows-1252", "windows-1252": "windows-1252", ascii: "utf-8", "us-ascii": "utf-8",
};

function normalize(encoding) {
  return ALIASES[String(encoding || "utf-8").toLowerCase().replace(/_/g, "-")] || null;
}

function makeDecoder(encoding) {
  const label = normalize(encoding) || "utf-8";
  try {
    return new TextDecoder(label, { fatal: false, ignoreBOM: false });
  } catch {
    return new TextDecoder("utf-8", { fatal: false });
  }
}

function toBytes(buf) {
  if (buf instanceof Uint8Array) return buf;
  if (typeof buf === "string") return new TextEncoder().encode(buf);
  return new Uint8Array(buf);
}

const iconv = {
  encodingExists(encoding) {
    return normalize(encoding) !== null;
  },
  getDecoder(encoding) {
    const decoder = makeDecoder(encoding);
    return {
      write(chunk) {
        return decoder.decode(toBytes(chunk), { stream: true });
      },
      end(chunk) {
        return chunk ? decoder.decode(toBytes(chunk)) : decoder.decode();
      },
    };
  },
  decode(buf, encoding) {
    return makeDecoder(encoding).decode(toBytes(buf));
  },
  encode(str, _encoding) {
    const bytes = new TextEncoder().encode(String(str));
    return typeof Buffer !== "undefined" ? Buffer.from(bytes) : bytes;
  },
  getEncoder() {
    const encoder = new TextEncoder();
    return { write: str => encoder.encode(String(str)), end: () => undefined };
  },
};

module.exports = iconv;
module.exports.default = iconv;
