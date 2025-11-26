/*
File Protector: A mobile application for encrypting and decrypting files.
Copyright (C) 2025 Paul Oremland

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import CryptoJS from "crypto-js";

// Helper to convert ArrayBuffer to WordArray
function arrayBufferToWordArray(ab: ArrayBuffer): CryptoJS.lib.WordArray {
	const ua = new Uint8Array(ab);
	const words: number[] = [];
	for (let i = 0; i < ua.length; i += 4) {
		let word = (ua[i] << 24) | (ua[i + 1] << 16) | (ua[i + 2] << 8) | ua[i + 3];
		words.push(word);
	}
	return CryptoJS.lib.WordArray.create(words, ua.length);
}

// Helper to convert WordArray to ArrayBuffer
function wordArrayToArrayBuffer(
	wordArray: CryptoJS.lib.WordArray,
): ArrayBuffer {
	const len = wordArray.sigBytes;
	const words = wordArray.words;
	const ab = new ArrayBuffer(len);
	const ua = new Uint8Array(ab);
	for (let i = 0; i < len; i++) {
		ua[i] = (words[Math.floor(i / 4)] >>> (8 * (3 - (i % 4)))) & 0xff;
	}
	return ab;
}

// Helper to yield execution to the event loop to prevent UI freeze
const yieldToLoop = () => new Promise((resolve) => setTimeout(resolve, 0));

export async function encrypt(
	data: ArrayBuffer,
	password: string = "",
	cipher?: string,
	digest?: string,
	onProgress?: (percent: number) => void,
): Promise<ArrayBuffer> {
	// 1. Generate Salt (8 bytes)
	const salt = CryptoJS.lib.WordArray.random(8);

	// 2. Derive Key/IV using OpenSSL KDF (compatible with openssl command)
	// TripleDES key size: 6 words (192 bits), IV size: 2 words (64 bits)
	const keySize = 6;
	const ivSize = 2;
	const kdf = CryptoJS.kdf.OpenSSL.execute(password, keySize, ivSize, salt);
	const key = kdf.key;
	const iv = kdf.iv;

	// 3. Create Encryptor
	// @ts-ignore - Accessing algo directly
	const encryptor = CryptoJS.algo.TripleDES.createEncryptor(key, { iv: iv });

	// 4. Process Chunks
	const chunkSize = 1024 * 512; // 512KB chunks
	const totalSize = data.byteLength;
	let offset = 0;
	const cipherParts: CryptoJS.lib.WordArray[] = [];

	while (offset < totalSize) {
		const chunk = data.slice(offset, offset + chunkSize);
		const chunkWord = arrayBufferToWordArray(chunk);
		const encryptedChunk = encryptor.process(chunkWord);
		if (encryptedChunk.sigBytes > 0) {
			cipherParts.push(encryptedChunk);
		}
		offset += chunkSize;
		if (onProgress) onProgress(Math.min(offset / totalSize, 1));
		await yieldToLoop();
	}

	const finalChunk = encryptor.finalize();
	if (finalChunk.sigBytes > 0) {
		cipherParts.push(finalChunk);
	}

	// 5. Construct OpenSSL format: Salted__ (8 bytes) + Salt (8 bytes) + Ciphertext
	const saltedHeader = CryptoJS.enc.Latin1.parse("Salted__");
	const combined = saltedHeader.concat(salt);
	cipherParts.forEach((part) => combined.concat(part));

	// Convert final WordArray to ArrayBuffer
	return wordArrayToArrayBuffer(combined);
}

export async function decrypt(
	data: ArrayBuffer,
	password: string = "",
	cipher?: string,
	digest?: string,
	onProgress?: (percent: number) => void,
): Promise<ArrayBuffer> {
	try {
		// 1. Parse Header
		// Expected format: Salted__ (8 bytes) + Salt (8 bytes) + Ciphertext
		if (data.byteLength < 16) {
			throw new Error("File too short.");
		}

		const saltBuffer = data.slice(8, 16);
		const salt = arrayBufferToWordArray(saltBuffer);

		// 2. Derive Key/IV
		const keySize = 6;
		const ivSize = 2;
		const kdf = CryptoJS.kdf.OpenSSL.execute(password, keySize, ivSize, salt);
		const key = kdf.key;
		const iv = kdf.iv;

		// 3. Create Decryptor
		// @ts-ignore
		const decryptor = CryptoJS.algo.TripleDES.createDecryptor(key, { iv: iv });

		// 4. Process Chunks
		const chunkSize = 1024 * 512; // 512KB
		let offset = 16; // Skip header
		const totalSize = data.byteLength;
		const plainParts: CryptoJS.lib.WordArray[] = [];

		while (offset < totalSize) {
			const chunk = data.slice(offset, offset + chunkSize);
			const chunkWord = arrayBufferToWordArray(chunk);
			const decryptedChunk = decryptor.process(chunkWord);
			if (decryptedChunk.sigBytes > 0) {
				plainParts.push(decryptedChunk);
			}
			offset += chunkSize;
			if (onProgress) onProgress(Math.min(offset / totalSize, 1));
			await yieldToLoop();
		}

		const finalChunk = decryptor.finalize();
		if (finalChunk.sigBytes > 0) {
			plainParts.push(finalChunk);
		}

		// Check if successful (arbitrary check, but usually sigBytes is valid)
		const totalSigBytes = plainParts.reduce((acc, p) => acc + p.sigBytes, 0);
		if (totalSigBytes <= 0 && plainParts.length > 0 && data.byteLength > 16) {
			// Note: Valid empty file encrypted is possible, but unlikely to be <= 0 if parts exist?
			// Actually, if decryption fails (bad padding), finalize throws or returns error?
			// In chunked mode, finalize() might throw PaddingError.
			// We let it bubble to catch.
		}

		const combined = CryptoJS.lib.WordArray.create();
		plainParts.forEach((p) => combined.concat(p));

		return wordArrayToArrayBuffer(combined);
	} catch (e) {
		console.error("Decryption error:", e);
		throw new Error("Decryption failed. Incorrect password or corrupt file.");
	}
}