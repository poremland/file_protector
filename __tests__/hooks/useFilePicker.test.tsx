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
import { renderHook, waitFor } from "@testing-library/react-native";
import { useFilePicker } from "../../src/hooks/useFilePicker";
import * as DocumentPicker from "expo-document-picker";

jest.mock("expo-document-picker", () => ({
	getDocumentAsync: jest.fn(),
}));

describe("useFilePicker", () => {
	beforeEach(() => {
		(DocumentPicker.getDocumentAsync as jest.Mock).mockClear();
	});

	it("should call document picker when no uri is provided", async () => {
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
		(DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue(
			mockDocResult,
		);

		const { result } = renderHook(() => useFilePicker());

		await waitFor(() => {
			expect(result.current).toEqual(mockDocResult);
		});
		expect(DocumentPicker.getDocumentAsync).toHaveBeenCalled();
	});

	it("should not call document picker when a uri is provided", async () => {
		const { result } = renderHook(() => useFilePicker("file://test.txt"));

		await waitFor(() => {
			expect(result.current?.assets?.[0].name).toEqual("test.txt");
		});

		expect(DocumentPicker.getDocumentAsync).not.toHaveBeenCalled();
	});
});
