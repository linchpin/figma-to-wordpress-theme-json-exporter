/**
 * Primitives Collection Creator
 *
 * Creates a "Primitives" collection from settings.custom in theme.json
 */

import { ImportOptions, CreatorResult } from '../types';
import {
	flattenToVariablePaths,
	colorToFigmaRgba,
	parseCssSize,
	isCssVarReference
} from '../parser';
import { GetOrCreateCollection } from './index';

const COLLECTION_NAME = 'Primitives';

/**
 * Create a Primitives collection from settings.custom
 */
export async function createPrimitivesCollection(
	customData: Record<string, any>,
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

	// Flatten the nested structure to variable paths
	const variables = flattenToVariablePaths(customData);

	if (variables.length === 0) {
		result.warnings.push('No variables found in settings.custom');
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

	// Create variables
	for (const { path, value, type, isReference } of variables) {
		// Skip if already exists and not overwriting
		const existingVar = existingVariables.get(path.toLowerCase());
		if (existingVar && !options.overwriteExisting) {
			result.warnings.push(`Skipped existing variable: ${path}`);
			continue;
		}

		// Skip CSS var references (cannot resolve without context)
		if (isReference) {
			result.warnings.push(`Skipped CSS var reference: ${path} = ${value}`);
			continue;
		}

		// Skip unsupported types (Figma variables only support COLOR and FLOAT for design tokens)
		if (!type || (type !== 'COLOR' && type !== 'FLOAT')) {
			if (type === 'STRING' || type === 'BOOLEAN') {
				result.warnings.push(`Skipped unsupported type (${type}): ${path}`);
			}
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
					path,
					collection,
					type
				);
				result.variablesCreated++;
			}

			// Set the value
			if (type === 'COLOR') {
				try {
					const rgba = colorToFigmaRgba(value);
					variable.setValueForMode(modeId, rgba);
				} catch (colorError) {
					result.warnings.push(`Invalid color value for ${path}: ${value}`);
					continue;
				}
			} else if (type === 'FLOAT') {
				try {
					const numValue = typeof value === 'number' ? value : parseCssSize(value);
					variable.setValueForMode(modeId, numValue);
				} catch (sizeError) {
					result.warnings.push(`Invalid size value for ${path}: ${value}`);
					continue;
				}
			}
		} catch (error) {
			result.warnings.push(
				`Failed to create variable ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`
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
