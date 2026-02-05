/**
 * Validation utilities for WordPress theme.json files
 *
 * Uses AJV to validate against the official WordPress theme.json JSON Schema.
 * Fetches the latest schema at runtime, falling back to a bundled copy.
 */

import Ajv, { ValidateFunction, ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import bundledSchema from "../schemas/theme-json-v3.json";

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

export interface ValidationOptions {
	strict?: boolean; // If true, treats warnings as errors
	allowCustomProperties?: boolean; // If true, allows custom properties in settings.custom
}

// Module-level cache for the compiled AJV validator
let cachedValidator: ValidateFunction | null = null;
let cachedSchemaSource: "remote" | "bundled" | null = null;

/**
 * Create and configure an AJV instance
 */
function createAjv(): Ajv {
	const ajv = new Ajv({
		allErrors: true,
		verbose: true,
		strict: false, // WordPress schema uses some non-standard keywords
	});
	addFormats(ajv);
	return ajv;
}

/**
 * Get or create the cached AJV validator.
 * Tries to fetch the latest schema from WordPress, falls back to bundled copy.
 */
async function getValidator(): Promise<ValidateFunction> {
	if (cachedValidator) {
		return cachedValidator;
	}

	const ajv = createAjv();
	let schema: any = null;

	// Try to fetch the latest schema
	try {
		const response = await fetch("https://schemas.wp.org/trunk/theme.json");
		if (response.ok) {
			schema = await response.json();
			cachedSchemaSource = "remote";
		}
	} catch {
		// Network error, will fall back to bundled schema
	}

	// Fall back to bundled schema
	if (!schema) {
		schema = bundledSchema;
		cachedSchemaSource = "bundled";
	}

	cachedValidator = ajv.compile(schema);
	return cachedValidator;
}

/**
 * Reset the cached validator (useful for testing or when schema needs refresh)
 */
export function resetValidatorCache(): void {
	cachedValidator = null;
	cachedSchemaSource = null;
}

/**
 * Get the source of the currently cached schema
 */
export function getSchemaSource(): "remote" | "bundled" | null {
	return cachedSchemaSource;
}

/**
 * Validates a theme.json object against the WordPress schema
 * @param themeJson The theme.json object to validate
 * @param options Validation options
 * @returns ValidationResult with validation status and any errors/warnings
 */
export async function validateThemeJson(
	themeJson: any,
	options: ValidationOptions = {}
): Promise<ValidationResult> {
	const result: ValidationResult = {
		isValid: true,
		errors: [],
		warnings: [],
	};

	try {
		// Basic structure validation (fast pre-checks)
		validateBasicStructure(themeJson, result);

		// If basic structure fails, skip schema validation
		if (result.errors.length > 0) {
			result.isValid = false;
			return result;
		}

		// AJV schema validation
		await validateAgainstSchema(themeJson, result, options);

		// Custom validation rules (beyond what the schema covers)
		validateCustomRules(themeJson, result, options);

		// Determine overall validity
		result.isValid =
			result.errors.length === 0 &&
			(!options.strict || result.warnings.length === 0);
	} catch (error) {
		result.isValid = false;
		result.errors.push(
			`Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`
		);
	}

	return result;
}

/**
 * Validates basic theme.json structure
 */
function validateBasicStructure(themeJson: any, result: ValidationResult): void {
	// Check if it's an object
	if (typeof themeJson !== "object" || themeJson === null) {
		result.errors.push("theme.json must be a valid JSON object");
		return;
	}

	// Check required properties
	if (themeJson.version === undefined) {
		result.errors.push("Missing required property: version");
	} else if (themeJson.version !== 3) {
		result.errors.push("Version must be 3");
	}

	// Check $schema property
	if (themeJson.$schema === undefined) {
		result.warnings.push(
			"Missing $schema property (recommended for IDE support)"
		);
	} else if (
		themeJson.$schema !== "https://schemas.wp.org/trunk/theme.json"
	) {
		result.warnings.push(
			'$schema should be "https://schemas.wp.org/trunk/theme.json"'
		);
	}

	// Check settings property
	if (themeJson.settings === undefined) {
		result.warnings.push("Missing settings property (recommended)");
	} else if (typeof themeJson.settings !== "object") {
		result.errors.push("settings must be an object");
	}
}

/**
 * Validates against the WordPress schema using AJV
 */
async function validateAgainstSchema(
	themeJson: any,
	result: ValidationResult,
	options: ValidationOptions
): Promise<void> {
	try {
		const validate = await getValidator();
		const valid = validate(themeJson);

		if (!valid && validate.errors) {
			for (const error of validate.errors) {
				const message = formatAjvError(error);

				// Treat additionalProperties warnings as warnings, not errors,
				// when custom properties are allowed
				if (
					options.allowCustomProperties &&
					error.keyword === "additionalProperties" &&
					error.instancePath.startsWith("/settings/custom")
				) {
					result.warnings.push(message);
				} else if (error.keyword === "additionalProperties") {
					// Additional properties outside settings.custom are warnings
					result.warnings.push(message);
				} else {
					result.errors.push(message);
				}
			}
		}

		if (cachedSchemaSource === "bundled") {
			result.warnings.push(
				"Using bundled schema (could not fetch latest from WordPress)"
			);
		}
	} catch (error) {
		result.warnings.push(
			"Schema validation unavailable: " +
				(error instanceof Error ? error.message : "Unknown error")
		);
	}
}

/**
 * Formats an AJV error into a user-friendly message
 */
function formatAjvError(error: ErrorObject): string {
	const path = error.instancePath
		? error.instancePath.replace(/\//g, ".").slice(1)
		: "root";

	switch (error.keyword) {
		case "required":
			return `${path}: missing required property "${(error.params as any).missingProperty}"`;
		case "type":
			return `${path}: ${error.message}`;
		case "enum":
			return `${path}: must be one of ${JSON.stringify((error.params as any).allowedValues)}`;
		case "additionalProperties":
			return `${path}: unknown property "${(error.params as any).additionalProperty}"`;
		case "pattern":
			return `${path}: ${error.message}`;
		case "format":
			return `${path}: ${error.message}`;
		case "minimum":
		case "maximum":
			return `${path}: ${error.message}`;
		case "minItems":
		case "maxItems":
			return `${path}: ${error.message}`;
		case "oneOf":
		case "anyOf":
			return `${path}: must match one of the allowed schemas`;
		default:
			return `${path}: ${error.message || "validation error"}`;
	}
}

/**
 * Validates custom rules specific to our plugin
 */
function validateCustomRules(
	themeJson: any,
	result: ValidationResult,
	options: ValidationOptions
): void {
	// Check for our custom typography presets
	if (themeJson.settings?.custom?.typography?.presets) {
		result.warnings.push(
			"Custom typography presets detected. Consider using WordPress-compatible typography structure instead."
		);
	}

	// Check for proper CSS variable references
	validateCssVariableReferences(themeJson, result);
}

/**
 * Validates CSS variable references throughout the theme.json
 */
function validateCssVariableReferences(
	themeJson: any,
	result: ValidationResult
): void {
	const validateObject = (obj: any, path: string = ""): void => {
		if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
			for (const [key, value] of Object.entries(obj)) {
				const currentPath = path ? `${path}.${key}` : key;

				if (typeof value === "string" && value.startsWith("var(--")) {
					// Validate CSS variable format
					if (
						!/^var\(--wp--(?:custom|preset)--[a-zA-Z0-9-]+(?:--[a-zA-Z0-9-]+)*\)$/.test(
							value
						)
					) {
						result.warnings.push(
							`CSS variable at ${currentPath} may not follow WordPress conventions: ${value}`
						);
					}
				} else if (typeof value === "object" && value !== null) {
					validateObject(value, currentPath);
				}
			}
		}
	};

	validateObject(themeJson);
}

/**
 * Formats validation results for display
 */
export function formatValidationResults(result: ValidationResult): string {
	const lines: string[] = [];

	if (result.isValid) {
		lines.push("✅ Theme.json validation passed!");
	} else {
		lines.push("❌ Theme.json validation failed!");
	}

	if (result.errors.length > 0) {
		lines.push("\nErrors:");
		result.errors.forEach((error) => lines.push(`  • ${error}`));
	}

	if (result.warnings.length > 0) {
		lines.push("\nWarnings:");
		result.warnings.forEach((warning) => lines.push(`  ⚠️  ${warning}`));
	}

	return lines.join("\n");
}
