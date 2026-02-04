/**
 * Default Placeholder Values for Schema-based Variable Creation
 *
 * These are grayscale/neutral values that users can easily customize.
 * Based on WordPress theme.json conventions.
 */

import { ColorPlaceholder, FontSizePlaceholder, SpacingPlaceholder, PlaceholderConfig } from './types';

/**
 * Default color placeholders - grayscale for easy customization
 */
export const DEFAULT_COLORS: ColorPlaceholder[] = [
	{ name: 'Primary', slug: 'primary', color: '#333333' },
	{ name: 'Secondary', slug: 'secondary', color: '#666666' },
	{ name: 'Tertiary', slug: 'tertiary', color: '#999999' },
	{ name: 'Foreground', slug: 'foreground', color: '#1a1a1a' },
	{ name: 'Background', slug: 'background', color: '#ffffff' },
	{ name: 'Contrast', slug: 'contrast', color: '#000000' },
	{ name: 'Base', slug: 'base', color: '#f5f5f5' },
	{ name: 'Accent', slug: 'accent', color: '#444444' }
];

/**
 * Default font size placeholders - standard scale
 */
export const DEFAULT_FONT_SIZES: FontSizePlaceholder[] = [
	{ name: 'Extra Small', slug: 'xs', size: '12px' },
	{ name: 'Small', slug: 'sm', size: '14px' },
	{ name: 'Medium', slug: 'md', size: '16px' },
	{ name: 'Large', slug: 'lg', size: '20px' },
	{ name: 'Extra Large', slug: 'xl', size: '24px' },
	{ name: '2X Large', slug: 'xxl', size: '32px' },
	{ name: '3X Large', slug: 'xxxl', size: '48px' }
];

/**
 * Default spacing placeholders - WordPress 10-80 scale
 */
export const DEFAULT_SPACING: SpacingPlaceholder[] = [
	{ name: '1 (Smallest)', slug: '10', size: '4px' },
	{ name: '2', slug: '20', size: '8px' },
	{ name: '3', slug: '30', size: '12px' },
	{ name: '4', slug: '40', size: '16px' },
	{ name: '5 (Medium)', slug: '50', size: '24px' },
	{ name: '6', slug: '60', size: '32px' },
	{ name: '7', slug: '70', size: '48px' },
	{ name: '8 (Largest)', slug: '80', size: '64px' }
];

/**
 * Get default placeholder configuration
 */
export function getDefaultPlaceholders(): PlaceholderConfig {
	return {
		colors: DEFAULT_COLORS,
		fontSizes: DEFAULT_FONT_SIZES,
		spacing: DEFAULT_SPACING
	};
}

/**
 * Merge custom placeholders with defaults
 */
export function mergePlaceholders(custom?: Partial<PlaceholderConfig>): PlaceholderConfig {
	const defaults = getDefaultPlaceholders();

	if (!custom) {
		return defaults;
	}

	return {
		colors: custom.colors || defaults.colors,
		fontSizes: custom.fontSizes || defaults.fontSizes,
		spacing: custom.spacing || defaults.spacing
	};
}

/**
 * Collection names for each section
 */
export const COLLECTION_NAMES = {
	colors: 'wp.settings.colors',
	typography: 'wp.settings.typography',
	spacing: 'wp.settings.spacing'
} as const;

/**
 * Display names for each section
 */
export const SECTION_DISPLAY_NAMES = {
	colors: 'Colors',
	typography: 'Typography',
	spacing: 'Spacing'
} as const;
