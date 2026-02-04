/**
 * Schema-based Variable Creation Types
 */

/**
 * Options for creating variables from schema
 */
export interface SchemaCreateOptions {
	/** Which sections to create */
	sections: SchemaSectionConfig;

	/** How to handle collection name conflicts */
	conflictStrategy: 'skip' | 'overwrite' | 'rename';

	/** Create Desktop/Mobile modes for responsive values */
	createFluidModes?: boolean;

	/** Custom placeholder values (optional override) */
	customPlaceholders?: Partial<PlaceholderConfig>;
}

/**
 * Configuration for which schema sections to create
 */
export interface SchemaSectionConfig {
	/** wp.settings.colors collection */
	colors: boolean;

	/** wp.settings.typography collection */
	typography: boolean;

	/** wp.settings.spacing collection */
	spacing: boolean;
}

/**
 * Configuration for placeholder values
 */
export interface PlaceholderConfig {
	colors: ColorPlaceholder[];
	fontSizes: FontSizePlaceholder[];
	spacing: SpacingPlaceholder[];
}

/**
 * Color placeholder definition
 */
export interface ColorPlaceholder {
	/** Display name (e.g., "Primary") */
	name: string;

	/** Slug identifier (e.g., "primary") */
	slug: string;

	/** Hex color value (e.g., "#333333") */
	color: string;
}

/**
 * Font size placeholder definition
 */
export interface FontSizePlaceholder {
	/** Display name (e.g., "Medium") */
	name: string;

	/** Slug identifier (e.g., "md") */
	slug: string;

	/** Size value (e.g., "16px") */
	size: string;
}

/**
 * Spacing placeholder definition
 */
export interface SpacingPlaceholder {
	/** Display name (e.g., "4 (Medium)") */
	name: string;

	/** Slug identifier (e.g., "40") */
	slug: string;

	/** Size value (e.g., "16px") */
	size: string;
}

/**
 * Result of schema-based variable creation
 */
export interface SchemaCreateResult {
	/** Whether creation completed without critical errors */
	success: boolean;

	/** Number of collections created */
	collectionsCreated: number;

	/** Number of variables created */
	variablesCreated: number;

	/** Number of items skipped */
	skipped: number;

	/** Critical error messages */
	errors: string[];

	/** Non-critical warning messages */
	warnings: string[];

	/** Details about created collections */
	collections: SchemaCollectionResult[];
}

/**
 * Information about a created collection
 */
export interface SchemaCollectionResult {
	name: string;
	id: string;
	variableCount: number;
}

/**
 * Preview of schema-based creation
 */
export interface SchemaPreview {
	/** Sections that will be created */
	sections: SectionPreview[];

	/** Existing collections that conflict */
	existingCollections: ExistingCollectionInfo[];

	/** Warnings about potential issues */
	warnings: string[];

	/** Whether schema was fetched or using fallback */
	schemaSource: 'fetched' | 'fallback';
}

/**
 * Preview of a section to be created
 */
export interface SectionPreview {
	/** Section identifier (colors, typography, spacing) */
	id: string;

	/** Collection name (e.g., "wp.settings.colors") */
	collectionName: string;

	/** Display name */
	displayName: string;

	/** Number of variables that will be created */
	variableCount: number;

	/** Number of variables that already exist (will be skipped) */
	existingCount: number;

	/** Preview of variables */
	variables: SchemaVariablePreview[];

	/** Whether this collection already exists */
	collectionExists: boolean;
}

/**
 * Preview of a variable from schema
 */
export interface SchemaVariablePreview {
	/** Variable name/slug */
	name: string;

	/** Display name */
	displayName: string;

	/** Variable type */
	type: 'COLOR' | 'FLOAT';

	/** Placeholder value */
	value: string;

	/** Whether this variable already exists */
	exists: boolean;
}

/**
 * Information about an existing collection
 */
export interface ExistingCollectionInfo {
	/** Collection name */
	name: string;

	/** Collection ID */
	id: string;

	/** Number of variables in the collection */
	variableCount: number;

	/** Names of existing variables */
	existingVariables: string[];
}

/**
 * Result from a creator function
 */
export interface CreatorResult {
	collectionsCreated: number;
	variablesCreated: number;
	skipped: number;
	collections: SchemaCollectionResult[];
	warnings: string[];
	errors: string[];
}

/**
 * Function signature for getting or creating a collection
 */
export type GetOrCreateCollection = (name: string) => Promise<VariableCollection | null>;
