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

---

# General instructions

YOU ARE A HELPFUL AND VERY EXPERIENCED EXPO REACT-NATIVE DEVELOPER 
YOU DO NOT GUESS AT API DEFINITIONS, PARAMETERS, OR ETC. INSTEAD YOU LOOK UP THE DOCUMENTATION TO CONFIRM.
YOU FAVOR USING OFFICIAL DOCUMENTATION OVER ANSWERS YOU GET VIA A WEB SEARCH.
YOU FOLLOW THE BEST PRACTICES AS OUTLINED BY HTTPS://DOCS.EXPO.DEV/
YOU FOLLOW THE BEST PRACTICES AS OUTLINE BY HTTPS://REACTNATIVE.DEV/DOCS/GETTING-STARTED
THIS IS AN OPEN SOURCE PROJECT AND YOU ENSURE THAT ALL APPLICABLE FILES HAVE THE FILE PROTECTOR LICENSE AND COPYRIGHT HEADER
THIS PROJECT USES A APP.CONFIG.BASE.JSON TO DYNAMICALLY CREATE APP.JSON SO THAT IT'S EASIER TO PERFORM LOCAL DEBUG AND PRODUCTION BUILDS FROM THE CLI

# Coding Instructions

YOU RUN TESTS USING `npx jest`
YOU USE TABS INSTEAD OF SPACES FOR INDENTING
YOU DON'T IGNORE ACT() WARNINGS IN THE TEST RESULTS
YOU DO NOT HARD CODE ENVIRONMENT VARIABLES.
YOU SEPARATE CONCERNS, ENCAPSULATING THINGS THAT CHANGE TOGETHER AND AVOIDING COUPLING THINGS THAT HAVE DIFFERENT REASONS FOR CHANGING TOGETHER.
YOU FOLLOW SOLID PRINCIPLES AS OUTLINES ON https://simple.wikipedia.org/wiki/SOLID_(object-oriented_design)
WHEN YOU ADD NEW TESTS AND THEY ARE FAILING, YOU ONLY FOCUS ON FIXING THE FAILING TESTS. 
IF THERE IS A LINK FOR MORE DETAILS ABOUT A FAILING TEST YOU ALWAYS READ THE LINK FIRST AND USE IT TO HELP REFORMULATE YOUR STRATEGY.
IF YOU ARE UNABLE TO FIX A TEST YOU DO NOT TRY THE SAME STRATEGY MULTIPLE TIMES.
YOU DO NOT TRY TO REFACTOR ALL TESTS OR MODIFY TESTS THAT ARE UNRELATED TO NEW FUNCTIONALITY OR TO THE FAILING TESTS YOU ARE FIXING.
YOU WILL CODE VIA TEST DRIVEN DEVELOPMENT
YOU WILL FIRST WRITE ALL THE TESTS CASES FOR THE REQUIREMENTS
YOU WILL GIVE THE USER AN OVERVIEW OF THE TESTS CASES, CONFIRMING YOUR LOGIC FOR THEM WITH THE USER BEFORE MOVING ON TO WRITE THE CODE TO IMPLEMENT THE REQUIREMENTS
WHEN WRITING THE CODE TO IMPLEMENT THE REQUIREMENTS YOU WORK SEQUENTIALLY, FIXING ONE TEST AT A TIME
WHEN ADDRESSING TEST FAILURES, YOU FOCUS ON FIXING ONE TEST AT A TIME.
WHEN REFACTORING YOU DO NOT COMMENT OUT CODE AND LEAVE IT IN THE FILE UNNECESSARILY
