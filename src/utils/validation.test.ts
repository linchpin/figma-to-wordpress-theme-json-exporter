import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateThemeJson, formatValidationResults, ValidationOptions, resetValidatorCache } from './validation';

// Mock fetch so tests use the bundled schema fallback
global.fetch = vi.fn();

describe('validateThemeJson', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetValidatorCache();
		// Default: simulate network failure so bundled schema is used
		(global.fetch as any).mockRejectedValue(new Error('Network unavailable'));
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

	it('should detect invalid color palette structure via AJV', async () => {
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
							// Missing slug - AJV should catch this
							color: '#666666'
						}
					]
				}
			}
		};

		const result = await validateThemeJson(themeJson);

		expect(result.isValid).toBe(false);
		// AJV should report a missing required property error for the palette item
		const hasSlugError = result.errors.some(e =>
			e.includes('slug') || e.includes('required')
		);
		expect(hasSlugError).toBe(true);
	});

	it('should validate valid typography structure', async () => {
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
				custom: {
					myColor: 'var(--invalid-format)'
				}
			}
		};

		const result = await validateThemeJson(themeJson);

		const expectedWarning = 'CSS variable at settings.custom.myColor may not follow WordPress conventions: var(--invalid-format)';
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

		expect(result.warnings).toContain('Custom typography presets detected. Consider using WordPress-compatible typography structure instead.');
	});

	it('should fall back to bundled schema on network error', async () => {
		const themeJson = {
			version: 3,
			settings: {}
		};

		(global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

		const result = await validateThemeJson(themeJson);

		expect(result.isValid).toBe(true);
		expect(result.warnings).toContain('Using bundled schema (could not fetch latest from WordPress)');
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

	it('should handle non-object input', async () => {
		const result = await validateThemeJson(null);

		expect(result.isValid).toBe(false);
		expect(result.errors).toContain('theme.json must be a valid JSON object');
	});

	it('should detect invalid property types via AJV', async () => {
		const themeJson = {
			version: 3,
			settings: {
				typography: {
					fontSizes: 'not-an-array' // Should be an array
				}
			}
		};

		const result = await validateThemeJson(themeJson);

		expect(result.isValid).toBe(false);
		const hasTypeError = result.errors.some(e =>
			e.includes('type') || e.includes('array') || e.includes('must')
		);
		expect(hasTypeError).toBe(true);
	});

	it('should cache the validator across calls', async () => {
		const themeJson = {
			version: 3,
			$schema: 'https://schemas.wp.org/trunk/theme.json',
			settings: {}
		};

		await validateThemeJson(themeJson);
		await validateThemeJson(themeJson);

		// fetch should only be called once since validator is cached
		expect(global.fetch).toHaveBeenCalledTimes(1);
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
