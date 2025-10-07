#!/usr/bin/env node
/**
 * Generate a fixed-size JSON file containing an array of objects:
 * [
 *   {"amount": <number>, "placeholder": "<filler>"},
 *   ...
 * ]
 *
 * Default file size: 50,000 bytes (decimal 50 KB).
 *
 * Options:
 *   --amount <int>          Single amount for all objects (ignored if --amounts used)
 *   --amounts <csv>         Comma-separated list of amounts (defines object count)
 *   --count <int>           Number of objects (default: 5) (ignored if --amounts used)
 *   --size <int>            Target size (bytes unless --kib) (default: 50000)
 *   --kib                   Interpret --size as KiB (size * 1024)
 *   --output <file>         Output filename (default: data_50kb.json)
 *   --seed <int>            Deterministic seed for filler generation
 *   -h, --help              Show help
 *
 * Strategy:
 *   1. Determine object amounts array.
 *   2. Compute total structural overhead (brackets, commas, per-object prefixes/suffixes).
 *   3. Distribute the remaining bytes among placeholders (nearly even; earlier objects may get +1).
 *   4. Build final JSON string, verify exact byte size, write to disk.
 */

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = {
    amount: 100,
    amounts: null,
    count: 5,
    size: 50000,
    kib: false,
    output: "demo_data.json",
    seed: undefined,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    const needValue = (flag) => {
      const v = argv[++i];
      if (!v || v.startsWith("-")) {
        console.error(`Missing value for ${flag}`);
        process.exit(1);
      }
      return v;
    };

    switch (token) {
      case "--amount":
        args.amount = Number(needValue(token));
        if (Number.isNaN(args.amount)) {
          console.error("Invalid number for --amount");
          process.exit(1);
        }
        break;
      case "--amounts":
        args.amounts = needValue(token)
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
          .map((n) => {
            const val = Number(n);
            if (Number.isNaN(val)) {
              console.error(`Invalid number in --amounts list: ${n}`);
              process.exit(1);
            }
            return val;
          });
        if (args.amounts.length === 0) {
          console.error("Empty --amounts list.");
          process.exit(1);
        }
        break;
      case "--count":
        args.count = Number(needValue(token));
        if (!Number.isInteger(args.count) || args.count <= 0) {
          console.error("Invalid --count (must be positive integer)");
          process.exit(1);
        }
        break;
      case "--size":
        args.size = Number(needValue(token));
        if (!Number.isFinite(args.size) || args.size <= 0) {
          console.error("Invalid --size (must be positive)");
          process.exit(1);
        }
        break;
      case "--kib":
        args.kib = true;
        break;
      case "--output":
        args.output = needValue(token);
        break;
      case "--seed":
        args.seed = Number(needValue(token));
        if (!Number.isFinite(args.seed)) {
          console.error("Invalid --seed");
          process.exit(1);
        }
        break;
      case "-h":
      case "--help":
        args.help = true;
        break;
      default:
        if (token.startsWith("-")) {
          console.error(`Unknown option: ${token}`);
          process.exit(1);
        } else {
          console.error(`Unexpected argument: ${token}`);
          process.exit(1);
        }
    }
  }
  return args;
}

// Deterministic PRNG (Mulberry32)
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
  const chunkSize = 8192;
  let remaining = length;
  const parts = [];
  while (remaining > 0) {
    const thisChunk = Math.min(chunkSize, remaining);
    let buf = "";
    for (let i = 0; i < thisChunk; i++) {
      buf += chars[Math.floor(rng() * n)];
    }
    parts.push(buf);
    remaining -= thisChunk;
  }
  return parts.join("");
}

function buildJson(amounts, targetBytes, seed) {
  const n = amounts.length;
  if (n === 0) throw new Error("No amounts provided.");

  // Per-object string fragments (excluding filler)
  // Object format: {"amount":<num>,"placeholder":"<FILLER>"}
  // We'll compute prefix and suffix for each object individually
  const prefixes = [];
  const suffix = '"}'; // constant
  let overhead = 0;

  // Overhead starts with '[' + ']' + (n-1) commas between objects
  overhead += 2; // '[' and ']'
  overhead += Math.max(0, n - 1); // commas

  for (let i = 0; i < n; i++) {
    const amt = amounts[i];
    const prefix = '{"amount":' + String(amt) + ',"placeholder":"';
    prefixes.push(prefix);
    overhead += Buffer.byteLength(prefix) + Buffer.byteLength(suffix);
  }

  const fillerNeeded = targetBytes - overhead;
  if (fillerNeeded < 0) {
    throw new Error(
      `Target size ${targetBytes} is too small for structure overhead (${overhead} bytes).`
    );
  }

  // Distribute filler bytes across objects
  const base = Math.floor(fillerNeeded / n);
  let remainder = fillerNeeded % n;
  const fillerLengths = [];
  for (let i = 0; i < n; i++) {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder--;
    fillerLengths.push(base + extra);
  }

  // RNG
  const rng =
    typeof seed === "number" && Number.isFinite(seed)
      ? mulberry32(seed)
      : Math.random;

  // Build final JSON string
  const parts = ["["];
  for (let i = 0; i < n; i++) {
    if (i > 0) parts.push(",");
    const filler = generateFiller(fillerLengths[i], rng);
    parts.push(prefixes[i], filler, suffix);
  }
  parts.push("]");

  const jsonString = parts.join("");
  const finalBytes = Buffer.byteLength(jsonString);
  if (finalBytes !== targetBytes) {
    throw new Error(
      `Size mismatch after construction. Expected ${targetBytes}, got ${finalBytes}`
    );
  }

  return {
    jsonString,
    finalBytes,
    fillerTotals: fillerLengths.reduce((a, b) => a + b, 0),
    objectCount: n,
  };
}

function showHelp() {
  console.log(`
Usage: node ${path.basename(process.argv[1])} [options]

Options:
  --amount <int>          Single amount for all objects (ignored if --amounts)
  --amounts <csv>         Comma-separated list of amounts (sets object count)
  --count <int>           Number of objects (default 5; ignored if --amounts)
  --size <int>            Target size (bytes unless --kib) (default 50000)
  --kib                   Interpret size as KiB (size * 1024)
  --output <file>         Output filename (default: data_50kb.json)
  --seed <int>            Deterministic seed for filler
  -h, --help              Show this help

Examples:
  node ${path.basename(process.argv[1])}
  node ${path.basename(process.argv[1])} --count 8
  node ${path.basename(process.argv[1])} --amount 250 --count 12
  node ${path.basename(process.argv[1])} --amounts 100,200,300,400
  node ${path.basename(process.argv[1])} --size 50 --kib -o data_50kib.json
  node ${path.basename(process.argv[1])} --seed 42 --count 7
`);
}

(function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    showHelp();
    process.exit(0);
  }

  let targetBytes = args.kib ? args.size * 1024 : args.size;
  if (!Number.isFinite(targetBytes) || targetBytes <= 0) {
    console.error("Target size must be a positive number.");
    process.exit(1);
  }

  let amounts;
  if (Array.isArray(args.amounts) && args.amounts.length > 0) {
    amounts = args.amounts;
  } else {
    if (!Number.isInteger(args.count) || args.count <= 0) {
      console.error("--count must be a positive integer.");
      process.exit(1);
    }
    amounts = Array(args.count).fill(args.amount);
  }

  try {
    const { jsonString, finalBytes, fillerTotals, objectCount } = buildJson(
      amounts,
      targetBytes,
      args.seed
    );
    fs.writeFileSync(args.output, jsonString, { encoding: "utf8" });
    console.log(`Written: ${args.output}`);
    console.log(`Objects: ${objectCount}`);
    console.log(`Total placeholder bytes: ${fillerTotals}`);
    console.log(`Final size (bytes): ${finalBytes}`);
    if (args.kib) {
      console.log(`Target (KiB): ${args.size} => ${targetBytes} bytes`);
    } else {
      console.log(`Target (bytes): ${targetBytes}`);
    }
    if (typeof args.seed === "number") {
      console.log(`Seed: ${args.seed} (deterministic)`);
    }
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
