import { describe, it, expect, vi, beforeEach } from 'vitest';
import { collectionProcessors, dispatchCollection } from './registry';

// Mock processCollectionData to avoid real Figma API calls during process()
vi.mock('../collection/index', () => ({
	processCollectionData: vi.fn().mockResolvedValue({}),
	processCollectionModeData: vi.fn().mockResolvedValue({}),
}));

// Mock button processing
vi.mock('../button/index', () => ({
	processButtonStyles: vi.fn(),
}));

describe('collectionProcessors', () => {
	it('contains 9 processors', () => {
		expect(collectionProcessors).toHaveLength(9);
	});

	it('has primitives as first processor', () => {
		expect(collectionProcessors[0].matches('Primitives')).toBe(true);
	});

	it('has fallback as last processor', () => {
		expect(collectionProcessors[8].matches('anything')).toBe(true);
	});

	it('wp.settings.colors matches before general wp.settings', () => {
		const colorIndex = collectionProcessors.findIndex(p => p.matches('wp.settings.colors'));
		const settingsIndex = collectionProcessors.findIndex(p =>
			p.matches('wp.settings') && !p.matches('wp.settings.colors')
		);
		expect(colorIndex).toBeLessThan(settingsIndex);
	});

	it('wp.settings.spacing (subset) matches before general wp.settings', () => {
		const subsetIndex = collectionProcessors.findIndex(p => p.matches('wp.settings.spacing'));
		// General wp.settings processor is at index 4 (after subset at 2)
		expect(subsetIndex).toBeLessThan(4);
	});

	it('wp.settings.background (extended) matches before general wp.settings', () => {
		const extIndex = collectionProcessors.findIndex(p => p.matches('wp.settings.background'));
		expect(extIndex).toBeLessThan(4);
	});

	it('wp.elements matches after wp.settings processors', () => {
		const elementsIndex = collectionProcessors.findIndex(p => p.matches('wp.elements.button'));
		const settingsIndex = collectionProcessors.findIndex(p =>
			p.matches('wp.settings') && !p.matches('wp.settings.colors')
		);
		expect(elementsIndex).toBeGreaterThan(settingsIndex);
	});

	it('wp.blocks matches after wp.elements', () => {
		const blocksIndex = collectionProcessors.findIndex(p => p.matches('wp.blocks.core/button'));
		const elementsIndex = collectionProcessors.findIndex(p => p.matches('wp.elements.button'));
		expect(blocksIndex).toBeGreaterThan(elementsIndex);
	});
});

describe('dispatchCollection', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('dispatches without error for Primitives collection', async () => {
		const ctx = { theme: { settings: { custom: {} } }, files: [] };
		const collection = { name: 'Primitives', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };
		await dispatchCollection(collection as any, ctx, {});
	});

	it('dispatches without error for empty-named collection', async () => {
		const ctx = { theme: { settings: { custom: {} } }, files: [] };
		const collection = { name: '', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };
		await dispatchCollection(collection as any, ctx, {});
	});

	it('dispatches wp.styles collection', async () => {
		const ctx = { theme: { settings: { custom: {} }, styles: {} }, files: [] };
		const collection = { name: 'wp.styles', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };
		await dispatchCollection(collection as any, ctx, {});
	});

	it('dispatches wp.elements.button collection', async () => {
		const ctx = { theme: { settings: { custom: {} } }, files: [] };
		const collection = { name: 'wp.elements.button', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };
		await dispatchCollection(collection as any, ctx, {});
	});

	it('dispatches wp.blocks.core/button collection', async () => {
		const ctx = { theme: { settings: { custom: {} } }, files: [] };
		const collection = { name: 'wp.blocks.core/button', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };
		await dispatchCollection(collection as any, ctx, {});
	});
});
