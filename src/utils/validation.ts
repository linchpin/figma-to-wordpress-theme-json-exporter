/**
 * Validation utilities for WordPress theme.json files
 */

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

export interface ValidationOptions {
	strict?: boolean; // If true, treats warnings as errors
	allowCustomProperties?: boolean; // If true, allows custom properties in settings.custom
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
		warnings: []
	};

	try {
		// Basic structure validation
		validateBasicStructure(themeJson, result, options);
		
		// Schema validation (if available)
		await validateAgainstSchema(themeJson, result, options);
		
		// Custom validation rules
		validateCustomRules(themeJson, result, options);
		
		// Determine overall validity
		result.isValid = result.errors.length === 0 && 
			(!options.strict || result.warnings.length === 0);
		
	} catch (error) {
		result.isValid = false;
		result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}

	return result;
}

/**
 * Validates basic theme.json structure
 */
function validateBasicStructure(
	themeJson: any,
	result: ValidationResult,
	options: ValidationOptions
): void {
	// Check if it's an object
	if (typeof themeJson !== 'object' || themeJson === null) {
		result.errors.push('theme.json must be a valid JSON object');
		return;
	}

	// Check required properties
	if (themeJson.version === undefined) {
		result.errors.push('Missing required property: version');
	} else if (themeJson.version !== 3) {
		result.errors.push('Version must be 3');
	}

	// Check $schema property
	if (themeJson.$schema === undefined) {
		result.warnings.push('Missing $schema property (recommended for IDE support)');
	} else if (themeJson.$schema !== 'https://schemas.wp.org/trunk/theme.json') {
		result.warnings.push('$schema should be "https://schemas.wp.org/trunk/theme.json"');
	}

	// Check settings property
	if (themeJson.settings === undefined) {
		result.warnings.push('Missing settings property (recommended)');
	} else if (typeof themeJson.settings !== 'object') {
		result.errors.push('settings must be an object');
	}
}

/**
 * Validates against the WordPress schema (if available)
 */
async function validateAgainstSchema(
	themeJson: any,
	result: ValidationResult,
	options: ValidationOptions
): Promise<void> {
	try {
		// Try to fetch the schema
		const schemaResponse = await fetch('https://schemas.wp.org/trunk/theme.json');
		if (!schemaResponse.ok) {
			result.warnings.push('Could not fetch WordPress schema for validation');
			return;
		}

		const schema = await schemaResponse.json();
		
		// Basic schema validation (simplified)
		validateSchemaProperties(themeJson, schema, result, options);
		
	} catch (error) {
		result.warnings.push('Schema validation unavailable: ' + (error instanceof Error ? error.message : 'Network error'));
	}
}

/**
 * Validates properties against the schema
 */
function validateSchemaProperties(
	themeJson: any,
	schema: any,
	result: ValidationResult,
	options: ValidationOptions
): void {
	// Validate settings structure
	if (themeJson.settings) {
		validateSettings(themeJson.settings, schema, result, options);
	}

	// Validate styles structure
	if (themeJson.styles) {
		validateStyles(themeJson.styles, schema, result, options);
	}

	// Validate other top-level properties
	const allowedTopLevelProps = ['$schema', 'version', 'title', 'slug', 'description', 'blockTypes', 'settings', 'styles', 'customTemplates', 'templateParts', 'patterns'];
	
	for (const prop of Object.keys(themeJson)) {
		if (!allowedTopLevelProps.includes(prop)) {
			result.warnings.push(`Unknown top-level property: ${prop}`);
		}
	}
}

/**
 * Validates settings object
 */
function validateSettings(
	settings: any,
	schema: any,
	result: ValidationResult,
	options: ValidationOptions
): void {
	if (typeof settings !== 'object' || settings === null) {
		result.errors.push('settings must be an object');
		return;
	}

	// Validate color settings
	if (settings.color) {
		validateColorSettings(settings.color, result);
	}

	// Validate typography settings
	if (settings.typography) {
		validateTypographySettings(settings.typography, result);
	}

	// Validate spacing settings
	if (settings.spacing) {
		validateSpacingSettings(settings.spacing, result);
	}

	// Validate custom settings
	if (settings.custom) {
		validateCustomSettings(settings.custom, result, options);
	}
}

/**
 * Validates color settings
 */
function validateColorSettings(colorSettings: any, result: ValidationResult): void {
	if (typeof colorSettings !== 'object') {
		result.errors.push('settings.color must be an object');
		return;
	}

	// Validate palette
	if (colorSettings.palette && Array.isArray(colorSettings.palette)) {
		for (let i = 0; i < colorSettings.palette.length; i++) {
			const color = colorSettings.palette[i];
			if (typeof color !== 'object' || color === null) {
				result.errors.push(`settings.color.palette[${i}] must be an object`);
				continue;
			}

			if (!color.name || typeof color.name !== 'string') {
				result.errors.push(`settings.color.palette[${i}] must have a valid name property`);
			}

			if (!color.slug || typeof color.slug !== 'string') {
				result.errors.push(`settings.color.palette[${i}] must have a valid slug property`);
			}

			if (!color.color || typeof color.color !== 'string') {
				result.errors.push(`settings.color.palette[${i}] must have a valid color property`);
			}
		}
	}
}

/**
 * Validates typography settings
 */
function validateTypographySettings(typographySettings: any, result: ValidationResult): void {
	if (typeof typographySettings !== 'object') {
		result.errors.push('settings.typography must be an object');
		return;
	}

	// Validate fontSizes
	if (typographySettings.fontSizes && Array.isArray(typographySettings.fontSizes)) {
		for (let i = 0; i < typographySettings.fontSizes.length; i++) {
			const fontSize = typographySettings.fontSizes[i];
			if (typeof fontSize !== 'object' || fontSize === null) {
				result.errors.push(`settings.typography.fontSizes[${i}] must be an object`);
				continue;
			}

			if (!fontSize.name || typeof fontSize.name !== 'string') {
				result.errors.push(`settings.typography.fontSizes[${i}] must have a valid name property`);
			}

			if (!fontSize.slug || typeof fontSize.slug !== 'string') {
				result.errors.push(`settings.typography.fontSizes[${i}] must have a valid slug property`);
			}

			if (!fontSize.size || typeof fontSize.size !== 'string') {
				result.errors.push(`settings.typography.fontSizes[${i}] must have a valid size property`);
			}
		}
	}

	// Validate fontFamilies
	if (typographySettings.fontFamilies && Array.isArray(typographySettings.fontFamilies)) {
		for (let i = 0; i < typographySettings.fontFamilies.length; i++) {
			const fontFamily = typographySettings.fontFamilies[i];
			if (typeof fontFamily !== 'object' || fontFamily === null) {
				result.errors.push(`settings.typography.fontFamilies[${i}] must be an object`);
				continue;
			}

			if (!fontFamily.name || typeof fontFamily.name !== 'string') {
				result.errors.push(`settings.typography.fontFamilies[${i}] must have a valid name property`);
			}

			if (!fontFamily.slug || typeof fontFamily.slug !== 'string') {
				result.errors.push(`settings.typography.fontFamilies[${i}] must have a valid slug property`);
			}

			if (!fontFamily.fontFamily || typeof fontFamily.fontFamily !== 'string') {
				result.errors.push(`settings.typography.fontFamilies[${i}] must have a valid fontFamily property`);
			}
		}
	}
}

/**
 * Validates spacing settings
 */
function validateSpacingSettings(spacingSettings: any, result: ValidationResult): void {
	if (typeof spacingSettings !== 'object') {
		result.errors.push('settings.spacing must be an object');
		return;
	}

	// Validate spacingSizes
	if (spacingSettings.spacingSizes && Array.isArray(spacingSettings.spacingSizes)) {
		for (let i = 0; i < spacingSettings.spacingSizes.length; i++) {
			const spacingSize = spacingSettings.spacingSizes[i];
			if (typeof spacingSize !== 'object' || spacingSize === null) {
				result.errors.push(`settings.spacing.spacingSizes[${i}] must be an object`);
				continue;
			}

			if (!spacingSize.name || typeof spacingSize.name !== 'string') {
				result.errors.push(`settings.spacing.spacingSizes[${i}] must have a valid name property`);
			}

			if (!spacingSize.slug || typeof spacingSize.slug !== 'string') {
				result.errors.push(`settings.spacing.spacingSizes[${i}] must have a valid slug property`);
			}

			if (!spacingSize.size || typeof spacingSize.size !== 'string') {
				result.errors.push(`settings.spacing.spacingSizes[${i}] must have a valid size property`);
			}
		}
	}
}

/**
 * Validates custom settings
 */
function validateCustomSettings(customSettings: any, result: ValidationResult, options: ValidationOptions): void {
	if (!options.allowCustomProperties) {
		result.warnings.push('Custom properties in settings.custom are not part of the standard schema');
	}

	// Validate custom properties structure
	if (typeof customSettings !== 'object' || customSettings === null) {
		result.errors.push('settings.custom must be an object');
		return;
	}

	// Check for common custom property patterns
	for (const [key, value] of Object.entries(customSettings)) {
		// Validate both string and object values
		validateCustomProperty(key, value, result, options);
	}
}

/**
 * Validates a custom property
 */
function validateCustomProperty(
	propertyName: string,
	value: any,
	result: ValidationResult,
	options: ValidationOptions
): void {
	// Check for CSS variable references
	if (typeof value === 'string' && value.startsWith('var(--')) {
		// Validate CSS variable format
		if (!/^var\(--[a-zA-Z0-9-]+(?:--[a-zA-Z0-9-]+)*\)$/.test(value)) {
			result.warnings.push(`Custom property ${propertyName} has potentially invalid CSS variable format: ${value}`);
		}
	}

	// Check for nested objects
	if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
		for (const [nestedKey, nestedValue] of Object.entries(value)) {
			validateCustomProperty(`${propertyName}.${nestedKey}`, nestedValue, result, options);
		}
	}
}

/**
 * Validates styles object
 */
function validateStyles(styles: any, schema: any, result: ValidationResult, options: ValidationOptions): void {
	if (typeof styles !== 'object' || styles === null) {
		result.errors.push('styles must be an object');
		return;
	}

	// Basic styles validation
	for (const [key, value] of Object.entries(styles)) {
		if (typeof value === 'object' && value !== null) {
			validateStyleBlock(key, value, result, options);
		}
	}
}

/**
 * Validates a style block
 */
function validateStyleBlock(
	blockName: string,
	styleBlock: any,
	result: ValidationResult,
	options: ValidationOptions
): void {
	// Validate common style properties
	const commonStyleProps = ['color', 'typography', 'spacing', 'border', 'background'];
	
	for (const [prop, value] of Object.entries(styleBlock)) {
		if (commonStyleProps.includes(prop)) {
			validateStyleProperty(prop, value, result, options);
		}
	}
}

/**
 * Validates a style property
 */
function validateStyleProperty(
	propertyName: string,
	value: any,
	result: ValidationResult,
	options: ValidationOptions
): void {
	if (typeof value === 'string') {
		// Validate CSS variable references
		if (value.startsWith('var(--')) {
			if (!/^var\(--[a-zA-Z0-9-]+(?:--[a-zA-Z0-9-]+)*\)$/.test(value)) {
				result.warnings.push(`Style property ${propertyName} has potentially invalid CSS variable format: ${value}`);
			}
		}
	} else if (typeof value === 'object' && value !== null) {
		// Validate nested style objects
		for (const [nestedProp, nestedValue] of Object.entries(value)) {
			validateStyleProperty(`${propertyName}.${nestedProp}`, nestedValue, result, options);
		}
	}
}

/**
 * Validates custom rules specific to our plugin
 */
function validateCustomRules(themeJson: any, result: ValidationResult, options: ValidationOptions): void {
	// Check for our custom typography presets
	if (themeJson.settings?.custom?.typography?.presets) {
		result.warnings.push('Custom typography presets detected. Consider using WordPress-compatible typography structure instead.');
	}

	// Check for proper CSS variable references
	validateCssVariableReferences(themeJson, result);
}

/**
 * Validates CSS variable references throughout the theme.json
 */
function validateCssVariableReferences(themeJson: any, result: ValidationResult): void {
	const validateObject = (obj: any, path: string = ''): void => {
		if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
			for (const [key, value] of Object.entries(obj)) {
				const currentPath = path ? `${path}.${key}` : key;
				
				if (typeof value === 'string' && value.startsWith('var(--')) {
					// Validate CSS variable format
					if (!/^var\(--wp--(?:custom|preset)--[a-zA-Z0-9-]+(?:--[a-zA-Z0-9-]+)*\)$/.test(value)) {
						result.warnings.push(`CSS variable at ${currentPath} may not follow WordPress conventions: ${value}`);
					}
				} else if (typeof value === 'object' && value !== null) {
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
		lines.push('✅ Theme.json validation passed!');
	} else {
		lines.push('❌ Theme.json validation failed!');
	}
	
	if (result.errors.length > 0) {
		lines.push('\nErrors:');
		result.errors.forEach(error => lines.push(`  • ${error}`));
	}
	
	if (result.warnings.length > 0) {
		lines.push('\nWarnings:');
		result.warnings.forEach(warning => lines.push(`  ⚠️  ${warning}`));
	}
	
	return lines.join('\n');
} 