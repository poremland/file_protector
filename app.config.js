/*
 * File Protector: A mobile application for encrypting and decrypting files.
 * Copyright (C) 2025 Paul Oremland
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

module.exports = ({ config }) => {
	const baseConfig = require("./app.config.base.json");

	const keystorePassword = process.env.ANDROID_KEYSTORE_PASSWORD;
	const keystoreAlias = process.env.ANDROID_KEYSTORE_ALIAS;
	const keyPassword = process.env.ANDROID_KEYSTORE_PASSWORD;
	const keystorePath = process.env.ANDROID_KEYSTORE_PATH;

	// Start with the base config, which is the 'expo' object
	let finalConfig = { ...baseConfig };

	if (keystorePassword && keystoreAlias && keyPassword) {
		finalConfig.android = {
			...finalConfig.android,
			useProguard: true,
			package: "net.oremland.fileprotector",
			build: {
				gradleCommand: ":app:assembleRelease",
				keystore: {
					path: keystorePath,
					alias: keystoreAlias,
					password: keystorePassword,
					keyPassword: keyPassword,
				},
			},
		};
	}

	if (!finalConfig.plugins) {
		finalConfig.plugins = [];
	}
	finalConfig.plugins.push(require('./plugins/withAndroidAbiSplits.js'));

	return finalConfig;
};
