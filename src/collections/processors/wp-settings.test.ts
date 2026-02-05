import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../test-setup';

vi.mock('../../collection/index', () => ({
	processCollectionData: vi.fn(),
}));

import { processCollectionData } from '../../collection/index';
import { wpSettingsProcessor } from './wp-settings';
import type { ExportContext } from '../types';

const mockedProcess = processCollectionData as ReturnType<typeof vi.fn>;

describe('wpSettingsProcessor', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('matches', () => {
		it('matches wp.settings', () => {
			expect(wpSettingsProcessor.matches('wp.settings')).toBe(true);
		});

		it('matches wp.settings.custom-thing', () => {
			expect(wpSettingsProcessor.matches('wp.settings.custom-thing')).toBe(true);
		});

		it('does not match wp.settings.color', () => {
			expect(wpSettingsProcessor.matches('wp.settings.color')).toBe(false);
		});

		it('does not match wp.settings.colors', () => {
			expect(wpSettingsProcessor.matches('wp.settings.colors')).toBe(false);
		});

		it('does not match Primitives', () => {
			expect(wpSettingsProcessor.matches('Primitives')).toBe(false);
		});

		it('does not match wp.elements', () => {
			expect(wpSettingsProcessor.matches('wp.elements')).toBe(false);
		});

		it('does not match wp.blocks', () => {
			expect(wpSettingsProcessor.matches('wp.blocks')).toBe(false);
		});
	});

	describe('process', () => {
		it('routes known settings keys to settings root for exact wp.settings', async () => {
			mockedProcess.mockResolvedValue({ spacing: { base: '16px' }, typography: { fontSize: '14px' } });
			const ctx: ExportContext = { theme: { settings: { custom: {} } }, files: [] };
			const collection = { name: 'wp.settings', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.spacing).toBeDefined();
			expect(ctx.theme.settings.typography).toBeDefined();
		});

		it('routes unknown keys to settings.custom for exact wp.settings', async () => {
			mockedProcess.mockResolvedValue({ myCustomThing: { value: '1px' } });
			const ctx: ExportContext = { theme: { settings: { custom: {} } }, files: [] };
			const collection = { name: 'wp.settings', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.custom.myCustomThing).toBeDefined();
		});

		it('unwraps wp.settings key from data for exact match', async () => {
			mockedProcess.mockResolvedValue({ 'wp.settings': { spacing: { base: '16px' } } });
			const ctx: ExportContext = { theme: { settings: { custom: {} } }, files: [] };
			const collection = { name: 'wp.settings', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.spacing).toBeDefined();
		});

		it('merges into settings.custom with path for wp.settings.X collections', async () => {
			mockedProcess.mockResolvedValue({ value: '1px' });
			const ctx: ExportContext = { theme: { settings: { custom: {} } }, files: [] };
			const collection = { name: 'wp.settings.my-thing', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.custom['my-thing']).toBeDefined();
		});

		it('handles known key "appearanceTools"', async () => {
			mockedProcess.mockResolvedValue({ appearanceTools: true });
			const ctx: ExportContext = { theme: { settings: { custom: {} } }, files: [] };
			const collection = { name: 'wp.settings', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.appearanceTools).toBe(true);
		});

		it('handles known key "layout"', async () => {
			mockedProcess.mockResolvedValue({ layout: { contentSize: '800px' } });
			const ctx: ExportContext = { theme: { settings: { custom: {} } }, files: [] };
			const collection = { name: 'wp.settings', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.layout).toBeDefined();
			expect(ctx.theme.settings.layout.contentSize).toBe('800px');
		});
	});
});
