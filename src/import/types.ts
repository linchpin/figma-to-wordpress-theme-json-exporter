/**
 * Theme.json Importer Types
 */

/**
 * Options for importing a theme.json file
 */
export interface ImportOptions {
	/** The theme.json content as a string or parsed object */
	themeJson: string | object;

	/** Which sections to import (defaults to all core sections) */
	sections?: ImportSectionConfig;

	/** Whether to overwrite existing collections with the same name */
	overwriteExisting?: boolean;

	/** Create Desktop/Mobile modes for fluid values */
	createFluidModes?: boolean;

	/** How to handle collection name conflicts */
	conflictStrategy?: 'skip' | 'overwrite' | 'rename';
}

/**
 * Configuration for which sections to import
 */
export interface ImportSectionConfig {
	/** settings.custom → "Primitives" collection */
	primitives?: boolean;

	/** settings.color.palette → "wp.settings.colors" collection */
	colorPalette?: boolean;

	/** settings.typography.fontSizes/fontFamilies → "wp.settings.typography" collection */
	typography?: boolean;

	/** settings.spacing.spacingSizes → "wp.settings.spacing" collection */
	spacing?: boolean;
}

/**
 * Result of an import operation
 */
export interface ImportResult {
	/** Whether the import completed without critical errors */
	success: boolean;

	/** Number of collections created */
	collectionsCreated: number;

	/** Number of variables created */
	variablesCreated: number;

	/** Number of items skipped (due to conflicts, unsupported types, etc.) */
	skipped: number;

	/** Critical error messages */
	errors: string[];

	/** Non-critical warning messages */
	warnings: string[];

	/** Details about created collections */
	collections: CollectionResult[];
}

/**
 * Information about a created collection
 */
export interface CollectionResult {
	name: string;
	id: string;
	variableCount: number;
}

/**
 * Preview of what an import will create (without actually creating)
 */
export interface ImportPreview {
	/** Collections that will be created */
	collections: CollectionPreview[];

	/** Warnings about potential issues */
	warnings: string[];

	/** Errors that would prevent import */
	errors: string[];

	/** Whether the theme.json is valid */
	isValid: boolean;

	/** Detected theme.json version */
	version?: number;
}

/**
 * Preview of a collection to be created
 */
export interface CollectionPreview {
	/** Collection name */
	name: string;

	/** Number of variables that will be created */
	variableCount: number;

	/** Preview of variables */
	variables: VariablePreview[];

	/** Mode names (e.g., ["Default"] or ["Desktop", "Mobile"]) */
	modes: string[];

	/** Whether a collection with this name already exists */
	existsAlready: boolean;
}

/**
 * Preview of a variable to be created
 */
export interface VariablePreview {
	/** Full variable path (e.g., "color/primary") */
	name: string;

	/** Figma variable type */
	type: VariableResolveType;

	/** The value to be set */
	value: any;

	/** Whether this is a CSS var reference */
	isReference: boolean;
}

/**
 * Figma variable resolve types
 */
export type VariableResolveType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';

/**
 * Result from a creator function
 */
export interface CreatorResult {
	collectionsCreated: number;
	variablesCreated: number;
	collections: CollectionResult[];
	warnings: string[];
	errors: string[];
}

/**
 * Flattened variable data ready for creation
 */
export interface FlattenedVariable {
	/** Variable path/name */
	path: string;

	/** Value to set */
	value: any;

	/** Inferred type */
	type: VariableResolveType | null;

	/** Whether the value is a CSS var reference */
	isReference: boolean;
}
