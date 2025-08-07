console.clear();

import { ExportOptions } from './types';
import { exportToJSON } from './export/index';
import { getAllColorPresets } from './color/index';
import { applyCssVarSyntaxToVariables } from './utils/figma-variables';

figma.ui.onmessage = async (e) => {
	console.log("code received message", e);
	if (e.type === "EXPORT") {
		// Extract options from the message
		const options: ExportOptions = e.options || {};
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
	}
};

if (figma.command === "export") {
	figma.showUI(__uiFiles__["export"], {
		width: 500,
		height: 500,
		themeColors: true,
	});
} else if (figma.command === "css-vars") {
	figma.showUI(__uiFiles__["css-vars"], {
		width: 400,
		height: 300,
		themeColors: true,
	});
}
