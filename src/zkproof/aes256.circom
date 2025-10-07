pragma circom 2.0.0;

include "../../node_modules/zk-symmetric-crypto/aes/aes_nonce_ctr.circom";

/**
 * AES-256-CTR circuit for decrypting JSON data (up to 10KB)
 * 
 * This is a scalable version that processes multiple 16-byte blocks.
 * For 10KB data, we process it in manageable chunks to keep circuit size reasonable.
 * 
 * Approach: Process 10KB as 640 blocks of 16 bytes each (10,240 bytes total)
 * This gives us some padding for the actual 10KB of data.
 */

/**
 * Optimized AES-256-CTR circuit for large data processing
 * Processes data in configurable chunks to balance circuit size vs capability
 */
template AES256DecryptLarge(numBytes) {
    // AES processes data in bytes, each byte is 8 bits
    var BITS_PER_BYTE = 8;
    var AES_KEY_SIZE = 32; // 256 bits = 32 bytes
    
    // Inputs (key will be made private in main component)
    signal input key[AES_KEY_SIZE * BITS_PER_BYTE];    // 256-bit key as 256 bits
    signal input nonce[12 * BITS_PER_BYTE];            // 12-byte nonce as 96 bits
    signal input counter[4 * BITS_PER_BYTE];           // 4-byte counter as 32 bits
    signal input ciphertext[numBytes * BITS_PER_BYTE]; // Encrypted data in bits
    
    // Public outputs
    signal output plaintext[numBytes * BITS_PER_BYTE]; // Decrypted data in bits
    
    // Single AES-CTR decryption for all data
    component aes256 = AES_NONCE_CTR(numBytes, AES_KEY_SIZE);
    aes256.key <== key;
    aes256.nonce <== nonce;
    aes256.counter <== counter;
    aes256.in <== ciphertext;
    
    plaintext <== aes256.out;
}

/**
 * Specific instantiation for 20KB JSON processing
 * 20KB = 20,480 bytes
 */
template AES256Decrypt20KB() {
    var NUM_BYTES = 20480;  // 20KB
    
    // Define the interface first
    signal input key[256];               // 256-bit key
    signal input nonce[96];              // 96-bit nonce (12 bytes)
    signal input counter[32];            // 32-bit counter (4 bytes)
    signal input ciphertext[NUM_BYTES * 8]; // 20KB encrypted data
    signal output plaintext[NUM_BYTES * 8]; // 20KB decrypted data
    
    // Use the generic large data template
    component processor = AES256DecryptLarge(NUM_BYTES);
    
    // Pass through all signals
    processor.key <== key;
    processor.nonce <== nonce;
    processor.counter <== counter;
    processor.ciphertext <== ciphertext;
    plaintext <== processor.plaintext;
}

/**
 * Specific instantiation for 10KB JSON processing
 * 10KB = 10,240 bytes
 */
template AES256Decrypt10KB() {
    var NUM_BYTES = 10240;  // 10KB
    
    // Define the interface first
    signal input key[256];               // 256-bit key
    signal input nonce[96];              // 96-bit nonce (12 bytes)
    signal input counter[32];            // 32-bit counter (4 bytes)
    signal input ciphertext[NUM_BYTES * 8]; // 10KB encrypted data
    signal output plaintext[NUM_BYTES * 8]; // 10KB decrypted data
    
    // Use the generic large data template
    component processor = AES256DecryptLarge(NUM_BYTES);
    
    // Pass through all signals
    processor.key <== key;
    processor.nonce <== nonce;
    processor.counter <== counter;
    processor.ciphertext <== ciphertext;
    plaintext <== processor.plaintext;
}

/**
 * Smaller version for testing and development (1KB = 1,024 bytes)
 */
template AES256Decrypt1KB() {
    var NUM_BYTES = 1024;  // 1KB
    
    // Define the interface first
    signal input key[256];               // 256-bit key
    signal input nonce[96];              // 96-bit nonce (12 bytes)
    signal input counter[32];            // 32-bit counter (4 bytes)
    signal input ciphertext[NUM_BYTES * 8]; // 1KB encrypted data
    signal output plaintext[NUM_BYTES * 8]; // 1KB decrypted data
    
    // Use the generic large data template
    component processor = AES256DecryptLarge(NUM_BYTES);
    
    processor.key <== key;
    processor.nonce <== nonce;
    processor.counter <== counter;
    processor.ciphertext <== ciphertext;
    plaintext <== processor.plaintext;
}

/**
 * Original small version for basic testing (64 bytes)
 */
template AES256DecryptDemo() {
    var NUM_BYTES = 64;  // 64 bytes
    
    // Single block processing
    signal input key[256];               // 256-bit key
    signal input nonce[96];              // 96-bit nonce (12 bytes)
    signal input counter[32];            // 32-bit counter (4 bytes)
    signal input ciphertext[NUM_BYTES * 8]; // 64-byte encrypted data
    signal output plaintext[NUM_BYTES * 8]; // 64-byte decrypted data
    
    // AES-256-CTR decryption
    component aes256 = AES_NONCE_CTR(NUM_BYTES, 32);
    aes256.key <== key;
    aes256.nonce <== nonce;
    aes256.counter <== counter;
    aes256.in <== ciphertext;
    
    plaintext <== aes256.out;
}

// Main component instantiation for 10KB JSON processing
// 
// For production use: AES256Decrypt10KB() - handles ~10KB of data
// For testing: AES256Decrypt1KB() - handles ~1KB of data
// For basic demo: AES256DecryptDemo() - handles 64 bytes
//
// Input structure:
// - key: private input (aes256_key from JSON - 32 bytes = 256 bits)
// - nonce: public input (aes256_nonce from JSON - 12 bytes = 96 bits) 
// - counter: public input (aes256_counter from JSON - 4 bytes = 32 bits)
// - ciphertext: public input (user_data from JSON converted to bits)
// - plaintext: public output (decrypted data bits)

// Choose the appropriate size based on your needs:
// - AES256Decrypt20KB() for up to 20KB data - for very large datasets
// - AES256Decrypt10KB() for up to 10KB data - for large datasets
// - AES256Decrypt1KB() for up to 1KB data - more practical for most cases
// - AES256DecryptDemo() for 64 bytes - for testing and small data

// Use the 10KB version for comparison with ChaCha20 (key is private by default)
component main{public [nonce, counter, ciphertext]} = AES256Decrypt10KB();