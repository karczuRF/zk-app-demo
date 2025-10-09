import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as snarkjs from "snarkjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Complete EdDSA Proof Generation and Verification Example
 *
 * This script demonstrates the full workflow:
 * 1. Compile circuit (if needed)
 * 2. Generate witness from inputs
 * 3. Generate zk-SNARK proof
 * 4. Verify the proof
 */

async function generateAndVerifyProof() {
  console.log("=== EdDSA Proof Generation and Verification ===\n");

  // Valid EdDSA signature inputs (generated from eddsa_example.js)
  const inputs = {
    enabled: "1",
    Ax: "6009826206664631762425195104551483519464780417855034312675013183895652229081",
    Ay: "10734004088266146241393102410697198390225666634906567834302254376371681698208",
    R8x: "768628322367438897591892651544585016483775439849185453307980271413448090067",
    R8y: "835054137277806186325990601284225362696199886646469738751473117863494289039",
    S: "1399076002097524913742141956425391410958841425548685882283268088667350850025",
    M: "12345678901234567890",
  };

  console.log("1. Circuit Inputs:");
  console.log(JSON.stringify(inputs, null, 2));

  try {
    // Step 1: Use pre-compiled circuit (already exists)
    console.log("\n2. Using pre-compiled circuit...");
    const circuitPath = path.join(__dirname, "..", "EdDSAVerifier.circom");
    const outputDir = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "build",
      "eddsa_generate"
    );
    const preCompiledDir = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "build",
      "eddsa_simple"
    );

    // Create build directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Check if pre-compiled circuit exists
    if (fs.existsSync(preCompiledDir)) {
      console.log("✓ Using pre-compiled circuit from:", preCompiledDir);
    } else {
      console.log("⚠️ Pre-compiled circuit not found. Compile first with:");
      console.log(
        "   circom src/zkproof/eddsa/EdDSAVerifier.circom --r1cs --wasm --sym -l node_modules -o build/eddsa/"
      );
      throw new Error("Pre-compiled circuit required");
    }

    // Step 2: Calculate witness
    console.log("\n3. Calculating witness...");
    const wasmPath = path.join(
      preCompiledDir,
      "EdDSAVerifier_js",
      "EdDSAVerifier.wasm"
    );
    const witnessPath = path.join(outputDir, "witness.wtns");
    await snarkjs.wtns.calculate(inputs, wasmPath, witnessPath);

    // Read witness for info
    const witness = await snarkjs.wtns.exportJson(witnessPath);

    console.log("✓ Witness calculated");
    console.log("   Witness length:", witness.length);
    console.log("   Output signal (valid):", witness[1]?.toString() || "N/A");

    // Step 3: Setup (generate proving and verification keys)
    console.log("\n4. Setting up proving system...");
    console.log("\n4. Setting up proving system output dir", outputDir);
    const r1csPath = path.join(preCompiledDir, "EdDSAVerifier.r1cs");

    // Use existing powers of tau file
    let ptauPath = path.join(outputDir, "powersOfTau28_hez_final_13.ptau");
    if (!fs.existsSync(ptauPath)) {
      ptauPath = path.join(outputDir, "powersOfTau28_hez_final_12.ptau");
    }

    // Check if the file is valid (not empty) or copy from existing
    if (!fs.existsSync(ptauPath) || fs.statSync(ptauPath).size < 1000000) {
      // Try to copy from scripts build directory
      const sourcePathScripts = path.join(
        __dirname,
        "build",
        "powersOfTau28_hez_final_13.ptau"
      );
      const sourcePathScripts12 = path.join(
        __dirname,
        "build",
        "powersOfTau28_hez_final_12.ptau"
      );

      if (
        fs.existsSync(sourcePathScripts) &&
        fs.statSync(sourcePathScripts).size > 1000000
      ) {
        console.log(
          "   Copying valid powers of tau file from scripts build..."
        );
        fs.copyFileSync(sourcePathScripts, ptauPath);
        console.log("✓ Powers of tau copied successfully");
      } else if (
        fs.existsSync(sourcePathScripts12) &&
        fs.statSync(sourcePathScripts12).size > 1000000
      ) {
        console.log(
          "   Copying valid powers of tau file from scripts build..."
        );
        fs.copyFileSync(sourcePathScripts12, ptauPath);
        console.log("✓ Powers of tau copied successfully");
      } else {
        console.log(
          "   No valid powers of tau file found, generating locally..."
        );
        // Generate a smaller ceremony locally for testing
        ptauPath = path.join(outputDir, "pot12_final.ptau");

        console.log("   Creating new accumulator...");
        await snarkjs.powersOfTau.newAccumulator(
          "bn128",
          12,
          path.join(outputDir, "pot12_0000.ptau")
        );

        console.log("   Contributing to ceremony...");
        await snarkjs.powersOfTau.contribute(
          path.join(outputDir, "pot12_0000.ptau"),
          path.join(outputDir, "pot12_0001.ptau"),
          "first contribution",
          "random entropy for testing"
        );

        console.log("   Finalizing ceremony...");
        await snarkjs.powersOfTau.finalizeAccumulator(
          path.join(outputDir, "pot12_0001.ptau"),
          ptauPath
        );

        // Clean up intermediate files
        fs.unlinkSync(path.join(outputDir, "pot12_0000.ptau"));
        fs.unlinkSync(path.join(outputDir, "pot12_0001.ptau"));

        console.log("   ✓ Local powers of tau ceremony completed");
      }
    }

    console.log("   Using powers of tau file:", path.basename(ptauPath)); // Use existing proving key (eddsa.zkey) or generate new one
    let zkeyPath = path.join(outputDir, "eddsa.zkey");
    if (!fs.existsSync(zkeyPath) || fs.statSync(zkeyPath).size < 1000000) {
      // If eddsa.zkey doesn't exist or is too small, generate a new one
      zkeyPath = path.join(outputDir, "EdDSAExample_0001.zkey");
      console.log("   Generating proving key...");
      await snarkjs.zKey.newZKey(r1csPath, ptauPath, zkeyPath);
    } else {
      console.log("   Using existing proving key: eddsa.zkey");
    }

    // Export verification key
    const vkPath = path.join(outputDir, "verification_key.json");
    const vKey = await snarkjs.zKey.exportVerificationKey(zkeyPath);
    fs.writeFileSync(vkPath, JSON.stringify(vKey, null, 2));

    console.log("✓ Proving system setup complete");

    // Step 4: Generate proof
    console.log("\n5. Generating proof...");
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      inputs,
      wasmPath,
      zkeyPath
    );

    console.log("✓ Proof generated successfully");
    console.log("\n6. Proof Details:");
    console.log("   Proof:");
    console.log("     π_a:", proof.pi_a);
    console.log("     π_b:", proof.pi_b);
    console.log("     π_c:", proof.pi_c);
    console.log("\n   Public Signals:", publicSignals);

    // Save proof and public signals
    const proofPath = path.join(outputDir, "proof.json");
    const publicPath = path.join(outputDir, "public.json");
    fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
    fs.writeFileSync(publicPath, JSON.stringify(publicSignals, null, 2));

    // Step 5: Verify proof
    console.log("\n7. Verifying proof...");
    const verificationResult = await snarkjs.groth16.verify(
      vKey,
      publicSignals,
      proof
    );

    console.log("✓ Verification result:", verificationResult);

    if (verificationResult) {
      console.log("\n🎉 SUCCESS! Proof is valid!");
      console.log("\nWhat this proves:");
      console.log("- The prover knows a valid EdDSA signature");
      console.log("- The signature corresponds to the public key (Ax, Ay)");
      console.log("- The signature is for the message M");
      console.log("- All this without revealing the signature itself!");
    } else {
      console.log("\n❌ FAILED! Proof is invalid!");
    }

    // Step 6: Generate Solidity verifier (optional)
    try {
      console.log("\n8. Generating Solidity verifier...");
      const solidityVerifier = await snarkjs.zKey.exportSolidityVerifier(
        zkeyPath
      );
      const verifierPath = path.join(outputDir, "verifier.sol");
      fs.writeFileSync(verifierPath, solidityVerifier);
      console.log("✓ Solidity verifier saved to:", verifierPath);
    } catch (error) {
      console.log("⚠️  Solidity verifier generation failed (optional step)");
      console.log("   This is expected with some snarkjs versions");
    }

    console.log("\n=== Summary ===");
    console.log("Files generated:");
    console.log("- build/witness.wtns (witness data)");
    console.log("- build/EdDSAExample_0001.zkey (proving key)");
    console.log("- build/verification_key.json (verification key)");
    console.log("- build/proof.json (generated proof)");
    console.log("- build/public.json (public signals)");
    console.log("- build/verifier.sol (Solidity verifier contract)");
    console.log("\nUsing pre-compiled circuit from:");
    console.log("- build/eddsa/EdDSAVerifier.r1cs (constraint system)");
    console.log("- build/eddsa/EdDSAVerifier.wasm (witness generator)");

    return {
      proof,
      publicSignals,
      verificationResult,
      inputs,
    };
  } catch (error) {
    console.error("\n❌ Error occurred:");
    console.error(error.message);
    console.error("\nFull error:", error);

    // Provide guidance on common issues
    console.log("\n💡 Troubleshooting:");
    console.log("1. Ensure circom is installed: npm install -g circom");
    console.log("2. Check that all dependencies are installed");
    console.log("3. Verify the circuit compiles without errors");
    console.log("4. Make sure snarkjs version is compatible");

    throw error;
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAndVerifyProof()
    .then((result) => {
      console.log("\n✨ Proof generation completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Proof generation failed!");
      process.exit(1);
    });
}

export { generateAndVerifyProof };
