/**
 * Theme.json Importer
 *
 * Main entry point for importing WordPress theme.json files into Figma variable collections.
 */

import { ImportOptions, ImportResult, ImportPreview, CollectionPreview, VariablePreview } from './types';
import { parseThemeJson, flattenToVariablePaths, inferVariableType, isCssVarReference, getCollectionNameForSection } from './parser';
import { processAllSections } from './creators/index';
import { ThemeJsonV3 } from '../types/theme-json';
import { validateThemeJson as validateThemeJsonSchema } from '../utils/validation';

/**
 * Import a theme.json file into Figma variable collections
 */
export async function importFromThemeJSON(options: ImportOptions): Promise<ImportResult> {
	const result: ImportResult = {
		success: false,
		collectionsCreated: 0,
		variablesCreated: 0,
		skipped: 0,
		errors: [],
		warnings: [],
		collections: []
	};

	try {
		if (!options?.themeJson) {
			throw new Error('Missing theme.json input');
		}

		const validation = await validateThemeJSON(options.themeJson);
		result.warnings = [...validation.warnings];

		if (!validation.isValid) {
			result.errors = [...validation.errors];
			return result;
		}

		// Parse and validate the theme.json
		const parsed = parseThemeJson(options.themeJson);

		// Process all enabled sections
		const creatorResult = await processAllSections(parsed, options);

		// Merge results
		result.collectionsCreated = creatorResult.collectionsCreated;
		result.variablesCreated = creatorResult.variablesCreated;
		result.collections = creatorResult.collections;
		result.warnings = [...result.warnings, ...creatorResult.warnings];
		result.errors = [...result.errors, ...creatorResult.errors];

		// Determine success (no critical errors)
		result.success = result.errors.length === 0;

	} catch (error) {
		result.errors.push(error instanceof Error ? error.message : 'Unknown error during import');
	}

	return result;
}

/**
 * Validate a theme.json file without importing
 */
export async function validateThemeJSON(input: string | object): Promise<{
	isValid: boolean;
	errors: string[];
	warnings: string[];
	version?: number;
}> {
	const errors: string[] = [];
	const warnings: string[] = [];

	try {
		const parsed = parseThemeJson(input);
		const schemaValidation = await validateThemeJsonSchema(parsed);

		errors.push(...schemaValidation.errors);
		warnings.push(...schemaValidation.warnings);

		// Check for expected structure
		if (!parsed.settings && !parsed.styles) {
			warnings.push('Theme.json has neither settings nor styles');
		}

		// Check for supported sections
		if (parsed.settings) {
			if (!parsed.settings.custom && !parsed.settings.color?.palette &&
				!parsed.settings.typography?.fontSizes && !parsed.settings.spacing?.spacingSizes) {
				warnings.push('No importable sections found in settings (custom, color.palette, typography.fontSizes, spacing.spacingSizes)');
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
			version: parsed.version
		};
	} catch (error) {
		return {
			isValid: false,
			errors: [error instanceof Error ? error.message : 'Parse error'],
			warnings
		};
	}
}

/**
 * Preview what an import will create without actually creating anything
 */
export async function previewImport(
	input: string | object,
	options?: Partial<ImportOptions>
): Promise<ImportPreview> {
	const preview: ImportPreview = {
		collections: [],
		warnings: [],
		errors: [],
		isValid: false
	};

	try {
		const parsed = parseThemeJson(input);
		preview.version = parsed.version;
		preview.isValid = true;

		// Get existing collections for conflict detection
		const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();
		const existingNames = new Set(existingCollections.map(c => c.name.toLowerCase()));

		const sections = options?.sections || {
			primitives: true,
			colorPalette: true,
			typography: true,
			spacing: true
		};

		// Preview Primitives (settings.custom)
		if (sections.primitives && parsed.settings?.custom) {
			const collectionName = 'Primitives';
			const variables = flattenToVariablePaths(parsed.settings.custom);
			const supportedVars = variables.filter(v =>
				v.type === 'COLOR' || v.type === 'FLOAT'
			);

			preview.collections.push({
				name: collectionName,
				variableCount: supportedVars.length,
				variables: supportedVars.slice(0, 10).map(v => ({
					name: v.path,
					type: v.type!,
					value: v.value,
					isReference: v.isReference
				})),
				modes: ['Default'],
				existsAlready: existingNames.has(collectionName.toLowerCase())
			});

			if (variables.length > supportedVars.length) {
				preview.warnings.push(
					`${variables.length - supportedVars.length} variable(s) in settings.custom will be skipped (unsupported type)`
				);
			}
		}

		// Preview Color Palette
		if (sections.colorPalette && parsed.settings?.color?.palette) {
			const collectionName = 'wp.settings.colors';
			const palette = parsed.settings.color.palette;
			const supportedColors = palette.filter(p => !isCssVarReference(p.color));

			preview.collections.push({
				name: collectionName,
				variableCount: supportedColors.length,
				variables: supportedColors.slice(0, 10).map(p => ({
					name: p.slug,
					type: 'COLOR' as const,
					value: p.color,
					isReference: false
				})),
				modes: ['Default'],
				existsAlready: existingNames.has(collectionName.toLowerCase())
			});

			if (palette.length > supportedColors.length) {
				preview.warnings.push(
					`${palette.length - supportedColors.length} color(s) will be skipped (CSS var references)`
				);
			}
		}

		// Preview Typography
		if (sections.typography && parsed.settings?.typography) {
			const collectionName = 'wp.settings.typography';
			const fontSizes = parsed.settings.typography.fontSizes || [];
			const supportedSizes = fontSizes.filter(fs => !isCssVarReference(fs.size));

			const hasFluid = fontSizes.some(fs =>
				fs.fluid && typeof fs.fluid === 'object'
			);

			preview.collections.push({
				name: collectionName,
				variableCount: supportedSizes.length,
				variables: supportedSizes.slice(0, 10).map(fs => ({
					name: `fontSize/${fs.slug}`,
					type: 'FLOAT' as const,
					value: fs.size,
					isReference: false
				})),
				modes: hasFluid ? ['Desktop', 'Mobile'] : ['Default'],
				existsAlready: existingNames.has(collectionName.toLowerCase())
			});

			if (parsed.settings.typography.fontFamilies?.length) {
				preview.warnings.push(
					`${parsed.settings.typography.fontFamilies.length} font family/families will be skipped (STRING not supported)`
				);
			}
		}

		// Preview Spacing
		if (sections.spacing && parsed.settings?.spacing?.spacingSizes) {
			const collectionName = 'wp.settings.spacing';
			const spacingSizes = parsed.settings.spacing.spacingSizes;
			const supportedSizes = spacingSizes.filter(sp => !isCssVarReference(sp.size));

			const hasFluid = spacingSizes.some(sp =>
				sp.size.toLowerCase().startsWith('clamp(')
			);

			preview.collections.push({
				name: collectionName,
				variableCount: supportedSizes.length,
				variables: supportedSizes.slice(0, 10).map(sp => ({
					name: sp.slug,
					type: 'FLOAT' as const,
					value: sp.size,
					isReference: false
				})),
				modes: hasFluid ? ['Desktop', 'Mobile'] : ['Default'],
				existsAlready: existingNames.has(collectionName.toLowerCase())
			});
		}

		// Add warnings for unsupported sections
		if (parsed.settings?.color?.gradients?.length) {
			preview.warnings.push(`${parsed.settings.color.gradients.length} gradient(s) will be skipped`);
		}
		if (parsed.settings?.color?.duotone?.length) {
			preview.warnings.push(`${parsed.settings.color.duotone.length} duotone preset(s) will be skipped`);
		}
		if (parsed.settings?.shadow?.presets?.length) {
			preview.warnings.push(`${parsed.settings.shadow.presets.length} shadow preset(s) will be skipped`);
		}
		if (parsed.styles?.elements && Object.keys(parsed.styles.elements).length > 0) {
			preview.warnings.push(`styles.elements will be skipped`);
		}
		if (parsed.styles?.blocks && Object.keys(parsed.styles.blocks).length > 0) {
			preview.warnings.push(`styles.blocks will be skipped`);
		}

	} catch (error) {
		preview.errors.push(error instanceof Error ? error.message : 'Parse error');
	}

	return preview;
}

/**
 * Check for existing collections that would conflict with an import
 */
export async function checkExistingCollections(
	collectionNames: string[]
): Promise<{ name: string; id: string }[]> {
	const collections = await figma.variables.getLocalVariableCollectionsAsync();
	const nameLookup = new Map(
		collections.map(c => [c.name.toLowerCase(), { name: c.name, id: c.id }])
	);

	return collectionNames
		.map(name => nameLookup.get(name.toLowerCase()))
		.filter((c): c is { name: string; id: string } => c !== undefined);
}

// Re-export types for convenience
export type { ImportOptions, ImportResult, ImportPreview } from './types';
