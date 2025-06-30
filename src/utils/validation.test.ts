import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateThemeJson, formatValidationResults, ValidationOptions } from './validation';

// Mock fetch for schema validation
global.fetch = vi.fn();

describe('validateThemeJson', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should validate a valid theme.json', async () => {
		const validThemeJson = {
			version: 3,
			$schema: 'https://schemas.wp.org/trunk/theme.json',
			settings: {
				color: {
					palette: [
						{
							name: 'Primary',
							slug: 'primary',
							color: '#007cba'
						}
					]
				},
				typography: {
					fontSizes: [
						{
							name: 'Small',
							slug: 'small',
							size: '13px'
						}
					]
				}
			}
		};

		// Mock successful schema fetch
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({})
		});

		const result = await validateThemeJson(validThemeJson);

		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should detect missing version', async () => {
		const invalidThemeJson = {
			settings: {}
		};

		const result = await validateThemeJson(invalidThemeJson);

		expect(result.isValid).toBe(false);
		expect(result.errors).toContain('Missing required property: version');
	});

	it('should detect wrong version', async () => {
		const invalidThemeJson = {
			version: 2,
			settings: {}
		};

		const result = await validateThemeJson(invalidThemeJson);

		expect(result.isValid).toBe(false);
		expect(result.errors).toContain('Version must be 3');
	});

	it('should warn about missing $schema', async () => {
		const themeJson = {
			version: 3,
			settings: {}
		};

		const result = await validateThemeJson(themeJson);

		expect(result.isValid).toBe(true);
		expect(result.warnings).toContain('Missing $schema property (recommended for IDE support)');
	});

	it('should warn about wrong $schema', async () => {
		const themeJson = {
			version: 3,
			$schema: 'https://wrong-schema.org/theme.json',
			settings: {}
		};

		const result = await validateThemeJson(themeJson);

		expect(result.isValid).toBe(true);
		expect(result.warnings).toContain('$schema should be "https://schemas.wp.org/trunk/theme.json"');
	});

	it('should validate color palette structure', async () => {
		const themeJson = {
			version: 3,
			settings: {
				color: {
					palette: [
						{
							name: 'Primary',
							slug: 'primary',
							color: '#007cba'
						},
						{
							name: 'Secondary',
							// Missing slug
							color: '#666666'
						}
					]
				}
			}
		};

		// Mock successful schema fetch to avoid network issues
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({})
		});

		const result = await validateThemeJson(themeJson);

		expect(result.isValid).toBe(false);
		expect(result.errors).toContain('settings.color.palette[1] must have a valid slug property');
	});

	it('should validate typography structure', async () => {
		const themeJson = {
			version: 3,
			settings: {
				typography: {
					fontSizes: [
						{
							name: 'Small',
							slug: 'small',
							size: '13px'
						}
					],
					fontFamilies: [
						{
							name: 'Sans',
							slug: 'sans',
							fontFamily: 'Arial, sans-serif'
						}
					]
				}
			}
		};

		const result = await validateThemeJson(themeJson);

		expect(result.isValid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it('should validate CSS variable references', async () => {
		const themeJson = {
			version: 3,
			settings: {
				color: {
					palette: [
						{
							name: 'Primary',
							slug: 'primary',
							color: 'var(--wp--preset--color--primary)'
						}
					]
				},
				custom: {
					myColor: 'var(--invalid-format)'
				}
			}
		};

		// Mock successful schema fetch to avoid network issues
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({})
		});

		const result = await validateThemeJson(themeJson);

		const expectedWarning = 'CSS variable at settings.custom.myColor may not follow WordPress conventions: var(--invalid-format)';
		if (!result.warnings.includes(expectedWarning)) {
			throw new Error('Actual warnings: ' + JSON.stringify(result.warnings));
		}
		expect(result.isValid).toBe(true);
		expect(result.warnings).toContain(expectedWarning);
	});

	it('should warn about custom typography presets', async () => {
		const themeJson = {
			version: 3,
			settings: {
				custom: {
					typography: {
						presets: []
					}
				}
			}
		};

		const result = await validateThemeJson(themeJson);

		expect(result.isValid).toBe(true);
		expect(result.warnings).toContain('Custom typography presets detected. Consider using WordPress-compatible typography structure instead.');
	});

	it('should handle network errors gracefully', async () => {
		const themeJson = {
			version: 3,
			settings: {}
		};

		// Mock network error
		(global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

		const result = await validateThemeJson(themeJson);

		expect(result.isValid).toBe(true);
		expect(result.warnings).toContain('Schema validation unavailable: Network error');
	});

	it('should handle strict mode', async () => {
		const themeJson = {
			version: 3,
			settings: {}
		};

		const options: ValidationOptions = { strict: true };

		const result = await validateThemeJson(themeJson, options);

		// In strict mode, warnings should make the result invalid
		expect(result.isValid).toBe(false);
	});

	it('should allow custom properties when configured', async () => {
		const themeJson = {
			version: 3,
			settings: {
				custom: {
					myProperty: 'value'
				}
			}
		};

		const options: ValidationOptions = { allowCustomProperties: true };

		const result = await validateThemeJson(themeJson, options);

		expect(result.isValid).toBe(true);
		expect(result.warnings).not.toContain('Custom properties in settings.custom are not part of the standard schema');
	});
});

describe('formatValidationResults', () => {
	it('should format successful validation', () => {
		const result = {
			isValid: true,
			errors: [],
			warnings: []
		};

		const formatted = formatValidationResults(result);

		expect(formatted).toContain('✅ Theme.json validation passed!');
		expect(formatted).not.toContain('Errors:');
		expect(formatted).not.toContain('Warnings:');
	});

	it('should format failed validation with errors', () => {
		const result = {
			isValid: false,
			errors: ['Missing version', 'Invalid color format'],
			warnings: []
		};

		const formatted = formatValidationResults(result);

		expect(formatted).toContain('❌ Theme.json validation failed!');
		expect(formatted).toContain('Errors:');
		expect(formatted).toContain('  • Missing version');
		expect(formatted).toContain('  • Invalid color format');
	});

	it('should format validation with warnings', () => {
		const result = {
			isValid: true,
			errors: [],
			warnings: ['Missing $schema', 'Custom property detected']
		};

		const formatted = formatValidationResults(result);

		expect(formatted).toContain('✅ Theme.json validation passed!');
		expect(formatted).toContain('Warnings:');
		expect(formatted).toContain('  ⚠️  Missing $schema');
		expect(formatted).toContain('  ⚠️  Custom property detected');
	});

	it('should format validation with both errors and warnings', () => {
		const result = {
			isValid: false,
			errors: ['Missing version'],
			warnings: ['Missing $schema']
		};

		const formatted = formatValidationResults(result);

		expect(formatted).toContain('❌ Theme.json validation failed!');
		expect(formatted).toContain('Errors:');
		expect(formatted).toContain('Warnings:');
		expect(formatted).toContain('  • Missing version');
		expect(formatted).toContain('  ⚠️  Missing $schema');
	});
}); 