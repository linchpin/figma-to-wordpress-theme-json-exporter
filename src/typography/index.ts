import { buildCssVarReference } from '../utils/css';
import { rgbToHex } from '../utils/color';
import { roundToMax3Decimals, convertPxToRem, shouldUseRemForCollection } from '../utils/index';
import { ExportOptions } from '../types';

// Helper function to ensure font property variables have the proper WordPress path structure
export function formatFontPropertyPath(nameParts: string[], propertyType: string): string[] {
	// Convert all parts to lowercase
	const lowerParts = nameParts.map(part => part.toLowerCase());
	const lowerPropertyType = propertyType.toLowerCase();

	// Check if this path already contains the correct prefixes
	const hasPropertyPrefix = lowerParts.some(part => part === lowerPropertyType);
	const hasFontPrefix = lowerParts.some(part => part === 'font');

	// Create new array with the required prefixes if they don't exist
	let formattedParts = [...lowerParts];

	if (!hasFontPrefix && !hasPropertyPrefix) {
		// Neither prefix exists, add both
		formattedParts = ['font', lowerPropertyType, ...formattedParts];
	} else if (hasFontPrefix && !hasPropertyPrefix) {
		// Only font prefix exists, add property type after it
		const fontIndex = formattedParts.findIndex(part => part === 'font');
		formattedParts.splice(fontIndex + 1, 0, lowerPropertyType);
	} else if (!hasFontPrefix && hasPropertyPrefix) {
		// Only property prefix exists, add font prefix before it
		const propertyIndex = formattedParts.findIndex(part => part === lowerPropertyType);
		formattedParts.splice(propertyIndex, 0, 'font');
	}

	return formattedParts;
}

// Function to generate WordPress-compatible typography presets
export async function getWordPressTypographyPresets(options?: ExportOptions): Promise<any> {
	// Get all text styles in the document - use async version
	const textStyles = await figma.getLocalTextStylesAsync();
	
	console.log('getWordPressTypographyPresets called with options:', options);
	console.log('Found text styles:', textStyles.length);
	console.log('Text style names:', textStyles.map(style => style.name));
	
	// Initialize WordPress typography structure
	const typographySettings: any = {
		fontSizes: [],
		fontFamilies: [],
		fontStyles: [],
		fontWeights: [],
		lineHeights: [],
		textDecorations: [],
		textTransforms: [],
		letterSpacings: []
	};

	// Track unique values to avoid duplicates
	const uniqueFontSizes = new Set<string>();
	const uniqueFontFamilies = new Set<string>();
	const uniqueFontStyles = new Set<string>();
	const uniqueFontWeights = new Set<string>();
	const uniqueLineHeights = new Set<string>();
	const uniqueTextDecorations = new Set<string>();
	const uniqueTextTransforms = new Set<string>();
	const uniqueLetterSpacings = new Set<string>();

	// Process each text style
	for (const style of textStyles) {
		const {
			// @ts-expect-error the types are wrong
			fontFamily, fontSize, fontWeight, fontName, lineHeight, letterSpacing,
			// @ts-expect-error the types are wrong
			textCase, textDecoration, textDecorationColor, textDecorationOffset,
			// @ts-expect-error the types are wrong
			textDecorationSkipInk, textDecorationStyle, textDecorationThickness,
			hangingPunctuation, leadingTrim, boundVariables
		} = style;

		// Debug logging
		console.log('Processing style:', style.name);
		console.log('fontFamily:', fontFamily);
		console.log('fontName:', fontName);
		console.log('boundVariables:', boundVariables);

		// Process font family
		let fontFamilyValue = null;
		let fontFamilySlug = null;
		
		if (fontFamily) {
			if (boundVariables?.fontFamily) {
				const variableId = boundVariables.fontFamily.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					const formattedParts = formatFontPropertyPath(nameParts, 'family');
					fontFamilyValue = buildCssVarReference(formattedParts);
					// Create slug from variable name for better organization
					fontFamilySlug = createSlugFromStyleName(variable.name);
				}
			} else {
				const fontFamilyVar = await findFontFamilyVariable(fontFamily);
				fontFamilyValue = fontFamilyVar || fontFamily;
				// Create slug from font family name
				fontFamilySlug = createSlugFromStyleName(fontFamily);
			}
		} else if (fontName?.family) {
			const fontFamilyVar = await findFontFamilyVariable(fontName.family);
			fontFamilyValue = fontFamilyVar || fontName.family;
			// Create slug from font family name
			fontFamilySlug = createSlugFromStyleName(fontName.family);
		}

		if (fontFamilyValue && !uniqueFontFamilies.has(fontFamilyValue)) {
			uniqueFontFamilies.add(fontFamilyValue);
			
			// Create font family object according to WordPress schema
			const fontFamilyObj: any = {
				fontFamily: fontFamilyValue,
				slug: fontFamilySlug || createSlugFromStyleName(style.name)
			};

			// Add name if it's different from the slug
			const displayName = formatStyleName(style.name);
			if (displayName !== fontFamilyObj.slug) {
				fontFamilyObj.name = displayName;
			}

			// Note: fontFace declarations should be added manually by developers
			// based on their actual font files and requirements
			// We don't auto-generate these to avoid hardcoding assumptions

			typographySettings.fontFamilies.push(fontFamilyObj);
			
			// Debug logging
			console.log('Added font family:', fontFamilyObj);
		}

		// Process font size
		let fontSizeValue = null;
		if (fontSize) {
			if (boundVariables?.fontSize) {
				const variableId = boundVariables.fontSize.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					const formattedParts = formatFontPropertyPath(nameParts, 'size');
					fontSizeValue = buildCssVarReference(formattedParts);
				}
			} else {
				const fontSizeVar = await findFontSizeVariable(fontSize);
				if (fontSizeVar) {
					fontSizeValue = fontSizeVar;
				} else {
					if (options?.useRem && shouldUseRemForCollection(['font', 'size'], options.remCollections)) {
						fontSizeValue = convertPxToRem(fontSize);
					} else {
						fontSizeValue = `${fontSize}px`;
					}
				}
			}
		}

		if (fontSizeValue && !uniqueFontSizes.has(fontSizeValue)) {
			uniqueFontSizes.add(fontSizeValue);
			typographySettings.fontSizes.push({
				size: fontSizeValue,
				name: formatStyleName(style.name),
				slug: createSlugFromStyleName(style.name)
			});
		}

		// Process font weight
		let fontWeightValue = null;
		if (fontWeight) {
			if (boundVariables?.fontWeight) {
				const variableId = boundVariables.fontWeight.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					const formattedParts = formatFontPropertyPath(nameParts, 'weight');
					fontWeightValue = buildCssVarReference(formattedParts);
				}
			} else {
				const fontWeightVar = await findFontWeightVariable(fontWeight);
				fontWeightValue = fontWeightVar || fontWeight;
			}
		} else if (fontName?.style) {
			const fontWeightMap = {
				'thin': 100,
				'extralight': 200, 'extra light': 200, 'ultra light': 200,
				'light': 300,
				'normal': 400, 'regular': 400,
				'medium': 500,
				'semibold': 600, 'semi bold': 600, 'demi bold': 600,
				'bold': 700,
				'extrabold': 800, 'extra bold': 800, 'ultra bold': 800,
				'black': 900, 'heavy': 900
			};

			const styleKey = fontName.style.toLowerCase();
			const numericWeight = parseInt(styleKey, 10);
			if (!isNaN(numericWeight) && numericWeight >= 100 && numericWeight <= 900) {
				fontWeightValue = numericWeight;
			} else {
				for (const [name, value] of Object.entries(fontWeightMap)) {
					if (styleKey.includes(name)) {
						fontWeightValue = value;
						break;
					}
				}
			}
		}

		if (fontWeightValue && !uniqueFontWeights.has(String(fontWeightValue))) {
			uniqueFontWeights.add(String(fontWeightValue));
			typographySettings.fontWeights.push({
				weight: fontWeightValue,
				name: formatStyleName(style.name),
				slug: createSlugFromStyleName(style.name)
			});
		}

		// Process line height
		if (lineHeight !== undefined) {
			let lineHeightValue = null;
			if (boundVariables?.lineHeight) {
				const variableId = boundVariables.lineHeight.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					const formattedParts = formatFontPropertyPath(nameParts, 'line-height');
					lineHeightValue = buildCssVarReference(formattedParts);
				}
			} else {
				if (typeof lineHeight === 'object' && lineHeight !== null) {
					const unit = 'unit' in lineHeight ? (lineHeight as any).unit : null;
					const value = 'value' in lineHeight ? (lineHeight as any).value : null;

					if (unit === 'PERCENT' && value !== null) {
						lineHeightValue = roundToMax3Decimals(value / 100);
					} else if (unit === 'PIXELS' && value !== null) {
						lineHeightValue = roundToMax3Decimals(value / fontSize);
					} else if (value !== null) {
						lineHeightValue = roundToMax3Decimals(value);
					}
				} else if (typeof lineHeight === 'number') {
					lineHeightValue = roundToMax3Decimals(lineHeight);
				} else if (typeof lineHeight === 'string') {
					const lineHeightStr = lineHeight as string;
					if (lineHeightStr.endsWith('px')) {
						const pixelValue = parseFloat(lineHeightStr);
						lineHeightValue = roundToMax3Decimals(pixelValue / fontSize);
					} else if (lineHeightStr.endsWith('%')) {
						const percentValue = parseFloat(lineHeightStr.replace('%', ''));
						lineHeightValue = roundToMax3Decimals(percentValue / 100);
					} else {
						lineHeightValue = roundToMax3Decimals(parseFloat(lineHeightStr));
					}
				}
			}

			if (lineHeightValue && !uniqueLineHeights.has(String(lineHeightValue))) {
				uniqueLineHeights.add(String(lineHeightValue));
				typographySettings.lineHeights.push({
					lineHeight: lineHeightValue,
					name: formatStyleName(style.name),
					slug: createSlugFromStyleName(style.name)
				});
			}
		}

		// Process letter spacing
		if (letterSpacing !== undefined) {
			let letterSpacingValue = null;
			if (boundVariables?.letterSpacing) {
				const variableId = boundVariables.letterSpacing.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					const formattedParts = formatFontPropertyPath(nameParts, 'letter-spacing');
					letterSpacingValue = buildCssVarReference(formattedParts);
				}
			} else {
				if (typeof letterSpacing === 'object' && letterSpacing !== null) {
					const unit = 'unit' in letterSpacing ? (letterSpacing as any).unit : null;
					const value = 'value' in letterSpacing ? (letterSpacing as any).value : null;

					if (unit === 'PERCENT' && value === 0) {
						letterSpacingValue = 0;
					} else if (unit === 'PIXELS' && value !== null) {
						const emValue = value / fontSize;
						letterSpacingValue = `${roundToMax3Decimals(emValue)}em`;
					} else if (value !== null) {
						letterSpacingValue = roundToMax3Decimals(value);
					}
				} else if (typeof letterSpacing === 'number') {
					letterSpacingValue = roundToMax3Decimals(letterSpacing);
				} else if (typeof letterSpacing === 'string') {
					const letterSpacingStr = letterSpacing as string;
					if (letterSpacingStr.endsWith('px')) {
						const pixelValue = parseFloat(letterSpacingStr);
						const emValue = pixelValue / fontSize;
						letterSpacingValue = `${roundToMax3Decimals(emValue)}em`;
					} else {
						letterSpacingValue = roundToMax3Decimals(parseFloat(letterSpacingStr));
					}
				}
			}

			if (letterSpacingValue !== null && !uniqueLetterSpacings.has(String(letterSpacingValue))) {
				uniqueLetterSpacings.add(String(letterSpacingValue));
				typographySettings.letterSpacings.push({
					letterSpacing: letterSpacingValue,
					name: formatStyleName(style.name),
					slug: createSlugFromStyleName(style.name)
				});
			}
		}

		// Process text case (text transform)
		if (textCase !== undefined && textCase !== "ORIGINAL") {
			const textCaseMap: Record<string, string> = {
				"UPPER": "uppercase",
				"LOWER": "lowercase",
				"TITLE": "capitalize",
				"SMALL_CAPS": "small-caps",
				"SMALL_CAPS_FORCED": "small-caps"
			};

			let textTransformValue = null;
			// @ts-expect-error the types are wrong
			if (boundVariables?.textCase) {
				// @ts-expect-error the types are wrong
				const variableId = boundVariables.textCase.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					textTransformValue = buildCssVarReference(nameParts);
				}
			} else if (textCase in textCaseMap) {
				textTransformValue = textCaseMap[textCase];
			}

			if (textTransformValue && !uniqueTextTransforms.has(textTransformValue)) {
				uniqueTextTransforms.add(textTransformValue);
				typographySettings.textTransforms.push({
					textTransform: textTransformValue,
					name: formatStyleName(style.name),
					slug: createSlugFromStyleName(style.name)
				});
			}
		}

		// Process text decoration
		if (textDecoration !== undefined && textDecoration !== "NONE") {
			const decorationMap: Record<string, string> = {
				"UNDERLINE": "underline",
				"STRIKETHROUGH": "line-through"
			};

			let textDecorationValue = null;
			// @ts-expect-error the types are wrong
			if (boundVariables?.textDecoration) {
				// @ts-expect-error the types are wrong
				const variableId = boundVariables.textDecoration.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					textDecorationValue = buildCssVarReference(nameParts);
				}
			} else if (textDecoration in decorationMap) {
				textDecorationValue = decorationMap[textDecoration];
			}

			if (textDecorationValue && !uniqueTextDecorations.has(textDecorationValue)) {
				uniqueTextDecorations.add(textDecorationValue);
				typographySettings.textDecorations.push({
					textDecoration: textDecorationValue,
					name: formatStyleName(style.name),
					slug: createSlugFromStyleName(style.name)
				});
			}
		}
	}

	// Remove empty arrays
	Object.keys(typographySettings).forEach(key => {
		if (typographySettings[key].length === 0) {
			delete typographySettings[key];
		}
	});

	// Debug logging
	console.log('Final typography settings:', typographySettings);
	console.log('Font families count:', typographySettings.fontFamilies?.length || 0);

	return typographySettings;
}

// Function to retrieve and process text styles from Figma (legacy function for backward compatibility)
export async function getTypographyPresets(options?: ExportOptions): Promise<any[]> {
	// Get all text styles in the document - use async version
	const textStyles = await figma.getLocalTextStylesAsync();
	const typographyPresets = [];

	// Process each text style
	for (const style of textStyles) {
		// Remove the console.log for production
		// console.log({style});

		// Create slug from style name
		const styleName = style.name;
		const slug = createSlugFromStyleName(styleName);

		// Create the preset object
		const preset: Record<string, any> = {
			slug,
			name: formatStyleName(styleName),
		};

		// Add selector for heading styles if applicable
		if (/^h[1-6]$/i.test(slug) || slug.startsWith('heading-')) {
			const headingMatch = styleName.match(/h([1-6])|heading[- ]([1-6])/i);
			const headingLevel = headingMatch ? (headingMatch[1] || headingMatch[2]) : null;

			if (headingLevel) {
				preset.selector = `h${headingLevel}`;
			}
		}

		// Add typography properties
		const {
			// @ts-expect-error the types are wrong
			fontFamily, fontSize, fontWeight, fontName, lineHeight, letterSpacing,
			// @ts-expect-error the types are wrong
			textCase, textDecoration, textDecorationColor, textDecorationOffset,
			// @ts-expect-error the types are wrong
			textDecorationSkipInk, textDecorationStyle, textDecorationThickness,
			hangingPunctuation, leadingTrim, boundVariables
		} = style;

		// Try to map to CSS variables when possible, using boundVariables if available
		if (fontFamily) {
			if (boundVariables?.fontFamily) {
				// Get the variable directly from boundVariables
				const variableId = boundVariables.fontFamily.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					// Format path for font-family to ensure it has the right structure
					const formattedParts = formatFontPropertyPath(nameParts, 'family');
					preset.fontFamily = buildCssVarReference(formattedParts);
				}
			} else {
				// Fallback to the old method if no bound variable
				const fontFamilyVar = await findFontFamilyVariable(fontFamily);
				preset.fontFamily = fontFamilyVar || fontFamily;
			}
		} else if (fontName?.family) {
			// Use fontName.family as a fallback if fontFamily is not available
			const fontFamilyVar = await findFontFamilyVariable(fontName.family);
			preset.fontFamily = fontFamilyVar || fontName.family;
		}

		if (fontSize) {
			if (boundVariables?.fontSize) {
				// Get the variable directly from boundVariables
				const variableId = boundVariables.fontSize.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					// Format path for font-size to ensure it has the right structure
					const formattedParts = formatFontPropertyPath(nameParts, 'size');
					preset.fontSize = buildCssVarReference(formattedParts);
				}
			} else {
				// Fallback to the old method if no bound variable
				const fontSizeVar = await findFontSizeVariable(fontSize);
				if (fontSizeVar) {
					preset.fontSize = fontSizeVar;
				} else {
					// Apply rem conversion if enabled for font/typography
					if (options?.useRem && shouldUseRemForCollection(['font', 'size'], options.remCollections)) {
						preset.fontSize = convertPxToRem(fontSize);
					} else {
						preset.fontSize = `${fontSize}px`;
					}
				}
			}
		}

		if (fontWeight) {
			if (boundVariables?.fontWeight) {
				// Get the variable directly from boundVariables
				const variableId = boundVariables.fontWeight.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					// Format path for font-weight to ensure it has the right structure
					const formattedParts = formatFontPropertyPath(nameParts, 'weight');
					preset.fontWeight = buildCssVarReference(formattedParts);
				}
			} else {
				// Fallback to the old method if no bound variable
				const fontWeightVar = await findFontWeightVariable(fontWeight);
				preset.fontWeight = fontWeightVar || fontWeight;
			}
		} else if (fontName?.style) {
			// Extract font weight from fontName.style if available
			// Common mappings for font weight names to numeric values
			const fontWeightMap = {
				'thin': 100,
				'extralight': 200, 'extra light': 200, 'ultra light': 200,
				'light': 300,
				'normal': 400, 'regular': 400,
				'medium': 500,
				'semibold': 600, 'semi bold': 600, 'demi bold': 600,
				'bold': 700,
				'extrabold': 800, 'extra bold': 800, 'ultra bold': 800,
				'black': 900, 'heavy': 900
			};

			// Convert style to lowercase for matching
			const styleKey = fontName.style.toLowerCase();

			// First, check for direct numeric values like "700"
			const numericWeight = parseInt(styleKey, 10);
			if (!isNaN(numericWeight) && numericWeight >= 100 && numericWeight <= 900) {
				preset.fontWeight = numericWeight;
			} else {
				// Then check for weight name mapping
				for (const [name, value] of Object.entries(fontWeightMap)) {
					if (styleKey.includes(name)) {
						preset.fontWeight = value;
						break;
					}
				}
			}
		}

		// Handle lineHeight with bound variable if available
		if (lineHeight !== undefined) {
			// Check for bound variable first
			if (boundVariables?.lineHeight) {
				const variableId = boundVariables.lineHeight.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					// Format path for line-height to ensure it has the right structure
					const formattedParts = formatFontPropertyPath(nameParts, 'line-height');
					preset.lineHeight = buildCssVarReference(formattedParts);
				}
			} else {
				// Fall back to the existing formatting logic if no bound variable
				// Handle complex object format
				if (typeof lineHeight === 'object' && lineHeight !== null) {
					// Access unit and value safely
					const unit = 'unit' in lineHeight ? (lineHeight as any).unit : null;
					const value = 'value' in lineHeight ? (lineHeight as any).value : null;

					// For percent units, just output the numeric value as a string
					if (unit === 'PERCENT' && value !== null) {
						// Convert percentage to decimal (e.g., 120 -> 1.2)
						preset.lineHeight = roundToMax3Decimals(value / 100);
					} else if (unit === 'PIXELS' && value !== null) {
						// Convert pixel values to unitless relative to font size
						preset.lineHeight = roundToMax3Decimals(value / fontSize);
					} else if (value !== null) {
						// For other units, keep the raw value
						preset.lineHeight = roundToMax3Decimals(value);
					} else {
						// Fallback to 'normal' if we can't determine a proper value
						preset.lineHeight = 'normal';
					}
				} else if (typeof lineHeight === 'number') {
					// Handle numeric lineHeight
					preset.lineHeight = roundToMax3Decimals(lineHeight);
				} else if (typeof lineHeight === 'string') {
					// Convert to number or keep as is if it's already unitless
					const lineHeightStr = lineHeight as string;
					if (lineHeightStr.endsWith('px')) {
						const pixelValue = parseFloat(lineHeightStr);
						preset.lineHeight = roundToMax3Decimals(pixelValue / fontSize);
					} else if (lineHeightStr.endsWith('%')) {
						// Convert percentage string to decimal
						const percentValue = parseFloat(lineHeightStr.replace('%', ''));
						preset.lineHeight = roundToMax3Decimals(percentValue / 100);
					} else {
						preset.lineHeight = roundToMax3Decimals(parseFloat(lineHeightStr));
					}
				}
			}
		}

		// Handle letterSpacing with bound variable if available
		if (letterSpacing !== undefined) {
			// Check for bound variable first
			if (boundVariables?.letterSpacing) {
				const variableId = boundVariables.letterSpacing.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					// Format path for letter-spacing to ensure it has the right structure
					const formattedParts = formatFontPropertyPath(nameParts, 'letter-spacing');
					preset.letterSpacing = buildCssVarReference(formattedParts);
				}
			} else {
				// Fall back to the existing formatting logic if no bound variable
				// Handle complex object format
				if (typeof letterSpacing === 'object' && letterSpacing !== null) {
					// Access unit and value safely
					const unit = 'unit' in letterSpacing ? (letterSpacing as any).unit : null;
					const value = 'value' in letterSpacing ? (letterSpacing as any).value : null;

					// For percent units with 0 value, output just 0 (numeric)
					if (unit === 'PERCENT' && value === 0) {
						preset.letterSpacing = 0;
					} else if (unit === 'PIXELS' && value !== null) {
						// Convert pixel values to em units relative to font size
						const emValue = value / fontSize;
						preset.letterSpacing = `${roundToMax3Decimals(emValue)}em`;
					} else if (value !== null) {
						// For other units, keep the raw value
						preset.letterSpacing = roundToMax3Decimals(value);
					} else {
						// Fallback to 0 if we can't determine a proper value
						preset.letterSpacing = 0;
					}
				} else if (typeof letterSpacing === 'number') {
					// Handle numeric letterSpacing
					preset.letterSpacing = roundToMax3Decimals(letterSpacing);
				} else if (typeof letterSpacing === 'string') {
					// Convert to em units for WordPress
					const letterSpacingStr = letterSpacing as string;
					if (letterSpacingStr.endsWith('px')) {
						const pixelValue = parseFloat(letterSpacingStr);
						const emValue = pixelValue / fontSize;
						preset.letterSpacing = `${roundToMax3Decimals(emValue)}em`;
					} else {
						preset.letterSpacing = roundToMax3Decimals(parseFloat(letterSpacingStr));
					}
				}
			}
		}

		// Handle textCase
		if (textCase !== undefined && textCase !== "ORIGINAL") {
			const textCaseMap: Record<string, string> = {
				"UPPER": "uppercase",
				"LOWER": "lowercase",
				"TITLE": "capitalize",
				"SMALL_CAPS": "small-caps",
				"SMALL_CAPS_FORCED": "small-caps"
			};

			// @ts-expect-error the types are wrong
			if (boundVariables?.textCase) {
				// @ts-expect-error the types are wrong
				const variableId = boundVariables.textCase.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					preset.textTransform = buildCssVarReference(nameParts);
				}
			} else if (textCase in textCaseMap) {
				preset.textTransform = textCaseMap[textCase];
			}
		}

		// Handle textDecoration
		if (textDecoration !== undefined && textDecoration !== "NONE") {
			const decorationMap: Record<string, string> = {
				"UNDERLINE": "underline",
				"STRIKETHROUGH": "line-through"
			};

			// @ts-expect-error the types are wrong
			if (boundVariables?.textDecoration) {
				// @ts-expect-error the types are wrong
				const variableId = boundVariables.textDecoration.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					preset.textDecoration = buildCssVarReference(nameParts);
				}
			} else if (textDecoration in decorationMap) {
				preset.textDecoration = decorationMap[textDecoration];
			}
		}

		// Handle textDecorationColor
		if (textDecorationColor) {
			// @ts-expect-error the types are wrong
			if (boundVariables?.textDecorationColor) {
				// @ts-expect-error the types are wrong
				const variableId = boundVariables.textDecorationColor.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					preset.textDecorationColor = buildCssVarReference(nameParts);
				}
			} else if (typeof textDecorationColor === 'object') {
				// Convert color object to hex or rgba and only set if valid
				const colorValue = rgbToHex(textDecorationColor);
				if (colorValue !== null) {
					preset.textDecorationColor = colorValue;
				}
			} else if (typeof textDecorationColor === 'string') {
				preset.textDecorationColor = textDecorationColor;
			}
		}

		// Handle textDecorationStyle
		if (textDecorationStyle !== undefined && textDecorationStyle !== "SOLID") {
			const styleMap: Record<string, string> = {
				"DASHED": "dashed",
				"DOTTED": "dotted",
				"WAVY": "wavy"
			};

			// @ts-expect-error the types are wrong
			if (boundVariables?.textDecorationStyle) {
				// @ts-expect-error the types are wrong
				const variableId = boundVariables.textDecorationStyle.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					preset.textDecorationStyle = buildCssVarReference(nameParts);
				}
			} else if (textDecorationStyle in styleMap) {
				preset.textDecorationStyle = styleMap[textDecorationStyle as string];
			}
		}

		// Handle textDecorationThickness
		if (textDecorationThickness !== undefined) {
			// @ts-expect-error the types are wrong
			if (boundVariables?.textDecorationThickness) {
				// @ts-expect-error the types are wrong
				const variableId = boundVariables.textDecorationThickness.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					preset.textDecorationThickness = buildCssVarReference(nameParts);
				}
			} else {
				// Only set if we have a valid value
				if (typeof textDecorationThickness === 'object') {
					// If it's an object, only use if it has a value property
					if (textDecorationThickness && 'value' in textDecorationThickness &&
						typeof textDecorationThickness.value === 'number') {
						preset.textDecorationThickness = `${textDecorationThickness.value}px`;
					}
					// Otherwise omit the property
				} else if (typeof textDecorationThickness === 'number') {
					// Convert to px units for WordPress
					preset.textDecorationThickness = `${textDecorationThickness}px`;
				}
				// Do not set a default - omit if invalid
			}
		}

		// Handle textDecorationOffset
		if (textDecorationOffset !== undefined) {
			// @ts-expect-error the types are wrong
			if (boundVariables?.textDecorationOffset) {
				// @ts-expect-error the types are wrong
				const variableId = boundVariables.textDecorationOffset.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					preset.textUnderlineOffset = buildCssVarReference(nameParts);
				}
			} else {
				// Only set if we have a valid value
				if (typeof textDecorationOffset === 'object') {
					// If it's an object, only use if it has a value property
					if (textDecorationOffset && 'value' in textDecorationOffset &&
						typeof textDecorationOffset.value === 'number') {
						preset.textUnderlineOffset = `${textDecorationOffset.value}px`;
					}
					// Otherwise omit the property
				} else if (typeof textDecorationOffset === 'number') {
					// Convert to px units for WordPress
					preset.textUnderlineOffset = `${textDecorationOffset}px`;
				}
				// Do not set a default - omit if invalid
			}
		}

		// Handle textDecorationSkipInk
		if (textDecorationSkipInk !== undefined && textDecorationSkipInk !== "AUTO") {
			const skipInkMap: Record<string, string> = {
				"NONE": "none",
				"ALL": "all"
			};

			// @ts-expect-error the types are wrong
			if (boundVariables?.textDecorationSkipInk) {
				// @ts-expect-error the types are wrong
				const variableId = boundVariables.textDecorationSkipInk.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					preset.textDecorationSkipInk = buildCssVarReference(nameParts);
				}
			} else if (textDecorationSkipInk in skipInkMap) {
				preset.textDecorationSkipInk = skipInkMap[textDecorationSkipInk as string];
			}
		}

		// Handle hangingPunctuation
		if (hangingPunctuation !== undefined) {
			// @ts-expect-error the types are wrong
			if (boundVariables?.hangingPunctuation) {
				// @ts-expect-error the types are wrong
				const variableId = boundVariables.hangingPunctuation.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					preset.hangingPunctuation = buildCssVarReference(nameParts);
				}
			} else {
				preset.hangingPunctuation = hangingPunctuation ? "first" : "none";
			}
		}

		// Handle leadingTrim
		// @ts-expect-error the types are wrong
		if (leadingTrim !== undefined && leadingTrim !== "AUTO") {
			const leadingTrimMap: Record<string, string> = {
				"NONE": "none",
				"BOTH": "both",
				"CAP": "start",
				"ALPHABETIC": "end"
			};

			// @ts-expect-error the types are wrong
			if (boundVariables?.leadingTrim) {
				// @ts-expect-error the types are wrong
				const variableId = boundVariables.leadingTrim.id;
				const variable = await figma.variables.getVariableByIdAsync(variableId);
				if (variable) {
					const nameParts = variable.name.split("/").map(part => part.toLowerCase());
					preset.leadingTrim = buildCssVarReference(nameParts);
				}
			} else if (leadingTrim in leadingTrimMap) {
				preset.leadingTrim = leadingTrimMap[leadingTrim as string];
			}
		}

		typographyPresets.push(preset);
	}

	return typographyPresets;
}

// Helper function to format style name for display
export function formatStyleName(fullStyleName: string): string {
	// Get the last part of the path (after the last slash or backslash)
	const lastPart = fullStyleName.split(/[/\\]/).pop() || fullStyleName;
	
	// Handle camelCase by inserting spaces before capital letters
	const spacedName = lastPart.replace(/([a-z])([A-Z])/g, '$1 $2');
	
	// Split by spaces, dashes, or underscores
	const parts = spacedName.split(/[\s\-_]+/).filter(part => part.length > 0);
	
	// Format each part
	const formattedParts = parts.map(part => {
		// Check if it's a size indicator
		const sizeIndicators = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
		if (sizeIndicators.includes(part.toLowerCase())) {
			return part.toUpperCase();
		}
		// Otherwise capitalize first letter
		return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
	});
	
	// Join the parts with spaces
	return formattedParts.join(' ');
}

// Helper function to create a slug from a style name
export function createSlugFromStyleName(styleName: string): string {
	// Get the last part of the path (after the last slash or backslash)
	const lastPart = styleName.split(/[/\\]/).pop() || styleName;

	// Convert to lowercase and replace spaces and special characters with dashes
	return lastPart
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, '-') // Replace any non-alphanumeric chars with dashes
		.replace(/-+/g, '-')          // Replace multiple consecutive dashes with a single dash
		.replace(/^-|-$/g, '');       // Remove leading and trailing dashes
}

// Helper function to try to find a matching font family variable
export async function findFontFamilyVariable(fontFamily: string): Promise<string | null> {
	// First check if it's a WordPress preset font family
	const wpPresetMatch = fontFamily.match(/^(sans|serif|monospace|system)$/i);
	if (wpPresetMatch) {
		return `var(--wp--preset--font-family--${wpPresetMatch[1].toLowerCase()})`;
	}

	// Try to find a custom font family variable in the document
	try {
		const collections = await figma.variables.getLocalVariableCollectionsAsync();

		for (const collection of collections) {
			// @ts-expect-error the types are wrong
			const variables = await figma.variables.getVariablesByCollectionIdAsync(collection.id);

			for (const variable of variables) {
				// Look for variables that might be font families
				if (variable.name.toLowerCase().includes('font') &&
					variable.name.toLowerCase().includes('family')) {

					const valuesByMode = await figma.variables.getVariableByIdAsync(variable.id)
						.then(v => v?.valuesByMode);

					// Check each mode's value
					if (valuesByMode) {
						for (const [_, value] of Object.entries(valuesByMode)) {
							if (value === fontFamily) {
								// Found a match, return as a CSS variable reference
								const nameParts = variable.name.split("/").map((part: string) => part.toLowerCase());
								return buildCssVarReference(nameParts);
							}
						}
					}
				}
			}
		}
	} catch (error) {
		console.error("Error finding font family variable:", error);
	}

	// If no match is found, return the font family as-is for WordPress to handle
	// WordPress will use this as the actual font-family CSS value
	return null;
}

// Helper function to try to find a matching font size variable
export async function findFontSizeVariable(fontSize: number): Promise<string | null> {
	try {
		const collections = await figma.variables.getLocalVariableCollectionsAsync();

		for (const collection of collections) {
			// @ts-expect-error the types are wrong
			const variables = await figma.variables.getVariablesByCollectionIdAsync(collection.id);

			for (const variable of variables) {
				// Look for variables that might be font sizes
				if (variable.name.toLowerCase().includes('font') &&
					variable.name.toLowerCase().includes('size')) {

					const variableInfo = await figma.variables.getVariableByIdAsync(variable.id);

					// Check each mode's value
					if (variableInfo?.valuesByMode) {
						for (const [_, value] of Object.entries(variableInfo.valuesByMode)) {
							if (value === fontSize) {
								// Found a match, return as a CSS variable reference
								const nameParts = variable.name.split("/").map((part: string) => part.toLowerCase());
								return buildCssVarReference(nameParts);
							}
						}
					}
				}
			}
		}
	} catch (error) {
		console.error("Error finding font size variable:", error);
	}

	return null;
}

// Helper function to try to find a matching font weight variable
export async function findFontWeightVariable(fontWeight: number): Promise<string | null> {
	// Map of common font weight names
	const weightNames: Record<number, string> = {
		100: 'thin',
		200: 'extra-light',
		300: 'light',
		400: 'regular',
		500: 'medium',
		600: 'semi-bold',
		700: 'bold',
		800: 'extra-bold',
		900: 'black'
	};

	try {
		const collections = await figma.variables.getLocalVariableCollectionsAsync();

		for (const collection of collections) {
			// @ts-expect-error the types are wrong
			const variables = await figma.variables.getVariablesByCollectionIdAsync(collection.id);

			for (const variable of variables) {
				// Look for variables that might be font weights
				if (variable.name.toLowerCase().includes('font') &&
					variable.name.toLowerCase().includes('weight')) {

					const variableInfo = await figma.variables.getVariableByIdAsync(variable.id);

					// Check each mode's value
					if (variableInfo?.valuesByMode) {
						for (const [_, value] of Object.entries(variableInfo.valuesByMode)) {
							if (value === fontWeight) {
								// Found a match, return as a CSS variable reference
								const nameParts = variable.name.split("/").map((part: string) => part.toLowerCase());
								return buildCssVarReference(nameParts);
							}
						}
					}

					// Check for name-based match (like "bold" for 700)
					if (fontWeight in weightNames) {
						const weightName = weightNames[fontWeight];
						if (variable.name.toLowerCase().includes(weightName)) {
							const nameParts = variable.name.split("/").map((part: string) => part.toLowerCase());
							return buildCssVarReference(nameParts);
						}
					}
				}
			}
		}
	} catch (error) {
		console.error("Error finding font weight variable:", error);
	}

	return null;
} 