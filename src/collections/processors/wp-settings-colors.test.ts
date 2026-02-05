import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../test-setup';

vi.mock('../../collection/index', () => ({
	processCollectionData: vi.fn(),
	processCollectionModeData: vi.fn(),
}));

vi.mock('../../button/index', () => ({
	processButtonStyles: vi.fn(),
}));

import { processCollectionModeData } from '../../collection/index';
import { processButtonStyles } from '../../button/index';
import { wpSettingsColorsProcessor } from './wp-settings-colors';
import type { ExportContext } from '../types';

const mockedProcessMode = processCollectionModeData as ReturnType<typeof vi.fn>;
const mockedProcessButton = processButtonStyles as ReturnType<typeof vi.fn>;

describe('wpSettingsColorsProcessor', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('matches', () => {
		it('matches wp.settings.color', () => {
			expect(wpSettingsColorsProcessor.matches('wp.settings.color')).toBe(true);
		});

		it('matches wp.settings.colors', () => {
			expect(wpSettingsColorsProcessor.matches('wp.settings.colors')).toBe(true);
		});

		it('matches case-insensitively', () => {
			expect(wpSettingsColorsProcessor.matches('WP.Settings.Colors')).toBe(true);
		});

		it('does not match wp.settings', () => {
			expect(wpSettingsColorsProcessor.matches('wp.settings')).toBe(false);
		});

		it('does not match wp.settings.typography', () => {
			expect(wpSettingsColorsProcessor.matches('wp.settings.typography')).toBe(false);
		});

		it('does not match Primitives', () => {
			expect(wpSettingsColorsProcessor.matches('Primitives')).toBe(false);
		});
	});

	describe('process', () => {
		it('skips when collection has no modes', async () => {
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.settings.colors', modes: [], variableIds: [] };

			await wpSettingsColorsProcessor.process(collection as any, ctx, {});

			expect(mockedProcessMode).not.toHaveBeenCalled();
		});

		it('processes first mode data', async () => {
			mockedProcessMode.mockResolvedValue({ primary: '#ff0000' });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const modes = [{ modeId: 'm1', name: 'Default' }];
			const collection = { name: 'wp.settings.colors', modes, variableIds: [] };

			await wpSettingsColorsProcessor.process(collection as any, ctx, {});

			expect(mockedProcessMode).toHaveBeenCalledWith(collection, modes[0], {});
		});

		it('processes button styles when present in data', async () => {
			const buttonData = { background: '#000', text: '#fff' };
			mockedProcessMode.mockResolvedValue({ button: buttonData });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.settings.colors', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsColorsProcessor.process(collection as any, ctx, {});

			expect(mockedProcessButton).toHaveBeenCalledWith(buttonData, ctx.files);
		});

		it('does not process button styles when absent', async () => {
			mockedProcessMode.mockResolvedValue({ primary: '#ff0000' });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.settings.colors', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsColorsProcessor.process(collection as any, ctx, {});

			expect(mockedProcessButton).not.toHaveBeenCalled();
		});

		it('does not merge colors into settings (intentional design)', async () => {
			mockedProcessMode.mockResolvedValue({ primary: '#ff0000' });
			const ctx: ExportContext = { theme: { settings: { custom: {} } }, files: [] };
			const collection = { name: 'wp.settings.colors', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsColorsProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.custom).toEqual({});
		});
	});
});
