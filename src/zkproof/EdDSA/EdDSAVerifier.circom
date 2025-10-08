pragma circom 2.1.4;

include "../node_modules/circomlib/circuits/eddsaposeidon.circom";

// This circuit verifies an EdDSA signature using Poseidon hash
// It proves that the signer knows the private key corresponding to the public key
// without revealing the private key itself

template EdDSASignatureVerifier() {
    // Public inputs (known to verifier)
    signal input enabled;      // 1 to enable verification, 0 to disable
    signal input Ax;          // Public key X coordinate
    signal input Ay;          // Public key Y coordinate
    signal input M;           // Message hash
    
    // Private inputs (only known to prover)
    signal input R8x;         // Signature R point X coordinate
    signal input R8y;         // Signature R point Y coordinate  
    signal input S;           // Signature S value
    
    // Output
    signal output valid;      // 1 if signature is valid, 0 otherwise
    
    // Use the EdDSA Poseidon verifier
    component verifier = EdDSAPoseidonVerifier();
    
    verifier.enabled <== enabled;
    verifier.Ax <== Ax;
    verifier.Ay <== Ay;
    verifier.R8x <== R8x;
    verifier.R8y <== R8y;
    verifier.S <== S;
    verifier.M <== M;
    
    // The verifier doesn't have an explicit output, it constraints that the signature is valid
    // If the signature is invalid, the circuit will fail to generate a proof
    // So if we reach this point, the signature is valid
    valid <== enabled;
}

component main = EdDSASignatureVerifier();