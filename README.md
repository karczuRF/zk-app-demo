# ChaCha20 Circuit Integration - Complete Setup

## 🎯 Overview

Successfully refactored and integrated ChaCha20 circuit functionality with complete input generation pipeline and witness creation workflow.

## 📁 Project Structure

```
src/
├── zkproof/
│   └── chacha20.circom              # ChaCha20 ZK circuit (64-byte decryption demo)
├── utils/
│   ├── convert_chacha_input.js      # Convert ChaCha20 data between formats
│   ├── parse_string_to_chacha.js    # Convert string inputs to ChaCha20 format
│   ├── generate_chacha20_circuit_inputs.js  # Generate circuit-compatible inputs
│   ├── generate_chacha20_witness.js # ES module witness generator wrapper
│   └── chacha20_workflow.js         # Complete automation workflow
├── generated_data_set/
│   ├── inputs_string.json           # Simple string format inputs
│   ├── chacha_input*.json          # Various ChaCha20 format examples
│   └── *_circuit_inputs.json       # Circuit-ready bit array inputs
└── build/
    ├── chacha20.r1cs               # Circuit R1CS constraint system
    ├── chacha20.sym                # Circuit symbols
    └── chacha20_js/
        ├── chacha20.wasm           # Compiled circuit WASM
        ├── witness_*.wtns          # Generated witness files
        └── generate_witness.js     # CircomJS witness generator
```

## 🔧 Circuit Specifications

### ChaCha20 Circuit (`chacha20.circom`)

- **Purpose**: Demonstrates ChaCha20 decryption in zero-knowledge
- **Input Format**:
  - Key: 8 × 32-bit words (256 bits total) as bit arrays
  - Nonce: 3 × 32-bit words (96 bits total) as bit arrays
  - Counter: 1 × 32-bit word (32 bits) as bit array
  - Ciphertext: 16 × 32-bit words (512 bits, 64 bytes) as bit arrays
- **Output**: 64-byte plaintext as 16 × 32-bit words in bit arrays
- **Privacy**: Key is private input, others are public

### Circuit Template Instances

- **Optimized Design**: Efficient bit manipulation and word operations
- **ChaCha20 Core**: Uses `zk-symmetric-crypto` library templates
- **Constraint Count**: Suitable for PLONK proving system

## 🛠 Tools & Scripts

### 1. Input Format Conversion

```bash
# Convert between different ChaCha20 data formats
node src/utils/convert_chacha_input.js

# Parse string inputs to ChaCha20 format
node src/utils/parse_string_to_chacha.js
```

### 2. Circuit Input Generation

```bash
# Generate circuit-compatible bit array inputs
node src/utils/generate_chacha20_circuit_inputs.js
```

**Input Processing:**

- **String Format**: `{"user_data": "text", "chacha20_key": "hex...", ...}`
- **ChaCha Format**: `{"user_data": "base64", "chacha20_key": ["1", "35", ...], ...}`
- **Circuit Format**: `{"key": [[bits...], ...], "nonce": [[bits...], ...], ...}`

### 3. Witness Generation

```bash
# Generate witness for specific input
cd build/chacha20_js
node generate_witness.js chacha20.wasm ../../src/generated_data_set/inputs_string_circuit_inputs.json witness.wtns
```

### 4. Complete Workflow Automation

```bash
# Run entire pipeline: compile → generate inputs → create witnesses
node src/utils/chacha20_workflow.js
```

## ✅ Verified Functionality

### Successfully Generated Witnesses

1. **String Input**: `witness_string.wtns` (727,660 bytes)
2. **JSON Example**: `witness_json_example.wtns` (727,660 bytes)
3. **Text Example**: `witness_text_example.wtns` (727,660 bytes)

### Data Format Examples

- **Simple Text**: `"text"` → Base64 → Bit arrays
- **JSON Data**: `{"message":"Hello ZK World!","amounts":[10,20,30]}` → Circuit format
- **Long Text**: 99-byte messages → Truncated to 64 bytes for circuit

## 🎯 Proof Generation Pipeline

### Setup (One-time)

```bash
# Download ceremony file
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau

# Generate proving key
snarkjs plonk setup build/chacha20.r1cs powersOfTau28_hez_final_15.ptau build/chacha20_circuit_final.zkey
```

### Proof Generation & Verification

```bash
# Generate proof
snarkjs plonk prove build/chacha20_circuit_final.zkey build/chacha20_js/witness_string.wtns build/proof_string.json build/public_string.json

# Verify proof
snarkjs plonk verify build/chacha20_circuit_final.zkey build/public_string.json build/proof_string.json
```

## 🔄 Integration Notes

### Package.json Changes

- **Removed**: `"type": "module"` to enable CommonJS compatibility
- **Effect**: CircomJS witness generators work without ES module conflicts
- **Trade-off**: Some ES module scripts show warnings but function correctly

### Circuit Dependencies

- **Library**: `zk-symmetric-crypto` ChaCha20 implementation
- **Templates**: `ChaCha20(16, 32)` for 64-byte block processing
- **Constraints**: Optimized for PLONK proving system

### Data Flow

1. **String Input** → `parse_string_to_chacha.js` → **ChaCha Format**
2. **ChaCha Format** → `generate_chacha20_circuit_inputs.js` → **Circuit Format**
3. **Circuit Format** → `generate_witness.js` → **Witness File**
4. **Witness File** → `snarkjs plonk prove` → **ZK Proof**

## 🎉 Status: Complete & Working

All components tested and verified:

- ✅ Circuit compilation successful
- ✅ Input generation pipeline functional
- ✅ Witness generation working for multiple input types
- ✅ Ready for proof generation and verification
- ✅ Comprehensive tooling and automation

The ChaCha20 circuit integration is now complete with full toolchain support for converting various input formats to circuit-compatible data and generating cryptographic proofs.
