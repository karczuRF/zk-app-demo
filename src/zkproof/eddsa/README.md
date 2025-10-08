# EdDSA Poseidon Signature Verification

This guide explains how to sign messages and verify signatures using the EdDSA Poseidon circuit from circomlib.

## Overview

EdDSA (Edwards-curve Digital Signature Algorithm) with Poseidon hash is a zero-knowledge friendly signature scheme that allows you to prove knowledge of a signature without revealing the signature itself.

## Key Components

### 1. EdDSAPoseidonVerifier Circuit

The circuit takes these inputs:

- `enabled`: 1 to verify, 0 to bypass
- `Ax`, `Ay`: Public key coordinates
- `R8x`, `R8y`: Signature R point coordinates
- `S`: Signature S value
- `M`: Message hash (as field element)

### 2. The Verification Process

The circuit implements the EdDSA verification equation:

```
S * B = R + H(R, A, M) * A
```

Where:

- `S` is the signature scalar
- `B` is the base point (generator)
- `R` is the signature point
- `A` is the public key point
- `H(R, A, M)` is the Poseidon hash of the signature point, public key, and message

## Step-by-Step Usage

### Step 1: Generate Key Pair

```javascript
const circomlib = require("circomlibjs");

// Initialize EdDSA
const eddsa = await circomlib.buildEddsa();

// Generate private key (32 bytes)
const privateKey = Buffer.from("your-32-byte-private-key-hex", "hex");

// Generate public key
const publicKey = eddsa.prv2pub(privateKey);
// publicKey[0] = Ax, publicKey[1] = Ay
```

### Step 2: Create Message Hash

```javascript
const { buildPoseidon } = require("circomlibjs");

// Initialize Poseidon
const poseidon = await buildPoseidon();

// Create message as field element
const message = poseidon.F.e("your-message-as-number");
```

### Step 3: Sign the Message

```javascript
// Sign using Poseidon hash
const signature = eddsa.signPoseidon(privateKey, message);

// Signature contains:
// signature.R8[0] = R8x
// signature.R8[1] = R8y
// signature.S = S
```

### Step 4: Verify with JavaScript (Optional)

```javascript
// Verify signature (returns boolean)
const isValid = eddsa.verifyPoseidon(message, signature, publicKey);
```

### Step 5: Prepare Circuit Inputs

```javascript
const circuitInputs = {
  enabled: 1, // Enable verification
  Ax: publicKey[0], // Public key X
  Ay: publicKey[1], // Public key Y
  R8x: signature.R8[0], // Signature R point X
  R8y: signature.R8[1], // Signature R point Y
  S: signature.S, // Signature S value
  M: message, // Message hash
};
```

### Step 6: Generate Zero-Knowledge Proof

```javascript
const { wasm } = require("circom_tester");

// Load circuit
const circuit = await wasm("path/to/your/circuit.circom");

// Generate witness (proves signature is valid)
const witness = await circuit.calculateWitness(circuitInputs, true);

// If this succeeds, the signature is valid
// If it fails, the signature is invalid
```

## Use Cases

### 1. Anonymous Authentication

Prove you have a valid signature from an authority without revealing which specific signature.

### 2. Private Voting

Vote while proving you're an authorized voter without revealing your identity.

### 3. Credential Verification

Prove you have valid credentials without revealing the credentials themselves.

### 4. Access Control

Prove authorization without revealing access tokens.

## Security Considerations

1. **Private Key Security**: Keep private keys secure and never share them
2. **Message Uniqueness**: Use unique messages to prevent replay attacks
3. **Circuit Constraints**: The circuit enforces cryptographic constraints - invalid signatures will cause proof generation to fail
4. **Field Elements**: Ensure messages fit within the field size (254 bits for Baby Jubjub)

## Example Output

When running the example:

```
Private Key: 0001020304050607080910111213141516171819202122232425262728293031
Public Key:
  Ax: 13277427435165878497778222415993513565335242147425444407278247659442895875392
  Ay: 13622229784656158136036771217484571176836296686641868549125388198837476602820
Message: 123456789
Signature:
  R8x: 11384336176077715648...
  R8y: 9942317131685942354...
  S: 1672775540687708987...
Signature Valid: true
```

## Common Errors

1. **"Non quadratic constraints"**: Ensure all operations use signals properly
2. **"Missing input"**: All circuit inputs must be provided
3. **"Witness calculation failed"**: Invalid signature or incorrect inputs
4. **"Field overflow"**: Message or signature values too large for the field

## Running the Example

```bash
# Install dependencies
npm install

# Run the JavaScript example
node EdDSAExample/eddsa_example.js

# Run the circuit test
npm test EdDSAExample/test_eddsa.js
```

This demonstrates the complete flow from key generation to zero-knowledge proof generation for EdDSA signature verification.
