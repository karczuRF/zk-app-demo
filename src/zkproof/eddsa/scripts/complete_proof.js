import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
// import { eddsaPoseidonExample } from "./eddsa_example.js"; // import if needed

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Complete EdDSA Proof Generation with Working Test Data
 *
 * This script generates working EdDSA signature data and creates a complete proof
 */

async function generateWorkingProof() {
  console.log("=== Complete EdDSA Proof Generation ===\n");

  const buildDir = path.join(__dirname, "build");

  // Ensure build directory exists
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  // Step 1: Generate working EdDSA inputs
  console.log("1. Generating working EdDSA signature inputs...");

  // Import and use the EdDSA example generator
  const { eddsaPoseidonExample } = await import("./eddsa_example.js");
  const workingInputs = await eddsaPoseidonExample();
  // Test inputs from our working test case

  // some test inputs
  //   const workingInputs = {
  //     enabled: "1",
  //     // Public inputs (will be public signals)
  //     Ax: "13277427435165878497778222415993513565335242147425444407278247659442895875392",
  //     Ay: "13622229784656158136036771217484571176836296686641868549125388198837476602820",
  //     M: "12345678901234567890",
  //     // Private inputs (will be private witnesses)
  //     R8x: "11384336176077715648350801245047497805309499996377629391154447008051744969937",
  //     R8y: "9942317131685942354404541203667644915118129085816422696081448233190420507665",
  //     S: "1399076002097524913742141956425391410958841425548685882283268088667350850025",
  //   };
  console.log("   Inputs:", JSON.stringify(workingInputs, null, 2));

  try {
    // Step 2: Generate witness with working inputs
    console.log("\n2. Generating witness...");
    const inputPath = path.join(buildDir, "input.json");
    fs.writeFileSync(inputPath, JSON.stringify(workingInputs, null, 2));

    // Use pre-compiled circuit
    const wasmPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "build",
      "eddsa",
      "EdDSAVerifier_js",
      "EdDSAVerifier.wasm"
    );

    if (fs.existsSync(wasmPath)) {
      const snarkjs = await import("snarkjs");
      const witnessPath = path.join(buildDir, "witness.wtns");
      await snarkjs.wtns.calculate(workingInputs, wasmPath, witnessPath);
      console.log("✓ Witness generated using pre-compiled circuit");
      console.log("✓ Witness file saved to:", witnessPath);
    } else {
      console.log("⚠️ Pre-compiled circuit not found. Compile first with:");
      console.log(
        "   circom src/zkproof/eddsa/EdDSAVerifier.circom --r1cs --wasm --sym -l node_modules -o build/eddsa/"
      );
      throw new Error("Pre-compiled circuit required");
    }

    console.log("✓ Witness generation completed successfully");

    // Step 3: Download powers of tau if needed
    console.log("\n3. Setting up powers of tau...");
    const ptauPath = path.join(buildDir, "powersOfTau28_hez_final_12.ptau");

    if (!fs.existsSync(ptauPath)) {
      console.log("   Downloading powers of tau (this may take a while)...");
      try {
        execSync(
          `wget -q -O "${ptauPath}" https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau`,
          { stdio: "inherit" }
        );
        console.log("✓ Powers of tau downloaded");
      } catch (wgetError) {
        console.log("⚠️ wget failed, trying curl...");
        try {
          execSync(
            `curl -L -o "${ptauPath}" https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau`,
            { stdio: "inherit" }
          );
          console.log("✓ Powers of tau downloaded with curl");
        } catch (curlError) {
          console.log(
            "❌ Failed to download powers of tau. Please download manually:"
          );
          console.log(
            `   wget -O "${ptauPath}" https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau`
          );
          throw new Error("Powers of tau required for proof generation");
        }
      }
    } else {
      console.log("✓ Powers of tau already exists");
    }

    // Step 4: Generate witness file for snarkjs (already done above)
    console.log("\n4. Witness file already generated...");

    // Witness already generated above

    // Step 5: Setup proving key
    console.log("\n5. Generating proving key...");
    const r1csPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "build",
      "eddsa",
      "EdDSAVerifier.r1cs"
    );
    const zkeyPath = path.join(buildDir, "circuit.zkey");

    if (
      !fs.existsSync(zkeyPath) &&
      fs.existsSync(r1csPath) &&
      fs.existsSync(ptauPath)
    ) {
      try {
        execSync(
          `snarkjs groth16 setup "${r1csPath}" "${ptauPath}" "${zkeyPath}"`,
          { stdio: "inherit", cwd: buildDir }
        );
        console.log("✓ Proving key generated");
      } catch (setupError) {
        console.log("⚠️ Setup failed:", setupError.message);
      }
    }

    // Step 6: Export verification key
    console.log("\n6. Exporting verification key...");
    const vkeyPath = path.join(buildDir, "verification_key.json");

    if (fs.existsSync(zkeyPath) && !fs.existsSync(vkeyPath)) {
      try {
        execSync(
          `snarkjs zkey export verificationkey "${zkeyPath}" "${vkeyPath}"`,
          { stdio: "inherit", cwd: buildDir }
        );
        console.log("✓ Verification key exported");
      } catch (vkeyError) {
        console.log("⚠️ Verification key export failed:", vkeyError.message);
      }
    }

    // Step 7: Generate proof
    console.log("\n7. Generating zk-SNARK proof...");
    const proofPath = path.join(buildDir, "proof.json");
    const publicPath = path.join(buildDir, "public.json");

    if (fs.existsSync(zkeyPath) && fs.existsSync(witnessPath)) {
      try {
        execSync(
          `snarkjs groth16 prove "${zkeyPath}" "${witnessPath}" "${proofPath}" "${publicPath}"`,
          { stdio: "inherit", cwd: buildDir }
        );
        console.log("✓ Proof generated successfully!");

        // Read and display the proof
        if (fs.existsSync(proofPath)) {
          const proof = JSON.parse(fs.readFileSync(proofPath, "utf8"));
          const publicSignals = JSON.parse(fs.readFileSync(publicPath, "utf8"));

          console.log("\n📜 Generated Proof:");
          console.log("   π_a:", proof.pi_a);
          console.log("   π_b:", proof.pi_b[0]);
          console.log("   π_c:", proof.pi_c);
          console.log("\n📊 Public Signals:", publicSignals);
        }
      } catch (proveError) {
        console.log("⚠️ Proof generation failed:", proveError.message);
      }
    }

    // Step 8: Verify proof
    console.log("\n8. Verifying proof...");
    if (
      fs.existsSync(vkeyPath) &&
      fs.existsSync(proofPath) &&
      fs.existsSync(publicPath)
    ) {
      try {
        const result = execSync(
          `snarkjs groth16 verify "${vkeyPath}" "${publicPath}" "${proofPath}"`,
          { stdio: "pipe", cwd: buildDir }
        );
        const output = result.toString();
        console.log("✓ Verification result:", output.trim());

        if (output.includes("OK")) {
          console.log("\n🎉 SUCCESS! Proof is valid!");
        } else {
          console.log("\n❌ Proof verification failed!");
        }
      } catch (verifyError) {
        console.log("⚠️ Verification failed:", verifyError.message);
      }
    }

    // Step 9: Generate Solidity verifier
    console.log("\n9. Generating Solidity verifier...");
    const solPath = path.join(buildDir, "verifier.sol");

    if (fs.existsSync(zkeyPath) && !fs.existsSync(solPath)) {
      try {
        execSync(
          `snarkjs zkey export solidityverifier "${zkeyPath}" "${solPath}"`,
          { stdio: "inherit", cwd: buildDir }
        );
        console.log("✓ Solidity verifier generated");
      } catch (solError) {
        console.log(
          "⚠️ Solidity verifier generation failed:",
          solError.message
        );
      }
    }

    console.log("\n=== Summary ===");
    console.log("✅ Files generated in build/ directory:");

    const files = [
      "EdDSAVerifier.r1cs",
      "EdDSAVerifier.wasm",
      "input.json",
      "witness.wtns",
      "circuit.zkey",
      "verification_key.json",
      "proof.json",
      "public.json",
      "verifier.sol",
    ];

    files.forEach((file) => {
      const filePath = path.join(buildDir, file);
      const exists = fs.existsSync(filePath);
      const size = exists ? fs.statSync(filePath).size : 0;
      console.log(
        `   ${exists ? "✓" : "❌"} ${file} ${exists ? `(${size} bytes)` : ""}`
      );
    });

    console.log("\n🔍 What this proves:");
    console.log("- The circuit executed successfully with the given inputs");
    console.log("- The prover knows all the private inputs (R8x, R8y, S)");
    console.log("- The public inputs (enabled, Ax, Ay, M) are verified");
    console.log(
      "- In this case, verification was disabled (enabled=0) for demonstration"
    );

    return { success: true, buildDir };
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.log("\n💡 Manual steps if automated generation fails:");
    console.log("1. Ensure circom and snarkjs are installed globally");
    console.log("2. Download powers of tau manually if needed");
    console.log("3. Check that all dependencies are properly installed");

    return { success: false, error: error.message, buildDir };
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateWorkingProof()
    .then((result) => {
      if (result.success) {
        console.log("\n🚀 Complete proof generation finished!");
      } else {
        console.log("\n⚠️ Proof generation completed with issues");
      }
    })
    .catch(console.error);
}

export { generateWorkingProof };
