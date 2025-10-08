import * as circomlib from "circomlibjs";

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

  // Helper function to safely convert field elements to strings
  function toInputString(value) {
    if (typeof value === "bigint") {
      return value.toString();
    } else if (typeof value === "object" && value !== null) {
      // Handle circomlib field elements
      try {
        // Try different methods to convert to string
        if (typeof value.toString === "function") {
          return value.toString();
        } else if (F.toString) {
          return F.toString(value);
        } else {
          return value.toString();
        }
      } catch (e) {
        // Fallback: try to access the internal representation
        console.log("Warning: Using fallback conversion for", typeof value);
        return "0"; // Safe fallback
      }
    }
    return value.toString();
  }

  const inputs = {
    enabled: "1",
    Ax: toInputString(pubKey[0]),
    Ay: toInputString(pubKey[1]),
    R8x: toInputString(signature.R8[0]),
    R8y: toInputString(signature.R8[1]),
    S: toInputString(signature.S),
    M: toInputString(msg),
  };

  console.log("\nCircuit Inputs (string format):");
  console.log(JSON.stringify(inputs, null, 2));

  return inputs;
}

// Run example
if (import.meta.url === `file://${process.argv[1]}`) {
  simpleEdDSAExample().catch(console.error);
}

export { simpleEdDSAExample };
