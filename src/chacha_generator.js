import {
  generateProof,
  verifyProof,
} from "@reclaimprotocol/zk-symmetric-crypto";
import { makeSnarkJsZKOperator } from "@reclaimprotocol/zk-symmetric-crypto/snarkjs";
import { createCipheriv, randomBytes } from "crypto";
// Set a crypto impl to use. In the browser, or NodeJS, you can use the `webcrypto` backend.
import { setCryptoImplementation } from "@reclaimprotocol/tls";
import { webcryptoCrypto } from "@reclaimprotocol/tls/webcrypto";

async function main() {
  setCryptoImplementation(webcryptoCrypto);
  const key = randomBytes(32);
  const iv = randomBytes(12);
  const algorithm = "chacha20";
  const data = "Hello World!";

  const cipher = createCipheriv("chacha20-poly1305", key, iv);
  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);

  // the operator is the abstract interface for
  // the snarkjs library to generate & verify the proof
  const operator = makeSnarkJsZKOperator(algorithm);
  // generate the proof that you have the key to the ciphertext
  const {
    // groth16-snarkjs proof as a JSON string
    proofJson,
    // the plaintext, obtained from the output of the circuit
    plaintext,
  } = await generateProof({
    algorithm,
    // key, iv & counter are the private inputs to the circuit
    privateInput: {
      key,
      iv,
      // this is the counter from which to start
      // the stream cipher. Read about
      // the counter here: https://en.wikipedia.org/wiki/Stream_cipher
      offset: 0,
    },
    // the public ciphertext input to the circuit
    publicInput: { ciphertext },
    operator,
  });

  // you can check that the plaintext obtained from the circuit
  // is the same as the plaintext obtained from the ciphertext
  const plaintextBuffer = plaintext
    // slice in case the plaintext was padded
    .slice(0, data.length);
  // "Hello World!"
  console.log(Buffer.from(plaintextBuffer).toString());

  // you can verify the proof with the public inputs
  // and the proof JSON string
  await verifyProof({
    proof: {
      proofJson,
      plaintext,
      algorithm,
    },
    // the public inputs to the circuit
    publicInput: { ciphertext },
    operator,
  });
  console.log("Proof verified");
}

main();
