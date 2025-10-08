import * as circomlib from "circomlibjs";

export async function eddsaPoseidonExample() {
  console.log("=== EdDSA Poseidon Signature Example ===\n");

  // 1. Initialize libraries
  const eddsa = await circomlib.buildEddsa();
  const poseidon = await circomlib.buildPoseidon();

  // 2. Generate a private key (32 bytes)
  const privateKey = Buffer.from(
    "0001020304050607080910111213141516171819202122232425262728293031",
    "hex"
  );

  // 3. Generate the public key from private key
  const publicKey = eddsa.prv2pub(privateKey);

  // 4. Create a message to sign (convert to field element)
  const messageValue = "12345678901234567890";
  const message = eddsa.F.e(messageValue);

  console.log("1. Key Generation:");
  console.log("   Private Key:", privateKey.toString("hex"));
  console.log("   Public Key Ax:", publicKey[0]);
  console.log("   Public Key Ay:", publicKey[1]);

  console.log("\n2. Message:");
  console.log("   Original:", messageValue);
  console.log("   Field Element:", message);

  // 5. Sign the message
  const signature = eddsa.signPoseidon(privateKey, message);

  console.log("\n3. Signature:");
  console.log("   R8x:", signature.R8[0]);
  console.log("   R8y:", signature.R8[1]);
  console.log("   S:", signature.S);

  // 6. Verify the signature
  const isValid = eddsa.verifyPoseidon(message, signature, publicKey);
  console.log("\n4. Verification:");
  console.log("   Signature Valid:", isValid);

  // 7. Prepare inputs for the circuit (convert to strings properly)
  // Helper function to convert circomlib values to circuit input strings
  function toInputString(value) {
    if (typeof value === "bigint") {
      return value.toString();
    } else if (typeof value === "object" && value !== null) {
      // Handle circomlib field elements
      try {
        return eddsa.F.toObject
          ? eddsa.F.toObject(value).toString()
          : value.toString();
      } catch (e) {
        return value.toString();
      }
    }
    return value.toString();
  }

  const circuitInputs = {
    enabled: 1,
    Ax: toInputString(publicKey[0]),
    Ay: toInputString(publicKey[1]),
    R8x: toInputString(signature.R8[0]),
    R8y: toInputString(signature.R8[1]),
    S: toInputString(signature.S),
    M: toInputString(message),
  };

  console.log("\n5. Circuit Inputs:");
  console.log(JSON.stringify(circuitInputs, null, 2));

  console.log("\n=== Complete! ===");
  console.log("Use these inputs with the EdDSAPoseidonVerifier circuit");
  console.log("to generate a zero-knowledge proof that you know the");
  console.log("private key corresponding to the public key.\n");

  return circuitInputs;
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  eddsaPoseidonExample().catch(console.error);
}
