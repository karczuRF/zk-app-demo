import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
// Circuit size options:
// - 1KB: 16 blocks × 64 bytes = 1,024 bytes (practical for most JSON)
// - 10KB: 160 blocks × 64 bytes = 10,240 bytes (for larger data)

const CIRCUIT_SIZE = process.env.CIRCUIT_SIZE || "1KB"; // Default to 1KB for practicality
let NUM_BLOCKS, MAX_SIZE;

if (CIRCUIT_SIZE === "10KB") {
  NUM_BLOCKS = 160; // 10KB circuit
  MAX_SIZE = 10240;
} else if (CIRCUIT_SIZE === "64B") {
  NUM_BLOCKS = 1; // Demo circuit (64 bytes)
  MAX_SIZE = 64;
} else {
  NUM_BLOCKS = 16; // 1KB circuit (default)
  MAX_SIZE = 1024;
}

const BLOCK_SIZE = 64; // bytes per block

const __dirname = path.dirname(__filename);

/**
 * Convert a 32-bit integer to an array of 32 bits (LSB first)
 */
function intToBits32(value) {
  const bits = [];
  for (let i = 0; i < 32; i++) {
    bits.push((value >> i) & 1);
  }
  return bits;
}

/**
 * Convert 4 bytes to a 32-bit word (little-endian) and then to bits
 */
function bytesToBits32(bytes) {
  if (bytes.length !== 4) {
    throw new Error(`Expected 4 bytes, got ${bytes.length}`);
  }

  // Convert to 32-bit word in little-endian format
  const word = (bytes[3] << 24) | (bytes[2] << 16) | (bytes[1] << 8) | bytes[0];
  return intToBits32(word);
}

/**
 * Convert byte array to ChaCha20 circuit format
 */
function convertBytesToCircuitInput(bytes, expectedWords) {
  if (bytes.length !== expectedWords * 4) {
    console.log(
      `Warning: Expected ${expectedWords * 4} bytes, got ${
        bytes.length
      }. Padding or truncating...`
    );
  }

  // Pad or truncate to expected length
  const paddedBytes = new Array(expectedWords * 4).fill(0);
  for (let i = 0; i < Math.min(bytes.length, paddedBytes.length); i++) {
    paddedBytes[i] = bytes[i];
  }

  const result = [];
  for (let i = 0; i < expectedWords; i++) {
    const wordBytes = paddedBytes.slice(i * 4, (i + 1) * 4);
    result.push(bytesToBits32(wordBytes));
  }

  return result;
}

/**
 * Generate circuit inputs for ChaCha20 from string inputs
 */
function generateChaCha20CircuitInputs(inputData) {
  console.log("=== Generating ChaCha20 Circuit Inputs ===\n");

  // Parse input data (can be from string format or ChaCha format)
  let userData, keyArray, nonceArray, counter;

  if (
    inputData.user_data &&
    typeof inputData.user_data === "string" &&
    inputData.chacha20_key &&
    typeof inputData.chacha20_key === "string"
  ) {
    // String format input (hex strings)
    console.log("Processing string format input...");
    userData = Buffer.from(inputData.user_data, "utf8");

    // Convert hex key to bytes
    const keyHex = inputData.chacha20_key.padEnd(64, "0").substring(0, 64);
    keyArray = [];
    for (let i = 0; i < keyHex.length; i += 2) {
      keyArray.push(parseInt(keyHex.substring(i, i + 2), 16));
    }

    // Convert hex nonce to bytes
    const nonceHex = inputData.chacha20_nonce.padEnd(24, "0").substring(0, 24);
    nonceArray = [];
    for (let i = 0; i < nonceHex.length; i += 2) {
      nonceArray.push(parseInt(nonceHex.substring(i, i + 2), 16));
    }

    counter = parseInt(inputData.chacha20_counter || "1");
  } else if (inputData.chacha20_key && Array.isArray(inputData.chacha20_key)) {
    // ChaCha format input
    console.log("Processing ChaCha format input...");

    if (inputData.user_data) {
      // Decode base64 user_data
      userData = Buffer.from(inputData.user_data, "base64");
    } else {
      userData = Buffer.from("default test data", "utf8");
    }

    keyArray = inputData.chacha20_key.map((x) => parseInt(x));
    nonceArray = inputData.chacha20_nonce.map((x) => parseInt(x));
    counter = parseInt(inputData.chacha20_counter);
  } else {
    throw new Error(
      "Invalid input format. Expected string format or ChaCha format."
    );
  }

  console.log("Input data:");
  console.log(
    `- User data: "${userData.toString("utf8")}" (${userData.length} bytes)`
  );
  console.log(`- Key: ${keyArray.length} bytes`);
  console.log(`- Nonce: ${nonceArray.length} bytes`);
  console.log(`- Counter: ${counter}`);
  console.log("");

  // Generate circuit inputs
  console.log("Converting to circuit format...\n");

  // 1. Key: 32 bytes -> 8 32-bit words -> 8 arrays of 32 bits each
  const keyBits = convertBytesToCircuitInput(keyArray, 8);
  console.log(`✅ Key converted: 32 bytes -> 8 words of 32 bits each`);

  // 2. Nonce: 12 bytes -> 3 32-bit words -> 3 arrays of 32 bits each
  const nonceBits = convertBytesToCircuitInput(nonceArray, 3);
  console.log(`✅ Nonce converted: 12 bytes -> 3 words of 32 bits each`);

  // 3. Counter: 1 32-bit word -> 1 array of 32 bits
  const counterBits = intToBits32(counter);
  console.log(`✅ Counter converted: ${counter} -> 32 bits`);

  // 4. Ciphertext: Process data in 64-byte blocks (size determined by CIRCUIT_SIZE)
  const BLOCK_SIZE = 64; // bytes per block
  // Use global configuration set at module level

  // Prepare the data (pad or truncate to exactly 10KB)
  const processedData = new Array(MAX_SIZE).fill(0);
  for (let i = 0; i < Math.min(userData.length, MAX_SIZE); i++) {
    processedData[i] = userData[i];
  }

  // Convert to blocks of 64 bytes each
  const ciphertextBlocks = [];
  for (let blockIdx = 0; blockIdx < NUM_BLOCKS; blockIdx++) {
    const blockStart = blockIdx * BLOCK_SIZE;
    const blockBytes = processedData.slice(blockStart, blockStart + BLOCK_SIZE);

    // Convert this block to 16 words × 32 bits
    const blockBits = convertBytesToCircuitInput(blockBytes, 16);
    ciphertextBlocks.push(blockBits);
  }

  console.log(
    `✅ Ciphertext converted: ${userData.length} bytes -> ${NUM_BLOCKS} blocks (${MAX_SIZE} bytes total, ${CIRCUIT_SIZE} circuit)`
  );

  // Create the circuit input structure
  const circuitInputs = {
    key: keyBits,
    nonce: nonceBits,
    counter: counterBits,
    ciphertext: ciphertextBlocks,
  };

  console.log("\n=== Circuit Input Summary ===");
  console.log(
    `Key: ${circuitInputs.key.length} words x 32 bits = ${
      circuitInputs.key.length * 32
    } total bits`
  );
  console.log(
    `Nonce: ${circuitInputs.nonce.length} words x 32 bits = ${
      circuitInputs.nonce.length * 32
    } total bits`
  );
  console.log(`Counter: 32 bits`);
  console.log(
    `Ciphertext: ${
      circuitInputs.ciphertext.length
    } blocks x 16 words x 32 bits = ${
      circuitInputs.ciphertext.length * 16 * 32
    } total bits (${circuitInputs.ciphertext.length * 64} bytes)`
  );

  return circuitInputs;
}

/**
 * Process multiple input files and generate circuit inputs
 */
function processAllInputFiles() {
  console.log("🔄 Processing all available input files...\n");

  const inputFiles = [
    "inputs_string.json",
    "chacha_input.json",
    "chacha_input_generated.json",
    "chacha_input_json_example.json",
    "chacha_input_text_example.json",
    "inputs_string_1kb_transaction.json",
  ];

  const results = {};

  for (const filename of inputFiles) {
    const filePath = path.join(__dirname, "../generated_data_set", filename);

    try {
      if (!fs.existsSync(filePath)) {
        console.log(`⏭️  Skipping ${filename} (file not found)`);
        continue;
      }

      console.log(`📁 Processing ${filename}...`);
      const inputData = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const circuitInputs = generateChaCha20CircuitInputs(inputData);

      // Save circuit inputs
      const outputFilename = filename.replace(".json", "_circuit_inputs.json");
      const outputPath = path.join(
        __dirname,
        "../generated_data_set",
        outputFilename
      );
      fs.writeFileSync(outputPath, JSON.stringify(circuitInputs, null, 2));

      console.log(`✅ Circuit inputs saved to: ${outputFilename}\n`);

      results[filename] = {
        inputFile: filePath,
        outputFile: outputPath,
        success: true,
      };
    } catch (error) {
      console.log(`❌ Error processing ${filename}: ${error.message}\n`);
      results[filename] = {
        inputFile: filePath,
        error: error.message,
        success: false,
      };
    }
  }

  return results;
}

/**
 * Generate a witness generation command for the circuit
 */
function generateWitnessCommand(circuitInputFile) {
  const inputsPath = path.resolve(
    __dirname,
    "../generated_data_set",
    circuitInputFile
  );
  const wasmPath = path.resolve(
    __dirname,
    "../../build/chacha20_js/chacha20.wasm"
  );
  const witnessPath = path.resolve(
    __dirname,
    "../../build/witness_chacha20.wtns"
  );

  return `node generate_witness.js "${wasmPath}" "${inputsPath}" "${witnessPath}"`;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const results = processAllInputFiles();

    console.log("\n🎉 Circuit input generation completed!\n");

    console.log("=== Summary ===");
    Object.entries(results).forEach(([filename, result]) => {
      if (result.success) {
        console.log(`✅ ${filename} -> ${path.basename(result.outputFile)}`);
      } else {
        console.log(`❌ ${filename} -> Error: ${result.error}`);
      }
    });

    console.log("\n=== Next Steps ===");
    console.log("1. Compile the circuit:");
    console.log(
      "   circom src/zkproof/chacha20.circom --r1cs --wasm --sym -o ./build/"
    );
    console.log("");
    console.log("2. Generate witness (example):");
    console.log(`   cd build/chacha20_js`);
    console.log(
      `   ${generateWitnessCommand("inputs_string_circuit_inputs.json")}`
    );
    console.log("");
    console.log("3. Generate proof:");
    console.log(
      "   snarkjs plonk setup circuit.r1cs powersOfTau28_hez_final_15.ptau circuit_final.zkey"
    );
    console.log(
      "   snarkjs plonk prove circuit_final.zkey witness.wtns proof.json public.json"
    );
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  }
}

export { generateChaCha20CircuitInputs, convertBytesToCircuitInput };
