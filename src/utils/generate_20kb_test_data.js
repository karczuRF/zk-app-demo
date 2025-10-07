const fs = require("fs");
const path = require("path");

/**
 * Generate 20KB dataset by expanding existing 10KB records
 */
function generate20KBDataset() {
  console.log("🚀 Generating 20KB dataset for performance testing...\n");

  // Read the compact 10KB dataset as base
  const baseFilePath = path.join(
    __dirname,
    "../generated_data_set/inputs_10kb_records_compact.json"
  );
  const baseData = JSON.parse(fs.readFileSync(baseFilePath, "utf8"));
  const baseRecords = JSON.parse(baseData.user_data);

  console.log(
    `Base dataset: ${baseRecords.records.length} records (${Buffer.byteLength(
      baseData.user_data,
      "utf8"
    )} bytes)`
  );

  // Duplicate and modify records to reach ~20KB
  const expandedRecords = [...baseRecords.records];

  // Add variations of existing records with modified names and amounts (more controlled)
  const originalCount = baseRecords.records.length;
  let targetReached = false;

  // Add records one by one until we approach 20KB
  for (let i = 0; i < originalCount && !targetReached; i++) {
    const record = baseRecords.records[i];

    // Create first variation
    expandedRecords.push({
      name: record.name.replace(/(\d+)/, (match) =>
        String(parseInt(match) + 1000)
      ),
      amount:
        (parseFloat(record.amount.replace("$", "")) * 1.5).toFixed(2) + "$",
    });

    let currentSize = Buffer.byteLength(
      JSON.stringify({ records: expandedRecords }),
      "utf8"
    );
    if (currentSize > 19000) {
      // Stop at ~19KB
      targetReached = true;
      break;
    }

    // Create second variation if still under target
    expandedRecords.push({
      name: record.name.replace(/(\d+)/, (match) =>
        String(parseInt(match) + 2000)
      ),
      amount:
        (parseFloat(record.amount.replace("$", "")) * 0.7).toFixed(2) + "$",
    });

    currentSize = Buffer.byteLength(
      JSON.stringify({ records: expandedRecords }),
      "utf8"
    );
    if (currentSize > 19000) {
      // Stop at ~19KB
      targetReached = true;
      break;
    }
  }

  // Continue adding until we reach ~20KB
  let currentSize = Buffer.byteLength(
    JSON.stringify({ records: expandedRecords }),
    "utf8"
  );
  console.log(
    `After duplications: ${expandedRecords.length} records (${currentSize} bytes)`
  );

  // Add more variations if needed to reach 20KB
  let counter = 3000;
  while (currentSize < 19500) {
    // Target ~19.5KB to stay under 20KB
    for (
      let i = 0;
      i < Math.min(50, baseRecords.records.length) && currentSize < 19500;
      i++
    ) {
      const record = baseRecords.records[i];
      expandedRecords.push({
        name: record.name.replace(/(\d+)/, () => String(counter++)),
        amount: (Math.random() * 9000 + 1000).toFixed(2) + "$",
      });
      currentSize = Buffer.byteLength(
        JSON.stringify({ records: expandedRecords }),
        "utf8"
      );
    }
  }

  const finalRecordsData = { records: expandedRecords };
  const finalDataString = JSON.stringify(finalRecordsData);
  const finalSize = Buffer.byteLength(finalDataString, "utf8");

  console.log(
    `Final dataset: ${expandedRecords.length} records (${finalSize} bytes = ${(
      finalSize / 1024
    ).toFixed(2)} KB)`
  );

  // Create the 20KB dataset file
  const output20KB = {
    user_data: finalDataString,
    chacha20_key: baseData.chacha20_key,
    chacha20_nonce: baseData.chacha20_nonce,
    chacha20_counter: "1",
  };

  const outputPath = path.join(
    __dirname,
    "../generated_data_set/inputs_20kb_records_test.json"
  );
  fs.writeFileSync(outputPath, JSON.stringify(output20KB, null, 2));

  console.log(`✅ 20KB dataset saved to: ${path.basename(outputPath)}`);
  console.log(
    `📊 Final size: ${Buffer.byteLength(
      JSON.stringify(output20KB),
      "utf8"
    )} bytes total`
  );

  return outputPath;
}

if (require.main === module) {
  generate20KBDataset();
}

module.exports = { generate20KBDataset };
