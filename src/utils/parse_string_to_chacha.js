import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createCipheriv, randomBytes } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseStringInputsToChacha() {
  console.log("=== Converting String Inputs to ChaCha20 Format ===\n");

  // Read the inputs_string.json file
  const inputFile = path.join(
    __dirname,
    "../generated_data_set/inputs_string.json"
  );
  const stringData = JSON.parse(fs.readFileSync(inputFile, "utf8"));

  console.log("Original string inputs:");
  console.log(JSON.stringify(stringData, null, 2));
  console.log("\n");

  // Parse user_data (encrypt the text with ChaCha20)
  let userData;
  let userDataBase64;

  if (typeof stringData.user_data === "string") {
    console.log("Converting user_data from string to encrypted format...");

    // Convert the string to a buffer for encryption
    const plaintextBuffer = Buffer.from(stringData.user_data, "utf8");
    console.log(`Original text: "${stringData.user_data}"`);
    console.log(`Text as bytes: [${Array.from(plaintextBuffer).join(", ")}]`);

    // For demonstration, we'll create a simple encrypted version
    // In practice, this would be encrypted with ChaCha20
    userDataBase64 = plaintextBuffer.toString("base64");
    console.log(`Encoded as base64: ${userDataBase64}`);
  } else {
    // If user_data is already in some other format, convert appropriately
    userData = stringData.user_data;
    userDataBase64 = Buffer.from(JSON.stringify(userData)).toString("base64");
  }

  // Parse ChaCha20 key (convert hex string to byte array)
  let keyArray;
  if (typeof stringData.chacha20_key === "string") {
    console.log("\\nConverting chacha20_key from hex string to byte array...");
    const keyHex = stringData.chacha20_key;
    console.log(`Key hex: ${keyHex}`);

    if (keyHex.length !== 64) {
      // 32 bytes = 64 hex characters
      console.log(
        `Warning: Key should be 64 hex characters (32 bytes), got ${keyHex.length}. Padding or truncating...`
      );
    }

    // Ensure we have exactly 32 bytes
    const paddedKeyHex = keyHex.padEnd(64, "0").substring(0, 64);
    keyArray = [];

    for (let i = 0; i < paddedKeyHex.length; i += 2) {
      const hexByte = paddedKeyHex.substring(i, i + 2);
      const byteValue = parseInt(hexByte, 16);
      keyArray.push(byteValue.toString());
    }

    console.log(
      `Key as byte array: [${keyArray.slice(0, 8).join(", ")}...${keyArray
        .slice(-4)
        .join(", ")}] (${keyArray.length} bytes)`
    );
  } else {
    keyArray = stringData.chacha20_key;
  }

  // Parse ChaCha20 nonce (convert hex string to byte array)
  let nonceArray;
  if (typeof stringData.chacha20_nonce === "string") {
    console.log(
      "\\nConverting chacha20_nonce from hex string to byte array..."
    );
    const nonceHex = stringData.chacha20_nonce;
    console.log(`Nonce hex: ${nonceHex}`);

    if (nonceHex.length !== 24) {
      // 12 bytes = 24 hex characters
      console.log(
        `Warning: Nonce should be 24 hex characters (12 bytes), got ${nonceHex.length}. Padding or truncating...`
      );
    }

    // Ensure we have exactly 12 bytes
    const paddedNonceHex = nonceHex.padEnd(24, "0").substring(0, 24);
    nonceArray = [];

    for (let i = 0; i < paddedNonceHex.length; i += 2) {
      const hexByte = paddedNonceHex.substring(i, i + 2);
      const byteValue = parseInt(hexByte, 16);
      nonceArray.push(byteValue.toString());
    }

    console.log(
      `Nonce as byte array: [${nonceArray.join(", ")}] (${
        nonceArray.length
      } bytes)`
    );
  } else {
    nonceArray = stringData.chacha20_nonce;
  }

  // Parse counter (ensure it's a string)
  const counter = stringData.chacha20_counter.toString();
  console.log(`\\nCounter: ${counter}`);

  // Create the ChaCha20 format
  const chachaFormat = {
    user_data: userDataBase64,
    chacha20_key: keyArray,
    chacha20_nonce: nonceArray,
    chacha20_counter: counter,
  };

  console.log("\\n=== Generated ChaCha20 Format ===");
  console.log(JSON.stringify(chachaFormat, null, 2));

  // Save to new file
  const outputFile = path.join(
    __dirname,
    "../generated_data_set/chacha_input_generated.json"
  );
  fs.writeFileSync(outputFile, JSON.stringify(chachaFormat, null, 2));

  console.log(`\\n✅ ChaCha20 format saved to: ${outputFile}`);

  // Also create a summary file with both formats for comparison
  const summaryData = {
    original_string_format: stringData,
    converted_chacha_format: chachaFormat,
    conversion_info: {
      user_data_conversion: "Text converted to base64",
      key_conversion: "Hex string converted to byte array (32 bytes)",
      nonce_conversion: "Hex string converted to byte array (12 bytes)",
      counter_conversion: "Ensured string format",
    },
  };

  const summaryFile = path.join(
    __dirname,
    "../generated_data_set/chacha_conversion_summary.json"
  );
  fs.writeFileSync(summaryFile, JSON.stringify(summaryData, null, 2));

  console.log(`📋 Conversion summary saved to: ${summaryFile}`);

  return chachaFormat;
}

function createExampleWithDifferentInputs() {
  console.log("\\n=== Creating Additional Examples ===");

  // Example with JSON data as user_data
  const jsonExample = {
    user_data: JSON.stringify({
      message: "Hello ZK World!",
      amounts: [10, 20, 30],
    }),
    chacha20_key: "fedcba9876543210fedcba9876543210",
    chacha20_nonce: "abcdef123456",
    chacha20_counter: "5",
  };

  // Example with longer text
  const textExample = {
    user_data:
      "This is a longer message that will be encrypted using ChaCha20 in the zero-knowledge proof circuit.",
    chacha20_key: "1a2b3c4d5e6f7890abcdef1234567890",
    chacha20_nonce: "987654321abc",
    chacha20_counter: "10",
  };

  const examples = [
    { name: "json_example", data: jsonExample },
    { name: "text_example", data: textExample },
  ];

  examples.forEach((example) => {
    console.log(`\\nProcessing ${example.name}...`);

    // Save original format
    const originalFile = path.join(
      __dirname,
      "../generated_data_set",
      `inputs_string_${example.name}.json`
    );
    fs.writeFileSync(originalFile, JSON.stringify(example.data, null, 2));

    // Convert to ChaCha format (reuse the conversion logic)
    const userDataBuffer = Buffer.from(example.data.user_data, "utf8");
    const keyArray = [];
    const keyHex = example.data.chacha20_key.padEnd(64, "0").substring(0, 64);
    for (let i = 0; i < keyHex.length; i += 2) {
      keyArray.push(parseInt(keyHex.substring(i, i + 2), 16).toString());
    }

    const nonceArray = [];
    const nonceHex = example.data.chacha20_nonce
      .padEnd(24, "0")
      .substring(0, 24);
    for (let i = 0; i < nonceHex.length; i += 2) {
      nonceArray.push(parseInt(nonceHex.substring(i, i + 2), 16).toString());
    }

    const chachaFormat = {
      user_data: userDataBuffer.toString("base64"),
      chacha20_key: keyArray,
      chacha20_nonce: nonceArray,
      chacha20_counter: example.data.chacha20_counter.toString(),
    };

    const chachaFile = path.join(
      __dirname,
      "../generated_data_set",
      `chacha_input_${example.name}.json`
    );
    fs.writeFileSync(chachaFile, JSON.stringify(chachaFormat, null, 2));

    console.log(`Generated: ${originalFile}`);
    console.log(`Generated: ${chachaFile}`);
  });
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    parseStringInputsToChacha();
    createExampleWithDifferentInputs();
    console.log("\\n🎉 All conversions completed successfully!");
  } catch (error) {
    console.error("❌ Error during conversion:", error.message);
    process.exit(1);
  }
}

export { parseStringInputsToChacha };
