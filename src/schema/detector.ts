/**
 * Existing Variable Detection
 *
 * Checks for existing collections and variables to enable smart conflict handling.
 */

import { ExistingCollectionInfo } from './types';
import { COLLECTION_NAMES } from './placeholders';

/**
 * Detect existing collections that would conflict with schema creation
 */
export async function detectExistingCollections(): Promise<Map<string, ExistingCollectionInfo>> {
	const collections = await figma.variables.getLocalVariableCollectionsAsync();
	const result = new Map<string, ExistingCollectionInfo>();

	for (const collection of collections) {
		const lowerName = collection.name.toLowerCase();

		// Check if this matches any of our target collection names
		for (const [key, targetName] of Object.entries(COLLECTION_NAMES)) {
			if (lowerName === targetName.toLowerCase()) {
				const existingVariables: string[] = [];

				// Get all variable names in this collection
				for (const varId of collection.variableIds) {
					const variable = await figma.variables.getVariableByIdAsync(varId);
					if (variable) {
						existingVariables.push(variable.name.toLowerCase());
					}
				}

				result.set(key, {
					name: collection.name,
					id: collection.id,
					variableCount: collection.variableIds.length,
					existingVariables
				});
				break;
			}
		}
	}

	return result;
}

/**
 * Check if a specific collection exists
 */
export async function collectionExists(collectionName: string): Promise<{
	exists: boolean;
	collection?: VariableCollection;
	variableNames?: string[];
}> {
	const collections = await figma.variables.getLocalVariableCollectionsAsync();
	const existing = collections.find(
		c => c.name.toLowerCase() === collectionName.toLowerCase()
	);

	if (!existing) {
		return { exists: false };
	}

	const variableNames: string[] = [];
	for (const varId of existing.variableIds) {
		const variable = await figma.variables.getVariableByIdAsync(varId);
		if (variable) {
			variableNames.push(variable.name.toLowerCase());
		}
	}

	return {
		exists: true,
		collection: existing,
		variableNames
	};
}

/**
 * Get existing variable names for a collection
 */
export async function getExistingVariableNames(collection: VariableCollection): Promise<Set<string>> {
	const names = new Set<string>();

	for (const varId of collection.variableIds) {
		const variable = await figma.variables.getVariableByIdAsync(varId);
		if (variable) {
			names.add(variable.name.toLowerCase());
		}
	}

	return names;
}

/**
 * Check which variables from a list already exist in a collection
 */
export async function checkExistingVariables(
	collectionName: string,
	variableSlugs: string[]
): Promise<{
	collectionExists: boolean;
	collectionId?: string;
	existingVariables: string[];
	missingVariables: string[];
}> {
	const check = await collectionExists(collectionName);

	if (!check.exists || !check.variableNames) {
		return {
			collectionExists: false,
			existingVariables: [],
			missingVariables: variableSlugs
		};
	}

	const existingSet = new Set(check.variableNames);
	const existing: string[] = [];
	const missing: string[] = [];

	for (const slug of variableSlugs) {
		if (existingSet.has(slug.toLowerCase())) {
			existing.push(slug);
		} else {
			missing.push(slug);
		}
	}

	return {
		collectionExists: true,
		collectionId: check.collection?.id,
		existingVariables: existing,
		missingVariables: missing
	};
}
