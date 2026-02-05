import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../test-setup';

vi.mock('../../collection/index', () => ({
	processCollectionData: vi.fn(),
}));

import { processCollectionData } from '../../collection/index';
import { wpSettingsExtendedProcessor } from './wp-settings-extended';
import type { ExportContext } from '../types';

const mockedProcess = processCollectionData as ReturnType<typeof vi.fn>;

describe('wpSettingsExtendedProcessor', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('matches', () => {
		it.each([
			'wp.settings.background',
			'wp.settings.border',
			'wp.settings.dimensions',
			'wp.settings.position',
		])('matches %s', (name) => {
			expect(wpSettingsExtendedProcessor.matches(name)).toBe(true);
		});

		it('matches case-insensitively', () => {
			expect(wpSettingsExtendedProcessor.matches('WP.Settings.Border')).toBe(true);
			expect(wpSettingsExtendedProcessor.matches('wp.SETTINGS.POSITION')).toBe(true);
		});

		it('does not match wp.settings.layout (handled by subset)', () => {
			expect(wpSettingsExtendedProcessor.matches('wp.settings.layout')).toBe(false);
		});

		it('does not match wp.settings alone', () => {
			expect(wpSettingsExtendedProcessor.matches('wp.settings')).toBe(false);
		});

		it('does not match wp.settings.color', () => {
			expect(wpSettingsExtendedProcessor.matches('wp.settings.color')).toBe(false);
		});
	});

	describe('process', () => {
		it('merges data into settings[section] for border', async () => {
			mockedProcess.mockResolvedValue({ color: true, radius: true });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.settings.border', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsExtendedProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.border).toBeDefined();
			expect(ctx.theme.settings.border.color).toBe(true);
			expect(ctx.theme.settings.border.radius).toBe(true);
		});

		it('merges data into settings[section] for position', async () => {
			mockedProcess.mockResolvedValue({ sticky: true });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.settings.position', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsExtendedProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.position).toBeDefined();
			expect(ctx.theme.settings.position.sticky).toBe(true);
		});

		it('skips when enableBorderSettings is false', async () => {
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.settings.border', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsExtendedProcessor.process(collection as any, ctx, { enableBorderSettings: false } as any);

			expect(mockedProcess).not.toHaveBeenCalled();
			expect(ctx.theme.settings.border).toBeUndefined();
		});

		it('skips when enableBackgroundSettings is false', async () => {
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.settings.background', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsExtendedProcessor.process(collection as any, ctx, { enableBackgroundSettings: false } as any);

			expect(mockedProcess).not.toHaveBeenCalled();
		});

		it('skips when enableDimensionsSettings is false', async () => {
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.settings.dimensions', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsExtendedProcessor.process(collection as any, ctx, { enableDimensionsSettings: false } as any);

			expect(mockedProcess).not.toHaveBeenCalled();
		});

		it('skips when enablePositionSettings is false', async () => {
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.settings.position', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsExtendedProcessor.process(collection as any, ctx, { enablePositionSettings: false } as any);

			expect(mockedProcess).not.toHaveBeenCalled();
		});

		it('processes when enable option is true', async () => {
			mockedProcess.mockResolvedValue({ color: true });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.settings.border', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsExtendedProcessor.process(collection as any, ctx, { enableBorderSettings: true } as any);

			expect(ctx.theme.settings.border).toBeDefined();
		});

		it('processes when enable option is not set (defaults to enabled)', async () => {
			mockedProcess.mockResolvedValue({ color: true });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.settings.border', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsExtendedProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.border).toBeDefined();
		});

		it('unwraps nested section root', async () => {
			mockedProcess.mockResolvedValue({ background: { 'background-image': true } });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.settings.background', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsExtendedProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.background.backgroundImage).toBe(true);
		});

		it('deep merges with existing section data', async () => {
			mockedProcess.mockResolvedValue({ width: true });
			const ctx: ExportContext = {
				theme: { settings: { border: { color: true } } },
				files: [],
			};
			const collection = { name: 'wp.settings.border', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsExtendedProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.border.color).toBe(true);
			expect(ctx.theme.settings.border.width).toBe(true);
		});
	});
});
