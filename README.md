# License

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

---

# File Protector: App Goals and Requirements

This project is a React Native Expo application called "File Protector". The main goal is to create a mobile app that can encrypt and decrypt files in a way that is compatible with the following OpenSSL commands:
- Encrypt: `openssl des3 -md md5 -salt -in "$1" -out "$1.encrypted" -pass pass:$ENCRYPTPWD`
- Decrypt: `openssl des3 -md md5 -d -salt -in "$1" -out "$OUTPUTFILE" -pass pass:$ENCRYPTPWD`

## Key Features:
- **Encryption/Decryption Workflows:** The app provides a user interface to select a file, enter a password (optional), choose a cipher (default: des3), and a message digest (default: md5) to perform the encryption or decryption.
- **File Handling:** The app can select files from the device storage and save the processed files.
- **Sharing:** The app can be a share target for files from other applications. It should be able to handle both encrypted (`.encrypted`) and unencrypted files and trigger the corresponding workflow.
- **Dynamic Configuration:** The project uses a `app.config.base.json` file as a template and a `app.config.js` file to dynamically generate the `app.json` for different build environments, including handling of Android keystore configuration.
- **Local Builds:** The project is set up for local Android builds using a custom npm script `build:android:local`.
