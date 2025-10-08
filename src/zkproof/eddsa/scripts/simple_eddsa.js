const circomlib = require("circomlibjs");

async function simpleEdDSAExample() {
  console.log("=== Simple EdDSA Poseidon Example ===\n");

  // Initialize EdDSA
  const eddsa = await circomlib.buildEddsa();

  // Create a simple private key (in practice, use crypto.randomBytes(32))
  const prvKey = Buffer.from("1".repeat(64), "hex");

  // Generate public key
  const pubKey = eddsa.prv2pub(prvKey);

  // Create a simple message
  const msg = eddsa.F.e(1234);

  // Sign the message
  const signature = eddsa.signPoseidon(prvKey, msg);

  // Verify signature
  const valid = eddsa.verifyPoseidon(msg, signature, pubKey);

  console.log("Private Key:", prvKey.toString("hex"));
  console.log("Message:", msg.toString());
  console.log("Signature valid:", valid);

  // Convert to circuit format
  // Note: We need to handle the field element conversion properly
  const F = eddsa.F;

  const inputs = {
    enabled: "1",
    Ax: F.toObject(pubKey[0]).toString(),
    Ay: F.toObject(pubKey[1]).toString(),
    R8x: F.toObject(signature.R8[0]).toString(),
    R8y: F.toObject(signature.R8[1]).toString(),
    S: F.toObject(signature.S).toString(),
    M: F.toObject(msg).toString(),
  };

  console.log("\nCircuit Inputs (string format):");
  console.log(JSON.stringify(inputs, null, 2));

  return inputs;
}

// Run example
if (require.main === module) {
  simpleEdDSAExample().catch(console.error);
}

module.exports = { simpleEdDSAExample };
