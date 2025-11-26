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
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import WorkflowScreen from "../app/workflow";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { useFilePicker } from "../src/hooks/useFilePicker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { encrypt, decrypt } from "../src/crypto";
import { Alert } from "react-native";
import { Buffer } from "buffer"; // Import Buffer here

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

jest.mock("expo-router", () => ({
	useLocalSearchParams: jest.fn(),
	useRouter: jest.fn(() => ({
		back: jest.fn(),
		push: jest.fn(),
	})),
	useNavigation: jest.fn(() => ({
		setOptions: jest.fn(),
	})),
}));

// Mock the custom hook
jest.mock("../src/hooks/useFilePicker");

// Mock react-native-picker-select
jest.mock("react-native-picker-select", () => "Picker");

jest.mock("expo-file-system/legacy", () => ({
	readAsStringAsync: jest.fn(),
	writeAsStringAsync: jest.fn(),
	documentDirectory: "file:///documents/",
	StorageAccessFramework: {
		requestDirectoryPermissionsAsync: jest.fn(),
		createFileAsync: jest.fn(),
	},
}));
jest.mock("expo-sharing");
jest.mock("../src/crypto");

describe("<WorkflowScreen />", () => {
	beforeEach(() => {
		(encrypt as jest.Mock).mockClear();
		(decrypt as jest.Mock).mockClear();
		(FileSystem.readAsStringAsync as jest.Mock).mockClear();
		(FileSystem.writeAsStringAsync as jest.Mock).mockClear();
		(Sharing.shareAsync as jest.Mock).mockClear();
		// Ensure useRouter is mocked to return an object with back and push functions
		(useRouter as jest.Mock).mockReturnValue({
			back: jest.fn(),
			push: jest.fn(),
		});
	});

	it("should show encrypt workflow and render UI correctly", async () => {
		const mockDocResult: DocumentPicker.DocumentPickerSuccessResult = {
			canceled: false,
			assets: [
				{
					uri: "file://test.txt",
					name: "test.txt",
					mimeType: "text/plain",
					size: 123,
				},
			],
		};
		(useLocalSearchParams as jest.Mock).mockReturnValue({ type: "encrypt" });
		(useFilePicker as jest.Mock).mockReturnValue(mockDocResult);
		(FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
			Buffer.from("file content").toString("base64"),
		);

		const { getByText, findByText, queryByText, getByPlaceholderText } = render(
			<WorkflowScreen />,
		);

		await findByText("test.txt");

		// Check for the main UI components
		expect(getByText("Cipher:")).toBeTruthy();
		expect(getByPlaceholderText("Enter password")).toBeTruthy();
		expect(getByText("Encrypt")).toBeTruthy();

		// Check that digest is not visible
		expect(queryByText("Digest:")).toBeNull();

		// Enter password and check if digest becomes visible
		const passwordInput = getByPlaceholderText("Enter password");
		fireEvent.changeText(passwordInput, "test-password");
		expect(getByText("Digest:")).toBeTruthy();
	});

	it("should show decrypt workflow", async () => {
		const mockDocResult: DocumentPicker.DocumentPickerSuccessResult = {
			canceled: false,
			assets: [
				{
					uri: "file://test.txt.encrypted",
					name: "test.txt.encrypted",
					mimeType: "application/octet-stream",
					size: 456,
				},
			],
		};
		(useLocalSearchParams as jest.Mock).mockReturnValue({ type: "decrypt" });
		(useFilePicker as jest.Mock).mockReturnValue(mockDocResult);
		(FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
			Buffer.from("encrypted file content").toString("base64"),
		);

		const { findByText } = render(<WorkflowScreen />);

		await findByText("test.txt.encrypted");
	});

	it("should call encrypt and share the file", async () => {
		const mockDocResult: DocumentPicker.DocumentPickerSuccessResult = {
			canceled: false,
			assets: [
				{
					uri: "file://test.txt",
					name: "test.txt",
					mimeType: "text/plain",
					size: 123,
				},
			],
		};
		const plainTextContent = "test file content";
		const plainTextArrayBuffer = stringToArrayBuffer(plainTextContent);
		const base64EncodedContent =
			Buffer.from(plainTextContent).toString("base64");

		const encryptedContent = "encrypted content";
		const encryptedContentArrayBuffer = stringToArrayBuffer(encryptedContent);

		(useLocalSearchParams as jest.Mock).mockReturnValue({ type: "encrypt" });
		(useFilePicker as jest.Mock).mockReturnValue(mockDocResult);
		(FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
			base64EncodedContent,
		);
		(encrypt as jest.Mock).mockResolvedValue(encryptedContentArrayBuffer);

		const { getByText, findByText, getByTestId } = render(<WorkflowScreen />);

		const encryptButton = getByTestId("action-button");
		await waitFor(() => {
			// Check accessibility state or prop depending on what RNTL exposes
			// For TouchableOpacity, 'disabled' prop should be passed
			expect(encryptButton.props.accessibilityState?.disabled).not.toBe(true);
			expect(encryptButton.props.disabled).toBeFalsy();
		});
		await act(async () => {
			fireEvent.press(encryptButton);
		});

		await waitFor(() => {
			expect(encrypt).toHaveBeenCalledWith(
				plainTextArrayBuffer,
				"",
				"des3",
				"md5",
				expect.any(Function),
			);
			expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
				"file:///documents/test.txt.encrypted",
				Buffer.from(encryptedContentArrayBuffer).toString("base64"),
				{ encoding: "base64" },
			);
			expect(Sharing.shareAsync).toHaveBeenCalledWith(
				"file:///documents/test.txt.encrypted",
			);
		});
	});

	it("should call decrypt and share the file", async () => {
		const mockDocResult: DocumentPicker.DocumentPickerSuccessResult = {
			canceled: false,
			assets: [
				{
					uri: "file://test.txt.encrypted",
					name: "test.txt.encrypted",
					mimeType: "application/octet-stream",
					size: 456,
				},
			],
		};
		const encryptedContent = "encrypted file content";
		const encryptedContentArrayBuffer = stringToArrayBuffer(encryptedContent);
		const base64EncodedEncryptedContent =
			Buffer.from(encryptedContent).toString("base64");

		const decryptedContentPlain = "decrypted file content";
		const decryptedContentArrayBuffer = stringToArrayBuffer(
			decryptedContentPlain,
		);

		(useLocalSearchParams as jest.Mock).mockReturnValue({ type: "decrypt" });
		(useFilePicker as jest.Mock).mockReturnValue(mockDocResult);
		(FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
			base64EncodedEncryptedContent,
		);
		(decrypt as jest.Mock).mockResolvedValue(decryptedContentArrayBuffer);

		const { getByText, findByText, getByTestId } = render(<WorkflowScreen />);

		const decryptButton = getByTestId("action-button");
		await waitFor(() => expect(decryptButton.props.disabled).toBeFalsy());
		await act(async () => {
			fireEvent.press(decryptButton);
		});

		await waitFor(() => {
			expect(decrypt).toHaveBeenCalledWith(
				encryptedContentArrayBuffer,
				"",
				"des3",
				"md5",
				expect.any(Function),
			);
			expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
				"file:///documents/test.txt",
				Buffer.from(decryptedContentArrayBuffer).toString("base64"),
				{ encoding: "base64" },
			);
			expect(Sharing.shareAsync).toHaveBeenCalledWith(
				"file:///documents/test.txt",
			);
		});
	});

	it("should show an alert and go back if an invalid file is selected for decryption", async () => {
		const mockDocResult: DocumentPicker.DocumentPickerSuccessResult = {
			canceled: false,
			assets: [
				{
					uri: "file://test.txt",
					name: "test.txt",
					mimeType: "text/plain",
					size: 123,
				},
			],
		};
		const mockRouter = { back: jest.fn() };
		(useLocalSearchParams as jest.Mock).mockReturnValue({ type: "decrypt" });
		(useFilePicker as jest.Mock).mockReturnValue(mockDocResult);
		(useRouter as jest.Mock).mockReturnValue(mockRouter);
		const alertSpy = jest.spyOn(Alert, "alert");

		render(<WorkflowScreen />);

		await waitFor(() => {
			expect(alertSpy).toHaveBeenCalledWith(
				"Invalid File",
				"Please select a .encrypted file for decryption.",
			);
			expect(mockRouter.back).toHaveBeenCalled();
		});
	});

	it("should show progress bar while reading file content", async () => {
		const mockDocResult: DocumentPicker.DocumentPickerSuccessResult = {
			canceled: false,
			assets: [
				{
					uri: "file://test.txt",
					name: "test.txt",
					mimeType: "text/plain",
					size: 123,
				},
			],
		};

		let resolveRead: (value: string) => void = () => {};
		const readPromise = new Promise<string>((resolve) => {
			resolveRead = resolve;
		});

		(useLocalSearchParams as jest.Mock).mockReturnValue({ type: "encrypt" });
		(useFilePicker as jest.Mock).mockReturnValue(mockDocResult);
		(FileSystem.readAsStringAsync as jest.Mock).mockReturnValue(readPromise);

		const { getByText, queryByText } = render(<WorkflowScreen />);

		// Expect progress bar to be visible (shows 0%)
		await waitFor(() => expect(getByText("0%")).toBeTruthy());

		// Resolve the file read
		await act(async () => {
			resolveRead(Buffer.from("content").toString("base64"));
		});

		// Expect progress bar to be gone
		await waitFor(() => expect(queryByText("0%")).toBeNull());
	});
});