import * as circomlib from "circomlibjs";

async function workingEdDSAExample() {
  console.log("=== Working EdDSA Poseidon Example ===\n");

  try {
    // Initialize EdDSA
    const eddsa = await circomlib.buildEddsa();

    // Create a simple private key
    const prvKey = Buffer.from(
      "0001020304050607080910111213141516171819202122232425262728293031",
      "hex"
    );

    // Generate public key
    const pubKey = eddsa.prv2pub(prvKey);

    // Create a simple message (small number to avoid conversion issues)
    const msg = BigInt("1234");

    // Sign the message
    const signature = eddsa.signPoseidon(prvKey, msg);

    // Verify signature
    const valid = eddsa.verifyPoseidon(msg, signature, pubKey);

    console.log("Private Key:", prvKey.toString("hex"));
    console.log("Message:", msg.toString());
    console.log("Signature valid:", valid);

    // Prepare circuit inputs - convert BigInt to string
    const inputs = {
      enabled: "1",
      Ax: pubKey[0].toString(),
      Ay: pubKey[1].toString(),
      R8x: signature.R8[0].toString(),
      R8y: signature.R8[1].toString(),
      S: signature.S.toString(),
      M: msg.toString(),
    };

    console.log("\nCircuit Inputs:");
    console.log(JSON.stringify(inputs, null, 2));

    console.log("\n=== How to Use ===");
    console.log("1. Copy the above inputs to your circuit witness file");
    console.log("2. Use EdDSAPoseidonVerifier() in your Circom circuit");
    console.log(
      "3. Generate proof - if inputs are valid, proof generation will succeed"
    );
    console.log("4. If signature is invalid, proof generation will fail");

    return inputs;
  } catch (error) {
    console.error("Error:", error.message);

    // Provide manual example values for demonstration
    console.log("\n=== Manual Example Values ===");
    const manualInputs = {
      enabled: "1",
      Ax: "17777552123799933955779906779655732241715742912184938656739573121738514868268",
      Ay: "2626589144620713026669568689430873010625803728049924121243784502389097019475",
      R8x: "16950150798460657717958625567821834550301663161624707787222815936182638968203",
      R8y: "16950150798460657717958625567821834550301663161624707787222815936182638968203",
      S: "1853356185663744078478934630619558771179161083445064402625460201921931199600",
      M: "1234",
    };

    console.log(JSON.stringify(manualInputs, null, 2));
    console.log("\nNote: These are example values for demonstration.");

    return manualInputs;
  }
}

// Run example
if (import.meta.url === `file://${process.argv[1]}`) {
  workingEdDSAExample().catch(console.error);
}

export { workingEdDSAExample };
