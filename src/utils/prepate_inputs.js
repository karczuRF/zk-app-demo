const fs = require("fs");
const path = require("path");
// Load demo data
const jsonData = require("./demo_data_50kb.json");

// Convert strings to field elements (ASCII values)
function stringToFieldElement(str) {
  return str.charCodeAt(0); // For single characters
}

// Approach 1: Flatten all values
function flattenToFieldElements(data) {
  const result = [];
  for (const obj of data) {
    result.push(obj.a);
    result.push(stringToFieldElement(obj.p));
  }
  return result;
}

// Approach 2: Create structured input
function createStructuredInput(data) {
  return data.map((obj) => [obj.a, stringToFieldElement(obj.p)]);
}

// Generate inputs
const flatInput = flattenToFieldElements(jsonData);
const structuredInput = createStructuredInput(jsonData);

console.log("Flat input for Poseidon:", flatInput);
// Output: [10, 97, 20, 98, 30, 99, 40, 100, 50, 101]

console.log("Structured input:", structuredInput);
// Output: [[10, 97], [20, 98], [30, 99], [40, 100], [50, 101]]

fs.writeFileSync(
  "../generated_data_set/input_circuit.json",
  `{"data": ${JSON.stringify(flatInput, null, 2)}}`
);
