import { vi } from 'vitest';

let mockIdCounter = 0;

/**
 * Create a mock Figma VariableCollection
 */
export function createMockCollection(overrides: {
	name?: string;
	id?: string;
	modes?: Array<{ modeId: string; name: string }>;
	variableIds?: string[];
} = {}) {
	const id = overrides.id || `mock-collection-${++mockIdCounter}`;
	return {
		id,
		name: overrides.name || 'Mock Collection',
		modes: overrides.modes || [{ modeId: 'mode-1', name: 'Default' }],
		variableIds: overrides.variableIds || [],
		renameMode: vi.fn(),
		addMode: vi.fn().mockReturnValue(`mode-${++mockIdCounter}`),
	};
}

/**
 * Create a mock Figma Variable
 */
export function createMockVariable(overrides: {
	name?: string;
	id?: string;
	resolvedType?: string;
	valuesByMode?: Record<string, any>;
	description?: string;
} = {}) {
	const id = overrides.id || `mock-var-${++mockIdCounter}`;
	return {
		id,
		name: overrides.name || 'mock-variable',
		resolvedType: overrides.resolvedType || 'FLOAT',
		valuesByMode: overrides.valuesByMode || {},
		description: overrides.description || '',
		setValueForMode: vi.fn(),
	};
}

/**
 * Reset the mock ID counter (call in beforeEach for deterministic IDs)
 */
export function resetMockIdCounter() {
	mockIdCounter = 0;
}

// Mock Figma API
const mockFigma = {
	variables: {
		getLocalVariableCollectionsAsync: vi.fn(),
		getVariableByIdAsync: vi.fn(),
		getVariablesByCollectionIdAsync: vi.fn(),
		createVariableCollection: vi.fn().mockImplementation((name: string) => {
			return createMockCollection({ name });
		}),
		createVariable: vi.fn().mockImplementation((name: string, _collection: any, type: string) => {
			return createMockVariable({ name, resolvedType: type });
		}),
	},
	getLocalTextStylesAsync: vi.fn(),
	getLocalPaintStylesAsync: vi.fn(),
	ui: {
		postMessage: vi.fn(),
		onmessage: vi.fn(),
	},
};

// Add figma to global scope (bypass TypeScript checking)
(globalThis as any).figma = mockFigma;

// Mock console methods if needed
globalThis.console = {
	...console,
	log: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
};

export { mockFigma };
