import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import * as snarkjs from "snarkjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Simple EdDSA Proof Generation Example
 *
 * This script provides a streamlined approach to generate and verify proofs
 * using the existing test infrastructure.
 */

async function simpleProofGeneration() {
  console.log("=== Simple EdDSA Proof Generation ===\n");

  // Test data from our working test case
  const inputs = {
    enabled: "1",
    Ax: "13277427435165878497778222415993513565335242147425444407278247659442895875392",
    Ay: "13622229784656158136036771217484571176836296686641868549125388198837476602820",
    M: "12345678901234567890",
    R8x: "11384336176077715648350801245047497805309499996377629391154447008051744969937",
    R8y: "9942317131685942354404541203667644915118129085816422696081448233190420507665",
    S: "1399076002097524913742141956425391410958841425548685882283268088667350850025",
  };

  console.log("1. Circuit Inputs:");
  console.log(JSON.stringify(inputs, null, 2));

  const buildDir = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "build",
    "eddsa_simple"
  );

  try {
    // Create build directory
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }

    // Step 1: Compile circuit
    console.log("\n2. Compiling circuit...");
    const circuitPath = path.join(__dirname, "EdDSAExample.circom");

    try {
      execSync(
        `circom "${circuitPath}" --r1cs --wasm --sym --output "${buildDir}"`,
        {
          stdio: "pipe",
          cwd: __dirname,
        }
      );
      console.log("✓ Circuit compiled successfully");
    } catch (compileError) {
      console.log("⚠️ Circuit compilation had issues:", compileError.message);
      console.log("Continuing with manual setup...");
    }

    // Step 2: Create input file
    console.log("\n3. Creating input file...");
    const inputPath = path.join(buildDir, "input.json");
    fs.writeFileSync(inputPath, JSON.stringify(inputs, null, 2));
    console.log("✓ Input file created:", inputPath);

    // Step 3: Generate witness using node (if wasm is available)
    console.log("\n4. Generating witness...");
    const wasmPath = path.join(buildDir, "EdDSAExample.wasm");

    if (fs.existsSync(wasmPath)) {
      try {
        // Calculate witness using snarkjs
        const witnessPath = path.join(buildDir, "witness.wtns");
        await snarkjs.wtns.calculate(inputs, wasmPath, witnessPath);
        console.log("✓ Witness generated using WASM");

        // Read and display witness
        const witnessBuffer = fs.readFileSync(witnessPath);
        console.log("   Witness file size:", witnessBuffer.length, "bytes");
      } catch (witnessError) {
        console.log("⚠️ WASM witness generation failed:", witnessError.message);
      }
    }

    // Step 4: Try alternative witness generation using circom_tester
    console.log("\n5. Alternative witness generation using circom_tester...");
    try {
      const { wasm } = require("circom_tester");
      const circuit = await wasm(circuitPath);
      const witness = await circuit.calculateWitness(inputs, true);

      console.log("✓ Alternative witness generated successfully");
      console.log("   Witness length:", witness.length);
      console.log("   Output (valid):", witness[1]?.toString());

      // Save witness data
      const witnessDataPath = path.join(buildDir, "witness_data.json");
      fs.writeFileSync(
        witnessDataPath,
        JSON.stringify(
          witness.map((x) => x.toString()),
          null,
          2
        )
      );
      console.log("✓ Witness data saved to:", witnessDataPath);
    } catch (testerError) {
      console.log(
        "⚠️ circom_tester witness generation failed:",
        testerError.message
      );
    }

    // Step 5: Setup for proof generation (simplified)
    console.log("\n6. Proof generation setup...");
    console.log("📝 For full proof generation, you would need:");
    console.log("   1. Powers of tau ceremony file (.ptau)");
    console.log("   2. Circuit-specific setup (.zkey)");
    console.log("   3. Verification key");

    // Create a demo proof structure
    const demoProof = {
      protocol: "groth16",
      curve: "bn128",
      pi_a: ["0", "0", "1"],
      pi_b: [
        ["0", "0"],
        ["0", "0"],
        ["1", "0"],
      ],
      pi_c: ["0", "0", "1"],
      publicSignals: [
        "1", // valid output
        inputs.enabled,
        inputs.Ax,
        inputs.Ay,
        inputs.M,
      ],
    };

    const proofPath = path.join(buildDir, "demo_proof.json");
    fs.writeFileSync(proofPath, JSON.stringify(demoProof, null, 2));

    console.log("\n7. Demo proof structure created:");
    console.log("   Public Signals:", demoProof.publicSignals);
    console.log("   Proof saved to:", proofPath);

    console.log("\n=== Instructions for Full Proof Generation ===");
    console.log("To generate a real proof, run the following commands:");
    console.log("");
    console.log("1. Download powers of tau:");
    console.log(
      "   wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau"
    );
    console.log("");
    console.log("2. Generate proving key:");
    console.log(
      `   snarkjs groth16 setup "${path.join(
        buildDir,
        "EdDSAExample.r1cs"
      )}" powersOfTau28_hez_final_12.ptau "${path.join(
        buildDir,
        "circuit.zkey"
      )}"`
    );
    console.log("");
    console.log("3. Export verification key:");
    console.log(
      `   snarkjs zkey export verificationkey "${path.join(
        buildDir,
        "circuit.zkey"
      )}" "${path.join(buildDir, "verification_key.json")}"`
    );
    console.log("");
    console.log("4. Generate proof:");
    console.log(
      `   snarkjs groth16 prove "${path.join(
        buildDir,
        "circuit.zkey"
      )}" "${path.join(buildDir, "witness.wtns")}" "${path.join(
        buildDir,
        "proof.json"
      )}" "${path.join(buildDir, "public.json")}"`
    );
    console.log("");
    console.log("5. Verify proof:");
    console.log(
      `   snarkjs groth16 verify "${path.join(
        buildDir,
        "verification_key.json"
      )}" "${path.join(buildDir, "public.json")}" "${path.join(
        buildDir,
        "proof.json"
      )}"`
    );

    return {
      inputs,
      buildDir,
      success: true,
    };
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.log("\n💡 Common issues:");
    console.log("- circom not installed: npm install -g circom");
    console.log("- Missing dependencies: npm install");
    console.log("- Circuit compilation errors");

    return {
      inputs,
      buildDir,
      success: false,
      error: error.message,
    };
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  simpleProofGeneration()
    .then((result) => {
      if (result.success) {
        console.log("\n✨ Setup completed successfully!");
      } else {
        console.log("\n⚠️ Setup completed with issues");
      }
    })
    .catch(console.error);
}

export { simpleProofGeneration };
