/**
 * Color Palette Collection Creator
 *
 * Creates a "wp.settings.colors" collection from settings.color.palette in theme.json
 */

import { ImportOptions, CreatorResult } from '../types';
import { colorToFigmaRgba, isCssVarReference } from '../parser';
import { ColorPreset } from '../../types/theme-json';
import { GetOrCreateCollection } from './index';

const COLLECTION_NAME = 'wp.settings.colors';

/**
 * Create a wp.settings.colors collection from color palette presets
 */
export async function createColorPaletteCollection(
	palette: ColorPreset[],
	options: ImportOptions,
	getOrCreateCollection: GetOrCreateCollection
): Promise<CreatorResult> {
	const result: CreatorResult = {
		collectionsCreated: 0,
		variablesCreated: 0,
		collections: [],
		warnings: [],
		errors: []
	};

	if (palette.length === 0) {
		result.warnings.push('No colors found in settings.color.palette');
		return result;
	}

	// Get or create collection
	const collection = await getOrCreateCollection(COLLECTION_NAME);
	if (!collection) {
		result.warnings.push(`Skipped ${COLLECTION_NAME} collection (conflict strategy: skip)`);
		return result;
	}

	// Track if we created a new collection
	const isNewCollection = collection.variableIds.length === 0;
	if (isNewCollection) {
		result.collectionsCreated++;
	}

	// Get existing variables to check for duplicates
	const existingVariables = new Map<string, Variable>();
	for (const varId of collection.variableIds) {
		const v = await figma.variables.getVariableByIdAsync(varId);
		if (v) {
			existingVariables.set(v.name.toLowerCase(), v);
		}
	}

	// Get mode ID (use first mode)
	const modeId = collection.modes[0].modeId;

	// Create variables from palette
	for (const preset of palette) {
		const { name, slug, color } = preset;

		// Use slug as the variable name (it's the identifier in WordPress)
		const variableName = slug;

		// Skip if already exists and not overwriting
		const existingVar = existingVariables.get(variableName.toLowerCase());
		if (existingVar && !options.overwriteExisting) {
			result.warnings.push(`Skipped existing color: ${variableName}`);
			continue;
		}

		// Skip CSS var references
		if (isCssVarReference(color)) {
			result.warnings.push(`Skipped CSS var reference for color ${name}: ${color}`);
			continue;
		}

		try {
			let variable: Variable;

			if (existingVar && options.overwriteExisting) {
				// Update existing variable
				variable = existingVar;
			} else {
				// Create new variable
				variable = figma.variables.createVariable(
					variableName,
					collection.id,
					'COLOR'
				);
				result.variablesCreated++;
			}

			// Set description to the display name
			variable.description = name;

			// Parse and set the color value
			try {
				const rgba = colorToFigmaRgba(color);
				variable.setValueForMode(modeId, rgba);
			} catch (colorError) {
				result.warnings.push(`Invalid color value for ${name} (${slug}): ${color}`);
				continue;
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
