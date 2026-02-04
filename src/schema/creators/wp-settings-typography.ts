/**
 * Typography Collection Creator (Schema-based)
 *
 * Creates a "wp.settings.typography" collection from placeholder font sizes.
 */

import { CreatorResult, GetOrCreateCollection, FontSizePlaceholder, SchemaCreateOptions } from '../types';
import { DEFAULT_FONT_SIZES, COLLECTION_NAMES } from '../placeholders';
import { getExistingVariableNames } from '../detector';

/**
 * Parse CSS size value to number (in pixels)
 */
function parseCssSize(value: string): number {
	const match = value.match(/^([\d.]+)(px|rem|em)?$/i);
	if (!match) {
		throw new Error(`Invalid size value: ${value}`);
	}

	const num = parseFloat(match[1]);
	const unit = (match[2] || 'px').toLowerCase();

	switch (unit) {
		case 'rem':
		case 'em':
			return num * 16; // Assume 16px base
		case 'px':
		default:
			return num;
	}
}

/**
 * Create wp.settings.typography collection from placeholder values
 */
export async function createTypographyCollection(
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

	const collectionName = COLLECTION_NAMES.typography;
	const fontSizes = options.customPlaceholders?.fontSizes || DEFAULT_FONT_SIZES;

	if (fontSizes.length === 0) {
		result.warnings.push('No font sizes defined for creation');
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
	for (const sizeDef of fontSizes) {
		const { name, slug, size } = sizeDef;
		const variableName = `fontSize/${slug}`;

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
					'FLOAT'
				);
				result.variablesCreated++;
			}

			// Set description to the display name
			variable.description = name;

			// Parse and set the size value
			try {
				const numericValue = parseCssSize(size);
				variable.setValueForMode(modeId, numericValue);
			} catch (sizeError) {
				result.warnings.push(`Invalid size value for ${name} (${slug}): ${size}`);
			}
		} catch (error) {
			result.warnings.push(
				`Failed to create font size ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
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
 * Get preview of font sizes that would be created
 */
export function getTypographyPreview(
	existingVariables: Set<string>,
	customPlaceholders?: FontSizePlaceholder[]
): {
	total: number;
	existing: number;
	variables: Array<{ name: string; displayName: string; value: string; exists: boolean }>;
} {
	const fontSizes = customPlaceholders || DEFAULT_FONT_SIZES;
	const variables = fontSizes.map(fs => {
		const varName = `fontSize/${fs.slug}`;
		return {
			name: varName,
			displayName: fs.name,
			value: fs.size,
			exists: existingVariables.has(varName.toLowerCase())
		};
	});

	return {
		total: fontSizes.length,
		existing: variables.filter(v => v.exists).length,
		variables
	};
}
