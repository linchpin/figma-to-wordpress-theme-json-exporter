// Helper function to convert camelCase to kebab-case
export function camelToKebabCase(value: string): string {
	return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// Helper function to build a WordPress custom property path
export function buildWpCustomPropertyPath(nameParts: string[]): string {
	return nameParts.map(part => camelToKebabCase(part)).join('--');
}

// Helper function to build a CSS var() reference
export function buildCssVarReference(nameParts: string[]): string {
	return `var(--wp--custom--${buildWpCustomPropertyPath(nameParts)})`;
}

/**
 * Sanitizes a collection name for use in CSS custom properties
 * Converts spaces, hyphens, and special characters to valid CSS custom property format
 */
export function sanitizeCollectionName(collectionName: string): string {
	return collectionName
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-') // Replace any non-alphanumeric characters with hyphens
		.replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
		.replace(/-+/g, '-'); // Replace multiple consecutive hyphens with single hyphen
} 