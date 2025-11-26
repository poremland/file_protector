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
import "react-native-get-random-values"; // Import the polyfill for crypto.getRandomValues
import { encrypt, decrypt } from "../src/crypto";
import * as fs from "fs";
import * as path from "path";

// Helper function to convert a string to an ArrayBuffer
function stringToArrayBuffer(str: string): ArrayBuffer {
	const buf = new ArrayBuffer(str.length);
	const bufView = new Uint8Array(buf);
	for (let i = 0, strLen = str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return buf;
}

// Helper function to convert an ArrayBuffer to a string
function arrayBufferToString(buf: ArrayBuffer): string {
	return String.fromCharCode.apply(null, new Uint8Array(buf) as any);
}

// Helper to convert Node Buffer to ArrayBuffer
function toArrayBuffer(buffer: Buffer): ArrayBuffer {
	const ab = new ArrayBuffer(buffer.length);
	const view = new Uint8Array(ab);
	for (let i = 0; i < buffer.length; ++i) {
		view[i] = buffer[i];
	}
	return ab;
}

describe("Crypto", () => {
	const plainText = "Hello, World!";
	const plainTextArrayBuffer = stringToArrayBuffer(plainText);
	const password = "test-password";

	it("should encrypt and decrypt successfully with a password", async () => {
		const encrypted = await encrypt(plainTextArrayBuffer, password, "des3", "md5");
		expect(encrypted).not.toEqual(plainText);
		const decryptedArrayBuffer = await decrypt(
			encrypted,
			password,
			"des3",
			"md5",
		);
		expect(arrayBufferToString(decryptedArrayBuffer)).toEqual(plainText);
	});

	it("should fail to decrypt with the wrong password", async () => {
		const encrypted = await encrypt(plainTextArrayBuffer, password, "des3", "md5");
		try {
			const decrypted = await decrypt(
				encrypted,
				"wrong-password",
				"des3",
				"md5",
			);
			// If it doesn't throw, the output must NOT match the plaintext
			expect(arrayBufferToString(decrypted)).not.toEqual(plainText);
		} catch (e: any) {
			expect(e.message).toBe(
				"Decryption failed. Incorrect password or corrupt file.",
			);
		}
	});

	it("should encrypt and decrypt successfully without a password", async () => {
		const encrypted = await encrypt(plainTextArrayBuffer, "", "des3", "md5");
		expect(encrypted).not.toEqual(plainText);
		const decryptedArrayBuffer = await decrypt(encrypted, "", "des3", "md5");
		expect(arrayBufferToString(decryptedArrayBuffer)).toEqual(plainText);
	});

	it("should decrypt a file encrypted with OpenSSL CLI", async () => {
		const readmePath = path.join(__dirname, "../README.md");
		const encryptedPath = path.join(__dirname, "./assets/README.md.encrypted");

		if (fs.existsSync(encryptedPath)) {
			const originalContent = fs.readFileSync(readmePath, "utf-8");
			const encryptedBuffer = fs.readFileSync(encryptedPath);
			const encryptedArrayBuffer = toArrayBuffer(encryptedBuffer);

			const decryptedArrayBuffer = await decrypt(
				encryptedArrayBuffer,
				"test",
				"des3",
				"md5",
			);
			const decryptedContent = arrayBufferToString(decryptedArrayBuffer);

			// Normalize line endings for comparison (Windows vs Unix)
			expect(decryptedContent.replace(/\r\n/g, "\n")).toEqual(
				originalContent.replace(/\r\n/g, "\n"),
			);
		} else {
			console.warn("assets/README.md.encrypted not found, skipping OpenSSL compatibility test");
		}
	});
});