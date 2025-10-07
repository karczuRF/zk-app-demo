const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Circuit size configuration - determines number of bytes to process
// - 64B: 64 bytes (demo/test)
// - 1KB: 1,024 bytes (practical for most JSON)
// - 10KB: 10,240 bytes (for larger data)
// - 20KB: 20,480 bytes (for very large data)

const CIRCUIT_SIZE = process.env.CIRCUIT_SIZE || "1KB"; // Default to 1KB for practicality
let NUM_BYTES;
let MAX_SIZE;
if (CIRCUIT_SIZE === "20KB") {
  NUM_BYTES = 20480; // 20KB circuit
  MAX_SIZE = 20480;
} else if (CIRCUIT_SIZE === "10KB") {
  NUM_BYTES = 10240; // 10KB circuit
  MAX_SIZE = 10240;
} else if (CIRCUIT_SIZE === "64B") {
  NUM_BYTES = 64; // 64B circuit (demo)
  MAX_SIZE = 64;
} else {
  NUM_BYTES = 1024; // 1KB circuit (default)
  MAX_SIZE = 1024;
}

console.log(
  `🔧 AES-256-CTR Circuit Configuration: ${CIRCUIT_SIZE} (${NUM_BYTES} bytes)`
);

/**
 * Convert byte array to bits array (8 bits per byte)
 */
function convertBytesToBits(bytes) {
  const bits = [];
  for (let i = 0; i < bytes.length; i++) {
    for (let j = 7; j >= 0; j--) {
      // MSB first
      bits.push((bytes[i] >> j) & 1);
    }
  }
  return bits;
}

/**
 * Convert hex string to bits array
 */
function hexToBits(hexString) {
  const bytes = Buffer.from(hexString, "hex");
  return convertBytesToBits(bytes);
}

/**
 * Pad or truncate data to exact size
 */
function padOrTruncateData(data, targetSize) {
  if (data.length > targetSize) {
    console.log(
      `⚠️  Data truncated from ${data.length} to ${targetSize} bytes`
    );
    return data.slice(0, targetSize);
  } else if (data.length < targetSize) {
    const padded = Buffer.alloc(targetSize);
    data.copy(padded);
    console.log(`📝 Data padded from ${data.length} to ${targetSize} bytes`);
    return padded;
  }
  return data;
}

/**
 * Generate AES-256-CTR circuit inputs from JSON data
 */
function generateAES256CircuitInputs(inputData) {
  console.log("=== Generating AES-256-CTR Circuit Inputs ===\n");

  let userData, aesKey, aesNonce, aesCounter;

  // Handle different input formats
  if (inputData.user_data) {
    // String format input
    console.log("Processing string format input...");
    userData = Buffer.from(inputData.user_data, "utf8");

    // Generate AES key, nonce, and counter if not provided
    aesKey = inputData.aes256_key
      ? Buffer.from(inputData.aes256_key, "hex")
      : crypto.randomBytes(32);
    aesNonce = inputData.aes256_nonce
      ? Buffer.from(inputData.aes256_nonce, "hex")
      : crypto.randomBytes(12);
    aesCounter = inputData.aes256_counter
      ? parseInt(inputData.aes256_counter)
      : 1;
  } else if (inputData.ciphertext) {
    // AES format input (pre-encrypted)
    console.log("Processing AES format input...");
    userData = Buffer.from(inputData.ciphertext, "hex");
    aesKey = Buffer.from(inputData.key, "hex");
    aesNonce = Buffer.from(inputData.nonce, "hex");
    aesCounter = inputData.counter || 1;
  } else {
    throw new Error("Unsupported input format");
  }

  console.log(`Input data:`);
  console.log(
    `- User data: "${userData.toString("utf8").substring(0, 100)}${
      userData.length > 100 ? "..." : ""
    }" (${userData.length} bytes)`
  );
  console.log(`- Key: ${aesKey.length} bytes`);
  console.log(`- Nonce: ${aesNonce.length} bytes`);
  console.log(`- Counter: ${aesCounter}`);

  console.log("\nConverting to circuit format...\n");

  // 1. Key: Convert 32-byte key to 256 bits
  const keyBits = convertBytesToBits(aesKey);
  if (keyBits.length !== 256) {
    throw new Error(
      `Invalid key size: expected 256 bits, got ${keyBits.length}`
    );
  }

  // 2. Nonce: Convert 12-byte nonce to 96 bits
  const nonceBits = convertBytesToBits(aesNonce);
  if (nonceBits.length !== 96) {
    throw new Error(
      `Invalid nonce size: expected 96 bits, got ${nonceBits.length}`
    );
  }

  // 3. Counter: Convert counter to 32 bits (little-endian)
  const counterBytes = Buffer.alloc(4);
  counterBytes.writeUInt32LE(aesCounter, 0);
  const counterBits = convertBytesToBits(counterBytes);

  // 4. Ciphertext: Process data in bytes (pad or truncate to circuit size)
  const paddedData = padOrTruncateData(userData, NUM_BYTES);
  const ciphertextBits = convertBytesToBits(paddedData);

  console.log(
    `✅ Key converted: ${aesKey.length} bytes -> ${keyBits.length} bits`
  );
  console.log(
    `✅ Nonce converted: ${aesNonce.length} bytes -> ${nonceBits.length} bits`
  );
  console.log(
    `✅ Counter converted: ${aesCounter} -> ${counterBits.length} bits`
  );
  console.log(
    `✅ Ciphertext converted: ${userData.length} bytes -> ${NUM_BYTES} bytes (${ciphertextBits.length} bits, ${CIRCUIT_SIZE} circuit)`
  );

  // Create circuit input object
  const circuitInputs = {
    key: keyBits,
    nonce: nonceBits,
    counter: counterBits,
    ciphertext: ciphertextBits,
  };

  console.log("\n=== Circuit Input Summary ===");
  console.log(`Key: ${keyBits.length} bits`);
  console.log(`Nonce: ${nonceBits.length} bits`);
  console.log(`Counter: ${counterBits.length} bits`);
  console.log(`Ciphertext: ${ciphertextBits.length} bits (${NUM_BYTES} bytes)`);

  return circuitInputs;
}

/**
 * Process a single input file
 */
function processInputFile(fileName) {
  console.log(`📁 Processing ${fileName}...`);

  try {
    const inputPath = path.join(__dirname, "../generated_data_set", fileName);
    const inputData = JSON.parse(fs.readFileSync(inputPath, "utf8"));

    const circuitInputs = generateAES256CircuitInputs(inputData);

    // Generate output filename
    const baseName = fileName.replace(".json", "");
    const outputFileName = `${baseName}_aes256_circuit_inputs.json`;
    const outputPath = path.join(
      __dirname,
      "../generated_data_set",
      outputFileName
    );

    // Save circuit inputs
    fs.writeFileSync(outputPath, JSON.stringify(circuitInputs, null, 2));
    console.log(`✅ Circuit inputs saved to: ${outputFileName}`);
  } catch (error) {
    console.error(`❌ Error processing ${fileName}:`, error.message);
  }

  console.log(""); // Empty line for readability
}

/**
 * Main function to process all input files
 */
function main() {
  console.log("🔄 Processing all available input files...\n");

  // List of input files to process (same as ChaCha20)
  const inputFiles = [
    "inputs_string.json",
    "chacha_input.json",
    "chacha_input_generated.json",
    "chacha_input_json_example.json",
    "chacha_input_text_example.json",
    "inputs_string_1kb_transaction.json",
    "inputs_10kb_records_variant1.json",
    "inputs_10kb_records_variant2.json",
    "inputs_10kb_records_variant3.json",
    "inputs_10kb_records_compact.json",
    "inputs_20kb_records_test.json",
  ];

  // Process each file
  inputFiles.forEach(processInputFile);

  console.log("🎉 AES-256-CTR circuit input generation completed!\n");

  console.log("=== Summary ===");
  inputFiles.forEach((fileName) => {
    const baseName = fileName.replace(".json", "");
    const outputFileName = `${baseName}_aes256_circuit_inputs.json`;
    console.log(`✅ ${fileName} -> ${outputFileName}`);
  });

  console.log("\n=== Next Steps ===");
  console.log("1. Compile the AES-256 circuit:");
  console.log(
    "   circom src/zkproof/aes256.circom --r1cs --wasm --sym -o ./build/"
  );
  console.log("");
  console.log("2. Generate witness (example):");
  console.log("   cd build/aes256_js");
  console.log(
    `   node generate_witness.js aes256.wasm ../../src/generated_data_set/inputs_string_aes256_circuit_inputs.json witness_aes256.wtns`
  );
  console.log("");
  console.log("3. Generate proof:");
  console.log(
    "   snarkjs plonk setup circuit.r1cs powersOfTau28_hez_final_15.ptau circuit_final.zkey"
  );
  console.log(
    "   snarkjs plonk prove circuit_final.zkey witness.wtns proof.json public.json"
  );
}

if (require.main === module) {
  main();
}

module.exports = { generateAES256CircuitInputs, processInputFile };
