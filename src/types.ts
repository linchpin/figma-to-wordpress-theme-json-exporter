// Interface for export options
export interface ExportOptions {
	generateTypography?: boolean;
	generateWordPressTypography?: boolean; // Use WordPress-compatible typography structure
	generateColorPresets?: boolean;
	generateSpacingPresets?: boolean;
	baseTheme?: any;
	selectedColors?: string[]; // Array of color variable IDs to include in presets
	selectedCollections?: string[]; // Array of collection IDs to include in export
	applyCssVarSyntax?: boolean; // Apply CSS var syntax to Figma variables
	overwriteExistingVars?: boolean; // Whether to overwrite existing CSS var syntax
	useRem?: boolean; // Whether to use rem units instead of px
	remCollections?: {
		font?: boolean;
		primitives?: boolean;
		spacing?: boolean;
		[key: string]: boolean | undefined;
	}; // Which collections to apply rem conversion to

	/**
	 * Controls how COLOR aliases inside `wp.elements.*` collections are exported.
	 * - "value" → export resolved literal color values (e.g., "#5344F4").
	 * - "preset" → export WordPress palette references (e.g., "var:preset|color|primary").
	 */
	elementsColorExportMode?: "value" | "preset";

	/**
	 * Controls how COLOR aliases inside `wp.blocks.*` collections are exported.
	 * - "value" → export resolved literal color values (e.g., "#5344F4").
	 * - "preset" → export WordPress palette references (e.g., "var:preset|color|primary").
	 */
	blocksColorExportMode?: "value" | "preset";

	/**
	 * When true, routes collection processing through the new modular
	 * collections registry (wp.*-first approach). When false, uses a
	 * generic legacy-style merge into settings.custom.
	 */
	useCollectionsRegistry?: boolean;

	// ==========================================================================
	// Extended Settings Section Toggles
	// ==========================================================================

	/**
	 * When true, processes wp.settings.background collections.
	 * Enables background-related settings (backgroundImage, backgroundSize).
	 * @default true
	 */
	enableBackgroundSettings?: boolean;

	/**
	 * When true, processes wp.settings.border collections.
	 * Enables border-related settings (color, radius, style, width).
	 * @default true
	 */
	enableBorderSettings?: boolean;

	/**
	 * When true, processes wp.settings.dimensions collections.
	 * Enables dimension-related settings (aspectRatio, minHeight).
	 * @default true
	 */
	enableDimensionsSettings?: boolean;

	/**
	 * When true, processes wp.settings.position collections.
	 * Enables position-related settings (sticky).
	 * @default true
	 */
	enablePositionSettings?: boolean;
}

// TypeScript interface for Figma Variable Collection Mode
export interface VariableCollectionMode {
	modeId: string;
	name: string;
}

// Interface for Figma Variable Collection
export interface VariableCollection {
	name: string;
	modes: VariableCollectionMode[];
	variableIds: string[];
}

// Interface for color preset data used in the UI
export interface ColorPresetData {
	id: string;
	name: string;
	slug: string;
	color: string;
	collectionName: string;
	resolvedColor?: string; // Actual hex/rgb value for preview
	isWordPressSettings?: boolean; // Whether this color is from a WordPress settings collection
	paintStyleId?: string; // ID of the associated paint style if any
} 