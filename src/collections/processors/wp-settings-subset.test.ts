import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../test-setup';

vi.mock('../../collection/index', () => ({
	processCollectionData: vi.fn(),
}));

import { processCollectionData } from '../../collection/index';
import { wpSettingsSubsetProcessor } from './wp-settings-subset';
import type { ExportContext } from '../types';

const mockedProcess = processCollectionData as ReturnType<typeof vi.fn>;

describe('wpSettingsSubsetProcessor', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('matches', () => {
		it.each([
			'wp.settings.layout',
			'wp.settings.spacing',
			'wp.settings.typography',
			'wp.settings.shadow',
		])('matches %s', (name) => {
			expect(wpSettingsSubsetProcessor.matches(name)).toBe(true);
		});

		it('matches case-insensitively', () => {
			expect(wpSettingsSubsetProcessor.matches('WP.Settings.Spacing')).toBe(true);
			expect(wpSettingsSubsetProcessor.matches('wp.SETTINGS.TYPOGRAPHY')).toBe(true);
		});

		it('matches with suffix', () => {
			expect(wpSettingsSubsetProcessor.matches('wp.settings.layout.something')).toBe(true);
		});

		it('does not match wp.settings alone', () => {
			expect(wpSettingsSubsetProcessor.matches('wp.settings')).toBe(false);
		});

		it('does not match wp.settings.color', () => {
			expect(wpSettingsSubsetProcessor.matches('wp.settings.color')).toBe(false);
		});

		it('does not match wp.settings.background', () => {
			expect(wpSettingsSubsetProcessor.matches('wp.settings.background')).toBe(false);
		});
	});

	describe('process', () => {
		it('merges data into settings[section] for spacing', async () => {
			mockedProcess.mockResolvedValue({ base: '16px' });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.settings.spacing', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsSubsetProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.spacing).toBeDefined();
			expect(ctx.theme.settings.spacing.base).toBe('16px');
		});

		it('merges data into settings[section] for typography', async () => {
			mockedProcess.mockResolvedValue({ fontSize: '14px' });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.settings.typography', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsSubsetProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.typography).toBeDefined();
			expect(ctx.theme.settings.typography.fontSize).toBe('14px');
		});

		it('unwraps nested section root', async () => {
			mockedProcess.mockResolvedValue({ spacing: { base: '16px' } });
			const ctx: ExportContext = { theme: { settings: {} }, files: [] };
			const collection = { name: 'wp.settings.spacing', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsSubsetProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.spacing.base).toBe('16px');
		});

		it('deep merges with existing section data', async () => {
			mockedProcess.mockResolvedValue({ 'font-sizes': { small: '14px' } });
			const ctx: ExportContext = {
				theme: { settings: { typography: { fontFamily: 'Inter' } } },
				files: [],
			};
			const collection = { name: 'wp.settings.typography', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsSubsetProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings.typography.fontFamily).toBe('Inter');
		});

		it('creates settings object if not present', async () => {
			mockedProcess.mockResolvedValue({ contentSize: '800px' });
			const ctx: ExportContext = { theme: {}, files: [] };
			const collection = { name: 'wp.settings.layout', modes: [{ modeId: 'm1', name: 'Default' }], variableIds: [] };

			await wpSettingsSubsetProcessor.process(collection as any, ctx, {});

			expect(ctx.theme.settings).toBeDefined();
			expect(ctx.theme.settings.layout).toBeDefined();
		});
	});
});
