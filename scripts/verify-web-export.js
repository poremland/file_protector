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
const fs = require("fs");
const path = require("path");

const SCRIPT_SRC_REGEX = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;

function extractScriptSources(html) {
	const sources = [];
	let match;
	SCRIPT_SRC_REGEX.lastIndex = 0;
	while ((match = SCRIPT_SRC_REGEX.exec(html)) !== null) {
		sources.push(match[1]);
	}
	return sources;
}

function isJsPath(src) {
	const cleanPath = src.split(/[?#]/)[0];
	return cleanPath.endsWith(".js");
}

function validateWebExportHtml(html) {
	const errors = [];

	if (typeof html !== "string" || html.trim().length === 0) {
		errors.push("Web export index.html content is empty.");
		return { valid: false, errors };
	}

	if (html.includes("/file_protector/")) {
		errors.push(
			"Web export index.html must not reference the /file_protector/ subpath.",
		);
	}

	const scriptSources = extractScriptSources(html);
	const expoJsScripts = scriptSources.filter(
		(src) => src.startsWith("/_expo/") && isJsPath(src),
	);

	if (expoJsScripts.length === 0) {
		errors.push(
			"Web export index.html must reference at least one root-relative /_expo/ .js script.",
		);
	}

	return { valid: errors.length === 0, errors };
}

function verifyWebExportFile(filePath) {
	if (!fs.existsSync(filePath)) {
		return {
			valid: false,
			errors: [`Web export file not found: ${filePath}`],
		};
	}

	const html = fs.readFileSync(filePath, "utf-8");
	const htmlResult = validateWebExportHtml(html);
	const errors = [...htmlResult.errors];

	const distDir = path.resolve(path.dirname(filePath));
	const scriptSources = extractScriptSources(html).filter(isJsPath);

	for (const src of scriptSources) {
		if (!src.startsWith("/")) {
			continue;
		}
		const cleanRelPath = src.split(/[?#]/)[0].replace(/^\/+/, "");
		const resolvedAssetPath = path.resolve(distDir, cleanRelPath);
		if (
			!resolvedAssetPath.startsWith(distDir + path.sep) ||
			!fs.existsSync(resolvedAssetPath)
		) {
			errors.push(`Referenced script file does not exist on disk: ${src}`);
		}
	}

	return { valid: errors.length === 0, errors };
}

if (require.main === module) {
	const targetPath =
		process.argv[2] || path.join(__dirname, "..", "dist", "index.html");
	const result = verifyWebExportFile(targetPath);

	if (!result.valid) {
		for (const error of result.errors) {
			console.error(`ERROR: ${error}`);
		}
		process.exit(1);
	}

	console.log(`Web export verified successfully: ${targetPath}`);
}

module.exports = {
	extractScriptSources,
	validateWebExportHtml,
	verifyWebExportFile,
};
