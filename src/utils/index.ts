// Helper function to check if a value appears to be a variable alias
export function isVariableAlias(value: any): boolean {
    return !!(value && typeof value === "object" && (value as any).type === "VARIABLE_ALIAS");
}

/**
 * Checks if a collection name matches the WordPress settings pattern
 * Matches: wp.settings, wp.settings.color, wp.settings.colors, and nested variants
 *
 * @param collectionName The name of the collection
 * @returns true if the collection should be treated as WordPress settings
 */
export function isWordPressSettingsCollection(collectionName: string): boolean {
	const pattern = /^wp\.settings\.?/i;
	return pattern.test(collectionName);
}

/**
 * Extracts the WordPress settings path from a collection name
 * @param collectionName The name of the collection (e.g., "wp.settings.color")
 * @returns The settings path (e.g., "color") or null if not a WordPress settings collection
 */
export function extractWordPressSettingsPath(
	collectionName: string
): string | null {
	if (!isWordPressSettingsCollection(collectionName)) {
		return null;
	}

	// Exact match should map to the root of settings
	if (collectionName.trim().toLowerCase() === "wp.settings") {
		return "";
	}

	// Remove "wp.settings." prefix and return the rest
	return collectionName.replace(/^wp\.settings\./i, "");
}

/**
 * Checks if a WordPress settings collection is the "color" settings group
 * Matches: wp.settings.color, wp.settings.colors, and nested variants
 */
export function isWordPressSettingsColorCollection(
	collectionName: string
): boolean {
	return /^wp\.settings\.colors?(\.|$)/i.test(collectionName);
}

/**
 * Checks if a collection name matches the WordPress elements pattern
 * Matches: wp.elements, wp.elements.button, etc.
 */
export function isWordPressElementsCollection(collectionName: string): boolean {
	const pattern = /^wp\.elements(\.|$)/i;
	return pattern.test(collectionName);
}

/**
 * Extracts the WordPress elements path from a collection name
 * @param collectionName The name of the collection (e.g., "wp.elements.button")
 * @returns The elements path (e.g., "button") or empty string if root ("wp.elements")
 */
export function extractWordPressElementsPath(collectionName: string): string {
	if (!isWordPressElementsCollection(collectionName)) {
		return "";
	}
	return collectionName.replace(/^wp\.elements\.?/i, "");
}

// Helper function to merge collection data into the base theme at the appropriate location
export function mergeCollectionData(
	baseTheme: any,
	collectionName: string,
	collectionData: any
): void {
	// If collection name is empty, merge directly into base theme
	if (collectionName === "") {
		// Deep merge the collection data with the base theme
		Object.keys(collectionData).forEach((key) => {
			if (baseTheme[key]) {
				baseTheme[key] = deepMerge(baseTheme[key], collectionData[key]);
			} else {
				baseTheme[key] = collectionData[key];
			}
		});
	} else {
		// If a matching section already exists in the base theme, merge into it
		if (baseTheme[collectionName]) {
			// Deep merge the collection data with the existing section
			baseTheme[collectionName] = deepMerge(
				baseTheme[collectionName],
				collectionData
			);
		} else {
			// If no matching section exists, add the entire collection to the base theme
			baseTheme[collectionName] = collectionData;
		}
	}
}

// Helper function to perform a deep merge of objects
export function deepMerge(target: any, source: any): any {
	// If either is not an object, return source (overwrite)
	if (typeof target !== "object" || typeof source !== "object") {
		return source;
	}

	// Create a new object to avoid modifying the originals
	const result = { ...target };

	// Iterate through all properties of source
	for (const key in source) {
		// If property exists in both and both are objects, recursively merge
		if (
			key in result &&
			typeof result[key] === "object" &&
			typeof source[key] === "object"
		) {
			result[key] = deepMerge(result[key], source[key]);
		} else {
			// Otherwise just copy the property from source
			result[key] = source[key];
		}
	}

	return result;
}

// Helper function to determine if a value should have 'px' units appended
export function shouldAddPxUnit(nameParts: string[], value: any): boolean {
	// Skip if value is not a number or is already a string
	if (typeof value !== "number" || value === 0) {
		return false;
	}

	// Categories that should have px units
	const pxCategories = [
		"spacing",
		"font",
		"size",
		"grid",
		"radius",
		"width",
		"height",
	];

    // Helper: treat top-level layout keys as dimensioned
    const isLayout = isLayoutPath(nameParts);

    // Check if any of the path parts match our px categories or layout path
    return (
        isLayout || nameParts.some((part) => pxCategories.includes(part.toLowerCase()))
    );
}

// Helper function to format value with px units when appropriate
export function formatValueWithUnits(
	nameParts: string[],
	value: any,
	useRem?: boolean,
	remCollections?: any
): any {
	if (shouldAddPxUnit(nameParts, value)) {
        // Layout group should respect the global unit preference regardless of remCollections
        const isLayout = isLayoutPath(nameParts);
        if (
            useRem && (isLayout || shouldUseRemForCollection(nameParts, remCollections))
        ) {
			return convertPxToRem(value);
		}
		return `${value}px`;
	}
	return value;
}

// Determines if a variable path belongs to the layout group (e.g., ["layout", "content-width"]).
export function isLayoutPath(nameParts: string[]): boolean {
    if (!Array.isArray(nameParts) || nameParts.length === 0) return false;
    const first = String(nameParts[0] || "").toLowerCase();
    return first === "layout";
}

// Helper function to determine if rem should be used for this collection
export function shouldUseRemForCollection(
	nameParts: string[],
	remCollections?: any
): boolean {
	if (!remCollections) return false;

	// Check if any part of the path matches enabled rem collections
	const pathStr = nameParts.join("/").toLowerCase();

	// Check for specific collection patterns
	if (
		(pathStr.includes("font") || pathStr.includes("typography")) &&
		remCollections.font
	) {
		return true;
	}

	if (pathStr.includes("primitives") && remCollections.primitives) {
		return true;
	}

	if (pathStr.includes("spacing") && remCollections.spacing) {
		return true;
	}

	// Check for any custom collections by name
	for (const [collectionName, enabled] of Object.entries(remCollections)) {
		if (enabled && pathStr.includes(collectionName.toLowerCase())) {
			return true;
		}
	}

	return false;
}

// Helper function to convert px value to rem (assuming 16px base)
export function convertPxToRem(pxValue: number): string {
	const baseFontSize = 16; // Standard browser default
	const remValue = pxValue / baseFontSize;

	// Round to max 3 decimal places and remove trailing zeros
	const rounded = Math.round(remValue * 1000) / 1000;
	return `${rounded}rem`;
}

// Helper function to round numbers nicely with max 3 decimal places
export function roundToMax3Decimals(value: number): number | string {
	// Round to 3 decimal places
	const rounded = Math.round(value * 1000) / 1000;
	// Convert to string to check if it's an integer
	const valueStr = rounded.toString();
	// If it's a whole number, return it as a number
	if (valueStr.indexOf(".") === -1) {
		return rounded;
	}
	// Return as string with no trailing zeros
	return parseFloat(valueStr).toString();
}

// Helper function to capitalize the first letter of a string
export function capitalizeFirstLetter(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

// Color utils
import { rgbToHex } from "./color";

/**
 * Converts a string to camelCase. Preserves a leading ':' (e.g., pseudo selectors).
 */
export function toCamelCase(input: string): string {
	if (!input) return input;
	const raw = String(input).trim();
	if (!raw) return raw;
	if (raw.startsWith(":")) {
		return ":" + toCamelCase(raw.slice(1));
	}
	// Replace any non-alphanumeric separator with camel casing of the following char
	const normalized = raw
		.replace(/[^a-zA-Z0-9]+([a-zA-Z0-9])/g, (_, chr: string) =>
			chr.toUpperCase()
		)
		.replace(/^[A-Z]/, (c) => c.toLowerCase());
	return normalized;
}

/**
 * Recursively converts all object keys to camelCase.
 * - Leaves values unchanged
 * - Handles arrays and nested objects
 * - Preserves keys starting with ':' by only camel-casing the remainder
 */
export function convertObjectKeysToCamelCase<T = any>(input: T): T {
	if (Array.isArray(input)) {
		return input.map((item) =>
			convertObjectKeysToCamelCase(item)
		) as unknown as T;
	}
	if (input && typeof input === "object") {
		const result: Record<string, any> = {};
		for (const [key, value] of Object.entries(input as Record<string, any>)) {
			const newKey = toCamelCase(key);
			result[newKey] = convertObjectKeysToCamelCase(value);
		}
		return result as unknown as T;
	}
	return input;
}

/**
 * Resolves a Figma color value or alias chain to a hex (or rgba) string.
 * Safely follows VARIABLE_ALIAS references across modes until a concrete RGB value is found.
 */
export async function resolveColorValueToHex(
	value: any,
	preferredModeId?: string
): Promise<string | null> {
	try {
		let currentValue: any = value;
		let guard = 0;
		while (isVariableAlias(currentValue) && guard < 10) {
			guard++;
			const varId = (currentValue as any).id;
			if (!varId) break;
			const variable = await figma.variables.getVariableByIdAsync(varId);
			if (!variable) break;
			// Try preferred mode first, then fall back to first available
			const modeIds = Object.keys(variable.valuesByMode || {});
			const modeId =
				preferredModeId && variable.valuesByMode[preferredModeId] !== undefined
					? preferredModeId
					: modeIds.length > 0
					? modeIds[0]
					: undefined;
			if (!modeId) break;
			currentValue = variable.valuesByMode[modeId];
		}
		return rgbToHex(currentValue);
	} catch (e) {
		console.log("resolveColorValueToHex error:", e);
		return null;
	}
}

// =============================================================================
// WordPress Blocks Collection Utilities
// =============================================================================

/**
 * Checks if a collection name matches the WordPress blocks pattern
 * Matches: wp.blocks.core/button, wp.blocks.acf/hero, etc.
 *
 * @param collectionName The name of the collection
 * @returns true if the collection should be treated as WordPress blocks styling
 */
export function isWordPressBlocksCollection(collectionName: string): boolean {
	const pattern = /^wp\.blocks\.[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*/i;
	return pattern.test(collectionName);
}

/**
 * Extracts the WordPress block name from a collection name
 * @param collectionName The name of the collection (e.g., "wp.blocks.core/button")
 * @returns The block name (e.g., "core/button") or null if not a blocks collection
 */
export function extractWordPressBlockName(collectionName: string): string | null {
	const match = collectionName.match(/^wp\.blocks\.([a-z][a-z0-9-]*\/[a-z][a-z0-9-]*)/i);
	return match ? match[1] : null;
}

/**
 * Checks if a block name is a WordPress core block
 * @param blockName The block name (e.g., "core/button")
 * @returns true if it's a core block
 */
export function isCoreBlock(blockName: string): boolean {
	return blockName.toLowerCase().startsWith('core/');
}

/**
 * Gets the block badge type for UI display
 * @param blockName The block name (e.g., "core/button" or "acf/hero")
 * @returns Badge info with label and CSS class
 */
export function getBlockBadge(blockName: string): { label: string; cssClass: string } {
	return isCoreBlock(blockName)
		? { label: 'Core', cssClass: 'badge-core' }
		: { label: 'Custom', cssClass: 'badge-custom' };
}

// =============================================================================
// WordPress Styles Collection Utilities
// =============================================================================

/**
 * Checks if a collection name matches the WordPress global styles pattern
 * Matches: wp.styles, wp.styles.something
 *
 * @param collectionName The name of the collection
 * @returns true if the collection should be treated as WordPress global styles
 */
export function isWordPressStylesCollection(collectionName: string): boolean {
	const pattern = /^wp\.styles(?:\.|$)/i;
	return pattern.test(collectionName);
}

/**
 * Extracts the WordPress styles path from a collection name
 * @param collectionName The name of the collection (e.g., "wp.styles.color")
 * @returns The styles path (e.g., "color") or empty string if root
 */
export function extractWordPressStylesPath(collectionName: string): string {
	if (!isWordPressStylesCollection(collectionName)) {
		return "";
	}
	return collectionName.replace(/^wp\.styles\.?/i, "");
}

// =============================================================================
// Element and Pseudo-Selector Validation
// =============================================================================

import { VALID_ELEMENTS, VALID_PSEUDO_SELECTORS } from "../types/theme-json";

/**
 * Validates if an element name is a valid WordPress element
 * @param elementName The element name to validate
 * @returns true if valid
 */
export function isValidElement(elementName: string): boolean {
	return VALID_ELEMENTS.includes(elementName.toLowerCase() as any);
}

/**
 * Validates if a pseudo-selector is valid for WordPress theme.json
 * @param selector The pseudo-selector to validate (e.g., ":hover")
 * @returns true if valid
 */
export function isValidPseudoSelector(selector: string): boolean {
	return VALID_PSEUDO_SELECTORS.includes(selector.toLowerCase() as any);
}

/**
 * Gets all valid WordPress element names
 * @returns Array of valid element names
 */
export function getValidElements(): readonly string[] {
	return VALID_ELEMENTS;
}

/**
 * Gets all valid WordPress pseudo-selectors
 * @returns Array of valid pseudo-selectors
 */
export function getValidPseudoSelectors(): readonly string[] {
	return VALID_PSEUDO_SELECTORS;
}
