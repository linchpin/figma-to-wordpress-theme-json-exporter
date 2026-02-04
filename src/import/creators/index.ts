/**
 * Collection Creator Registry
 *
 * Coordinates the creation of Figma variable collections from theme.json sections.
 */

import { ImportOptions, CreatorResult, ImportSectionConfig } from '../types';
import { parseThemeJson } from '../parser';
import { ThemeJsonV3 } from '../../types/theme-json';
import { createPrimitivesCollection } from './primitives';
import { createColorPaletteCollection } from './wp-settings-colors';
import { createTypographyCollection } from './wp-settings-typography';
import { createSpacingCollection } from './wp-settings-spacing';

/**
 * Default section configuration - import all core sections
 */
const DEFAULT_SECTIONS: ImportSectionConfig = {
	primitives: true,
	colorPalette: true,
	typography: true,
	spacing: true
};

/**
 * Process all enabled sections and create collections
 */
export async function processAllSections(
	parsed: ThemeJsonV3,
	options: ImportOptions
): Promise<CreatorResult> {
	const sections = options.sections || DEFAULT_SECTIONS;
	const result: CreatorResult = {
		collectionsCreated: 0,
		variablesCreated: 0,
		collections: [],
		warnings: [],
		errors: []
	};

	// Get existing collections for conflict detection
	const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();
	const existingNames = new Map(
		existingCollections.map(c => [c.name.toLowerCase(), c])
	);

	// Helper to check if we should process a collection
	const shouldProcess = (collectionName: string): boolean => {
		const exists = existingNames.has(collectionName.toLowerCase());
		if (exists && options.conflictStrategy === 'skip') {
			result.warnings.push(`Skipped existing collection: ${collectionName}`);
			return false;
		}
		return true;
	};

	// Helper to get or create a collection
	const getOrCreateCollection = async (
		name: string
	): Promise<VariableCollection | null> => {
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

	// Process sections in order (for potential alias resolution)

	// 1. Primitives (settings.custom)
	if (sections.primitives && parsed.settings?.custom) {
		if (shouldProcess('Primitives')) {
			try {
				const createResult = await createPrimitivesCollection(
					parsed.settings.custom,
					options,
					getOrCreateCollection
				);
				mergeResults(result, createResult);
			} catch (error) {
				result.errors.push(`Primitives: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		}
	}

	// 2. Color palette (settings.color.palette)
	if (sections.colorPalette && parsed.settings?.color?.palette) {
		if (shouldProcess('wp.settings.colors')) {
			try {
				const createResult = await createColorPaletteCollection(
					parsed.settings.color.palette,
					options,
					getOrCreateCollection
				);
				mergeResults(result, createResult);
			} catch (error) {
				result.errors.push(`Color palette: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		}
	}

	// 3. Typography (settings.typography)
	if (sections.typography && parsed.settings?.typography) {
		if (shouldProcess('wp.settings.typography')) {
			try {
				const createResult = await createTypographyCollection(
					parsed.settings.typography,
					options,
					getOrCreateCollection
				);
				mergeResults(result, createResult);
			} catch (error) {
				result.errors.push(`Typography: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		}
	}

	// 4. Spacing (settings.spacing.spacingSizes)
	if (sections.spacing && parsed.settings?.spacing?.spacingSizes) {
		if (shouldProcess('wp.settings.spacing')) {
			try {
				const createResult = await createSpacingCollection(
					parsed.settings.spacing.spacingSizes,
					options,
					getOrCreateCollection
				);
				mergeResults(result, createResult);
			} catch (error) {
				result.errors.push(`Spacing: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		}
	}

	// Add warnings for skipped sections (future scope)
	if (parsed.settings?.color?.gradients?.length) {
		result.warnings.push(`Skipped ${parsed.settings.color.gradients.length} gradient(s) - not supported in initial import`);
	}
	if (parsed.settings?.color?.duotone?.length) {
		result.warnings.push(`Skipped ${parsed.settings.color.duotone.length} duotone preset(s) - not supported in initial import`);
	}
	if (parsed.settings?.shadow?.presets?.length) {
		result.warnings.push(`Skipped ${parsed.settings.shadow.presets.length} shadow preset(s) - not supported in initial import`);
	}
	if (parsed.styles?.elements && Object.keys(parsed.styles.elements).length > 0) {
		result.warnings.push(`Skipped styles.elements - not supported in initial import`);
	}
	if (parsed.styles?.blocks && Object.keys(parsed.styles.blocks).length > 0) {
		result.warnings.push(`Skipped styles.blocks - not supported in initial import`);
	}

	return result;
}

/**
 * Merge creator results into the main result
 */
function mergeResults(target: CreatorResult, source: CreatorResult): void {
	target.collectionsCreated += source.collectionsCreated;
	target.variablesCreated += source.variablesCreated;
	target.collections.push(...source.collections);
	target.warnings.push(...source.warnings);
	target.errors.push(...source.errors);
}

export type GetOrCreateCollection = (name: string) => Promise<VariableCollection | null>;
