// Utility functions for preparing JSON data for the encryption circuit

/**
 * Convert JSON string to array of field elements (ASCII values)
 * @param {string} jsonString - The stringified JSON data
 * @param {number} maxLength - Maximum length to pad/truncate to
 * @returns {number[]} Array of ASCII values as field elements
 */
export function jsonToFieldElements(jsonString, maxLength = 1024) {
  const result = new Array(maxLength).fill(0);

  for (let i = 0; i < Math.min(jsonString.length, maxLength); i++) {
    result[i] = jsonString.charCodeAt(i);
  }

  return result;
}

/**
 * Generate sample input for the encryption circuit
 * @param {Object} jsonData - The JSON data object
 * @param {string[]} password - Array of password strings (8 elements)
 * @returns {Object} Input object for the circuit
 */
export function generateEncryptionInput(jsonData, password = null) {
  // Default password if not provided
  const defaultPassword = [
    "1111111111",
    "2222222222",
    "3333333333",
    "4444444444",
    "5555555555",
    "6666666666",
    "7777777777",
    "8888888888",
  ];

  const jsonString = JSON.stringify(jsonData);
  const passwordArray = password || defaultPassword;

  return {
    json_data: jsonToFieldElements(jsonString, 1024),
    json_length: jsonString.length.toString(),
    password: passwordArray,
  };
}

/**
 * Extract amounts from the demo JSON data
 * @param {Array} jsonArray - Array of objects with amount fields
 * @returns {number[]} Array of amounts
 */
export function extractAmounts(jsonArray) {
  return jsonArray.map((item) => item.amount || 0);
}

/**
 * Calculate expected sum for verification
 * @param {Array} jsonArray - Array of objects with amount fields
 * @returns {number} Sum of all amounts
 */
export function calculateExpectedSum(jsonArray) {
  return jsonArray.reduce((sum, item) => sum + (item.amount || 0), 0);
}

// Example usage for the demo data:
/*
import demoData from '../utils/demo_data_50kb.json';

// Generate encryption input
const encryptionInput = generateEncryptionInput(demoData);

// Calculate expected sum
const expectedSum = calculateExpectedSum(demoData);
console.log('Expected sum:', expectedSum); // Should be 10+20+30+40+50+60+70+80 = 360

// Use in ZKProofGenerator
const proofInput = {
  user_data: encryptionInput.json_data.slice(0, 4), // First 4 elements for demo
  aes_password: encryptionInput.password
};
*/
