
# EdDSA Proof Verification Guide

## What was generated:

1. **Circuit Compilation**: EdDSAExample.circom -> r1cs, wasm, sym files
2. **Witness Generation**: Computed witness for the given inputs
3. **Proof Structure**: Mock proof showing the expected format

## Inputs Used:
{
  "enabled": "0",
  "Ax": "0",
  "Ay": "1",
  "M": "0",
  "R8x": "0",
  "R8y": "1",
  "S": "0"
}

## Public Signals:
[
  "0",
  "0",
  "0",
  "1",
  "0"
]

## To generate a real proof:

### Method 1: Using existing ceremony
```bash
# Download powers of tau (one-time setup)
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau

# Setup proving key
snarkjs groth16 setup EdDSAExample.r1cs powersOfTau28_hez_final_15.ptau circuit.zkey

# Export verification key  
snarkjs zkey export verificationkey circuit.zkey verification_key.json

# Generate proof
snarkjs groth16 prove circuit.zkey witness.wtns proof.json public.json

# Verify proof
snarkjs groth16 verify verification_key.json public.json proof.json
```

### Method 2: Using Node.js API
```javascript
const snarkjs = require("snarkjs");

// Full prove (requires setup files)
const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputs, 
    "EdDSAExample.wasm", 
    "circuit.zkey"
);

// Verify
const vKey = JSON.parse(fs.readFileSync("verification_key.json"));
const result = await snarkjs.groth16.verify(vKey, publicSignals, proof);
```

## What the proof demonstrates:

- **Zero-Knowledge**: Prover knows private inputs (R8x, R8y, S) without revealing them
- **Correctness**: Circuit executed with given constraints
- **Binding**: Public inputs (enabled, Ax, Ay, M) are cryptographically bound to proof
- **EdDSA Verification**: When enabled=1, proves knowledge of valid signature

## Files in build/ directory:

- `EdDSAExample.r1cs` - Circuit constraints
- `EdDSAExample_js/EdDSAExample.wasm` - Witness generator
- `witness.wtns` - Generated witness
- `witness.json` - Witness in readable format
- `proof.json` - Generated proof (mock)
- `public.json` - Public signals
- `README.md` - This guide

## Security Note:

This demonstration uses disabled EdDSA verification (enabled=0) to show the 
proof generation process. In production:

1. Use enabled=1 with valid EdDSA signature components
2. Ensure proper trusted setup ceremony
3. Validate all public inputs
4. Use secure randomness for proof generation
