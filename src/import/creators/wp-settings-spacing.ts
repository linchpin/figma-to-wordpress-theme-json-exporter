/**
 * Spacing Collection Creator
 *
 * Creates a "wp.settings.spacing" collection from settings.spacing.spacingSizes in theme.json
 */

import { ImportOptions, CreatorResult } from '../types';
import { parseCssSize, isCssVarReference } from '../parser';
import { SpacingPreset } from '../../types/theme-json';
import { GetOrCreateCollection } from './index';

const COLLECTION_NAME = 'wp.settings.spacing';

/**
 * Check if a size value is a clamp() function (indicates fluid/responsive spacing)
 */
function isFluidSize(size: string): boolean {
	return size.trim().toLowerCase().startsWith('clamp(');
}

/**
 * Parse a clamp() function and extract min and max values
 */
function parseClamp(size: string): { min: string; max: string } | null {
	const match = size.match(/^clamp\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)$/i);
	if (!match) return null;

	return {
		min: match[1].trim(),
		max: match[3].trim()
	};
}

/**
 * Create a wp.settings.spacing collection from spacing presets
 */
export async function createSpacingCollection(
	spacingSizes: SpacingPreset[],
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

	if (spacingSizes.length === 0) {
		result.warnings.push('No spacing sizes found in settings.spacing.spacingSizes');
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

	// Check if we need Desktop/Mobile modes for fluid spacing
	const hasFluidSpacing = spacingSizes.some(sp => isFluidSize(sp.size));

	let desktopModeId: string = collection.modes[0].modeId;
	let mobileModeId: string | null = null;

	if (hasFluidSpacing && options.createFluidModes !== false) {
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
					result.warnings.push('Could not create Mobile mode for fluid spacing');
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

	// Create variables from spacing sizes
	for (const preset of spacingSizes) {
		const { name, slug, size } = preset;
		const variableName = slug;

		// Skip if already exists and not overwriting
		const existingVar = existingVariables.get(variableName.toLowerCase());
		if (existingVar && !options.overwriteExisting) {
			result.warnings.push(`Skipped existing spacing: ${variableName}`);
			continue;
		}

		// Skip CSS var references
		if (isCssVarReference(size)) {
			result.warnings.push(`Skipped CSS var reference for spacing ${name}: ${size}`);
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

			variable.description = name;

			// Handle fluid (clamp) spacing
			if (isFluidSize(size) && mobileModeId) {
				const clampValues = parseClamp(size);
				if (clampValues) {
					try {
						const maxValue = parseCssSize(clampValues.max);
						const minValue = parseCssSize(clampValues.min);

						variable.setValueForMode(desktopModeId, maxValue);
						variable.setValueForMode(mobileModeId, minValue);
					} catch (sizeError) {
						result.warnings.push(`Invalid fluid spacing for ${name}: ${size}`);
					}
				} else {
					// Fallback: try to parse as regular size
					try {
						const sizeValue = parseCssSize(size);
						variable.setValueForMode(desktopModeId, sizeValue);
						if (mobileModeId) {
							variable.setValueForMode(mobileModeId, sizeValue);
						}
					} catch (sizeError) {
						result.warnings.push(`Invalid spacing size for ${name}: ${size}`);
					}
				}
			} else {
				// Regular spacing size
				try {
					const sizeValue = parseCssSize(size);
					variable.setValueForMode(desktopModeId, sizeValue);
					if (mobileModeId) {
						variable.setValueForMode(mobileModeId, sizeValue);
					}
				} catch (sizeError) {
					result.warnings.push(`Invalid spacing size for ${name}: ${size}`);
				}
			}
		} catch (error) {
			result.warnings.push(
				`Failed to create spacing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	result.collections.push({
		name: collection.name,
		id: collection.id,
		variableCount: result.variablesCreated
	});

	return result;
}
