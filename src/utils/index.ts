// Helper function to check if a value appears to be a variable alias
export function isVariableAlias(value: any): boolean {
	return value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS';
}

/**
 * Checks if a collection name matches the WordPress settings pattern
 * @param collectionName The name of the collection
 * @returns true if the collection should be treated as WordPress settings
 */
export function isWordPressSettingsCollection(collectionName: string): boolean {
	const pattern = /^wordpress\.settings\./i;
	return pattern.test(collectionName);
}

/**
 * Extracts the WordPress settings path from a collection name
 * @param collectionName The name of the collection (e.g., "wordpress.settings.color")
 * @returns The settings path (e.g., "color") or null if not a WordPress settings collection
 */
export function extractWordPressSettingsPath(collectionName: string): string | null {
	if (!isWordPressSettingsCollection(collectionName)) {
		return null;
	}
	
	// Remove "wordpress.settings." prefix and return the rest
	return collectionName.replace(/^wordpress\.settings\./i, '');
}

/**
 * Checks if a WordPress settings collection is the "color" settings group
 * Matches: wordpress.settings.color, wordpress.settings.colors, and nested variants
 */
export function isWordPressSettingsColorCollection(collectionName: string): boolean {
	if (!isWordPressSettingsCollection(collectionName)) return false;
	const rest = collectionName.replace(/^wordpress\.settings\./i, '');
	return /^colors?(\.|$)/i.test(rest);
}

// Helper function to merge collection data into the base theme at the appropriate location
export function mergeCollectionData(baseTheme: any, collectionName: string, collectionData: any): void {
	// If collection name is empty, merge directly into base theme
	if (collectionName === "") {
		// Deep merge the collection data with the base theme
		Object.keys(collectionData).forEach(key => {
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
			baseTheme[collectionName] = deepMerge(baseTheme[collectionName], collectionData);
		} else {
			// If no matching section exists, add the entire collection to the base theme
			baseTheme[collectionName] = collectionData;
		}
	}
}

// Helper function to perform a deep merge of objects
export function deepMerge(target: any, source: any): any {
	// If either is not an object, return source (overwrite)
	if (typeof target !== 'object' || typeof source !== 'object') {
		return source;
	}

	// Create a new object to avoid modifying the originals
	const result = { ...target };

	// Iterate through all properties of source
	for (const key in source) {
		// If property exists in both and both are objects, recursively merge
		if (key in result && typeof result[key] === 'object' && typeof source[key] === 'object') {
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
	if (typeof value !== 'number' || value === 0) {
		return false;
	}

	// Categories that should have px units
	const pxCategories = ['spacing', 'font', 'size', 'grid', 'radius', 'width', 'height'];

	// Check if any of the path parts match our px categories
	return nameParts.some(part => pxCategories.includes(part.toLowerCase()));
}

// Helper function to format value with px units when appropriate
export function formatValueWithUnits(nameParts: string[], value: any, useRem?: boolean, remCollections?: any): any {
	if (shouldAddPxUnit(nameParts, value)) {
		if (useRem && shouldUseRemForCollection(nameParts, remCollections)) {
			return convertPxToRem(value);
		}
		return `${value}px`;
	}
	return value;
}

// Helper function to determine if rem should be used for this collection
export function shouldUseRemForCollection(nameParts: string[], remCollections?: any): boolean {
	if (!remCollections) return false;
	
	// Check if any part of the path matches enabled rem collections
	const pathStr = nameParts.join('/').toLowerCase();
	
	// Check for specific collection patterns
	if ((pathStr.includes('font') || pathStr.includes('typography')) && remCollections.font) {
		return true;
	}
	
	if (pathStr.includes('primitives') && remCollections.primitives) {
		return true;
	}
	
	if (pathStr.includes('spacing') && remCollections.spacing) {
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
	if (valueStr.indexOf('.') === -1) {
		return rounded;
	}
	// Return as string with no trailing zeros
	return parseFloat(valueStr).toString();
}

// Helper function to capitalize the first letter of a string
export function capitalizeFirstLetter(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
} 