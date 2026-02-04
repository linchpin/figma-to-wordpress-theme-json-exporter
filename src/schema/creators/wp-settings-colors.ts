/**
 * Color Palette Collection Creator (Schema-based)
 *
 * Creates a "wp.settings.colors" collection from placeholder colors.
 */

import { CreatorResult, GetOrCreateCollection, ColorPlaceholder, SchemaCreateOptions } from '../types';
import { DEFAULT_COLORS, COLLECTION_NAMES } from '../placeholders';
import { getExistingVariableNames } from '../detector';

/**
 * Parse hex color to Figma RGBA
 */
function hexToFigmaRgba(hex: string): RGBA {
	// Remove # if present
	const cleanHex = hex.replace('#', '');

	// Parse hex values
	const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
	const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
	const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

	return { r, g, b, a: 1 };
}

/**
 * Create wp.settings.colors collection from placeholder values
 */
export async function createColorCollection(
	options: SchemaCreateOptions,
	getOrCreateCollection: GetOrCreateCollection
): Promise<CreatorResult> {
	const result: CreatorResult = {
		collectionsCreated: 0,
		variablesCreated: 0,
		skipped: 0,
		collections: [],
		warnings: [],
		errors: []
	};

	const collectionName = COLLECTION_NAMES.colors;
	const colors = options.customPlaceholders?.colors || DEFAULT_COLORS;

	if (colors.length === 0) {
		result.warnings.push('No colors defined for creation');
		return result;
	}

	// Get or create collection
	const collection = await getOrCreateCollection(collectionName);
	if (!collection) {
		result.warnings.push(`Skipped ${collectionName} collection (conflict strategy: skip)`);
		return result;
	}

	// Track if we created a new collection
	const isNewCollection = collection.variableIds.length === 0;
	if (isNewCollection) {
		result.collectionsCreated++;
	}

	// Get existing variables to check for duplicates
	const existingVariables = await getExistingVariableNames(collection);

	// Get mode ID (use first mode)
	const modeId = collection.modes[0].modeId;

	// Create variables from placeholders
	for (const colorDef of colors) {
		const { name, slug, color } = colorDef;
		const variableName = slug;

		// Check if already exists
		if (existingVariables.has(variableName.toLowerCase())) {
			if (options.conflictStrategy !== 'overwrite') {
				result.skipped++;
				continue;
			}
		}

		try {
			let variable: Variable;

			// Check if variable already exists in collection
			const existingVar = await findVariableByName(collection, variableName);

			if (existingVar && options.conflictStrategy === 'overwrite') {
				variable = existingVar;
			} else if (existingVar) {
				result.skipped++;
				continue;
			} else {
				variable = figma.variables.createVariable(
					variableName,
					collection,
					'COLOR'
				);
				result.variablesCreated++;
			}

			// Set description to the display name
			variable.description = name;

			// Parse and set the color value
			try {
				const rgba = hexToFigmaRgba(color);
				variable.setValueForMode(modeId, rgba);
			} catch (colorError) {
				result.warnings.push(`Invalid color value for ${name} (${slug}): ${color}`);
			}
		} catch (error) {
			result.warnings.push(
				`Failed to create color ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	result.collections.push({
		name: collection.name,
		id: collection.id,
		variableCount: result.variablesCreated
	});

	return result;
}

/**
 * Find a variable by name in a collection
 */
async function findVariableByName(
	collection: VariableCollection,
	name: string
): Promise<Variable | null> {
	for (const varId of collection.variableIds) {
		const variable = await figma.variables.getVariableByIdAsync(varId);
		if (variable && variable.name.toLowerCase() === name.toLowerCase()) {
			return variable;
		}
	}
	return null;
}

/**
 * Get preview of colors that would be created
 */
export function getColorPreview(
	existingVariables: Set<string>,
	customPlaceholders?: ColorPlaceholder[]
): {
	total: number;
	existing: number;
	variables: Array<{ name: string; displayName: string; value: string; exists: boolean }>;
} {
	const colors = customPlaceholders || DEFAULT_COLORS;
	const variables = colors.map(c => ({
		name: c.slug,
		displayName: c.name,
		value: c.color,
		exists: existingVariables.has(c.slug.toLowerCase())
	}));

	return {
		total: colors.length,
		existing: variables.filter(v => v.exists).length,
		variables
	};
}
