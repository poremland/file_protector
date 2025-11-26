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
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import HomeScreen from "../app/index";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";

// Mock the custom hook
const mockResetShareIntent = jest.fn();
const mockUseShareIntent = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: jest.fn(),
	useNavigation: jest.fn(() => ({
		setOptions: jest.fn(),
	})),
}));

jest.mock("expo-linking", () => ({
	getInitialURL: jest.fn(),
	addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock("expo-share-intent", () => ({
	useShareIntent: () => mockUseShareIntent(),
}));

describe("<HomeScreen />", () => {
	const mockRouter = {
		push: jest.fn(),
	};

	beforeEach(() => {
		(useRouter as jest.Mock).mockReturnValue(mockRouter);
		mockRouter.push.mockClear();
		(Linking.getInitialURL as jest.Mock).mockResolvedValue(null); // Default mock
		(Linking.addEventListener as jest.Mock).mockClear();
		mockResetShareIntent.mockClear();
		mockUseShareIntent.mockReturnValue({
			hasShareIntent: false,
			shareIntent: { files: [] },
			resetShareIntent: mockResetShareIntent,
		});
	});

	it("should display the app logo", () => {
		const { getByTestId } = render(<HomeScreen />);
		expect(getByTestId("app-logo")).toBeTruthy();
	});

	it("should display encrypt and decrypt options", () => {
		const { getByText } = render(<HomeScreen />);
		expect(getByText("Encrypt a file")).toBeTruthy();
		expect(getByText("Decrypt a file")).toBeTruthy();
	});

	it('navigates to the encrypt workflow when "Encrypt a file" is pressed', () => {
		const { getByText } = render(<HomeScreen />);
		fireEvent.press(getByText("Encrypt a file"));
		expect(mockRouter.push).toHaveBeenCalledWith({
			pathname: "/workflow",
			params: { type: "encrypt" },
		});
	});

	it('navigates to the decrypt workflow when "Decrypt a file" is pressed', () => {
		const { getByText } = render(<HomeScreen />);
		fireEvent.press(getByText("Decrypt a file"));
		expect(mockRouter.push).toHaveBeenCalledWith({
			pathname: "/workflow",
			params: { type: "decrypt" },
		});
	});

	it("should handle initial encrypted URL (deep link fallback)", async () => {
		(Linking.getInitialURL as jest.Mock).mockResolvedValue(
			"file://test.txt.encrypted",
		);
		render(<HomeScreen />);
		await waitFor(() => {
			expect(mockRouter.push).toHaveBeenCalledWith({
				pathname: "/workflow",
				params: { type: "decrypt", uri: "file://test.txt.encrypted" },
			});
		});
	});

	it("should handle initial unencrypted URL (deep link fallback)", async () => {
		(Linking.getInitialURL as jest.Mock).mockResolvedValue("file://test.txt");
		render(<HomeScreen />);
		await waitFor(() => {
			expect(mockRouter.push).toHaveBeenCalledWith({
				pathname: "/workflow",
				params: { type: "encrypt", uri: "file://test.txt" },
			});
		});
	});

	it("should handle incoming encrypted URL", () => {
		let callback: (event: { url: string }) => void = () => {};
		(Linking.addEventListener as jest.Mock).mockImplementation((type, cb) => {
			if (type === "url") {
				callback = cb;
			}
			return { remove: jest.fn() };
		});
		render(<HomeScreen />);
		callback({ url: "file://test.txt.encrypted" });
		expect(mockRouter.push).toHaveBeenCalledWith({
			pathname: "/workflow",
			params: { type: "decrypt", uri: "file://test.txt.encrypted" },
		});
	});

	it("should handle shared file via expo-share-intent (encrypted)", async () => {
		mockUseShareIntent.mockReturnValue({
			hasShareIntent: true,
			shareIntent: {
				files: [
					{ path: "content://some/path/file.enc", fileName: "file.encrypted" },
				],
			},
			resetShareIntent: mockResetShareIntent,
		});

		render(<HomeScreen />);
		await waitFor(() => {
			expect(mockRouter.push).toHaveBeenCalledWith({
				pathname: "/workflow",
				params: { type: "decrypt", uri: "content://some/path/file.enc" },
			});
			expect(mockResetShareIntent).toHaveBeenCalled();
		});
	});

	it("should handle shared file via expo-share-intent (unencrypted)", async () => {
		mockUseShareIntent.mockReturnValue({
			hasShareIntent: true,
			shareIntent: {
				files: [{ path: "content://some/path/file.txt", fileName: "file.txt" }],
			},
			resetShareIntent: mockResetShareIntent,
		});

		render(<HomeScreen />);
		await waitFor(() => {
			expect(mockRouter.push).toHaveBeenCalledWith({
				pathname: "/workflow",
				params: { type: "encrypt", uri: "content://some/path/file.txt" },
			});
			expect(mockResetShareIntent).toHaveBeenCalled();
		});
	});

	it("should fallback to Linking.getInitialURL if hasShareIntent is false", async () => {
		// mockUseShareIntent default return is hasShareIntent: false
		render(<HomeScreen />);
		await waitFor(() => {
			expect(Linking.getInitialURL).toHaveBeenCalled();
		});
	});
});
