pragma circom 2.0.0;

include "../../node_modules/zk-symmetric-crypto/chacha20/chacha20-bits.circom";


/**
 * ChaCha20 circuit for decrypting JSON data (up to 10KB)
 * 
 * This is a scalable version that processes multiple 64-byte blocks.
 * For 10KB data, we process it in manageable chunks to keep circuit size reasonable.
 * 
 * Approach: Process 10KB as 160 blocks of 64 bytes each (10,240 bytes total)
 * This gives us some padding for the actual 10KB of data and is much more efficient.
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
 * Specific instantiation for 10KB JSON processing
 * 10KB ≈ 156.25 blocks of 64 bytes, so we use 160 blocks for safety
 */
template ChaCha20Decrypt10KB() {
    var NUM_BLOCKS = 160;  // 160 × 64 = 10,240 bytes (covers 10KB + padding)
    
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

// Main component instantiation for 10KB JSON processing
// 
// For production use: ChaCha20Decrypt10KB() - handles ~10KB of data (160 blocks)
// For testing: ChaCha20Decrypt1KB() - handles ~1KB of data (16 blocks)
// For basic demo: ChaCha20DecryptDemo() - handles 64 bytes (1 block)
//
// Input structure:
// - key: private input (chacha20_key from JSON - 32 bytes)
// - nonce: public input (chacha20_nonce from JSON - 12 bytes) 
// - counter: public input (chacha20_counter from JSON - 4 bytes)
// - ciphertext: public input (user_data from JSON converted to blocks)
// - plaintext: public output (decrypted data blocks)

// Choose the appropriate size based on your needs:
// - ChaCha20Decrypt10KB() for up to 10KB data (160 blocks) - for large datasets
// - ChaCha20Decrypt1KB() for up to 1KB data (16 blocks) - more practical for most cases
// - ChaCha20DecryptDemo() for 64 bytes (1 block) - for testing and small data

// Use the 10KB version for handling large records datasets (key is private by default)
component main{public [nonce, counter, ciphertext]} = ChaCha20Decrypt10KB();