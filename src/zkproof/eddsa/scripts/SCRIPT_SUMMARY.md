# EdDSA Scripts Summary

This directory contains various scripts for working with EdDSA (Edwards-curve Digital Signature Algorithm) zero-knowledge proofs using Circom and snarkjs.

## 📋 Script Overview

### Core Functionality Scripts

#### 🔑 `eddsa_example.js`

**Purpose**: Generates valid EdDSA signatures and circuit inputs

- Creates EdDSA key pairs using circomlibjs
- Generates Poseidon-based EdDSA signatures
- Converts signatures to circuit-compatible format
- Outputs JSON files with signature components (Ax, Ay, R8x, R8y, S, M)
- **Status**: ✅ Working (ES modules)

#### 📊 `simple_eddsa.js`

**Purpose**: Basic EdDSA signature generation and field element handling

- Demonstrates EdDSA signature creation
- Shows proper field element conversion for circuits
- Handles BigInt to string conversion for JSON compatibility
- **Status**: ✅ Working (ES modules)

### Proof Generation Scripts

#### 🚀 `generate_proof.js`

**Purpose**: Complete end-to-end proof generation pipeline

- Full witness generation from EdDSA inputs
- Powers of tau ceremony setup
- Proving key generation
- zk-SNARK proof creation and verification
- Solidity verifier contract generation
- **Outputs**: `/build/eddsa_generate/`
- **Status**: ✅ Working (Full pipeline)

#### 🎯 `final_proof.js`

**Purpose**: Finalized proof generation with optimized workflow

- Uses pre-compiled circuit files
- Copies working ceremony files from other scripts
- Streamlined proof generation process
- Force exits to prevent hanging
- **Outputs**: `/build/eddsa_simple/`
- **Status**: ✅ Working (Optimized)

#### 🔧 `complete_proof.js`

**Purpose**: Alternative proof generation approach

- Imports EdDSA examples from other scripts
- Focuses on witness generation and setup
- Handles ceremony file management
- **Outputs**: `/build/eddsa_complete/`
- **Status**: ✅ Working (Alternative approach)

#### 📚 `simple_proof.js`

**Purpose**: Educational proof generation with manual instructions

- Setup mode for learning the proof process
- Generates step-by-step CLI commands
- Creates instruction files for manual execution
- Good for understanding the workflow
- **Outputs**: `/build/eddsa_simple/`
- **Status**: ✅ Working (Educational)

#### 📖 `simple_working_proof.js`

**Purpose**: Demonstration proof structure with documentation

- Creates mock proof structures for learning
- Generates comprehensive documentation
- Shows expected proof formats
- Provides setup instructions
- **Outputs**: `/build/eddsa_simple/`
- **Status**: ✅ Working (Demo/Documentation)

### Testing Scripts

#### 🧪 `test_eddsa.js`

**Purpose**: Testing and validation of EdDSA implementations

- Tests various EdDSA signature scenarios
- Validates circuit input formats
- Tests invalid signature rejection
- Tests disabled verification mode
- **Status**: ✅ Working (ES modules, standalone test runner)

## 📁 Output Directories

- **`/build/eddsa_generate/`**: Complete proof pipeline outputs
- **`/build/eddsa_complete/`**: Alternative proof approach outputs
- **`/build/eddsa_simple/`**: Educational and demo outputs

## 🔄 Workflow Recommendations

### For Learning:

1. Start with `simple_working_proof.js` for overview
2. Run `simple_proof.js` for step-by-step instructions
3. Study `eddsa_example.js` for signature generation

### For Development:

1. Use `generate_proof.js` for complete pipeline
2. Use `final_proof.js` for optimized production workflow
3. Reference `complete_proof.js` for alternative approaches

### For Testing:

1. Run `eddsa_example.js` to generate test inputs
2. Use `simple_eddsa.js` for basic signature testing
3. Execute `test_eddsa.js` for comprehensive testing

## 🛠 Technical Details

### Dependencies:

- **circomlibjs**: EdDSA signature generation
- **snarkjs**: Zero-knowledge proof operations
- **ES Modules**: All scripts converted from CommonJS

### Circuit Requirements:

- **EdDSAVerifier.circom**: Main circuit file
- **Circom 2.0.0**: Circuit compiler
- **Powers of Tau**: Ceremony files for trusted setup

### Key Features:

- ✅ ES module compatibility
- ✅ Proper error handling
- ✅ File output management
- ✅ Process exit handling
- ✅ Cross-script file sharing

## 🚨 Common Issues

1. **Script hanging**: Fixed with `process.exit(0)` in completion handlers
2. **Missing imports**: All scripts now have proper snarkjs imports
3. **API changes**: Updated to use `zKey.newZKey` instead of `groth16.setup`
4. **Ceremony files**: Scripts copy working ceremony files to avoid generation errors

## 📝 Usage Examples

```bash
# Generate EdDSA signature examples
node eddsa_example.js

# Run complete proof pipeline
node generate_proof.js

# Quick optimized proof generation
node final_proof.js

# Educational setup with instructions
node simple_proof.js

# Demo with documentation
node simple_working_proof.js
```

All scripts output their results to the main `/build/` directory with organized subdirectories for easy file management and cross-script compatibility.
