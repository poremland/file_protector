# File Protector

File Protector is a React Native Expo application designed to encrypt and decrypt files on mobile devices and the web. It ensures compatibility with standard OpenSSL commands, allowing for secure file handling and sharing.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [Testing](#testing)
- [Building](#building)
- [Configuration](#configuration)
- [License](#license)

## Features

- **Encryption/Decryption Workflows:** User interface to select a file, enter a password, and choose cipher/digest (default: `des3` / `md5`).
  - **Encrypt:** `openssl des3 -md md5 -salt -in "$1" -out "$1.encrypted" -pass pass:$ENCRYPTPWD`
  - **Decrypt:** `openssl des3 -md md5 -d -salt -in "$1" -out "$OUTPUTFILE" -pass pass:$ENCRYPTPWD`
- **File Handling:** Select files from device storage and save processed files.
- **Sharing:** Acts as a share target for files from other apps (supports `.encrypted` and unencrypted files).

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (LTS recommended)
- [Git](https://git-scm.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (optional, can use `npx`)
- **Mobile Development Environment:**
  - [Android Studio](https://developer.android.com/studio) (for Android)
  - [Xcode](https://developer.apple.com/xcode/) (for iOS, macOS only)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/poremland/file_protector.git
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd file_protector
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

## Running the App

Start the development server:

```bash
npx expo start
```

From the Expo dashboard, you can:
- Press `a` to run on Android Emulator.
- Press `i` to run on iOS Simulator.
- Scan the QR code with the Expo Go app on your physical device.

### Platform-Specific Commands
- **Android:** `npx expo run:android`
- **iOS:** `npx expo run:ios`
- **Web:** `npx expo start --web`

## Testing

Run the test suite using Jest:

```bash
npx jest
```

## Building

### Local Android Build
The project includes a custom script for local Android builds that handles dynamic configuration.

```bash
npm run build:android:local
```
*This command generates `app.json` from `app.config.base.json`, runs `npx expo prebuild`, and executes the Gradle build.*

### Android Release Keystore Configuration

For building signed Android release APKs, you need to provide your keystore details via environment variables. These variables are consumed by `app.config.js` during the prebuild process to configure the Android keystore.

Set the following environment variables before running the build command:

-   `ANDROID_KEYSTORE_PATH`: The absolute path to your `.keystore` file.
-   `ANDROID_KEYSTORE_ALIAS`: The alias for your key within the keystore.
-   `ANDROID_KEYSTORE_PASSWORD`: The password for your keystore and your key (if it's the same as the keystore password).

Example (for Linux/macOS):

```bash
export ANDROID_KEYSTORE_PATH="/path/to/your/keystore.keystore"
export ANDROID_KEYSTORE_ALIAS="your_alias_name"
export ANDROID_KEYSTORE_PASSWORD="your_keystore_password"
npx expo prebuild --platform android # This step is crucial for `app.json` and keystore config
npm run build:android:local
```

For Windows, you would typically set these using `set` command or PowerShell's `$env:` syntax before executing the build.

## Configuration

- **Dynamic Config:** The project uses `app.config.base.json` as a template. `app.config.js` dynamically generates the final `app.json` for different environments (e.g., handling Android keystore configurations).

## License

**Copyright (C) 2025 Paul Oremland**

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
