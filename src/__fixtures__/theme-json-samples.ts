/**
 * Shared theme.json test fixtures
 */

export const MINIMAL_THEME_JSON = {
	$schema: 'https://schemas.wp.org/trunk/theme.json',
	version: 3 as const,
	settings: {},
};

export const COLORS_THEME_JSON = {
	$schema: 'https://schemas.wp.org/trunk/theme.json',
	version: 3 as const,
	settings: {
		color: {
			palette: [
				{ name: 'Primary', slug: 'primary', color: '#007cba' },
				{ name: 'Secondary', slug: 'secondary', color: '#666666' },
				{ name: 'Accent', slug: 'accent', color: '#ff6900' },
				{ name: 'White', slug: 'white', color: '#ffffff' },
				{ name: 'Black', slug: 'black', color: '#000000' },
				{ name: 'CSS Var', slug: 'css-var', color: 'var(--wp--preset--color--primary)' },
			],
		},
	},
};

export const TYPOGRAPHY_THEME_JSON = {
	$schema: 'https://schemas.wp.org/trunk/theme.json',
	version: 3 as const,
	settings: {
		typography: {
			fontSizes: [
				{ name: 'Small', slug: 'small', size: '13px' },
				{ name: 'Medium', slug: 'medium', size: '16px' },
				{ name: 'Large', slug: 'large', size: '24px' },
				{
					name: 'Fluid Heading',
					slug: 'fluid-heading',
					size: '32px',
					fluid: { min: '24px', max: '32px' },
				},
			],
			fontFamilies: [
				{
					name: 'System',
					slug: 'system',
					fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
				},
			],
		},
	},
};

export const SPACING_THEME_JSON = {
	$schema: 'https://schemas.wp.org/trunk/theme.json',
	version: 3 as const,
	settings: {
		spacing: {
			spacingSizes: [
				{ name: 'Small', slug: 'small', size: '8px' },
				{ name: 'Medium', slug: 'medium', size: '16px' },
				{ name: 'Large', slug: 'large', size: '32px' },
				{ name: 'Fluid', slug: 'fluid', size: 'clamp(16px, 3vw, 32px)' },
			],
		},
	},
};

export const PRIMITIVES_THEME_JSON = {
	$schema: 'https://schemas.wp.org/trunk/theme.json',
	version: 3 as const,
	settings: {
		custom: {
			color: {
				primary: '#007cba',
				secondary: '#666666',
			},
			spacing: {
				base: '16px',
				large: '32px',
			},
			typography: {
				fontSize: {
					small: '13px',
				},
			},
		},
	},
};

export const FULL_THEME_JSON = {
	$schema: 'https://schemas.wp.org/trunk/theme.json',
	version: 3 as const,
	settings: {
		color: {
			palette: [
				{ name: 'Primary', slug: 'primary', color: '#007cba' },
				{ name: 'Secondary', slug: 'secondary', color: '#666666' },
			],
			gradients: [
				{
					name: 'Vivid cyan blue to vivid purple',
					slug: 'vivid-cyan-blue-to-vivid-purple',
					gradient: 'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)',
				},
			],
			duotone: [
				{
					name: 'Dark grayscale',
					slug: 'dark-grayscale',
					colors: ['#000000', '#7f7f7f'],
				},
			],
		},
		typography: {
			fontSizes: [
				{ name: 'Small', slug: 'small', size: '13px' },
				{ name: 'Large', slug: 'large', size: '24px' },
			],
			fontFamilies: [
				{
					name: 'System',
					slug: 'system',
					fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
				},
			],
		},
		spacing: {
			spacingSizes: [
				{ name: 'Small', slug: 'small', size: '8px' },
				{ name: 'Large', slug: 'large', size: '32px' },
			],
		},
		shadow: {
			presets: [
				{
					name: 'Natural',
					slug: 'natural',
					shadow: '6px 6px 9px rgba(0, 0, 0, 0.2)',
				},
			],
		},
		custom: {
			color: {
				primary: '#007cba',
			},
			spacing: {
				base: '16px',
			},
		},
	},
	styles: {
		elements: {
			button: {
				color: {
					background: '#007cba',
					text: '#ffffff',
				},
			},
			link: {
				color: {
					text: '#007cba',
				},
			},
		},
		blocks: {
			'core/button': {
				color: {
					background: '#007cba',
					text: '#ffffff',
				},
			},
		},
	},
};

export const INVALID_THEME_JSON_NO_VERSION = {
	settings: {
		color: {
			palette: [{ name: 'Primary', slug: 'primary', color: '#007cba' }],
		},
	},
};

export const INVALID_THEME_JSON_WRONG_VERSION = {
	version: 1,
	settings: {},
};

export const RGB_COLORS_THEME_JSON = {
	$schema: 'https://schemas.wp.org/trunk/theme.json',
	version: 3 as const,
	settings: {
		color: {
			palette: [
				{ name: 'Red', slug: 'red', color: 'rgb(255, 0, 0)' },
				{ name: 'Green Alpha', slug: 'green-alpha', color: 'rgba(0, 255, 0, 0.5)' },
			],
		},
	},
};
