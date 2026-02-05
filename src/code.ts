console.clear();

import { ExportOptions } from './types';
import { exportToJSON } from './export/index';
import { getAllColorPresets } from './color/index';
import { applyCssVarSyntaxToVariables } from './utils/figma-variables';
import { getDetectedBlocks } from './collections/processors/wp-blocks';
import { isWordPressBlocksCollection, isGroupBasedBlocksCollection, extractWordPressBlockName, isCoreBlock } from './utils/index';
import { importFromThemeJSON, validateThemeJSON, previewImport, checkExistingCollections, ImportOptions } from './import/index';
import { validateThemeJson as validateExportThemeJson } from './utils/validation';
import { createFromSchema, previewSchemaCreate, checkExistingSchemaCollections, SchemaCreateOptions } from './schema/index';

figma.ui.onmessage = async (e) => {
	console.log("code received message", e);
	if (e.type === "EXPORT") {
		// Extract options from the message
		const options: ExportOptions = {
		useCollectionsRegistry: true,
		...(e.options || {})
		};
		await exportToJSON(options);
	} else if (e.type === "GET_COLOR_PRESETS") {
		// Get all available color presets for the UI
		try {
			const { selectedCollectionIds } = e.options || {};
			const colorPresets = await getAllColorPresets(selectedCollectionIds);
			figma.ui.postMessage({
				type: "COLOR_PRESETS_RESULT",
				colorPresets
			});
		} catch (error) {
			figma.ui.postMessage({
				type: "COLOR_PRESETS_RESULT",
				error: error instanceof Error ? error.message : "Failed to get color presets"
			});
		}
	} else if (e.type === "GET_COLLECTIONS") {
		// Get all available collections for the UI
		try {
			const collections = await figma.variables.getLocalVariableCollectionsAsync();
			const collectionData = collections.map(collection => ({
				id: collection.id,
				name: collection.name,
				modeCount: collection.modes.length,
				variableCount: collection.variableIds.length
			}));
			figma.ui.postMessage({
				type: "COLLECTIONS_RESULT",
				collections: collectionData
			});
		} catch (error) {
			figma.ui.postMessage({
				type: "COLLECTIONS_RESULT",
				error: error instanceof Error ? error.message : "Failed to get collections"
			});
		}
	} else if (e.type === "APPLY_CSS_VAR_SYNTAX") {
		// Apply CSS var syntax to Figma variables
		try {
			const { overwriteExisting } = e.options || {};
			const result = await applyCssVarSyntaxToVariables({ overwriteExisting });
			figma.ui.postMessage({
				type: "CSS_VAR_SYNTAX_RESULT",
				result
			});
		} catch (error) {
			figma.ui.postMessage({
				type: "CSS_VAR_SYNTAX_RESULT",
				error: error instanceof Error ? error.message : "Failed to apply CSS var syntax"
			});
		}
	} else if (e.type === "RESIZE") {
		// Handle resize message from the UI
		if (e.width && e.height) {
			figma.ui.resize(
				Math.max(300, Math.round(e.width)),
				Math.max(300, Math.round(e.height))
			);
		}
	} else if (e.type === "GET_BLOCKS") {
		// Get all detected block collections for the UI
		try {
			const collections = await figma.variables.getLocalVariableCollectionsAsync();
			const collectionData = collections.map(collection => ({
				id: collection.id,
				name: collection.name,
				modeCount: collection.modes.length,
				variableCount: collection.variableIds.length
			}));

			// For group-based wp.blocks collection, get variable names
			let variableNames: string[] = [];
			const wpBlocksCollection = collections.find(c => isGroupBasedBlocksCollection(c.name));
			if (wpBlocksCollection) {
				const variablePromises = wpBlocksCollection.variableIds.map(id =>
					figma.variables.getVariableByIdAsync(id)
				);
				const variables = await Promise.all(variablePromises);
				variableNames = variables
					.filter((v): v is Variable => v !== null)
					.map(v => v.name);
			}

			// Use the utility function to get detected blocks with badge info
			const blocks = getDetectedBlocks(collectionData, variableNames);

			figma.ui.postMessage({
				type: "BLOCKS_RESULT",
				blocks
			});
		} catch (error) {
			figma.ui.postMessage({
				type: "BLOCKS_RESULT",
				error: error instanceof Error ? error.message : "Failed to get block collections"
			});
		}
	} else if (e.type === "VALIDATE_EXPORT") {
		// Validate an exported theme.json from the export UI
		try {
			const { themeJson } = e;
			const validation = await validateExportThemeJson(themeJson, { allowCustomProperties: true });
			figma.ui.postMessage({
				type: "VALIDATE_EXPORT_RESULT",
				validation
			});
		} catch (error) {
			figma.ui.postMessage({
				type: "VALIDATE_EXPORT_RESULT",
				error: error instanceof Error ? error.message : "Validation failed"
			});
		}
	}
	// ==========================================================================
	// Import Message Handlers
	// ==========================================================================
	else if (e.type === "VALIDATE_THEME_JSON") {
		// Validate a theme.json file without importing
		try {
			const { themeJson } = e;
			const validation = await validateThemeJSON(themeJson);
			figma.ui.postMessage({
				type: "VALIDATE_THEME_JSON_RESULT",
				validation
			});
		} catch (error) {
			figma.ui.postMessage({
				type: "VALIDATE_THEME_JSON_RESULT",
				error: error instanceof Error ? error.message : "Validation failed"
			});
		}
	} else if (e.type === "PREVIEW_IMPORT") {
		// Preview what will be created without actually creating
		try {
			const { themeJson, options } = e;
			const preview = await previewImport(themeJson, options);
			figma.ui.postMessage({
				type: "PREVIEW_IMPORT_RESULT",
				preview
			});
		} catch (error) {
			figma.ui.postMessage({
				type: "PREVIEW_IMPORT_RESULT",
				error: error instanceof Error ? error.message : "Preview failed"
			});
		}
	} else if (e.type === "IMPORT") {
		// Perform the actual import
		try {
			const themeJson = e.themeJson ?? e.options?.themeJson;
			if (!themeJson) {
				throw new Error("Missing theme.json input");
			}
			const options: ImportOptions = {
				...(e.options || {}),
				themeJson
			};
			const result = await importFromThemeJSON(options);
			figma.ui.postMessage({
				type: "IMPORT_RESULT",
				result
			});
		} catch (error) {
			figma.ui.postMessage({
				type: "IMPORT_RESULT",
				error: error instanceof Error ? error.message : "Import failed"
			});
		}
	} else if (e.type === "CHECK_EXISTING_COLLECTIONS") {
		// Check for collection name conflicts
		try {
			const { collectionNames } = e;
			const existing = await checkExistingCollections(collectionNames || []);
			figma.ui.postMessage({
				type: "CHECK_EXISTING_COLLECTIONS_RESULT",
				existing
			});
		} catch (error) {
			figma.ui.postMessage({
				type: "CHECK_EXISTING_COLLECTIONS_RESULT",
				error: error instanceof Error ? error.message : "Check failed"
			});
		}
	}
	// ==========================================================================
	// Schema-based Creation Message Handlers
	// ==========================================================================
	else if (e.type === "PREVIEW_SCHEMA_CREATE") {
		// Preview what schema-based creation will produce
		try {
			const { options } = e;
			const preview = await previewSchemaCreate(options || {});
			figma.ui.postMessage({
				type: "PREVIEW_SCHEMA_CREATE_RESULT",
				preview
			});
		} catch (error) {
			figma.ui.postMessage({
				type: "PREVIEW_SCHEMA_CREATE_RESULT",
				error: error instanceof Error ? error.message : "Preview failed"
			});
		}
	} else if (e.type === "CREATE_FROM_SCHEMA") {
		// Create variables from schema
		try {
			const options: SchemaCreateOptions = e.options;
			const result = await createFromSchema(options);
			figma.ui.postMessage({
				type: "CREATE_FROM_SCHEMA_RESULT",
				result
			});
		} catch (error) {
			figma.ui.postMessage({
				type: "CREATE_FROM_SCHEMA_RESULT",
				error: error instanceof Error ? error.message : "Creation failed"
			});
		}
	} else if (e.type === "CHECK_SCHEMA_COLLECTIONS") {
		// Check for existing collections that would conflict
		try {
			const { collectionNames } = e;
			const existing = await checkExistingSchemaCollections(collectionNames || []);
			figma.ui.postMessage({
				type: "CHECK_SCHEMA_COLLECTIONS_RESULT",
				existing
			});
		} catch (error) {
			figma.ui.postMessage({
				type: "CHECK_SCHEMA_COLLECTIONS_RESULT",
				error: error instanceof Error ? error.message : "Check failed"
			});
		}
	}
};

if (figma.command === "export") {
	figma.showUI(__uiFiles__["export"], {
		width: 600,
		height: 600,
		themeColors: true,
	});
} else if (figma.command === "import") {
	figma.showUI(__uiFiles__["import"], {
		width: 600,
		height: 650,
		themeColors: true,
	});
} else if (figma.command === "create-from-schema") {
	figma.showUI(__uiFiles__["create-from-schema"], {
		width: 600,
		height: 650,
		themeColors: true,
	});
} else if (figma.command === "css-vars") {
	figma.showUI(__uiFiles__["css-vars"], {
		width: 400,
		height: 300,
		themeColors: true,
	});
}
