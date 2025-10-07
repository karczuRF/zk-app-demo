#!/usr/bin/env node
/**
 * Generate a fixed-size JSON file:
 * {
 *   "amount": <number>,
 *   "placeholder": "<filler so total JSON is exact size>"
 * }
 *
 * Default size: 50,000 bytes (decimal "50 KB").
 * Use --kib with --size to interpret size as kibibytes (size * 1024).
 *
 * Options:
 *   --amount <int>      Numeric amount value (default: 100)
 *   --size <int>        Target size (default: 50000; bytes unless --kib)
 *   --kib               Interpret size as KiB (size * 1024)
 *   --output <file>     Output filename (default: data_50kb.json)
 *   --seed <int>        Deterministic filler generation
 *   -h, --help          Show help
 *
 * Examples:
 *   node generate_50kb_json.js
 *   node generate_50kb_json.js --size 50 --kib -o data_50kib.json
 *   node generate_50kb_json.js --amount 250 --seed 42
 */

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = {
    amount: 100,
    size: 50000,
    kib: false,
    output: "data_50kb.json",
    seed: undefined,
    help: false,
  };
  const mapFlag = (flag) => {
    switch (flag) {
      case "--amount":
        return "amount";
      case "--size":
        return "size";
      case "--kib":
        return "kib";
      case "--output":
        return "output";
      case "--seed":
        return "seed";
      case "-h":
      case "--help":
        return "help";
      default:
        return null;
    }
  };

  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const key = mapFlag(token);
      if (!key) {
        console.error(`Unknown option: ${token}`);
        process.exit(1);
      }
      if (key === "kib" || key === "help") {
        args[key] = true;
      } else {
        const next = argv[i + 1];
        if (!next || next.startsWith("-")) {
          console.error(`Missing value for ${token}`);
          process.exit(1);
        }
        i++;
        if (key === "amount" || key === "size" || key === "seed") {
          args[key] = Number(next);
          if (Number.isNaN(args[key])) {
            console.error(`Invalid number for ${token}`);
            process.exit(1);
          }
        } else {
          args[key] = next;
        }
      }
    } else if (token.startsWith("-")) {
      if (token === "-h") {
        args.help = true;
      } else {
        console.error(`Unknown short option: ${token}`);
        process.exit(1);
      }
    } else {
      console.error(`Unexpected argument: ${token}`);
      process.exit(1);
    }
  }
  return args;
}

// Simple deterministic PRNG (Mulberry32)
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateFiller(length, rng) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const n = chars.length;
  // Build in chunks for very large sizes
  const chunkSize = 8192;
  let remaining = length;
  const parts = [];
  while (remaining > 0) {
    const thisChunk = Math.min(chunkSize, remaining);
    let buf = "";
    for (let i = 0; i < thisChunk; i++) {
      const idx = Math.floor(rng() * n);
      buf += chars[idx];
    }
    parts.push(buf);
    remaining -= thisChunk;
  }
  return parts.join("");
}

function buildJson(amount, targetSizeBytes, seed) {
  const prefix = `{"amount":${amount},"placeholder":"`;
  const suffix = `"}`;
  const overhead = Buffer.byteLength(prefix) + Buffer.byteLength(suffix);
  const fillerBytesNeeded = targetSizeBytes - overhead;
  if (fillerBytesNeeded < 0) {
    throw new Error(
      `Target size ${targetSizeBytes} is too small for structure overhead (${overhead}).`
    );
  }

  // Setup RNG (seeded or Math.random)
  const rng =
    typeof seed === "number" && Number.isFinite(seed)
      ? mulberry32(seed)
      : Math.random;

  // Generate filler
  const filler = generateFiller(fillerBytesNeeded, rng);

  // Validate byte size
  const jsonString = prefix + filler + suffix;
  const finalBytes = Buffer.byteLength(jsonString);
  if (finalBytes !== targetSizeBytes) {
    // (Should not happen since each char is 1 byte in our chosen alphabet)
    throw new Error(
      `Size mismatch: expected ${targetSizeBytes}, got ${finalBytes}`
    );
  }

  return { jsonString, placeholderLength: filler.length, finalBytes };
}

function showHelp() {
  console.log(`
Usage: node ${path.basename(process.argv[1])} [options]

Options:
  --amount <int>        Numeric amount value (default: 100)
  --size <int>          Target size (default: 50000; bytes unless --kib)
  --kib                 Interpret --size as KiB (size * 1024)
  --output <file>       Output filename (default: data_50kb.json)
  --seed <int>          Deterministic seed for filler
  -h, --help            Show this help

Examples:
  node generate_50kb_json.js
  node generate_50kb_json.js --size 50 --kib -o data_50kib.json
  node generate_50kb_json.js --amount 250 --seed 42
  node generate_50kb_json.js --size 60000 --output bigger.json
`);
}

(function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    showHelp();
    process.exit(0);
  }

  let targetBytes = args.kib ? args.size * 1024 : args.size;
  if (targetBytes <= 0) {
    console.error("Target size must be positive.");
    process.exit(1);
  }

  try {
    const { jsonString, placeholderLength, finalBytes } = buildJson(
      args.amount,
      targetBytes,
      args.seed
    );
    fs.writeFileSync(args.output, jsonString, { encoding: "utf8" });
    console.log(`Written: ${args.output}`);
    console.log(`Final size (bytes): ${finalBytes}`);
    console.log(`Placeholder length (chars): ${placeholderLength}`);
    if (args.kib) {
      console.log(`Target (KiB): ${args.size} => ${targetBytes} bytes`);
    } else {
      console.log(`Target (bytes): ${targetBytes}`);
    }
    if (typeof args.seed === "number") {
      console.log(`Seed: ${args.seed} (deterministic run)`);
    }
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
