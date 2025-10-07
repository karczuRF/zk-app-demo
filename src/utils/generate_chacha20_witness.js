#!/usr/bin/env node

/**
 * ES Module     console.log('Loading witness calculator...');
    
    // Load the witness calculator (CommonJS)
    const witnessCalculatorPath = path.join(path.dirname(resolvedWasmPath), 'witness_calculator.cjs');
    if (!fs.existsSync(witnessCalculatorPath)) {
      throw new Error(`Witness calculator not found: ${witnessCalculatorPath}`);
    }
    
    const wc = require(witnessCalculatorPath);or generating witnesses for ChaCha20 circuit
 * Handles the CommonJS witness generator in an ES module environment
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

async function generateWitness(wasmPath, inputPath, outputPath) {
  try {
    console.log("=== ChaCha20 Circuit Witness Generation ===\n");

    // Resolve paths
    const resolvedWasmPath = path.resolve(wasmPath);
    const resolvedInputPath = path.resolve(inputPath);
    const resolvedOutputPath = path.resolve(outputPath);

    console.log(`WASM file: ${resolvedWasmPath}`);
    console.log(`Input file: ${resolvedInputPath}`);
    console.log(`Output file: ${resolvedOutputPath}`);

    // Check if files exist
    if (!fs.existsSync(resolvedWasmPath)) {
      throw new Error(`WASM file not found: ${resolvedWasmPath}`);
    }

    if (!fs.existsSync(resolvedInputPath)) {
      throw new Error(`Input file not found: ${resolvedInputPath}`);
    }

    console.log("\nLoading witness calculator...");

    // Load the witness calculator
    const witnessCalculatorPath = path.join(
      path.dirname(resolvedWasmPath),
      "witness_calculator.js"
    );
    if (!fs.existsSync(witnessCalculatorPath)) {
      throw new Error(`Witness calculator not found: ${witnessCalculatorPath}`);
    }

    const wc = require(witnessCalculatorPath);

    console.log("Loading circuit inputs...");
    const input = JSON.parse(fs.readFileSync(resolvedInputPath, "utf8"));

    console.log("Initializing witness calculator...");
    const witnessCalculator = await wc(resolvedWasmPath);

    console.log("Calculating witness...");
    const witness = await witnessCalculator.calculateWitness(input, 0);

    console.log("Writing witness to file...");
    await witnessCalculator.writeWitness(witness, resolvedOutputPath);

    console.log(`\\n✅ Witness generated successfully!`);
    console.log(`   Witness size: ${witness.length} elements`);
    console.log(`   Output file: ${resolvedOutputPath}`);

    return witness;
  } catch (error) {
    console.error("❌ Error generating witness:", error.message);
    throw error;
  }
}

// CLI usage
if (process.argv.length < 5) {
  console.log(
    "Usage: node generate_chacha20_witness.js <wasm_file> <input_json> <output_wtns>"
  );
  console.log("");
  console.log("Example:");
  console.log(
    "  node generate_chacha20_witness.js chacha20.wasm inputs.json witness.wtns"
  );
  process.exit(1);
}

const wasmPath = process.argv[2];
const inputPath = process.argv[3];
const outputPath = process.argv[4];

generateWitness(wasmPath, inputPath, outputPath)
  .then(() => {
    console.log("\\n🎉 Witness generation completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\\n❌ Witness generation failed:", error.message);
    process.exit(1);
  });

export { generateWitness };
