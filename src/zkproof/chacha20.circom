pragma circom 2.0.0;

include "../../node_modules/zk-symmetric-crypto/chacha20/chacha20-bits.circom";


/**
 * Demo circuit that uses ChaCha20 to decrypt user_data from decrypt_input_10kb.json
 * 
 * ChaCha20 Key Requirements:
 * - 32 bytes (256 bits) total
 * - Represented as 8 32-bit words
 * - Each 32-bit word is represented as 32 bits in the circuit
 * - Key bytes from JSON: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]
 * - This gets converted to 8 32-bit words: [0x03020100, 0x07060504, 0x0b0a0908, 0x0f0e0d0c, 0x13121110, 0x17161514, 0x1b1a1918, 0x1f1e1d1c]
 * 
 * This circuit decrypts a single 64-byte block from the user_data.
 */
template ChaCha20DecryptDemo() {
    // Inputs - ChaCha20 key from JSON file (will be made private in main component)
    signal input key[8][32];                // 32-byte key as 8 32-bit words in bits
    
    // Public inputs  
    signal input nonce[3][32];              // 12-byte nonce from chacha20_nonce in JSON (3 32-bit words in bits)
    signal input counter[32];               // 4-byte counter from chacha20_counter in JSON (1 32-bit word in bits)
    signal input ciphertext[16][32];        // 64-byte encrypted user_data (first 64 bytes as 16 32-bit words in bits)
    
    // Public outputs
    signal output plaintext[16][32];        // 64-byte decrypted data as 16 32-bit words in bits
    
    // ChaCha20 is a stream cipher, so decryption is the same as encryption
    // We pass the ciphertext as input to get the plaintext as output
    component chacha20 = ChaCha20(16, 32);
    
    // Connect the inputs
    chacha20.key <== key;
    chacha20.nonce <== nonce;
    chacha20.counter <== counter;
    chacha20.in <== ciphertext;
    
    // Connect the output
    plaintext <== chacha20.out;
}

// Instantiate the main component
// Input structure matches decrypt_input_10kb.json:
// - key: private input (chacha20_key from JSON - 32 bytes) 
// - nonce: public input (chacha20_nonce from JSON - 12 bytes)
// - counter: public input (chacha20_counter from JSON - 4 bytes) 
// - ciphertext: public input (user_data from JSON - first 64 bytes)
// - plaintext: public output (decrypted data)
component main{public [nonce, counter, ciphertext]} = ChaCha20DecryptDemo();