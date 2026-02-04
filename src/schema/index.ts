/**
 * Schema-based Variable Creation
 *
 * Main entry point for creating Figma variables from WordPress theme.json schema.
 */

import {
	SchemaCreateOptions,
	SchemaCreateResult,
	SchemaPreview,
	SectionPreview,
	ExistingCollectionInfo
} from './types';
import { processAllSections } from './creators/index';
import { detectExistingCollections, collectionExists } from './detector';
import { COLLECTION_NAMES, SECTION_DISPLAY_NAMES, getDefaultPlaceholders } from './placeholders';
import { getColorPreview } from './creators/wp-settings-colors';
import { getTypographyPreview } from './creators/wp-settings-typography';
import { getSpacingPreview } from './creators/wp-settings-spacing';

const SCHEMA_URL = 'https://raw.githubusercontent.com/WordPress/gutenberg/trunk/schemas/json/theme.json';

/**
 * Fetch the WordPress theme.json schema
 * Returns null if fetch fails (will use fallback placeholders)
 */
export async function fetchThemeJsonSchema(): Promise<any | null> {
	try {
		const response = await fetch(SCHEMA_URL);
		if (!response.ok) {
			console.warn(`Failed to fetch schema: ${response.status}`);
			return null;
		}
		return await response.json();
	} catch (error) {
		console.warn('Failed to fetch theme.json schema, using fallback placeholders');
		return null;
	}
}

/**
 * Create variables from schema placeholders
 */
export async function createFromSchema(options: SchemaCreateOptions): Promise<SchemaCreateResult> {
	const result: SchemaCreateResult = {
		success: false,
		collectionsCreated: 0,
		variablesCreated: 0,
		skipped: 0,
		errors: [],
		warnings: [],
		collections: []
	};

	try {
		// Process all enabled sections
		const creatorResult = await processAllSections(options);

		// Merge results
		result.collectionsCreated = creatorResult.collectionsCreated;
		result.variablesCreated = creatorResult.variablesCreated;
		result.skipped = creatorResult.skipped;
		result.collections = creatorResult.collections;
		result.warnings = creatorResult.warnings;
		result.errors = creatorResult.errors;

		// Determine success (no critical errors)
		result.success = result.errors.length === 0;

	} catch (error) {
		result.errors.push(error instanceof Error ? error.message : 'Unknown error during creation');
	}

	return result;
}

/**
 * Preview what schema-based creation will produce
 */
export async function previewSchemaCreate(
	options: Partial<SchemaCreateOptions>
): Promise<SchemaPreview> {
	const sections: SectionPreview[] = [];
	const existingCollections: ExistingCollectionInfo[] = [];
	const warnings: string[] = [];

	// Try to fetch schema (for future enhancement)
	const schema = await fetchThemeJsonSchema();
	const schemaSource: 'fetched' | 'fallback' = schema ? 'fetched' : 'fallback';

	if (!schema) {
		warnings.push('Using default placeholders (schema fetch failed or unavailable)');
	}

	// Detect existing collections
	const existing = await detectExistingCollections();

	// Get placeholders
	const placeholders = getDefaultPlaceholders();

	// Check each section
	const sectionConfig = options.sections || { colors: true, typography: true, spacing: true };

	// Colors section
	if (sectionConfig.colors) {
		const colorCheck = await collectionExists(COLLECTION_NAMES.colors);
		const existingVars = colorCheck.variableNames ? new Set(colorCheck.variableNames) : new Set<string>();
		const colorPreview = getColorPreview(existingVars, options.customPlaceholders?.colors);

		sections.push({
			id: 'colors',
			collectionName: COLLECTION_NAMES.colors,
			displayName: SECTION_DISPLAY_NAMES.colors,
			variableCount: colorPreview.total,
			existingCount: colorPreview.existing,
			variables: colorPreview.variables.map(v => ({
				name: v.name,
				displayName: v.displayName,
				type: 'COLOR' as const,
				value: v.value,
				exists: v.exists
			})),
			collectionExists: colorCheck.exists
		});

		if (colorCheck.exists) {
			existingCollections.push({
				name: COLLECTION_NAMES.colors,
				id: colorCheck.collection?.id || '',
				variableCount: colorCheck.variableNames?.length || 0,
				existingVariables: colorCheck.variableNames || []
			});
		}
	}

	// Typography section
	if (sectionConfig.typography) {
		const typoCheck = await collectionExists(COLLECTION_NAMES.typography);
		const existingVars = typoCheck.variableNames ? new Set(typoCheck.variableNames) : new Set<string>();
		const typoPreview = getTypographyPreview(existingVars, options.customPlaceholders?.fontSizes);

		sections.push({
			id: 'typography',
			collectionName: COLLECTION_NAMES.typography,
			displayName: SECTION_DISPLAY_NAMES.typography,
			variableCount: typoPreview.total,
			existingCount: typoPreview.existing,
			variables: typoPreview.variables.map(v => ({
				name: v.name,
				displayName: v.displayName,
				type: 'FLOAT' as const,
				value: v.value,
				exists: v.exists
			})),
			collectionExists: typoCheck.exists
		});

		if (typoCheck.exists) {
			existingCollections.push({
				name: COLLECTION_NAMES.typography,
				id: typoCheck.collection?.id || '',
				variableCount: typoCheck.variableNames?.length || 0,
				existingVariables: typoCheck.variableNames || []
			});
		}
	}

	// Spacing section
	if (sectionConfig.spacing) {
		const spacingCheck = await collectionExists(COLLECTION_NAMES.spacing);
		const existingVars = spacingCheck.variableNames ? new Set(spacingCheck.variableNames) : new Set<string>();
		const spacingPreview = getSpacingPreview(existingVars, options.customPlaceholders?.spacing);

		sections.push({
			id: 'spacing',
			collectionName: COLLECTION_NAMES.spacing,
			displayName: SECTION_DISPLAY_NAMES.spacing,
			variableCount: spacingPreview.total,
			existingCount: spacingPreview.existing,
			variables: spacingPreview.variables.map(v => ({
				name: v.name,
				displayName: v.displayName,
				type: 'FLOAT' as const,
				value: v.value,
				exists: v.exists
			})),
			collectionExists: spacingCheck.exists
		});

		if (spacingCheck.exists) {
			existingCollections.push({
				name: COLLECTION_NAMES.spacing,
				id: spacingCheck.collection?.id || '',
				variableCount: spacingCheck.variableNames?.length || 0,
				existingVariables: spacingCheck.variableNames || []
			});
		}
	}

	return {
		sections,
		existingCollections,
		warnings,
		schemaSource
	};
}

/**
 * Check for existing collections that would conflict
 */
export async function checkExistingSchemaCollections(
	collectionNames: string[]
): Promise<ExistingCollectionInfo[]> {
	const result: ExistingCollectionInfo[] = [];

	for (const name of collectionNames) {
		const check = await collectionExists(name);
		if (check.exists && check.collection) {
			result.push({
				name: check.collection.name,
				id: check.collection.id,
				variableCount: check.variableNames?.length || 0,
				existingVariables: check.variableNames || []
			});
		}
	}

	return result;
}

// Re-export types
export type {
	SchemaCreateOptions,
	SchemaCreateResult,
	SchemaPreview,
	SchemaSectionConfig,
	ExistingCollectionInfo
} from './types';
