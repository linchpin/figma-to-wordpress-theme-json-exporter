/**
 * Schema Creator Registry
 *
 * Coordinates the creation of Figma variable collections from schema placeholders.
 */

import { SchemaCreateOptions, CreatorResult, GetOrCreateCollection } from '../types';
import { createColorCollection } from './wp-settings-colors';
import { createTypographyCollection } from './wp-settings-typography';
import { createSpacingCollection } from './wp-settings-spacing';

/**
 * Process all enabled sections and create collections
 */
export async function processAllSections(
	options: SchemaCreateOptions
): Promise<CreatorResult> {
	const result: CreatorResult = {
		collectionsCreated: 0,
		variablesCreated: 0,
		skipped: 0,
		collections: [],
		warnings: [],
		errors: []
	};

	// Get existing collections for conflict detection
	const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();
	const existingNames = new Map(
		existingCollections.map(c => [c.name.toLowerCase(), c])
	);

	// Helper to get or create a collection
	const getOrCreateCollection: GetOrCreateCollection = async (name: string) => {
		const existing = existingNames.get(name.toLowerCase());

		if (existing) {
			if (options.conflictStrategy === 'skip') {
				return null;
			}
			if (options.conflictStrategy === 'rename') {
				// Create with a new name
				let suffix = 1;
				let newName = `${name} (${suffix})`;
				while (existingNames.has(newName.toLowerCase())) {
					suffix++;
					newName = `${name} (${suffix})`;
				}
				const collection = figma.variables.createVariableCollection(newName);
				result.warnings.push(`Renamed collection: ${name} → ${newName}`);
				return collection;
			}
			// Overwrite - return existing to add variables to it
			return existing;
		}

		return figma.variables.createVariableCollection(name);
	};

	// Process sections in order

	// 1. Colors
	if (options.sections.colors) {
		try {
			const createResult = await createColorCollection(options, getOrCreateCollection);
			mergeResults(result, createResult);
		} catch (error) {
			result.errors.push(`Colors: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	// 2. Typography
	if (options.sections.typography) {
		try {
			const createResult = await createTypographyCollection(options, getOrCreateCollection);
			mergeResults(result, createResult);
		} catch (error) {
			result.errors.push(`Typography: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	// 3. Spacing
	if (options.sections.spacing) {
		try {
			const createResult = await createSpacingCollection(options, getOrCreateCollection);
			mergeResults(result, createResult);
		} catch (error) {
			result.errors.push(`Spacing: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	return result;
}

/**
 * Merge creator results into the main result
 */
function mergeResults(target: CreatorResult, source: CreatorResult): void {
	target.collectionsCreated += source.collectionsCreated;
	target.variablesCreated += source.variablesCreated;
	target.skipped += source.skipped;
	target.collections.push(...source.collections);
	target.warnings.push(...source.warnings);
	target.errors.push(...source.errors);
}

export { createColorCollection } from './wp-settings-colors';
export { createTypographyCollection } from './wp-settings-typography';
export { createSpacingCollection } from './wp-settings-spacing';
