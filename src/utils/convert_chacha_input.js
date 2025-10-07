import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the chacha_input.json file
const inputFile = path.join(
  __dirname,
  "../generated_data_set/chacha_input.json"
);
const data = JSON.parse(fs.readFileSync(inputFile, "utf8"));

console.log("=== ChaCha20 Input Data Conversion ===\n");

// Convert base64 user_data to readable string
console.log("1. User Data:");
console.log("Base64:", data.user_data);
try {
  const decodedBuffer = Buffer.from(data.user_data, "base64");
  console.log("Decoded bytes:", Array.from(decodedBuffer));
  console.log("Decoded as string:", decodedBuffer.toString("utf8"));
  console.log("Decoded as hex:", decodedBuffer.toString("hex"));
} catch (error) {
  console.log("Error decoding base64:", error.message);
}

console.log("\n2. ChaCha20 Key (32 bytes):");
console.log("Array format:", data.chacha20_key);
const keyBuffer = Buffer.from(data.chacha20_key.map((x) => parseInt(x)));
console.log("As hex string:", keyBuffer.toString("hex"));
console.log("As bytes:", Array.from(keyBuffer));

console.log("\n3. ChaCha20 Nonce (12 bytes):");
console.log("Array format:", data.chacha20_nonce);
const nonceBuffer = Buffer.from(data.chacha20_nonce.map((x) => parseInt(x)));
console.log("As hex string:", nonceBuffer.toString("hex"));
console.log("As bytes:", Array.from(nonceBuffer));

console.log("\n4. ChaCha20 Counter:");
console.log("Counter value:", data.chacha20_counter);

// Create a converted version with different formats
const convertedData = {
  user_data: {
    base64: data.user_data,
    hex: Buffer.from(data.user_data, "base64").toString("hex"),
    bytes: Array.from(Buffer.from(data.user_data, "base64")),
    string: Buffer.from(data.user_data, "base64").toString("utf8"),
  },
  chacha20_key: {
    array: data.chacha20_key,
    hex: keyBuffer.toString("hex"),
    bytes: Array.from(keyBuffer),
  },
  chacha20_nonce: {
    array: data.chacha20_nonce,
    hex: nonceBuffer.toString("hex"),
    bytes: Array.from(nonceBuffer),
  },
  chacha20_counter: parseInt(data.chacha20_counter),
};

// Save the converted data
const outputFile = path.join(
  __dirname,
  "../generated_data_set/chacha_input_converted.json"
);
fs.writeFileSync(outputFile, JSON.stringify(convertedData, null, 2));

console.log(`\n✅ Converted data saved to: ${outputFile}`);
