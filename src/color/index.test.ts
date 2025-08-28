import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getColorPresets, getAllColorPresets } from './index';
import { mockFigma } from '../test-setup';

describe('getColorPresets', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset all mock implementations
		mockFigma.variables.getLocalVariableCollectionsAsync.mockReset();
		mockFigma.variables.getVariableByIdAsync.mockReset();
		mockFigma.getLocalPaintStylesAsync.mockReset();
		// Default mock for paint styles - empty array
		mockFigma.getLocalPaintStylesAsync.mockResolvedValue([]);
	});

	it('should return empty array when no color variables exist', async () => {
		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			{
				name: 'Typography',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1'],
			},
		]);

		mockFigma.variables.getVariableByIdAsync.mockResolvedValue({
			name: 'font-size',
			resolvedType: 'FLOAT',
			valuesByMode: {
				mode1: 16,
			},
		});

		const result = await getColorPresets();
		expect(result).toEqual([]);
	});

	it('should generate color presets from color variables', async () => {
        const mockColorCollection = {
            name: 'wp.settings.colors',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2'],
		};

		const mockVariable1 = {
			name: 'primary/500',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
			},
		};

		const mockVariable2 = {
			name: 'secondary-accent',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 1, g: 0.5, b: 0, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockColorCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariable1)
			.mockResolvedValueOnce(mockVariable2);

		const result = await getColorPresets();

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			name: 'Primary 500',
			slug: 'primary-500',
			color: 'var(--wp--preset--color--primary-500)',
		});
		expect(result[1]).toEqual({
			name: 'Secondary Accent',
			slug: 'secondary-accent',
			color: 'var(--wp--preset--color--secondary-accent)',
		});
	});

	it('should handle both variable aliases and direct color values', async () => {
        const mockColorCollection = {
            name: 'wp.settings.colors',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2'],
		};

		const mockVariable1 = {
			name: 'primary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
			},
		};

		const mockVariable2 = {
			name: 'alias',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { type: 'VARIABLE_ALIAS', id: 'var1' },
			},
		};

		const mockReferencedVariable = {
			name: 'primitives/blue/500',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockColorCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariable1)
			.mockResolvedValueOnce(mockVariable2)
			.mockResolvedValueOnce(mockReferencedVariable); // For the alias lookup

		const result = await getColorPresets();

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			name: 'Alias',
			slug: 'alias',
			color: 'var(--wp--preset--color--alias)',
		});
		expect(result[1]).toEqual({
			name: 'Primary',
			slug: 'primary',
			color: 'var(--wp--preset--color--primary)',
		});
	});

	it('should skip non-color variables', async () => {
        const mockColorCollection = {
            name: 'wp.settings.colors',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2'],
		};

		const mockVariable1 = {
			name: 'spacing',
			resolvedType: 'FLOAT',
			valuesByMode: {
				mode1: 16,
			},
		};

		const mockVariable2 = {
			name: 'primary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockColorCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariable1)
			.mockResolvedValueOnce(mockVariable2);

		const result = await getColorPresets();

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			name: 'Primary',
			slug: 'primary',
			color: 'var(--wp--preset--color--primary)',
		});
	});

	it('should sort presets by name', async () => {
        const mockColorCollection = {
            name: 'wp.settings.colors',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2', 'var3'],
		};

		const mockVariable1 = {
			name: 'zebra',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0, g: 0, b: 0, a: 1 },
			},
		};

		const mockVariable2 = {
			name: 'alpha',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 1, g: 1, b: 1, a: 1 },
			},
		};

		const mockVariable3 = {
			name: 'beta',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockColorCollection,
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariable1)
			.mockResolvedValueOnce(mockVariable2)
			.mockResolvedValueOnce(mockVariable3);

		const result = await getColorPresets();

		expect(result).toHaveLength(3);
		expect(result[0].name).toBe('Alpha');
		expect(result[1].name).toBe('Beta');
		expect(result[2].name).toBe('Zebra');
	});

	it('should exclude primitives collection but include other collections', async () => {
      const mockCollections = [
			{
        name: 'Primitives',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1'],
			},
			{
        name: 'wp.settings.colors',
				modes: [{ modeId: 'mode2', name: 'Default' }],
				variableIds: ['var2'],
			},
			{
      name: 'wp.settings.brand',
				modes: [{ modeId: 'mode3', name: 'Default' }],
				variableIds: ['var3'],
			}

		];

		const mockVariable1 = {
			name: 'red/500',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 1, g: 0, b: 0, a: 1 },
			},
		};

		const mockVariable2 = {
			name: 'primary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(
			mockCollections,
		);

		mockFigma.variables.getVariableByIdAsync.mockImplementation((id: string) => {
			if (id === 'var1') return Promise.resolve(mockVariable1);
			if (id === 'var2') return Promise.resolve(mockVariable2);
			return Promise.resolve(null);
		});

		// Ensure paint styles are mocked
		mockFigma.getLocalPaintStylesAsync.mockResolvedValue([]);

		const result = await getColorPresets();

		// Only the Brand collection variable should be included
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			name: 'Primary',
			slug: 'primary',
			color: 'var(--wp--preset--color--primary)',
		});
	});

	it('should filter colors by selectedColorIds when provided', async () => {
        const mockColorCollection = {
            name: 'wp.settings.colors',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2', 'var3'],
		};

		const mockVariable1 = {
			name: 'primary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
			},
		};

		const mockVariable2 = {
			name: 'secondary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 1, g: 0.5, b: 0, a: 1 },
			},
		};

		const mockVariable3 = {
			name: 'tertiary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 0.5, g: 0.2, b: 0.8, a: 1 },
			},
		};

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			mockColorCollection,
		]);

		mockFigma.variables.getVariableByIdAsync.mockImplementation((id: string) => {
			if (id === 'var1') return Promise.resolve(mockVariable1);
			if (id === 'var2') return Promise.resolve(mockVariable2);
			if (id === 'var3') return Promise.resolve(mockVariable3);
			return Promise.resolve(null);
		});

		// Ensure paint styles are mocked
		mockFigma.getLocalPaintStylesAsync.mockResolvedValue([]);

		const result = await getColorPresets(['var1', 'var3']);

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			name: 'Primary',
			slug: 'primary',
			color: 'var(--wp--preset--color--primary)',
		});
		expect(result[1]).toEqual({
			name: 'Tertiary',
			slug: 'tertiary',
			color: 'var(--wp--preset--color--tertiary)',
		});
	});

	it('should get color presets with paint style labels', async () => {
		const mockCollections = [
			{
				id: 'collection1',
				name: 'Brand Colors',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1']
			}
		];

		const mockVariables = [
			{
				id: 'var1',
				name: 'brand/primary',
				resolvedType: 'COLOR',
				valuesByMode: {
					'mode1': { r: 1, g: 0, b: 0 }
				}
			}
		];

		const mockPaintStyles = [
			{
				id: 'paint1',
				name: 'Midnight',
				paints: [
					{
						type: 'VARIABLE',
						boundVariables: {
							paints: [{ id: 'var1' }]
						}
					}
				]
			}
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
		mockFigma.variables.getVariableByIdAsync.mockResolvedValue(mockVariables[0]);
		mockFigma.getLocalPaintStylesAsync.mockResolvedValue(mockPaintStyles);

		const result = await getColorPresets();

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			name: 'Midnight',
			slug: 'brand-primary',
			color: 'var(--wp--preset--color--brand-primary)'
		});
	});

	it('should filter by selected color IDs', async () => {
		const mockCollections = [
			{
				id: 'collection1',
				name: 'Brand Colors',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1', 'var2']
			}
		];

		const mockVariables = [
			{
				id: 'var1',
				name: 'brand/primary',
				resolvedType: 'COLOR',
				valuesByMode: {
					'mode1': { r: 1, g: 0, b: 0 }
				}
			},
			{
				id: 'var2',
				name: 'brand/secondary',
				resolvedType: 'COLOR',
				valuesByMode: {
					'mode1': { r: 0, g: 1, b: 0 }
				}
			}
		];

		const mockPaintStyles = [
			{
				id: 'paint1',
				name: 'Midnight',
				paints: [
					{
						type: 'VARIABLE',
						boundVariables: {
							paints: [{ id: 'var1' }]
						}
					}
				]
			}
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariables[0])
			.mockResolvedValueOnce(mockVariables[1]);
		mockFigma.getLocalPaintStylesAsync.mockResolvedValue(mockPaintStyles);

		const result = await getColorPresets(['var1']);

		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('Midnight');
	});
});

describe('getAllColorPresets', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFigma.variables.getLocalVariableCollectionsAsync.mockReset();
		mockFigma.variables.getVariableByIdAsync.mockReset();
	});

	it('should return empty array when no color variables exist', async () => {
		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
			{
				name: 'Typography',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1'],
			},
		]);

		mockFigma.variables.getVariableByIdAsync.mockResolvedValue({
			name: 'font-size',
			resolvedType: 'FLOAT',
			valuesByMode: {
				mode1: 16,
			},
		});

		const result = await getAllColorPresets();
		expect(result).toEqual([]);
	});

	it('should get all color presets with resolved colors', async () => {
        mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
            {
                name: 'wp.settings.colors',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1', 'var2'],
			},
		];

		const mockVariables = [
			{
				id: 'var1',
				name: 'primary',
				resolvedType: 'COLOR',
				valuesByMode: {
					mode1: { r: 1, g: 0, b: 0 },
				},
			},
			{
				id: 'var2',
				name: 'secondary',
				resolvedType: 'COLOR',
				valuesByMode: {
					mode1: { type: 'VARIABLE_ALIAS', id: 'var1' },
				},
			},
		];

		const mockPaintStyles = [
			{
				id: 'paint1',
				name: 'Midnight',
				paints: [
					{
						type: 'VARIABLE',
						boundVariables: {
							paints: [{ id: 'var1' }]
						}
					}
				]
			},
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariables[0])
			.mockResolvedValueOnce(mockVariables[1])
			.mockResolvedValueOnce(mockVariables[0]); // For alias resolution
		mockFigma.getLocalPaintStylesAsync.mockResolvedValue(mockPaintStyles);

		const result = await getAllColorPresets();

        expect(result).toEqual([
			{
				id: 'var1',
				name: 'Midnight', // Paint Style name
				slug: 'primary',
				color: 'var(--wp--custom--color--primary)',
                collectionName: 'wp.settings.colors',
				resolvedColor: '#ff0000'
            , isWordPressSettings: true
			},
			{
				id: 'var2',
				name: 'Secondary',
				slug: 'secondary',
				color: 'var(--wp--custom--color--secondary)',
                collectionName: 'wp.settings.colors',
				resolvedColor: '#ff0000'
            , isWordPressSettings: true
			}
		]);
	});

	it('should skip collections with no modes in getAllColorPresets', async () => {
        mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue([
            {
                name: 'wp.settings.colors',
				modes: [], // No modes
				variableIds: ['var1']
			},
            {
                name: 'wp.settings.valid colors',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var2']
			}
		]);

		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce({
				name: 'valid',
				resolvedType: 'COLOR',
				valuesByMode: {
					mode1: { r: 0, g: 1, b: 0 }
				}
			});

		const result = await getAllColorPresets();

        expect(result).toEqual([
			{
				id: 'var2',
				name: 'Valid',
				slug: 'valid',
				color: 'var(--wp--custom--color--valid)',
                collectionName: 'wp.settings.valid colors',
				resolvedColor: '#00ff00'
            , isWordPressSettings: true
			}
		]);
	});

	it('should return color presets with collection info and resolved colors', async () => {
        const mockColorCollection = {
            name: 'wp.settings.color',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1', 'var2'],
		};

		const mockVariable1 = {
			name: 'primary',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { r: 1, g: 0, b: 0, a: 1 },
			},
		];

		const mockVariables = [
			{
				id: 'var1',
				name: 'primary',
				resolvedType: 'COLOR',
				valuesByMode: {
					mode1: { r: 1, g: 0, b: 0 },
				},
			},
			{
				id: 'var2',
				name: 'secondary-accent',
				resolvedType: 'COLOR',
				valuesByMode: {
					mode1: { r: 0, g: 1, b: 0 },
				},
			},
		];

		const mockPaintStyles = [
			{
				id: 'paint1',
				name: 'Midnight',
				paints: [
					{
						type: 'VARIABLE',
						boundVariables: {
							paints: [{ id: 'var1' }]
						}
					}
				]
			},
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariables[0])
			.mockResolvedValueOnce(mockVariables[1]);
		mockFigma.getLocalPaintStylesAsync.mockResolvedValue(mockPaintStyles);

		const result = await getAllColorPresets();

		expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
			id: 'var1',
			name: 'Midnight',
			slug: 'primary',
			color: 'var(--wp--custom--color--primary)',
            collectionName: 'wp.settings.color',
			resolvedColor: '#ff0000'
        , isWordPressSettings: true
		});
        expect(result[1]).toEqual({
			id: 'var2',
			name: 'Secondary Accent',
			slug: 'secondary-accent'
			color: 'var(--wp--custom--color--secondary--accent)',
            collectionName: 'wp.settings.color',
			resolvedColor: '#00ff00'
        , isWordPressSettings: true
		});
	});

	it('should handle variable aliases and resolve their colors', async () => {
        const mockColorCollection = {
            name: 'wp.settings.color',
			modes: [{ modeId: 'mode1', name: 'Default' }],
			variableIds: ['var1'],
		};

		const mockAliasVariable = {
			name: 'alias-color',
			resolvedType: 'COLOR',
			valuesByMode: {
				mode1: { type: 'VARIABLE_ALIAS', id: 'primitive-var' },
			},
		];

		const mockVariables = [
			{
				id: 'var1',
				name: 'alias-color',
				resolvedType: 'COLOR',
				valuesByMode: {
					mode1: { type: 'VARIABLE_ALIAS', id: 'var2' },
				},
			},
			{
				id: 'var2',
				name: 'primitives/blue/500',
				resolvedType: 'COLOR',
				valuesByMode: {
					mode1: { r: 0, g: 0, b: 1 },
				},
			},
		];

		const mockPaintStyles = [
			{
				id: 'paint1',
				name: 'Midnight',
				paints: [
					{
						type: 'VARIABLE',
						boundVariables: {
							paints: [{ id: 'var1' }]
						}
					}
				]
			},
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariables[0])
			.mockResolvedValueOnce(mockVariables[1]);
		mockFigma.getLocalPaintStylesAsync.mockResolvedValue(mockPaintStyles);

		const result = await getAllColorPresets();

		expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
			id: 'var1',
			name: 'Midnight',
			slug: 'alias-color',
			color: 'var(--wp--custom--color--alias-color)',
            collectionName: 'wp.settings.color',
			resolvedColor: '#0000ff'
        , isWordPressSettings: true
		});
	});

  it('should sort by collection name then by color name', async () => {
    const mockCollections = [
			{
        name: 'wp.settings.brand',
				modes: [{ modeId: 'mode1', name: 'Default' }],
				variableIds: ['var1'],
			},
			{
        name: 'wp.settings.color',
				modes: [{ modeId: 'mode2', name: 'Default' }],
				variableIds: ['var2'],
		];

		const mockVariables = [
			{
				id: 'var1',
				name: 'zebra',
				resolvedType: 'COLOR',
				valuesByMode: {
					mode1: { r: 0, g: 0, b: 0 },
				},
			},
			{
				id: 'var2',
				name: 'alpha',
				resolvedType: 'COLOR',
				valuesByMode: {
					mode1: { r: 1, g: 1, b: 1 },
				},
			},
			{
				id: 'var3',
				name: 'beta',
				resolvedType: 'COLOR',
				valuesByMode: {
					mode1: { r: 0.5, g: 0.5, b: 0.5 },
				},
			},
		];

		mockFigma.variables.getLocalVariableCollectionsAsync.mockResolvedValue(mockCollections);
		mockFigma.variables.getVariableByIdAsync
			.mockResolvedValueOnce(mockVariables[0])
			.mockResolvedValueOnce(mockVariables[1])
			.mockResolvedValueOnce(mockVariables[2]);
		mockFigma.getLocalPaintStylesAsync.mockResolvedValue([]);

		const result = await getAllColorPresets();
    expect(result).toHaveLength(2);
    // Sorted by collection name (lexicographically on raw names)
    expect(result[0].collectionName).toBe('wp.settings.brand');
    expect(result[0].name).toBe('Zebra');
    expect(result[1].collectionName).toBe('wp.settings.color');
    expect(result[1].name).toBe('Alpha');
	});
}); 