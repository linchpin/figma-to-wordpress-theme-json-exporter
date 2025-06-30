import { rgbToHex } from '../utils/color';
import { isVariableAlias } from '../utils/index';
import { buildCssVarReference } from '../utils/css';
import { ColorPresetData } from '../types';

interface ColorPreset {
	name: string;
	slug: string;
	color: string;
}

/**
 * Converts a variable name to a WordPress-compatible slug
 */
function nameToSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/**
 * Converts a variable name to a human-readable name
 */
function nameToLabel(name: string): string {
	return name
		.split(/[/\-_\s]+/)
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}

/**
 * Builds a WordPress preset color reference
 */
function buildPresetColorReference(nameParts: string[]): string {
	// Convert to kebab-case and join with hyphens
	const kebabParts = nameParts.map(part => part.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
	return `var(--wp--preset--color--${kebabParts.join('-')})`;
}

/**
 * Gets all available color presets for UI display using Paint Styles for labels
 */
export async function getAllColorPresets(): Promise<ColorPresetData[]> {
	const paintStyles = await figma.getLocalPaintStylesAsync();
	const collections = await figma.variables.getLocalVariableCollectionsAsync();
	const colorPresets: ColorPresetData[] = [];

	// Create a map of paint styles for quick lookup
	const paintStyleMap = new Map<string, any>();
	for (const style of paintStyles) {
		// Only process paint styles that have fills
		if (style.paints && style.paints.length > 0) {
			paintStyleMap.set(style.id, style);
		}
	}

	// Process variables to find color variables
	for (const collection of collections) {
		// Process all collections except "Primitives"
		const collectionName = collection.name.toLowerCase();
		if (collectionName === 'primitives') {
			continue;
		}

		// Use the first mode for color presets
		const mode = collection.modes[0];
		if (!mode) continue;

		for (const variableId of collection.variableIds) {
			const variable = await figma.variables.getVariableByIdAsync(variableId);
			if (!variable) continue;

			const { name, resolvedType, valuesByMode } = variable;
			const value = valuesByMode[mode.modeId];

			// Process color variables (both direct values and aliases)
			if (resolvedType === 'COLOR' && value !== undefined) {
				// Create a WordPress preset color reference based on the variable name
				const nameParts = name.split("/").map(part => part.toLowerCase());
				const colorValue = buildPresetColorReference(nameParts);
				
				// Resolve the actual color value for preview
				let resolvedColor: string | undefined;
				if (isVariableAlias(value)) {
					// For aliases, we'll try to resolve the referenced variable
					const referencedVariable = await figma.variables.getVariableByIdAsync((value as any).id);
					if (referencedVariable) {
						const referencedValue = referencedVariable.valuesByMode[Object.keys(referencedVariable.valuesByMode)[0]];
						if (referencedValue && !isVariableAlias(referencedValue)) {
							const hexValue = rgbToHex(referencedValue as RGB);
							resolvedColor = hexValue || undefined;
						}
					}
				} else {
					const hexValue = rgbToHex(value as RGB);
					resolvedColor = hexValue || undefined;
				}

				// Try to find a matching paint style for better labeling
				let displayName = nameToLabel(name);
				let paintStyleId: string | undefined;

				// Look for paint styles that might reference this variable
				for (const [styleId, style] of paintStyleMap) {
					if (style.paints && style.paints.length > 0) {
						const paint = style.paints[0];
						// Check if this paint style references our variable
						if (paint.type === 'VARIABLE' && paint.boundVariables?.paints) {
							const boundPaint = paint.boundVariables.paints[0];
							if (boundPaint && boundPaint.id === variableId) {
								displayName = style.name;
								paintStyleId = styleId;
								break;
							}
						}
					}
				}
				
				// Create a preset for this color - use variable name for slug, paint style name for display
				const preset: ColorPresetData = {
					id: variableId,
					name: displayName,
					slug: nameToSlug(name), // Use variable name for slug
					color: colorValue,
					collectionName: collection.name,
					resolvedColor,
					paintStyleId
				};

				colorPresets.push(preset);
			}
		}
	}

	// Also add paint styles that don't have bound variables (standalone paint styles)
	for (const [styleId, style] of paintStyleMap) {
		// Check if this paint style is already represented by a variable
		const alreadyRepresented = colorPresets.some(preset => preset.paintStyleId === styleId);
		if (alreadyRepresented) continue;

		// Process standalone paint styles
		if (style.paints && style.paints.length > 0) {
			const paint = style.paints[0];
			let colorValue: string;
			let resolvedColor: string | undefined;

			if (paint.type === 'SOLID') {
				// Convert solid paint to hex
				const hexValue = rgbToHex(paint.color);
				colorValue = hexValue || '#000000';
				resolvedColor = hexValue || undefined;
			} else if (paint.type === 'VARIABLE') {
				// This should have been handled above, but just in case
				continue;
			} else {
				// Skip other paint types for now
				continue;
			}

			const preset: ColorPresetData = {
				id: styleId,
				name: style.name,
				slug: nameToSlug(style.name), // For standalone paint styles, use the style name
				color: colorValue,
				collectionName: 'Paint Styles',
				resolvedColor,
				paintStyleId: styleId
			};

			colorPresets.push(preset);
		}
	}

	// Sort presets by collection name, then by name for consistent output
	return colorPresets.sort((a, b) => {
		const collectionCompare = a.collectionName.localeCompare(b.collectionName);
		if (collectionCompare !== 0) return collectionCompare;
		return a.name.localeCompare(b.name);
	});
}

/**
 * Generates color presets from Figma color variables and paint styles
 */
export async function getColorPresets(selectedColorIds?: string[]): Promise<ColorPreset[]> {
	const paintStyles = await figma.getLocalPaintStylesAsync();
	const collections = await figma.variables.getLocalVariableCollectionsAsync();
	const colorPresets: ColorPreset[] = [];

	// Create a map of paint styles for quick lookup
	const paintStyleMap = new Map<string, any>();
	for (const style of paintStyles) {
		// Only process paint styles that have fills
		if (style.paints && style.paints.length > 0) {
			paintStyleMap.set(style.id, style);
		}
	}

	// Process variables to find color variables
	for (const collection of collections) {
		// Process all collections except "Primitives"
		const collectionName = collection.name.toLowerCase();
		if (collectionName === 'primitives') {
			continue;
		}

		// Use the first mode for color presets
		const mode = collection.modes[0];
		if (!mode) continue;

		for (const variableId of collection.variableIds) {
			// If selectedColorIds is provided, only process selected colors
			if (selectedColorIds && !selectedColorIds.includes(variableId)) {
				continue;
			}

			const variable = await figma.variables.getVariableByIdAsync(variableId);
			if (!variable) continue;

			const { name, resolvedType, valuesByMode } = variable;
			const value = valuesByMode[mode.modeId];

			// Process color variables (both direct values and aliases)
			if (resolvedType === 'COLOR' && value !== undefined) {
				// Create a WordPress preset color reference based on the variable name
				const nameParts = name.split("/").map(part => part.toLowerCase());
				const colorValue = buildPresetColorReference(nameParts);

				// Try to find a matching paint style for better labeling
				let displayName = nameToLabel(name);

				// Look for paint styles that might reference this variable
				for (const [styleId, style] of paintStyleMap) {
					if (style.paints && style.paints.length > 0) {
						const paint = style.paints[0];
						// Check if this paint style references our variable
						if (paint.type === 'VARIABLE' && paint.boundVariables?.paints) {
							const boundPaint = paint.boundVariables.paints[0];
							if (boundPaint && boundPaint.id === variableId) {
								displayName = style.name;
								break;
							}
						}
					}
				}
				
				// Create a preset for this color - use variable name for slug, paint style name for display
				const preset: ColorPreset = {
					name: displayName,
					slug: nameToSlug(name), // Use variable name for slug
					color: colorValue
				};

				colorPresets.push(preset);
			}
		}
	}

	// Also add paint styles that don't have bound variables (standalone paint styles)
	for (const [styleId, style] of paintStyleMap) {
		// Check if this paint style is already represented by a variable
		const alreadyRepresented = colorPresets.some(preset => {
			// Check if any variable-based preset uses this paint style name
			return preset.name === style.name;
		});
		if (alreadyRepresented) continue;

		// Check if this paint style is selected
		if (selectedColorIds && !selectedColorIds.includes(styleId)) {
			continue;
		}

		// Process standalone paint styles
		if (style.paints && style.paints.length > 0) {
			const paint = style.paints[0];
			let colorValue: string;

			if (paint.type === 'SOLID') {
				// Convert solid paint to hex
				const hexValue = rgbToHex(paint.color);
				colorValue = hexValue || '#000000';
			} else if (paint.type === 'VARIABLE') {
				// This should have been handled above, but just in case
				continue;
			} else {
				// Skip other paint types for now
				continue;
			}

			const preset: ColorPreset = {
				name: style.name,
				slug: nameToSlug(style.name), // For standalone paint styles, use the style name
				color: colorValue
			};

			colorPresets.push(preset);
		}
	}

	// Sort presets by name for consistent output
	return colorPresets.sort((a, b) => a.name.localeCompare(b.name));
} 