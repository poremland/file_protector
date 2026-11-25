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
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const repoRoot = path.join(__dirname, "..");
const appConfigBasePath = path.join(repoRoot, "app.config.base.json");
const workflowPath = path.join(repoRoot, ".github", "workflows", "release.yml");
const verifyScriptPath = path.join(repoRoot, "scripts", "verify-web-export.js");

interface VerificationResult {
	valid: boolean;
	errors: string[];
}

interface VerifyWebExportModule {
	validateWebExportHtml: (html: string) => VerificationResult;
	verifyWebExportFile: (filePath: string) => VerificationResult;
}

function loadVerifyWebExport(): VerifyWebExportModule {
	return require(verifyScriptPath);
}

describe("Web Export Verification (scripts/verify-web-export.js)", () => {
	it("should pass when index.html references /_expo/ assets from root", () => {
		const { validateWebExportHtml } = loadVerifyWebExport();
		const validHtml = `<!DOCTYPE html>
<html lang="en">
	<head><title>File Protector</title></head>
	<body>
		<div id="root"></div>
		<script src="/_expo/static/js/web/entry-abc123.js" defer></script>
	</body>
</html>`;

		const result = validateWebExportHtml(validHtml);

		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it("should fail when index.html references /file_protector/ subpath", () => {
		const { validateWebExportHtml } = loadVerifyWebExport();
		const subpathHtml = `<!DOCTYPE html>
<html lang="en">
	<body>
		<div id="root"></div>
		<script src="/file_protector/_expo/static/js/web/entry-abc123.js" defer></script>
	</body>
</html>`;

		const result = validateWebExportHtml(subpathHtml);

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("/file_protector/"))).toBe(true);
	});

	it("should fail when index.html does not reference any /_expo/ .js script", () => {
		const { validateWebExportHtml } = loadVerifyWebExport();
		const missingAssetsHtml = `<!DOCTYPE html>
<html lang="en">
	<body><div id="root"></div></body>
</html>`;

		const result = validateWebExportHtml(missingAssetsHtml);

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("/_expo/"))).toBe(true);
	});

	it("should fail when index.html content is empty", () => {
		const { validateWebExportHtml } = loadVerifyWebExport();

		const result = validateWebExportHtml("   ");

		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it("should fail when dist/index.html file does not exist", () => {
		const { verifyWebExportFile } = loadVerifyWebExport();
		const missingFile = path.join(os.tmpdir(), `nonexistent-${Date.now()}.html`);

		const result = verifyWebExportFile(missingFile);

		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it("should fail when a .js file referenced in index.html does not exist on disk", () => {
		const { verifyWebExportFile } = loadVerifyWebExport();
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "fp-web-export-"));
		const tempFile = path.join(tempDir, "index.html");

		try {
			fs.writeFileSync(
				tempFile,
				`<!DOCTYPE html><html><body><script src="/_expo/static/js/web/missing-entry.js" defer></script></body></html>`,
				"utf-8",
			);

			const result = verifyWebExportFile(tempFile);

			expect(result.valid).toBe(false);
			expect(
				result.errors.some((e) => e.includes("/_expo/static/js/web/missing-entry.js")),
			).toBe(true);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it("should pass when index.html and all referenced .js files exist on disk", () => {
		const { verifyWebExportFile } = loadVerifyWebExport();
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "fp-web-export-"));
		const tempFile = path.join(tempDir, "index.html");
		const jsDir = path.join(tempDir, "_expo", "static", "js", "web");

		try {
			fs.mkdirSync(jsDir, { recursive: true });
			fs.writeFileSync(path.join(jsDir, "entry.js"), "console.log('ok');", "utf-8");
			fs.writeFileSync(
				tempFile,
				`<!DOCTYPE html><html><body><script src="/_expo/static/js/web/entry.js" defer></script></body></html>`,
				"utf-8",
			);

			const result = verifyWebExportFile(tempFile);

			expect(result.valid).toBe(true);
			expect(result.errors).toEqual([]);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});
});

describe("App Config Base (app.config.base.json)", () => {
	it("should keep metro as the web bundler", () => {
		const config = JSON.parse(fs.readFileSync(appConfigBasePath, "utf-8"));

		expect(config.web?.bundler).toBe("metro");
	});

	it("should not configure a /file_protector baseUrl", () => {
		const config = JSON.parse(fs.readFileSync(appConfigBasePath, "utf-8"));

		expect(config.web?.config?.router?.experiments?.baseUrl).toBeUndefined();
		expect(config.experiments?.baseUrl).toBeUndefined();
	});
});

describe("GitHub Actions Release Workflow (.github/workflows/release.yml)", () => {
	function readWorkflow(): string {
		expect(fs.existsSync(workflowPath)).toBe(true);
		return fs.readFileSync(workflowPath, "utf-8");
	}

	it("should exist and include the File Protector AGPLv3 license header", () => {
		const content = readWorkflow();

		expect(content).toContain("File Protector");
		expect(content).toContain("GNU Affero General Public License");
	});

	it("should trigger on v* tag pushes and manual workflow_dispatch with a tag input", () => {
		const content = readWorkflow();

		expect(content).toMatch(/push:\s*\n\s+tags:\s*\n\s+-\s*['"]v\*['"]/);
		expect(content).toMatch(/workflow_dispatch:/);
		expect(content).toMatch(/inputs:\s*\n\s+tag:/);
	});

	it("should grant contents: write permission", () => {
		const content = readWorkflow();

		expect(content).toMatch(/permissions:\s*\n\s+contents:\s*write/);
	});

	it("should install dependencies with npm ci and run the test suite before building", () => {
		const content = readWorkflow();

		const npmCiIndex = content.indexOf("npm ci");
		const npmTestIndex = content.indexOf("npm test");
		const exportIndex = content.indexOf("npx expo export --platform web");

		expect(npmCiIndex).toBeGreaterThan(-1);
		expect(npmTestIndex).toBeGreaterThan(npmCiIndex);
		expect(exportIndex).toBeGreaterThan(npmTestIndex);
	});

	it("should export web build and run the dist/index.html sanity check", () => {
		const content = readWorkflow();

		const exportIndex = content.indexOf("npx expo export --platform web");
		const verifyIndex = content.indexOf("node scripts/verify-web-export.js");

		expect(exportIndex).toBeGreaterThan(-1);
		expect(verifyIndex).toBeGreaterThan(exportIndex);
	});

	it("should package dist/ at archive root as file-protector-web.tar.gz and generate sha256 checksum", () => {
		const content = readWorkflow();

		expect(content).toContain("tar -czf file-protector-web.tar.gz -C dist .");
		expect(content).toContain(
			"sha256sum file-protector-web.tar.gz > file-protector-web.tar.gz.sha256",
		);
	});

	it("should publish both release assets to GitHub Releases using gh release create", () => {
		const content = readWorkflow();

		expect(content).toContain("gh release create");
		expect(content).toContain("--generate-notes");
		expect(content).toContain("file-protector-web.tar.gz");
		expect(content).toContain("file-protector-web.tar.gz.sha256");
	});
});
