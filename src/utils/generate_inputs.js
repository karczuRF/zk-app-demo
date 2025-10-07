const fs = require("fs");
const path = require("path");

// Load demo data
const demoData = require("./demo_data_10kb.json");

// Convert JSON string to field elements (ASCII values)
function jsonToFieldElements(jsonString, maxLength = 10240) {
  const result = new Array(maxLength).fill(0);

  for (let i = 0; i < Math.min(jsonString.length, maxLength); i++) {
    result[i] = jsonString.charCodeAt(i);
  }

  return result;
}

// Generate encryption circuit input
function generateEncryptionInput() {
  const jsonString = JSON.stringify(demoData);
  console.log("JSON string length:", jsonString.length);
  console.log("First 50 chars:", jsonString.substring(0, 50));

  return {
    json_data: jsonToFieldElements(jsonString, 10240),
    json_length: jsonString.length.toString(),
    password: [
      "1111111111",
      "2222222222",
      "3333333333",
      "4444444444",
      "5555555555",
      "6666666666",
      "7777777777",
      "8888888888",
    ],
  };
}

// Generate encrypted data using the encrypt circuit
function generateEncryptedData() {
  const jsonString = JSON.stringify(demoData);
  const fullFieldElements = jsonToFieldElements(jsonString, 10240);

  // This simulates the output of the encrypt circuit
  // In practice, you'd run the encrypt circuit to get these values
  const password = [
    "1111111111",
    "2222222222",
    "3333333333",
    "4444444444",
    "5555555555",
    "6666666666",
    "7777777777",
    "8888888888",
  ];

  console.log("Encryption - JSON string length:", jsonString.length);
  console.log("Encryption - Field elements length:", fullFieldElements.length);
  console.log(
    "Encryption - Expected sum:",
    demoData.reduce((sum, item) => sum + item.a, 0)
  );

  // For testing, use plaintext data
  // TODO: Use actual encrypt circuit output once end-to-end flow is working
  const encrypted = fullFieldElements.map((element, index) => {
    return element.toString();
  });

  return {
    encrypted_json: encrypted,
    encryption_key: password,
    data_length: jsonString.length.toString(),
    metadata: {
      originalData: jsonString.substring(0, 50) + "...",
      expectedSum: demoData.reduce((sum, item) => sum + item.a, 0),
    },
  };
}

// Generate PoC circuit input (uses encrypted data from encrypt circuit)
function generatePocInput() {
  const encryptedData = generateEncryptedData();

  console.log("PoC Input - Using encrypted data");
  console.log("PoC Input - Data length:", encryptedData.data_length);
  console.log("PoC Input - Expected sum:", encryptedData.metadata.expectedSum);

  // Return input for decrypt circuit (only the fields the circuit expects)
  return {
    user_data: encryptedData.encrypted_json, // JSON data as field elements
    aes_password: encryptedData.encryption_key, // Decryption key
  };
}

// Calculate expected sum (using 'a' field from demo data)
const expectedSum = demoData.reduce((sum, item) => sum + item.a, 0);
console.log("Expected sum of amounts:", expectedSum);

// Generate and save inputs
const encryptInput = generateEncryptionInput();
const pocInput = generatePocInput();

fs.writeFileSync(
  "../generated_data_set/encrypt_input_10kb.json",
  JSON.stringify(encryptInput, null, 2)
);
fs.writeFileSync(
  "../generated_data_set/decrypt_input_10kb.json",
  JSON.stringify(pocInput, null, 2)
);

console.log("✅ Input files generated:");
console.log("  - encrypt_input.json");
console.log("  - decrypt_input.json");
console.log("  - Expected final sum:", expectedSum);
