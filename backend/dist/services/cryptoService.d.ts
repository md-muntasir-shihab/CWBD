/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a colon-delimited hex string: iv:authTag:ciphertext
 */
export declare function encrypt(plaintext: string): string;
/**
 * Decrypt a ciphertext string that was produced by `encrypt`.
 * Throws if the input is malformed or the auth tag does not verify.
 */
export declare function decrypt(ciphertext: string): string;
//# sourceMappingURL=cryptoService.d.ts.map