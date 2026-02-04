/**
 * Typography Collection Creator
 *
 * Creates a "wp.settings.typography" collection from settings.typography in theme.json
 */

import { ImportOptions, CreatorResult } from '../types';
import { parseCssSize, isCssVarReference } from '../parser';
import { TypographySettings, FontSizePreset } from '../../types/theme-json';
import { GetOrCreateCollection } from './index';

const COLLECTION_NAME = 'wp.settings.typography';

/**
 * Create a wp.settings.typography collection from typography settings
 */
export async function createTypographyCollection(
	typography: TypographySettings,
	options: ImportOptions,
	getOrCreateCollection: GetOrCreateCollection
): Promise<CreatorResult> {
	const result: CreatorResult = {
		collectionsCreated: 0,
		variablesCreated: 0,
		collections: [],
		warnings: [],
		errors: []
	};

	const hasFontSizes = typography.fontSizes && typography.fontSizes.length > 0;
	const hasFontFamilies = typography.fontFamilies && typography.fontFamilies.length > 0;

	if (!hasFontSizes && !hasFontFamilies) {
		result.warnings.push('No font sizes or font families found in settings.typography');
		return result;
	}

	// Get or create collection
	const collection = await getOrCreateCollection(COLLECTION_NAME);
	if (!collection) {
		result.warnings.push(`Skipped ${COLLECTION_NAME} collection (conflict strategy: skip)`);
		return result;
	}

	// Track if we created a new collection
	const isNewCollection = collection.variableIds.length === 0;
	if (isNewCollection) {
		result.collectionsCreated++;
	}

	// Check if we need Desktop/Mobile modes for fluid typography
	const hasFluidFontSizes = typography.fontSizes?.some(fs =>
		fs.fluid && typeof fs.fluid === 'object' && (fs.fluid.min || fs.fluid.max)
	);

	let desktopModeId: string = collection.modes[0].modeId;
	let mobileModeId: string | null = null;

	if (hasFluidFontSizes && options.createFluidModes !== false) {
		// Check if Desktop/Mobile modes already exist
		const modeNames = collection.modes.map(m => m.name.toLowerCase());
		const hasDesktop = modeNames.includes('desktop');
		const hasMobile = modeNames.includes('mobile');

		if (!hasDesktop || !hasMobile) {
			// Rename first mode to Desktop if needed
			if (!hasDesktop && collection.modes.length > 0) {
				collection.renameMode(collection.modes[0].modeId, 'Desktop');
				desktopModeId = collection.modes[0].modeId;
			}

			// Add Mobile mode if needed
			if (!hasMobile) {
				try {
					mobileModeId = collection.addMode('Mobile');
				} catch (error) {
					result.warnings.push('Could not create Mobile mode for fluid typography');
				}
			}
		} else {
			// Find existing mode IDs
			const desktopMode = collection.modes.find(m => m.name.toLowerCase() === 'desktop');
			const mobileMode = collection.modes.find(m => m.name.toLowerCase() === 'mobile');
			if (desktopMode) desktopModeId = desktopMode.modeId;
			if (mobileMode) mobileModeId = mobileMode.modeId;
		}
	}

	// Get existing variables to check for duplicates
	const existingVariables = new Map<string, Variable>();
	for (const varId of collection.variableIds) {
		const v = await figma.variables.getVariableByIdAsync(varId);
		if (v) {
			existingVariables.set(v.name.toLowerCase(), v);
		}
	}

	// Process font sizes
	if (typography.fontSizes) {
		for (const preset of typography.fontSizes) {
			const variableName = `fontSize/${preset.slug}`;

			// Skip if already exists and not overwriting
			const existingVar = existingVariables.get(variableName.toLowerCase());
			if (existingVar && !options.overwriteExisting) {
				result.warnings.push(`Skipped existing font size: ${variableName}`);
				continue;
			}

			// Skip CSS var references
			if (isCssVarReference(preset.size)) {
				result.warnings.push(`Skipped CSS var reference for font size ${preset.name}: ${preset.size}`);
				continue;
			}

			try {
				let variable: Variable;

				if (existingVar && options.overwriteExisting) {
					variable = existingVar;
				} else {
					variable = figma.variables.createVariable(
						variableName,
						collection,
						'FLOAT'
					);
					result.variablesCreated++;
				}

				variable.description = preset.name;

				// Handle fluid font sizes
				if (preset.fluid && typeof preset.fluid === 'object' && mobileModeId) {
					const maxSize = preset.fluid.max || preset.size;
					const minSize = preset.fluid.min || preset.size;

					try {
						const maxValue = parseCssSize(maxSize);
						const minValue = parseCssSize(minSize);

						variable.setValueForMode(desktopModeId, maxValue);
						variable.setValueForMode(mobileModeId, minValue);
					} catch (sizeError) {
						result.warnings.push(`Invalid fluid font size for ${preset.name}`);
					}
				} else {
					// Regular font size
					try {
						const sizeValue = parseCssSize(preset.size);
						variable.setValueForMode(desktopModeId, sizeValue);
						if (mobileModeId) {
							variable.setValueForMode(mobileModeId, sizeValue);
						}
					} catch (sizeError) {
						result.warnings.push(`Invalid font size for ${preset.name}: ${preset.size}`);
					}
				}
			} catch (error) {
				result.warnings.push(
					`Failed to create font size ${preset.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}
		}
	}

	// Process font families (as STRING type - note: Figma STRING variables have limited use)
	// We'll skip these for now since Figma doesn't support STRING variables well for design tokens
	if (typography.fontFamilies && typography.fontFamilies.length > 0) {
		result.warnings.push(
			`Skipped ${typography.fontFamilies.length} font family/families - STRING variables not supported for design tokens`
		);
	}

	result.collections.push({
		name: collection.name,
		id: collection.id,
		variableCount: result.variablesCreated
	});

	return result;
}
