const fs = require("fs");
const path = require("path");

/**
 * Generate 10KB input data using the template structure
 * Template: { "records": [{ "name": "name", "amount": "amount" }] }
 *
 * This script creates realistic financial records data that totals approximately 10KB
 */

// Sample data pools for generating realistic records
const FIRST_NAMES = [
  "Alice",
  "Bob",
  "Charlie",
  "Diana",
  "Edward",
  "Fiona",
  "George",
  "Helen",
  "Ivan",
  "Julia",
  "Kevin",
  "Laura",
  "Michael",
  "Nancy",
  "Oliver",
  "Patricia",
  "Quinn",
  "Rachel",
  "Steven",
  "Teresa",
  "Ulrich",
  "Victoria",
  "William",
  "Xenia",
  "Yolanda",
  "Zachary",
  "Amanda",
  "Benjamin",
  "Catherine",
  "David",
  "Elizabeth",
  "Frank",
  "Grace",
  "Henry",
  "Isabella",
  "James",
  "Katherine",
  "Leonard",
  "Monica",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Torres",
  "Nguyen",
  "Hill",
  "Flores",
];

const COMPANIES = [
  "TechCorp Inc",
  "Global Solutions LLC",
  "DataFlow Systems",
  "CloudTech Partners",
  "Innovation Labs",
  "Digital Dynamics",
  "NextGen Solutions",
  "Alpha Technologies",
  "Beta Enterprises",
  "Gamma Consulting",
  "Delta Services",
  "Epsilon Holdings",
  "Prime Ventures",
  "Apex Industries",
  "Summit Technologies",
  "Pioneer Systems",
  "Vertex Solutions",
  "Matrix Corporation",
  "Nexus Group",
  "Quantum Enterprises",
];

/**
 * Generate a random name (person or company)
 */
function generateRandomName() {
  if (Math.random() < 0.7) {
    // 70% chance of person name
    const firstName =
      FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    return `${firstName} ${lastName}`;
  } else {
    // 30% chance of company name
    return COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
  }
}

/**
 * Generate a random amount (various formats for diversity)
 */
function generateRandomAmount() {
  const formats = [
    () => `$${(Math.random() * 10000).toFixed(2)}`, // Dollar amounts
    () => `€${(Math.random() * 8500).toFixed(2)}`, // Euro amounts
    () => `£${(Math.random() * 7500).toFixed(2)}`, // Pound amounts
    () => `${(Math.random() * 1000000).toFixed(0)} units`, // Unit quantities
    () => `${(Math.random() * 500).toFixed(3)} BTC`, // Cryptocurrency
    () => `${(Math.random() * 50000).toFixed(0)} points`, // Points/credits
    () => `${(Math.random() * 100).toFixed(1)}%`, // Percentages
    () => `${Math.floor(Math.random() * 1000000)} tokens`, // Token amounts
  ];

  const format = formats[Math.floor(Math.random() * formats.length)];
  return format();
}

/**
 * Generate records until we reach approximately the target size
 */
function generate10KBRecords() {
  console.log("🔄 Generating 10KB records data using template structure...\n");

  const records = [];
  let currentSize = 0;
  const targetSize = 10240; // 10KB in bytes

  // Start with the base structure size
  const baseStructure = '{"records":[]}';
  currentSize = Buffer.byteLength(baseStructure, "utf8");

  console.log(`Target size: ${targetSize} bytes`);
  console.log(`Base structure: ${currentSize} bytes\n`);

  let recordCount = 0;

  while (currentSize < targetSize - 200) {
    // Leave some buffer for final formatting
    const record = {
      name: generateRandomName(),
      amount: generateRandomAmount(),
    };

    // Calculate the size this record would add
    const recordJson = JSON.stringify(record);
    const additionalSize =
      Buffer.byteLength(recordJson, "utf8") + (records.length > 0 ? 1 : 0); // +1 for comma

    // Check if adding this record would exceed our target
    if (currentSize + additionalSize > targetSize - 50) {
      console.log(
        `Stopping at ${records.length} records to avoid exceeding target size`
      );
      break;
    }

    records.push(record);
    currentSize += additionalSize;
    recordCount++;

    if (recordCount % 50 === 0) {
      console.log(
        `Generated ${recordCount} records, current size: ${currentSize} bytes`
      );
    }
  }

  const finalData = { records };
  const finalJson = JSON.stringify(finalData, null, 2);
  const finalSize = Buffer.byteLength(finalJson, "utf8");

  console.log(`\n✅ Generation complete:`);
  console.log(`   Records generated: ${records.length}`);
  console.log(
    `   Final size: ${finalSize} bytes (${(finalSize / 1024).toFixed(2)} KB)`
  );
  console.log(
    `   Target utilization: ${((finalSize / targetSize) * 100).toFixed(1)}%`
  );

  return { data: finalData, size: finalSize, recordCount: records.length };
}

/**
 * Create different variants of 10KB data for testing
 */
function createVariants() {
  console.log("🚀 Creating multiple 10KB data variants...\n");

  const variants = [];

  for (let i = 1; i <= 3; i++) {
    console.log(`=== Variant ${i} ===`);
    const result = generate10KBRecords();

    // Create input file in the expected format for ChaCha20 processing
    const inputData = {
      user_data: JSON.stringify(result.data),
      chacha20_key: `${i
        .toString()
        .padStart(
          2,
          "0"
        )}23456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`,
      chacha20_nonce: `${i.toString().padStart(12, "0")}`,
      chacha20_counter: i.toString(),
    };

    // Save the variant
    const filename = `inputs_10kb_records_variant${i}.json`;
    const filepath = path.join(__dirname, "../generated_data_set", filename);

    fs.writeFileSync(filepath, JSON.stringify(inputData, null, 2));

    variants.push({
      filename,
      size: result.size,
      recordCount: result.recordCount,
      inputSize: Buffer.byteLength(JSON.stringify(inputData), "utf8"),
    });

    console.log(`📁 Saved: ${filename}`);
    console.log(
      `   User data: ${result.recordCount} records, ${result.size} bytes`
    );
    console.log(`   Total input file: ${variants[i - 1].inputSize} bytes\n`);
  }

  return variants;
}

/**
 * Create a compact single-line version for maximum data density
 */
function createCompactVariant() {
  console.log("=== Compact Variant (Maximum Density) ===");

  const records = [];
  let currentSize = 0;
  const targetSize = 10240;

  // Use minimal structure for maximum data density
  const baseSize = Buffer.byteLength('{"records":[]}', "utf8");
  currentSize = baseSize;

  while (currentSize < targetSize - 100) {
    // Create more compact records
    const shortNames = [
      "A Corp",
      "B Ltd",
      "C Inc",
      "D LLC",
      "E Co",
      "F Group",
      "G Tech",
      "H Data",
    ];
    const name =
      shortNames[Math.floor(Math.random() * shortNames.length)] +
      Math.floor(Math.random() * 1000);
    const amount = `$${(Math.random() * 9999).toFixed(2)}`;

    const record = { name, amount };
    const recordSize =
      Buffer.byteLength(JSON.stringify(record), "utf8") +
      (records.length > 0 ? 1 : 0);

    if (currentSize + recordSize > targetSize - 50) break;

    records.push(record);
    currentSize += recordSize;
  }

  const compactData = { records };
  const compactJson = JSON.stringify(compactData); // No formatting for maximum density
  const compactSize = Buffer.byteLength(compactJson, "utf8");

  const inputData = {
    user_data: compactJson,
    chacha20_key:
      "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
    chacha20_nonce: "abcdef123456",
    chacha20_counter: "999",
  };

  const filename = "inputs_10kb_records_compact.json";
  const filepath = path.join(__dirname, "../generated_data_set", filename);
  fs.writeFileSync(filepath, JSON.stringify(inputData, null, 2));

  console.log(`📁 Saved: ${filename}`);
  console.log(`   Records: ${records.length}`);
  console.log(
    `   User data size: ${compactSize} bytes (${(compactSize / 1024).toFixed(
      2
    )} KB)`
  );
  console.log(
    `   Density: ${((compactSize / targetSize) * 100).toFixed(1)}% of target\n`
  );

  return { filename, recordCount: records.length, size: compactSize };
}

// Main execution
if (require.main === module) {
  try {
    console.log("🎯 10KB ChaCha20 Input Data Generator");
    console.log(
      'Using template structure: { "records": [{ "name": "name", "amount": "amount" }] }\n'
    );

    const variants = createVariants();
    const compact = createCompactVariant();

    console.log("📊 Summary:");
    variants.forEach((variant, index) => {
      console.log(
        `   Variant ${index + 1}: ${variant.recordCount} records, ${
          variant.size
        } bytes`
      );
    });
    console.log(
      `   Compact: ${compact.recordCount} records, ${compact.size} bytes`
    );

    console.log("\n🎉 10KB input data generation completed!");
    console.log("\n🔧 Next steps:");
    console.log(
      "1. Generate circuit inputs: CIRCUIT_SIZE=10KB node src/utils/generate_chacha20_circuit_inputs.js"
    );
    console.log(
      "2. Compile circuit: circom src/zkproof/chacha20.circom --r1cs --wasm --sym -o ./build/"
    );
    console.log(
      "3. Generate witness: node build/chacha20_js/generate_witness.js ..."
    );
  } catch (error) {
    console.error("❌ Error generating 10KB data:", error.message);
    process.exit(1);
  }
}

module.exports = { generate10KBRecords, createVariants, createCompactVariant };
