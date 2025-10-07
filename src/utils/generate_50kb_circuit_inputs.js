import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
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
 * Convert byte array to ChaCha20 circuit format for large data
 */
function convertBytesToLargeCircuitInput(bytes, numBlocks) {
  const wordsPerBlock = 16;
  const bytesPerBlock = 64;
  const totalBytes = numBlocks * bytesPerBlock;

  console.log(
    `Converting ${bytes.length} bytes to ${numBlocks} blocks (${totalBytes} total bytes)`
  );

  // Pad or truncate to expected length
  const paddedBytes = new Array(totalBytes).fill(0);
  for (let i = 0; i < Math.min(bytes.length, paddedBytes.length); i++) {
    paddedBytes[i] = bytes[i];
  }

  const result = [];
  for (let blockIdx = 0; blockIdx < numBlocks; blockIdx++) {
    const block = [];
    for (let wordIdx = 0; wordIdx < wordsPerBlock; wordIdx++) {
      const startIdx = blockIdx * bytesPerBlock + wordIdx * 4;
      const wordBytes = paddedBytes.slice(startIdx, startIdx + 4);
      block.push(bytesToBits32(wordBytes));
    }
    result.push(block);
  }

  return result;
}

/**
 * Generate circuit inputs for 50KB ChaCha20 circuit
 */
function generateChaCha20_50KB_CircuitInputs(inputData) {
  console.log("=== Generating ChaCha20 50KB Circuit Inputs ===\n");

  // Parse input data
  let userData, keyArray, nonceArray, counter;

  if (
    inputData.user_data &&
    typeof inputData.user_data === "string" &&
    inputData.chacha20_key &&
    typeof inputData.chacha20_key === "string"
  ) {
    // String format input
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

  console.log("Input data analysis:");
  console.log(`- User data: ${userData.length} bytes`);
  console.log(`- Key: ${keyArray.length} bytes`);
  console.log(`- Nonce: ${nonceArray.length} bytes`);
  console.log(`- Counter: ${counter}`);

  // Determine appropriate circuit size based on data size
  let numBlocks, circuitType;
  if (userData.length <= 64) {
    numBlocks = 1;
    circuitType = "demo";
  } else if (userData.length <= 1024) {
    numBlocks = 16;
    circuitType = "1KB";
  } else {
    numBlocks = 800; // 50KB version
    circuitType = "50KB";
  }

  console.log(`\nUsing ${circuitType} circuit variant (${numBlocks} blocks)\n`);

  // Generate circuit inputs
  console.log("Converting to circuit format...");

  // 1. Key: 32 bytes -> 8 32-bit words -> 8 arrays of 32 bits each
  const keyBits = [];
  for (let i = 0; i < 8; i++) {
    const wordBytes = keyArray.slice(i * 4, (i + 1) * 4);
    if (wordBytes.length < 4) {
      wordBytes.push(...new Array(4 - wordBytes.length).fill(0));
    }
    keyBits.push(bytesToBits32(wordBytes));
  }
  console.log(`✅ Key converted: 32 bytes -> 8 words of 32 bits each`);

  // 2. Nonce: 12 bytes -> 3 32-bit words -> 3 arrays of 32 bits each
  const nonceBits = [];
  for (let i = 0; i < 3; i++) {
    const wordBytes = nonceArray.slice(i * 4, (i + 1) * 4);
    if (wordBytes.length < 4) {
      wordBytes.push(...new Array(4 - wordBytes.length).fill(0));
    }
    nonceBits.push(bytesToBits32(wordBytes));
  }
  console.log(`✅ Nonce converted: 12 bytes -> 3 words of 32 bits each`);

  // 3. Counter: 1 32-bit word -> 1 array of 32 bits
  const counterBits = intToBits32(counter);
  console.log(`✅ Counter converted: ${counter} -> 32 bits`);

  // 4. Ciphertext: Convert user data to blocks
  const ciphertextBits = convertBytesToLargeCircuitInput(
    Array.from(userData),
    numBlocks
  );
  console.log(
    `✅ Ciphertext converted: ${userData.length} bytes -> ${numBlocks} blocks of 16 words × 32 bits each`
  );

  // Create the circuit input structure
  const circuitInputs = {
    key: keyBits,
    nonce: nonceBits,
    counter: counterBits,
    ciphertext: ciphertextBits,
  };

  console.log("\n=== Circuit Input Summary ===");
  console.log(`Circuit type: ${circuitType}`);
  console.log(
    `Key: ${circuitInputs.key.length} words × 32 bits = ${
      circuitInputs.key.length * 32
    } total bits`
  );
  console.log(
    `Nonce: ${circuitInputs.nonce.length} words × 32 bits = ${
      circuitInputs.nonce.length * 32
    } total bits`
  );
  console.log(`Counter: 32 bits`);
  console.log(
    `Ciphertext: ${
      circuitInputs.ciphertext.length
    } blocks × 16 words × 32 bits = ${
      circuitInputs.ciphertext.length * 16 * 32
    } total bits`
  );
  console.log(
    `Total input size: ~${Math.round(
      (circuitInputs.ciphertext.length * 16 * 32 + 32 + 3 * 32 + 8 * 32) /
        8 /
        1024
    )} KB`
  );

  return {
    inputs: circuitInputs,
    metadata: {
      circuitType,
      numBlocks,
      originalDataSize: userData.length,
      paddedDataSize: numBlocks * 64,
    },
  };
}

/**
 * Process 50KB data files and generate appropriate circuit inputs
 */
function process50KBDataFiles() {
  console.log("🔄 Processing 50KB data files...\n");

  const dataFiles = [
    { name: "data_50kb.json", path: "data_50kb.json" },
    { name: "demo_data_50kb.json", path: "demo_data_50kb.json" },
  ];

  const results = {};

  for (const file of dataFiles) {
    const filePath = path.join(__dirname, file.path);

    try {
      if (!fs.existsSync(filePath)) {
        console.log(`⏭️  Skipping ${file.name} (file not found)`);
        continue;
      }

      console.log(`📁 Processing ${file.name}...`);
      const rawData = JSON.parse(fs.readFileSync(filePath, "utf8"));

      // Create a ChaCha20 input format from the raw JSON data
      const chachaInput = {
        user_data: JSON.stringify(rawData), // Convert JSON to string
        chacha20_key:
          "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        chacha20_nonce: "000000000000000000000001",
        chacha20_counter: "1",
      };

      const result = generateChaCha20_50KB_CircuitInputs(chachaInput);

      // Save circuit inputs
      const outputFilename = file.name.replace(
        ".json",
        "_50kb_circuit_inputs.json"
      );
      const outputPath = path.join(
        __dirname,
        "../generated_data_set",
        outputFilename
      );

      // Ensure directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, JSON.stringify(result.inputs, null, 2));

      console.log(`✅ Circuit inputs saved to: ${outputFilename}`);
      console.log(`   Circuit type: ${result.metadata.circuitType}`);
      console.log(
        `   Original data: ${result.metadata.originalDataSize} bytes`
      );
      console.log(
        `   Padded to: ${result.metadata.paddedDataSize} bytes (${result.metadata.numBlocks} blocks)\n`
      );

      results[file.name] = {
        inputFile: filePath,
        outputFile: outputPath,
        metadata: result.metadata,
        success: true,
      };
    } catch (error) {
      console.log(`❌ Error processing ${file.name}: ${error.message}\n`);
      results[file.name] = {
        inputFile: filePath,
        error: error.message,
        success: false,
      };
    }
  }

  return results;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const results = process50KBDataFiles();

    console.log("\n🎉 50KB Circuit input generation completed!\n");

    console.log("=== Summary ===");
    Object.entries(results).forEach(([filename, result]) => {
      if (result.success) {
        console.log(`✅ ${filename} -> ${path.basename(result.outputFile)}`);
        console.log(
          `   Type: ${result.metadata.circuitType}, Blocks: ${result.metadata.numBlocks}`
        );
      } else {
        console.log(`❌ ${filename} -> Error: ${result.error}`);
      }
    });

    console.log("\n=== Next Steps ===");
    console.log("1. Compile the 50KB circuit:");
    console.log(
      "   circom src/zkproof/chacha20.circom --r1cs --wasm --sym -o ./build/"
    );
    console.log("");
    console.log("2. Generate witness:");
    console.log("   cd build/chacha20_js");
    console.log(
      "   node generate_witness.js chacha20.wasm ../../src/generated_data_set/data_50kb_50kb_circuit_inputs.json witness_50kb.wtns"
    );
    console.log("");
    console.log("3. Generate proof:");
    console.log(
      "   snarkjs groth16 prove chacha20.zkey witness_50kb.wtns proof_50kb.json public_50kb.json"
    );
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  }
}

export { generateChaCha20_50KB_CircuitInputs };
