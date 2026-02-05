import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockCollection, mockFigma, resetMockIdCounter } from '../../test-setup';
import { createTypographyCollection } from './wp-settings-typography';

describe('createTypographyCollection', () => {
	let getOrCreateCollection: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
		resetMockIdCounter();
		getOrCreateCollection = vi.fn();
	});

	const defaultOptions = { themeJson: {} } as any;

	function setupCollection(overrides: Parameters<typeof createMockCollection>[0] = {}) {
		const collection = createMockCollection({ name: 'wp.settings.typography', variableIds: [], ...overrides });
		getOrCreateCollection.mockResolvedValue(collection);
		return collection;
	}

	it('creates FLOAT variables from fontSizes', async () => {
		setupCollection();
		const typography = { fontSizes: [{ name: 'Small', slug: 'small', size: '13px' }, { name: 'Large', slug: 'large', size: '24px' }] };
		const result = await createTypographyCollection(typography as any, defaultOptions, getOrCreateCollection);
		expect(result.variablesCreated).toBe(2);
		expect(mockFigma.variables.createVariable).toHaveBeenCalledWith('fontSize/small', expect.anything(), 'FLOAT');
		expect(mockFigma.variables.createVariable).toHaveBeenCalledWith('fontSize/large', expect.anything(), 'FLOAT');
	});

	it('sets description to preset name', async () => {
		setupCollection();
		const typography = { fontSizes: [{ name: 'Small', slug: 'small', size: '13px' }] };
		await createTypographyCollection(typography as any, defaultOptions, getOrCreateCollection);
		const createdVar = mockFigma.variables.createVariable.mock.results[0].value;
		expect(createdVar.description).toBe('Small');
	});

	it('parses px sizes to numeric values', async () => {
		setupCollection();
		const typography = { fontSizes: [{ name: 'Medium', slug: 'medium', size: '16px' }] };
		await createTypographyCollection(typography as any, defaultOptions, getOrCreateCollection);
		const createdVar = mockFigma.variables.createVariable.mock.results[0].value;
		expect(createdVar.setValueForMode).toHaveBeenCalledWith('mode-1', 16);
	});

	it('parses rem sizes to numeric values', async () => {
		setupCollection();
		const typography = { fontSizes: [{ name: 'Big', slug: 'big', size: '2rem' }] };
		await createTypographyCollection(typography as any, defaultOptions, getOrCreateCollection);
		const createdVar = mockFigma.variables.createVariable.mock.results[0].value;
		expect(createdVar.setValueForMode).toHaveBeenCalledWith('mode-1', 32);
	});

	it('handles fluid font sizes with Desktop/Mobile modes', async () => {
		const collection = setupCollection();
		collection.addMode.mockReturnValue('mobile-mode');
		const typography = {
			fontSizes: [{
				name: 'Fluid',
				slug: 'fluid',
				size: '32px',
				fluid: { min: '16px', max: '32px' },
			}],
		};
		const result = await createTypographyCollection(typography as any, defaultOptions, getOrCreateCollection);
		expect(result.variablesCreated).toBe(1);
		expect(collection.renameMode).toHaveBeenCalledWith('mode-1', 'Desktop');
		expect(collection.addMode).toHaveBeenCalledWith('Mobile');
	});

	it('skips font families with warning', async () => {
		setupCollection();
		const typography = {
			fontFamilies: [{ name: 'System', slug: 'system', fontFamily: 'Arial, sans-serif' }],
		};
		const result = await createTypographyCollection(typography as any, defaultOptions, getOrCreateCollection);
		expect(result.warnings).toContainEqual(expect.stringContaining('font family'));
	});

	it('skips CSS var reference sizes', async () => {
		setupCollection();
		const typography = { fontSizes: [{ name: 'Var', slug: 'var', size: 'var(--wp--custom--font-size)' }] };
		const result = await createTypographyCollection(typography as any, defaultOptions, getOrCreateCollection);
		expect(result.variablesCreated).toBe(0);
		expect(result.warnings).toContainEqual(expect.stringContaining('Skipped CSS var reference'));
	});

	it('returns warning when no fontSizes and no fontFamilies', async () => {
		const result = await createTypographyCollection({} as any, defaultOptions, getOrCreateCollection);
		expect(result.warnings).toContainEqual(expect.stringContaining('No font sizes or font families'));
		expect(getOrCreateCollection).not.toHaveBeenCalled();
	});

	it('returns warning when collection is null', async () => {
		getOrCreateCollection.mockResolvedValue(null);
		const typography = { fontSizes: [{ name: 'S', slug: 's', size: '13px' }] };
		const result = await createTypographyCollection(typography as any, defaultOptions, getOrCreateCollection);
		expect(result.warnings).toContainEqual(expect.stringContaining('Skipped wp.settings.typography'));
	});

	it('respects createFluidModes: false', async () => {
		const collection = setupCollection();
		const typography = {
			fontSizes: [{ name: 'Fluid', slug: 'fluid', size: '32px', fluid: { min: '16px', max: '32px' } }],
		};
		const options = { themeJson: {}, createFluidModes: false } as any;
		await createTypographyCollection(typography as any, options, getOrCreateCollection);
		expect(collection.addMode).not.toHaveBeenCalled();
		expect(collection.renameMode).not.toHaveBeenCalled();
	});
});
