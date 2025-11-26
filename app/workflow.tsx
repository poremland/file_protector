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
import {
	View,
	Text,
	TextInput,
	StyleSheet,
	Alert,
	Platform,
	TouchableOpacity,
} from "react-native";
import { Buffer } from "buffer";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useFilePicker } from "../src/hooks/useFilePicker";
import { useEffect, useState } from "react";
import RNPickerSelect from "react-native-picker-select";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { encrypt, decrypt } from "../src/crypto";

export default function WorkflowScreen() {
	const { type, uri } = useLocalSearchParams<{ type: string; uri?: string }>();
	const result = useFilePicker(uri);
	const [password, setPassword] = useState("");
	const [cipher, setCipher] = useState("des3");
	const [digest, setDigest] = useState("md5");
	const [fileContent, setFileContent] = useState<ArrayBuffer | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const navigation = useNavigation();
	const router = useRouter();

	useEffect(() => {
		navigation.setOptions({
			title: type === "encrypt" ? "Encrypt File" : "Decrypt File",
		});
	}, [navigation, type]);

	useEffect(() => {
		if (result && result.canceled) {
			router.back();
			return;
		}
		if (result && "assets" in result) {
			if (
				type === "decrypt" &&
				!result.assets![0].name.endsWith(".encrypted")
			) {
				Alert.alert(
					"Invalid File",
					"Please select a .encrypted file for decryption.",
				);
				router.back();
				return;
			}
			const readFileContent = async () => {
				setIsProcessing(true);
				setProgress(0);
				let content: ArrayBuffer;
				try {
					if (Platform.OS === "web") {
						const response = await fetch(result.assets![0].uri);
						content = await response.arrayBuffer();
					} else {
						// For native, read as base64 and convert to ArrayBuffer
						const base64Content = await FileSystem.readAsStringAsync(
							result.assets![0].uri,
							{
								encoding: "base64",
							},
						);
						const buffer = Buffer.from(base64Content, "base64");
						content = buffer.buffer; // Get the underlying ArrayBuffer
					}
					setFileContent(content);
				} catch (e: any) {
					console.error("File reading failed:", e);
					Alert.alert(
						"Error",
						`File reading failed: ${e.message || "Unknown error"}`,
					);
				} finally {
					setIsProcessing(false);
					setProgress(0);
				}
			};
			readFileContent();
		}
	}, [result, type, router]);

	useEffect(() => {}, [result, fileContent]);

	const handlePress = async () => {
		if (!fileContent || !result || !("assets" in result)) {
			return;
		}

		setIsProcessing(true);
		setProgress(0);

		// Allow UI to update before starting heavy work
		await new Promise((resolve) => setTimeout(resolve, 100));

		try {
			let processedContent: ArrayBuffer;
			let newFileName: string;

			if (type === "encrypt") {
				processedContent = await encrypt(
					fileContent as ArrayBuffer,
					password,
					cipher,
					digest,
					(p) => setProgress(p),
				);
				newFileName = result.assets![0].name + ".encrypted";
			} else {
				processedContent = await decrypt(
					fileContent as ArrayBuffer,
					password,
					cipher,
					digest,
					(p) => setProgress(p),
				);
				newFileName = result.assets![0].name.replace(".encrypted", "");
			}

			if (Platform.OS === "web") {
				const blob = new Blob([processedContent], {
					type: "application/octet-stream",
				});
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.style.display = "none";
				a.href = url;
				a.download = newFileName;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			} else {
				// Android SAF check
				if (
					Platform.OS === "android" &&
					FileSystem.StorageAccessFramework
				) {
					const permissions =
						await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
					if (permissions.granted) {
						const uri =
							await FileSystem.StorageAccessFramework.createFileAsync(
								permissions.directoryUri,
								newFileName,
								"application/octet-stream",
							);
						const base64Content =
							Buffer.from(processedContent).toString("base64");
						await FileSystem.writeAsStringAsync(uri, base64Content, {
							encoding: "base64",
						});
						Alert.alert("Success", "File saved successfully!");
					} else {
						// Fallback to share if permission denied
						shareFile(processedContent, newFileName);
					}
				} else {
					// iOS or fallback
					shareFile(processedContent, newFileName);
				}
			}
		} catch (e: any) {
			console.error("Operation failed:", e);
			Alert.alert("Error", `Operation failed: ${e.message || "Unknown error"}`);
		} finally {
			setIsProcessing(false);
			setProgress(0);
		}
	};

	const shareFile = async (content: ArrayBuffer, fileName: string) => {
		if (FileSystem.documentDirectory) {
			const fileUri = FileSystem.documentDirectory + fileName;
			const base64Content = Buffer.from(content).toString("base64");
			await FileSystem.writeAsStringAsync(fileUri, base64Content, {
				encoding: "base64",
			});
			await Sharing.shareAsync(fileUri);
		} else {
			throw new Error("Document directory is not available.");
		}
	};

	const ciphers = [{ label: "DES3", value: "des3" }];
	const digests = [{ label: "MD5", value: "md5" }];

	return (
		<View style={styles.container}>
			{result && "assets" in result && (
				<Text style={styles.filename}>{result.assets?.[0].name}</Text>
			)}
			<Text style={styles.label}>Cipher:</Text>
			<RNPickerSelect
				onValueChange={(value) => setCipher(value)}
				items={ciphers}
				style={pickerSelectStyles}
				value={cipher}
			/>

			<Text style={styles.label}>Password:</Text>
			<TextInput
				style={styles.input}
				onChangeText={setPassword}
				value={password}
				placeholder="Enter password"
				secureTextEntry
			/>

			{password ? (
				<>
					<Text style={styles.label}>Digest:</Text>
					<RNPickerSelect
						onValueChange={(value) => setDigest(value)}
						items={digests}
						style={pickerSelectStyles}
						value={digest}
					/>
				</>
			) : null}

			{isProcessing && (
				<View style={styles.progressContainer}>
					<View
						style={[styles.progressBar, { width: `${progress * 100}%` }]}
					/>
					<Text style={styles.progressText}>
						{Math.round(progress * 100)}%
					</Text>
				</View>
			)}

			<View style={styles.buttonContainer}>
				<TouchableOpacity
					testID="action-button"
					onPress={handlePress}
					disabled={!fileContent || isProcessing}
					style={[
						styles.button,
						(!fileContent || isProcessing) && styles.buttonDisabled,
					]}
				>
					<Text style={styles.buttonText}>
						{type === "encrypt" ? "Encrypt" : "Decrypt"}
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5",
		padding: 20,
	},
	label: {
		fontSize: 16,
		color: "#333333",
		marginBottom: 5,
	},
	filename: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333333",
		marginBottom: 20,
		textAlign: "center",
	},
	input: {
		backgroundColor: "white",
		borderRadius: 5,
		padding: 15,
		marginBottom: 15,
		fontSize: 16,
		borderWidth: 1,
		borderColor: "#DDD",
	},
	buttonContainer: {
		marginTop: 20,
	},
	button: {
		backgroundColor: "#3498DB",
		padding: 15,
		borderRadius: 5,
		alignItems: "center",
	},
	buttonDisabled: {
		backgroundColor: "#BDC3C7",
	},
	buttonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	progressContainer: {
		height: 20,
		backgroundColor: "#E0E0E0",
		borderRadius: 10,
		marginVertical: 15,
		overflow: "hidden",
		justifyContent: "center",
	},
	progressBar: {
		height: "100%",
		backgroundColor: "#2ECC71",
		position: "absolute",
		left: 0,
		top: 0,
	},
	progressText: {
		textAlign: "center",
		fontSize: 12,
		color: "#333",
		zIndex: 1,
	},
});

const pickerSelectStyles = StyleSheet.create({
	inputIOS: {
		fontSize: 16,
		paddingVertical: 12,
		paddingHorizontal: 10,
		borderWidth: 1,
		borderColor: "#DDD",
		borderRadius: 4,
		color: "black",
		paddingRight: 30,
		backgroundColor: "white",
		marginBottom: 15,
	},
	inputAndroid: {
		fontSize: 16,
		paddingHorizontal: 10,
		paddingVertical: 8,
		borderWidth: 1,
		borderColor: "#DDD",
		borderRadius: 8,
		color: "black",
		paddingRight: 30,
		backgroundColor: "white",
		marginBottom: 15,
	},
});
