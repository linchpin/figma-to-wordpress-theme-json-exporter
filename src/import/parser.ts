/**
 * Theme.json Parser Utilities
 *
 * Functions for parsing and validating WordPress theme.json files
 * and converting values to Figma-compatible formats.
 */

import { ThemeJsonV3 } from '../types/theme-json';
import { VariableResolveType, FlattenedVariable } from './types';

/**
 * Parse a theme.json string or object and validate its structure
 */
export function parseThemeJson(input: string | object): ThemeJsonV3 {
	let json: any;

	if (typeof input === 'string') {
		try {
			json = JSON.parse(input);
		} catch (e) {
			throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`);
		}
	} else {
		json = input;
	}

	// Basic validation
	if (!json || typeof json !== 'object') {
		throw new Error('Theme.json must be an object');
	}

	if (json.version !== 2 && json.version !== 3) {
		throw new Error(`Unsupported theme.json version: ${json.version}. Supported versions: 2, 3`);
	}

	return json as ThemeJsonV3;
}

/**
 * Infer the Figma variable type from a value
 */
export function inferVariableType(value: any): VariableResolveType | null {
	if (value === null || value === undefined) return null;

	if (typeof value === 'string') {
		// Hex colors
		if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value)) {
			return 'COLOR';
		}

		// RGB/RGBA colors
		if (/^rgba?\s*\(/.test(value)) {
			return 'COLOR';
		}

		// HSL/HSLA colors
		if (/^hsla?\s*\(/.test(value)) {
			return 'COLOR';
		}

		// Size values with units (px, rem, em, %, vh, vw)
		if (/^-?\d+(\.\d+)?(px|rem|em|%|vh|vw)$/.test(value)) {
			return 'FLOAT';
		}

		// Plain numbers as strings
		if (/^-?\d+(\.\d+)?$/.test(value)) {
			return 'FLOAT';
		}

		// CSS var references - cannot determine type without resolution
		if (value.startsWith('var(') || value.startsWith('var:')) {
			return null;
		}

		// clamp() functions typically represent sizes
		if (value.startsWith('clamp(')) {
			return 'FLOAT';
		}

		// Other strings (font families, etc.)
		return 'STRING';
	}

	if (typeof value === 'number') {
		return 'FLOAT';
	}

	if (typeof value === 'boolean') {
		return 'BOOLEAN';
	}

	// Fluid values object
	if (typeof value === 'object' && (value.fluid === 'true' || value.fluid === true)) {
		const type = inferVariableType(value.min) || inferVariableType(value.max);
		return type;
	}

	return null;
}

/**
 * Check if a value is a CSS variable reference
 */
export function isCssVarReference(value: any): boolean {
	if (typeof value !== 'string') return false;
	return value.startsWith('var(') || value.startsWith('var:');
}

/**
 * Parse a CSS variable reference to extract the path
 *
 * Handles formats:
 * - var:preset|color|primary
 * - var(--wp--custom--spacing--base)
 * - var(--wp--preset--color--primary)
 */
export function parseCssVarReference(value: string): { type: 'custom' | 'preset'; path: string[] } | null {
	// WordPress preset format: var:preset|color|primary
	const presetMatch = value.match(/^var:preset\|([^|]+)\|(.+)$/);
	if (presetMatch) {
		return {
			type: 'preset',
			path: [presetMatch[1], presetMatch[2]]
		};
	}

	// CSS custom property format: var(--wp--custom--spacing--base)
	const cssCustomMatch = value.match(/^var\(--wp--custom--(.+?)\)$/);
	if (cssCustomMatch) {
		return {
			type: 'custom',
			path: cssCustomMatch[1].split('--')
		};
	}

	// CSS preset format: var(--wp--preset--color--primary)
	const cssPresetMatch = value.match(/^var\(--wp--preset--([^-]+)--(.+?)\)$/);
	if (cssPresetMatch) {
		return {
			type: 'preset',
			path: [cssPresetMatch[1], cssPresetMatch[2]]
		};
	}

	return null;
}

/**
 * Convert a hex color string to Figma RGBA format
 */
export function hexToFigmaRgba(hex: string): RGBA {
	// Remove # if present
	hex = hex.replace(/^#/, '');

	let r: number, g: number, b: number, a: number = 1;

	if (hex.length === 3) {
		r = parseInt(hex[0] + hex[0], 16) / 255;
		g = parseInt(hex[1] + hex[1], 16) / 255;
		b = parseInt(hex[2] + hex[2], 16) / 255;
	} else if (hex.length === 6) {
		r = parseInt(hex.slice(0, 2), 16) / 255;
		g = parseInt(hex.slice(2, 4), 16) / 255;
		b = parseInt(hex.slice(4, 6), 16) / 255;
	} else if (hex.length === 8) {
		r = parseInt(hex.slice(0, 2), 16) / 255;
		g = parseInt(hex.slice(2, 4), 16) / 255;
		b = parseInt(hex.slice(4, 6), 16) / 255;
		a = parseInt(hex.slice(6, 8), 16) / 255;
	} else {
		throw new Error(`Invalid hex color: #${hex}`);
	}

	return { r, g, b, a };
}

/**
 * Parse an RGB/RGBA color string to Figma RGBA format
 */
export function rgbToFigmaRgba(rgb: string): RGBA {
	const match = rgb.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\s*\)$/);
	if (!match) {
		throw new Error(`Invalid RGB color: ${rgb}`);
	}

	return {
		r: parseInt(match[1], 10) / 255,
		g: parseInt(match[2], 10) / 255,
		b: parseInt(match[3], 10) / 255,
		a: match[4] ? parseFloat(match[4]) : 1
	};
}

/**
 * Convert any color string to Figma RGBA format
 */
export function colorToFigmaRgba(color: string): RGBA {
	if (color.startsWith('#')) {
		return hexToFigmaRgba(color);
	}
	if (color.startsWith('rgb')) {
		return rgbToFigmaRgba(color);
	}
	throw new Error(`Unsupported color format: ${color}`);
}

/**
 * Parse a CSS size value and return the numeric value in pixels
 *
 * Note: rem/em are converted assuming 16px base
 */
export function parseCssSize(value: string): number {
	// Handle clamp() by extracting the middle (preferred) value
	const clampMatch = value.match(/^clamp\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)$/);
	if (clampMatch) {
		// Use the max value (third parameter) for Figma
		return parseCssSize(clampMatch[3].trim());
	}

	const match = value.match(/^(-?\d+(?:\.\d+)?)(px|rem|em|%|vh|vw)?$/);
	if (!match) {
		throw new Error(`Invalid size value: ${value}`);
	}

	const num = parseFloat(match[1]);
	const unit = match[2] || 'px';

	// Convert to pixels (base 16px for rem/em)
	switch (unit) {
		case 'rem':
		case 'em':
			return num * 16;
		case 'px':
		default:
			return num;
	}
}

/**
 * Flatten a nested object into variable paths
 *
 * Example:
 * { color: { primary: "#ff0000" } }
 * becomes:
 * [{ path: "color/primary", value: "#ff0000" }]
 */
export function flattenToVariablePaths(
	obj: Record<string, any>,
	prefix: string = ''
): FlattenedVariable[] {
	const results: FlattenedVariable[] = [];

	for (const [key, value] of Object.entries(obj)) {
		const path = prefix ? `${prefix}/${key}` : key;

		if (value && typeof value === 'object' && !Array.isArray(value)) {
			// Check if it's a fluid value object
			if (value.fluid === 'true' || value.fluid === true) {
				const type = inferVariableType(value);
				results.push({
					path,
					value,
					type,
					isReference: false
				});
			} else {
				// Recurse into nested objects
				results.push(...flattenToVariablePaths(value, path));
			}
		} else if (value !== null && value !== undefined) {
			const isRef = isCssVarReference(value);
			const type = inferVariableType(value);
			results.push({
				path,
				value,
				type,
				isReference: isRef
			});
		}
	}

	return results;
}

/**
 * Convert a slug to a variable-friendly name
 * Replaces hyphens with slashes for nested structure
 */
export function slugToVariablePath(slug: string): string {
	return slug.replace(/-/g, '/');
}

/**
 * Convert camelCase or kebab-case to a display name
 */
export function toDisplayName(str: string): string {
	return str
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/-/g, ' ')
		.replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get the collection name for a theme.json section
 */
export function getCollectionNameForSection(section: string): string {
	switch (section) {
		case 'settings.custom':
			return 'Primitives';
		case 'settings.color.palette':
			return 'wp.settings.colors';
		case 'settings.typography':
			return 'wp.settings.typography';
		case 'settings.spacing.spacingSizes':
			return 'wp.settings.spacing';
		default:
			return section;
	}
}
