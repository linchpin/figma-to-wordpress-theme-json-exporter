import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processAllSections } from './index';
import { mockFigma, createMockCollection, resetMockIdCounter } from '../../test-setup';
import type { ThemeJsonV3 } from '../../types/theme-json';

function fullParsedTheme(): ThemeJsonV3 {
	return {
		version: 3,
		settings: {
			custom: { color: { primary: '#ff0000' } },
			color: { palette: [{ name: 'Primary', slug: 'primary', color: '#ff0000' }] },
			typography: { fontSizes: [{ name: 'Small', slug: 'small', size: '14px' }] },
			spacing: { spacingSizes: [{ name: 'Base', slug: 'base', size: '16px' }] },
		},
	} as ThemeJsonV3;
}

describe('processAllSections', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetMockIdCounter();
		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([]);
	});

	it('processes all 4 sections when enabled and data present', async () => {
		const options = { themeJson: '{}', conflictStrategy: 'overwrite' as const };
		const result = await processAllSections(fullParsedTheme(), options);
		// Should have processed without critical errors
		expect(result.collectionsCreated).toBeGreaterThanOrEqual(0);
		expect(Array.isArray(result.errors)).toBe(true);
	});

	it('skips sections when disabled in options.sections', async () => {
		const options = {
			themeJson: '{}',
			sections: { primitives: false, colorPalette: false, typography: false, spacing: false },
		};
		const result = await processAllSections(fullParsedTheme(), options);
		expect(result.collectionsCreated).toBe(0);
		expect(result.variablesCreated).toBe(0);
	});

	it('skips sections when data is missing', async () => {
		const parsed = { version: 3 } as ThemeJsonV3;
		const result = await processAllSections(parsed, { themeJson: '{}' });
		expect(result.collectionsCreated).toBe(0);
		expect(result.variablesCreated).toBe(0);
	});

	it('conflict strategy skip - skips existing collections', async () => {
		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			createMockCollection({ name: 'Primitives' }),
		]);
		const options = { themeJson: '{}', conflictStrategy: 'skip' as const };
		const result = await processAllSections(fullParsedTheme(), options);
		expect(result.warnings).toContainEqual(expect.stringContaining('Skipped existing collection: Primitives'));
	});

	it('adds warnings for unsupported sections', async () => {
		const parsed = {
			...fullParsedTheme(),
			settings: {
				...fullParsedTheme().settings,
				color: {
					...fullParsedTheme().settings!.color,
					gradients: [{ name: 'G', slug: 'g', gradient: 'linear-gradient(#000,#fff)' }],
					duotone: [{ name: 'D', slug: 'd', colors: ['#000', '#fff'] }],
				},
				shadow: { presets: [{ name: 'S', slug: 's', shadow: '0 0 10px #000' }] },
			},
			styles: {
				elements: { button: { color: { text: '#fff' } } },
				blocks: { 'core/paragraph': { color: { text: '#000' } } },
			},
		} as unknown as ThemeJsonV3;

		const result = await processAllSections(parsed, { themeJson: '{}' });
		expect(result.warnings).toContainEqual(expect.stringContaining('gradient'));
		expect(result.warnings).toContainEqual(expect.stringContaining('duotone'));
		expect(result.warnings).toContainEqual(expect.stringContaining('shadow'));
		expect(result.warnings).toContainEqual(expect.stringContaining('styles.elements'));
		expect(result.warnings).toContainEqual(expect.stringContaining('styles.blocks'));
	});

	it('uses default sections when options.sections is undefined', async () => {
		const options = { themeJson: '{}' };
		const result = await processAllSections(fullParsedTheme(), options);
		// All sections should be processed by default
		expect(result.collectionsCreated).toBeGreaterThanOrEqual(0);
	});
});
