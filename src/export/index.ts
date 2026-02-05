import { ExportOptions } from "../types";
import {
	mergeCollectionData,
	extractWordPressSettingsPath,
	extractWordPressElementsPath,
	isWordPressSettingsCollection,
	isWordPressSettingsColorCollection,
	isWordPressElementsCollection,
	convertObjectKeysToCamelCase,
} from "../utils/index";
import {
	processCollectionData,
	processCollectionModeData,
} from "../collection/index";
import {
	processButtonStyles,
	clearProcessedButtonVariants,
} from "../button/index";
import { getTypographyPresets, getWordPressTypographyPresets } from "../typography/index";
import { getColorPresets, getColorPresetsWithValues } from "../color/index";
import { getSpacingPresets } from "../spacing/index";
import { sanitizeCollectionName } from "../utils/css";
import { dispatchCollection } from "../collections/registry";
import { validateThemeJson } from "../utils/validation";

export async function exportToJSON(options: ExportOptions = {}) {
	// Clear the set of processed button variants at the start of a new export
	clearProcessedButtonVariants();

	const collections = await figma.variables.getLocalVariableCollectionsAsync();

	// Filter collections based on selectedCollections option
	const filteredCollections =
		options.selectedCollections && options.selectedCollections.length > 0
			? collections.filter((collection) =>
					options.selectedCollections!.includes(collection.id)
			  )
			: collections;

	// Find the "Primitives" collection first
	const primitivesCollection = filteredCollections.find(
		(collection) => collection.name.toLowerCase() === "primitives"
	);

    // Start with the base theme if provided, otherwise create a new theme object
    const theme = options.baseTheme || {
        $schema: "https://schemas.wp.org/trunk/theme.json",
        version: 3,
    };

	// Ensure the theme has the required structure
    theme.settings = theme.settings || {};
    theme.settings.custom = theme.settings.custom || {};
    // Do not pre-create color unless needed; tests expect it absent when not used
    // theme.settings.color remains undefined until presets or other code set it

	// Array to store all files we need to output
	const allFiles = [
		{
			fileName: "theme.json",
			body: theme,
		},
	];

	if (options.useCollectionsRegistry) {
		// New modular routing: process wp.* collections and explicitly selected non-wp collections
		const ctx = { theme, files: allFiles };
		const isSelected = (id: string) =>
			Array.isArray(options.selectedCollections) &&
			options.selectedCollections.includes(id);

		for (const collection of filteredCollections) {
			const isWp = /^wp\./i.test(collection.name || "");
			if (isWp || isSelected((collection as any).id)) {
				await dispatchCollection(collection as any, ctx, options);
			}
		}
	} else {
		// Legacy generic processing path: merge all collections broadly as before
		// Process primitives first if present
		if (primitivesCollection) {
			const primitivesData = await processCollectionData(
				primitivesCollection,
				options
			);
			mergeCollectionData(
				theme.settings.custom,
				"",
				convertObjectKeysToCamelCase(primitivesData)
			);
		}

		for (const collection of filteredCollections) {
			if (collection.name.toLowerCase() === "primitives") continue;
			const collectionData = await processCollectionData(collection, options);
			const name = collection.name;
			if (isWordPressSettingsCollection(name)) {
				const settingsPath = extractWordPressSettingsPath(name);
				if (settingsPath === "") {
					const dataToMerge =
						collectionData &&
						typeof collectionData === "object" &&
						(collectionData as any)["wp.settings"]
							? (collectionData as any)["wp.settings"]
							: collectionData;
					mergeCollectionData(
						theme.settings,
						"",
						convertObjectKeysToCamelCase(dataToMerge)
					);
				} else if (!isWordPressSettingsColorCollection(name)) {
					const targetPath = settingsPath || sanitizeCollectionName(name);
					mergeCollectionData(
						theme.settings.custom,
						targetPath,
						convertObjectKeysToCamelCase(collectionData)
					);
				}
			} else if (isWordPressElementsCollection(name)) {
				const elementsPath = extractWordPressElementsPath(name);
				theme.styles = theme.styles || ({} as any);
				(theme.styles as any).elements = (theme.styles as any).elements || {};
				const target = (theme.styles as any).elements as Record<string, any>;
				if (elementsPath) {
					target[elementsPath] = target[elementsPath] || {};
					mergeCollectionData(
						target[elementsPath],
						"",
						convertObjectKeysToCamelCase(collectionData)
					);
				} else {
					mergeCollectionData(
						target,
						"",
						convertObjectKeysToCamelCase(collectionData)
					);
				}
			} else {
				const collectionName = sanitizeCollectionName(name);
				mergeCollectionData(
					theme.settings.custom,
					collectionName,
					convertObjectKeysToCamelCase(collectionData)
				);
			}
		}
	}

	// Add typography presets if requested
	if (options.generateTypography || options.generateWordPressTypography) {
		console.log('Typography generation requested:', {
			generateTypography: options.generateTypography,
			generateWordPressTypography: options.generateWordPressTypography
		});
		
		if (options.generateWordPressTypography) {
			// Use WordPress-compatible typography structure
			console.log('Generating WordPress typography structure...');
			const typographySettings = await getWordPressTypographyPresets(options);
			console.log('WordPress typography settings result:', typographySettings);
			
			if (Object.keys(typographySettings).length > 0) {
				// Ensure typography settings exist
				theme.settings.typography = theme.settings.typography || {};
				
				// Merge typography settings into the theme
				Object.assign(theme.settings.typography, typographySettings);
				console.log('Typography settings merged into theme:', theme.settings.typography);
			} else {
				console.log('No typography settings generated - empty result');
			}
		} else {
			// Use legacy custom typography presets for backward compatibility
			console.log('Generating legacy typography presets...');
			const typographyPresets = await getTypographyPresets(options);
			if (typographyPresets.length > 0) {
				theme.settings.custom.typography = theme.settings.custom.typography || {};
				theme.settings.custom.typography.presets = typographyPresets;
			}
		}
	} else {
		console.log('No typography generation requested');
	}

	// Add color presets if requested
	if (options.generateColorPresets) {
		const colorPresets = options.useCollectionsRegistry
			? await getColorPresetsWithValues(options.selectedColors)
			: await getColorPresets(options.selectedColors);
		if (colorPresets.length > 0) {
			theme.settings.color = theme.settings.color || {};
			theme.settings.color.palette = colorPresets;
		}
	}

	// Ensure palette exists when elements are referencing preset colors
	if (options.elementsColorExportMode === "preset") {
		const hasPalette = !!(
			theme.settings.color &&
			Array.isArray((theme.settings.color as any).palette) &&
			(theme.settings.color as any).palette.length > 0
		);
		if (!hasPalette) {
			const colorPresets = options.useCollectionsRegistry
				? await getColorPresetsWithValues(options.selectedColors)
				: await getColorPresets(options.selectedColors);
			if (colorPresets.length > 0) {
				theme.settings.color = theme.settings.color || {};
				(theme.settings.color as any).palette = colorPresets;
			}
		}
	}

	// Add spacing presets if requested
	if (options.generateSpacingPresets) {
		const spacingPresets = await getSpacingPresets();
		if (spacingPresets.length > 0) {
			theme.settings.spacing = theme.settings.spacing || {};
			theme.settings.spacing.spacingSizes = spacingPresets;
		}
	}

	// Validate the assembled theme.json before sending
	const validation = await validateThemeJson(theme, { allowCustomProperties: true });

	// Send the result back to the UI
	figma.ui.postMessage({
		type: "EXPORT_RESULT",
		files: allFiles,
		warnings: validation.warnings,
		errors: validation.errors,
		isValid: validation.isValid,
	});
}
