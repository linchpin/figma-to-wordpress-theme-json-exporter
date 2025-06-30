import { ExportOptions } from '../types';
import { mergeCollectionData } from '../utils/index';
import { processCollectionData, processCollectionModeData } from '../collection/index';
import { processButtonStyles, clearProcessedButtonVariants } from '../button/index';
import { getTypographyPresets, getWordPressTypographyPresets } from '../typography/index';
import { getColorPresets } from '../color/index';
import { getSpacingPresets } from '../spacing/index';
import { validateThemeJson, formatValidationResults } from '../utils/validation';

export async function exportToJSON(options: ExportOptions = {}) {
	// Clear the set of processed button variants at the start of a new export
	clearProcessedButtonVariants();

	const collections = await figma.variables.getLocalVariableCollectionsAsync();

	// Find the "Primitives" collection first
	const primitivesCollection = collections.find(
		collection => collection.name.toLowerCase() === "primitives"
	);

	// Start with the base theme if provided, otherwise create a new theme object
	const theme = options.baseTheme || {
		"$schema": "https://schemas.wp.org/trunk/theme.json",
		"version": 3,
		"settings": {
			"custom": {}
		}
	};

	// Ensure the theme has the required structure
	theme.settings = theme.settings || {};
	theme.settings.custom = theme.settings.custom || {};

	// Array to store all files we need to output
	const allFiles = [{
		fileName: "theme.json",
		body: theme
	}];

	// Process the primitives collection first if it exists
	if (primitivesCollection) {
		const primitivesData = await processCollectionData(primitivesCollection, options);
		mergeCollectionData(theme.settings.custom, "", primitivesData);
	}

	// Process all other collections
	for (const collection of collections) {
		// Skip the primitives collection as we've already processed it
		if (collection.name.toLowerCase() === "primitives") {
			continue;
		}

		// Special handling for the Color collection
		if (collection.name.toLowerCase() === "color" && collection.modes.length > 0) {
			// Process the first mode normally and merge into the main theme
			const firstModeData = await processCollectionModeData(collection, collection.modes[0], options);

			// Process button styles specially if they exist
			if (firstModeData && 'button' in firstModeData) {
				processButtonStyles(firstModeData.button as Record<string, any>, allFiles);
			}

			// Merge the first mode data into the appropriate location in the base theme
			mergeCollectionData(theme.settings.custom, "color", firstModeData);

			// Create section files for Color collections based on specific conditions:
			// 1. Multiple modes always create section files
			// 2. Single mode with non-button colors creates section files unless it's only with Primitives
			const hasNonButtonColors = firstModeData && Object.keys(firstModeData).some(key => key !== 'button');
			const isOnlyWithPrimitives = collections.length === 2 && primitivesCollection;
			const shouldCreateSectionFile = collection.modes.length > 1 || (hasNonButtonColors && !isOnlyWithPrimitives);

			if (shouldCreateSectionFile) {
				// Output the first mode as a separate file
				const firstMode = collection.modes[0];
				const firstModeNameSlug = firstMode.name.toLowerCase().replace(/\s+/g, '-');
				const firstModeSectionFile = {
					fileName: `styles/section-${firstModeNameSlug}.json`,
					body: {
						"$schema": "https://schemas.wp.org/trunk/theme.json",
						"version": 3,
						"title": firstMode.name,
						"slug": `section-${firstModeNameSlug}`,
						"blockTypes": ["core/group"],
						"settings": {
							"custom": {
								"color": firstModeData
							}
						},
						"styles": {
							"color": {
								"background": "var(--wp--custom--color--surface--primary)",
								"text": "var(--wp--custom--color--text--primary)"
							}
						}
					}
				};
				allFiles.push(firstModeSectionFile);
			}

			// Process additional modes for the Color collection
			for (let i = 1; i < collection.modes.length; i++) {
				const mode = collection.modes[i];
				const modeData = await processCollectionModeData(collection, mode, options);

				// Process button styles for this mode if they exist
				if (modeData && 'button' in modeData) {
					processButtonStyles(modeData.button as Record<string, any>, allFiles);
				}

				// Create separate file for this color mode
				const modeNameSlug = mode.name.toLowerCase().replace(/\s+/g, '-');
				const sectionFile = {
					fileName: `styles/section-${modeNameSlug}.json`,
					body: {
						"$schema": "https://schemas.wp.org/trunk/theme.json",
						"version": 3,
						"title": mode.name,
						"slug": `section-${modeNameSlug}`,
						"blockTypes": ["core/group"],
						"settings": {
							"custom": {
								"color": modeData
							}
						},
						"styles": {
							"color": {
								"background": "var(--wp--custom--color--surface--primary)",
								"text": "var(--wp--custom--color--text--primary)"
							}
						}
					}
				};

				// Add this section file to our output
				allFiles.push(sectionFile);
			}
		} else {
			// For non-Color collections or Color collection with just one mode,
			// process normally
			const collectionData = await processCollectionData(collection, options);

			// Determine where to merge this collection's data based on its name
			const collectionName = collection.name.toLowerCase();

			// Merge the collection data into the appropriate location in the base theme
			mergeCollectionData(theme.settings.custom, collectionName, collectionData);
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
		const colorPresets = await getColorPresets(options.selectedColors);
		if (colorPresets.length > 0) {
			theme.settings.color = theme.settings.color || {};
			theme.settings.color.palette = colorPresets;
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

	// Validate the generated theme.json if validation is enabled
	let validationResult = null;
	if (options.validateThemeJson !== false) { // Default to true
		try {
			validationResult = await validateThemeJson(theme, {
				strict: options.strictValidation || false,
				allowCustomProperties: true // Allow custom properties since we generate them
			});
		} catch (error) {
			console.warn('Theme.json validation failed:', error);
			validationResult = {
				isValid: false,
				errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
				warnings: []
			};
		}
	}

	// Send the result back to the UI
	figma.ui.postMessage({
		type: "EXPORT_RESULT",
		files: allFiles,
		validation: validationResult ? {
			isValid: validationResult.isValid,
			message: formatValidationResults(validationResult),
			details: validationResult
		} : null
	});
} 