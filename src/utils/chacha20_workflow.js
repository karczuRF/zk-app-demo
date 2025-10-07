#!/usr/bin/env node

/**
 * Complete ChaCha20 Circuit Workflow
 *
 * This script demonstrates the complete workflow for:
 * 1. Converting string inputs to circuit format
 * 2. Generating witnesses
 * 3. Creating proofs (placeholder for proof generation)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🚀 ChaCha20 Circuit Complete Workflow\n");

// Paths
const projectRoot = path.resolve(__dirname, "../..");
const buildDir = path.join(projectRoot, "build");
const chacha20JsDir = path.join(buildDir, "chacha20_js");
const dataDir = path.join(projectRoot, "src/generated_data_set");

// Check if circuit is compiled
const wasmPath = path.join(chacha20JsDir, "chacha20.wasm");
const r1csPath = path.join(buildDir, "chacha20.r1cs");

console.log("📋 Checking circuit compilation...");
if (!fs.existsSync(wasmPath)) {
  console.log("⚠️  Circuit not found. Compiling...");
  try {
    execSync(
      "circom src/zkproof/chacha20.circom --r1cs --wasm --sym -o ./build/",
      { cwd: projectRoot, stdio: "inherit" }
    );
    console.log("✅ Circuit compiled successfully!");
  } catch (error) {
    console.error("❌ Circuit compilation failed:", error.message);
    process.exit(1);
  }
} else {
  console.log("✅ Circuit already compiled");
}

// Generate circuit inputs
console.log("\n📊 Generating circuit inputs...");
try {
  execSync("node src/utils/generate_chacha20_circuit_inputs.js", {
    cwd: projectRoot,
    stdio: "inherit",
  });
} catch (error) {
  console.error("❌ Circuit input generation failed:", error.message);
  process.exit(1);
}

// Test witness generation for different inputs
console.log("\n🧮 Generating witnesses for different inputs...");

const testCases = [
  {
    name: "String Input",
    inputFile: "inputs_string_circuit_inputs.json",
    witnessFile: "witness_string.wtns",
  },
  {
    name: "JSON Example",
    inputFile: "chacha_input_json_example_circuit_inputs.json",
    witnessFile: "witness_json_example.wtns",
  },
  {
    name: "Text Example",
    inputFile: "chacha_input_text_example_circuit_inputs.json",
    witnessFile: "witness_text_example.wtns",
  },
];

const successfulWitnesses = [];

for (const testCase of testCases) {
  console.log(`\n  Processing: ${testCase.name}...`);

  const inputPath = path.join(dataDir, testCase.inputFile);
  const witnessPath = path.join(chacha20JsDir, testCase.witnessFile);

  if (!fs.existsSync(inputPath)) {
    console.log(`  ⚠️  Input file not found: ${testCase.inputFile}`);
    continue;
  }

  try {
    const command = `node generate_witness.js chacha20.wasm ${inputPath} ${witnessPath}`;
    execSync(command, { cwd: chacha20JsDir, stdio: "pipe" });

    // Check witness file size
    const stats = fs.statSync(witnessPath);
    console.log(
      `  ✅ Witness generated: ${testCase.witnessFile} (${stats.size} bytes)`
    );

    successfulWitnesses.push({
      name: testCase.name,
      witnessFile: testCase.witnessFile,
      size: stats.size,
    });
  } catch (error) {
    console.log(`  ❌ Witness generation failed for ${testCase.name}`);
    console.log(`     Error: ${error.message}`);
  }
}

// Summary
console.log("\n📈 Workflow Summary");
console.log("===================");
console.log(`Circuit: chacha20.circom`);
console.log(`WASM: ${fs.existsSync(wasmPath) ? "✅" : "❌"} chacha20.wasm`);
console.log(`R1CS: ${fs.existsSync(r1csPath) ? "✅" : "❌"} chacha20.r1cs`);
console.log(
  `Successful witnesses: ${successfulWitnesses.length}/${testCases.length}`
);

if (successfulWitnesses.length > 0) {
  console.log("\n✅ Generated Witnesses:");
  successfulWitnesses.forEach((w) => {
    console.log(`   - ${w.name}: ${w.witnessFile} (${w.size} bytes)`);
  });
}

// Next steps
console.log("\n🎯 Next Steps for Proof Generation:");
console.log("");
console.log("1. Setup ceremony (if not done):");
console.log(
  "   wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau"
);
console.log("");
console.log("2. Generate proving key:");
console.log(
  "   snarkjs plonk setup build/chacha20.r1cs powersOfTau28_hez_final_15.ptau build/chacha20_circuit_final.zkey"
);
console.log("");
console.log("3. Generate proof (example with string input):");
console.log(
  "   snarkjs plonk prove build/chacha20_circuit_final.zkey build/chacha20_js/witness_string.wtns build/proof_string.json build/public_string.json"
);
console.log("");
console.log("4. Verify proof:");
console.log(
  "   snarkjs plonk verify build/chacha20_circuit_final.zkey build/public_string.json build/proof_string.json"
);

console.log("\n🎉 ChaCha20 circuit workflow completed successfully!");
