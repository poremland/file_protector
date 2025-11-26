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

const { withAppBuildGradle } = require('@expo/config-plugins');

const withAndroidAbiSplits = (config) => {
	return withAppBuildGradle(config, (config) => {
		if (config.modResults.language === 'groovy') {
			config.modResults.contents = addSplitsBlock(config.modResults.contents);
		} else {
			throw new Error(
				"Cannot add ABI splits because the app's build.gradle is not groovy"
			);
		}
		return config;
	});
};

function addSplitsBlock(gradleFileContent) {
	const splitsBlock = `
    splits {
        abi {
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
            universalApk false
        }
    }
    `;

	// Add the splits block inside the android block
	return gradleFileContent.replace(
		/android\s*{/,
		`android {
${splitsBlock}`
	);
}

module.exports = withAndroidAbiSplits;
