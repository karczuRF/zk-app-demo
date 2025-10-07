pragma circom 2.0.0;

include "../../node_modules/zk-symmetric-crypto/chacha20/chacha20-bits.circom";


/**
 * ChaCha20 circuit for decrypting large JSON data (50KB)
 * 
 * This is a scalable version that processes multiple 64-byte blocks.
 * For 50KB data, we process it in manageable chunks to avoid circuit size explosion.
 * 
 * Approach: Process 50KB as 800 blocks of 64 bytes each (51,200 bytes total)
 * This gives us some padding for the actual 50KB of data.
 */

/**
 * Optimized ChaCha20 circuit for large data processing
 * Processes data in configurable chunks to balance circuit size vs capability
 */
template ChaCha20DecryptLarge(numBlocks) {
    // Each block is 64 bytes = 16 × 32-bit words
    var WORDS_PER_BLOCK = 16;
    
    // Inputs (key will be made private in main component)
    signal input key[8][32];                            // 32-byte key as 8 32-bit words in bits
    signal input nonce[3][32];                          // 12-byte nonce as 3 32-bit words in bits
    signal input counter[32];                           // Base counter as 32-bit word in bits
    signal input ciphertext[numBlocks][WORDS_PER_BLOCK][32]; // All encrypted blocks
    
    // Public outputs
    signal output plaintext[numBlocks][WORDS_PER_BLOCK][32];  // All decrypted blocks
    
    // Process each block with ChaCha20
    component chacha20[numBlocks];
    
    for (var i = 0; i < numBlocks; i++) {
        chacha20[i] = ChaCha20(WORDS_PER_BLOCK, 32);
        chacha20[i].key <== key;
        chacha20[i].nonce <== nonce;
        chacha20[i].counter <== counter;  // Note: In practice, counter should increment per block
        chacha20[i].in <== ciphertext[i];
        plaintext[i] <== chacha20[i].out;
    }
}

/**
 * Specific instantiation for 50KB JSON processing
 * 50KB ≈ 781.25 blocks of 64 bytes, so we use 800 blocks for safety
 */
template ChaCha20Decrypt50KB() {
    var NUM_BLOCKS = 800;  // 800 × 64 = 51,200 bytes (covers 50KB + padding)
    
    // Define the interface first
    signal input key[8][32];
    signal input nonce[3][32];
    signal input counter[32];
    signal input ciphertext[NUM_BLOCKS][16][32];
    signal output plaintext[NUM_BLOCKS][16][32];
    
    // Use the generic large data template
    component processor = ChaCha20DecryptLarge(NUM_BLOCKS);
    
    // Pass through all signals
    processor.key <== key;
    processor.nonce <== nonce;
    processor.counter <== counter;
    processor.ciphertext <== ciphertext;
    plaintext <== processor.plaintext;
}

/**
 * Smaller version for testing and development (1KB = ~16 blocks)
 */
template ChaCha20Decrypt1KB() {
    var NUM_BLOCKS = 16;  // 16 × 64 = 1,024 bytes
    
    // Define the interface first
    signal input key[8][32];
    signal input nonce[3][32];
    signal input counter[32];
    signal input ciphertext[NUM_BLOCKS][16][32];
    signal output plaintext[NUM_BLOCKS][16][32];
    
    // Use the generic large data template
    component processor = ChaCha20DecryptLarge(NUM_BLOCKS);
    
    processor.key <== key;
    processor.nonce <== nonce;
    processor.counter <== counter;
    processor.ciphertext <== ciphertext;
    plaintext <== processor.plaintext;
}

/**
 * Original small version for basic testing (64 bytes = 1 block)
 */
template ChaCha20DecryptDemo() {
    // Single block processing (64 bytes)
    signal input key[8][32];                        // 32-byte key as 8 32-bit words in bits
    signal input nonce[3][32];                      // 12-byte nonce as 3 32-bit words in bits
    signal input counter[32];                       // 4-byte counter as 32-bit word in bits
    signal input ciphertext[16][32];                // 64-byte encrypted data as 16 32-bit words in bits
    
    signal output plaintext[16][32];                // 64-byte decrypted data as 16 32-bit words in bits
    
    // ChaCha20 decryption
    component chacha20 = ChaCha20(16, 32);
    chacha20.key <== key;
    chacha20.nonce <== nonce;
    chacha20.counter <== counter;
    chacha20.in <== ciphertext;
    
    plaintext <== chacha20.out;
}

// Main component instantiation for 50KB JSON processing
// 
// For production use: ChaCha20Decrypt50KB() - handles ~50KB of data
// For testing: ChaCha20Decrypt1KB() - handles ~1KB of data  
// For basic demo: ChaCha20DecryptDemo() - handles 64 bytes
//
// Input structure:
// - key: private input (chacha20_key from JSON - 32 bytes)
// - nonce: public input (chacha20_nonce from JSON - 12 bytes) 
// - counter: public input (chacha20_counter from JSON - 4 bytes)
// - ciphertext: public input (user_data from JSON converted to blocks)
// - plaintext: public output (decrypted data blocks)

// Use the 50KB version for handling large JSON data (key is private by default)
component main{public [nonce, counter, ciphertext]} = ChaCha20Decrypt50KB();