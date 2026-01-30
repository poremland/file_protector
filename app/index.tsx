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
import { useRouter, useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Button, Text, Image, Platform } from "react-native";
import { useEffect } from "react";
import * as Linking from "expo-linking";
import { useShareIntent } from "expo-share-intent";

export default function HomeScreen() {
	const router = useRouter();
	const navigation = useNavigation();
	const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

	useEffect(() => {
		navigation.setOptions({ title: "Choose a workflow" });
	}, [navigation]);

	const handleUrl = (url: string, fileName?: string) => {
		// The url is the file uri
		if (url) {
			const nameToCheck = fileName || url; // Prioritize fileName if available, otherwise use the URL

			if (nameToCheck.endsWith(".encrypted")) {
				router.push({
					pathname: "/workflow",
					params: { type: "decrypt", uri: url },
				});
			} else if (
				nameToCheck.startsWith("file://") ||
				nameToCheck.startsWith("content://") ||
				fileName
			) {
				// If it's a file:// URI or we have a fileName (implying a shared file)
				router.push({
					pathname: "/workflow",
					params: { type: "encrypt", uri: url },
				});
			}
		}
	};

	useEffect(() => {
		if (hasShareIntent && shareIntent.files && shareIntent.files.length > 0) {
			const firstFile = shareIntent.files[0];
			// Use 'path' as per ShareIntentFile definition
			handleUrl(firstFile.path, firstFile.fileName);
			resetShareIntent();
		} else {
			// Fallback to Expo Linking for regular deep links
			Linking.getInitialURL().then((url) => {
				if (url) {
					handleUrl(url);
				}
			});
		}
	}, [hasShareIntent, shareIntent, resetShareIntent]);

	useEffect(() => {
		const subscription = Linking.addEventListener("url", (event) => {
			handleUrl(event.url);
		});

		return () => {
			subscription.remove();
		};
	}, []);

	return (
		<View style={styles.container}>
			<Image
				testID="app-logo"
				source={require("../assets/icon.png")}
				style={styles.logo}
			/>
			<Text style={styles.title}>File Protector</Text>
			<Text style={styles.subtitle}>
				Encrypt and decrypt your files with ease.
			</Text>
			<View style={styles.buttonContainer}>
				<Button
					title="Encrypt a file"
					onPress={() =>
						router.push({ pathname: "/workflow", params: { type: "encrypt" } })
					}
					color="#3498DB"
				/>
			</View>
			<View style={styles.buttonContainer}>
				<Button
					title="Decrypt a file"
					onPress={() =>
						router.push({ pathname: "/workflow", params: { type: "decrypt" } })
					}
					color="#3498DB"
				/>
			</View>
			<StatusBar style="auto" />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F5F5",
		alignItems: "center",
		justifyContent: "center",
		padding: 20,
	},
	logo: {
		width: 100,
		height: 100,
		marginBottom: 20,
	},
	title: {
		fontSize: 32,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 10,
	},
	subtitle: {
		fontSize: 16,
		color: "#666",
		marginBottom: 40,
		textAlign: "center",
	},
	buttonContainer: {
		width: "80%",
		marginVertical: 10,
	},
});
