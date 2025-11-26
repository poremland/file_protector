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
import { useEffect, useState } from "react";
import * as DocumentPicker from "expo-document-picker";

export function useFilePicker(uri?: string) {
	const [result, setResult] =
		useState<DocumentPicker.DocumentPickerResult | null>(null);

	useEffect(() => {
		const handleUri = async () => {
			if (uri) {
				const name = uri.split("/").pop();
				setResult({
					canceled: false,
					assets: [{ uri, name: name || "", mimeType: "", size: 0 }],
				});
			} else {
				const doc = await DocumentPicker.getDocumentAsync();
				setResult(doc);
			}
		};
		handleUri();
	}, [uri]);

	return result;
}
