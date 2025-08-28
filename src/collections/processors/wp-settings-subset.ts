import { processCollectionData } from "../../collection/index";
import { convertObjectKeysToCamelCase, mergeCollectionData } from "../../utils/index";
import type { CollectionProcessor } from "../types";

function extractSubset(name: string): string | null {
  const m = name.trim().toLowerCase().match(/^wp\.settings\.(layout|spacing|typography|shadow)(?:\.|$)/i);
  return m ? m[1] : null;
}

function unwrapSubsetRoot(section: string, data: Record<string, any>): Record<string, any> {
  if (!data || typeof data !== "object") return data;
  if (Object.prototype.hasOwnProperty.call(data, section) && typeof data[section] === "object") {
    return data[section];
  }
  return data;
}

export const wpSettingsSubsetProcessor: CollectionProcessor = {
  matches: (name) => extractSubset(name) !== null,
  process: async (collection, ctx, options) => {
    const section = extractSubset(collection.name)!;
    const data = await processCollectionData(collection, options);
    const unwrapped = unwrapSubsetRoot(section, convertObjectKeysToCamelCase(data));
    ctx.theme.settings = ctx.theme.settings || {};
    ctx.theme.settings[section] = ctx.theme.settings[section] || {};
    const target = ctx.theme.settings[section];
    const merged = mergeSection(target, unwrapped);
    ctx.theme.settings[section] = merged;
  },
};

function mergeSection(target: any, source: any): any {
  if (!target || typeof target !== "object") return source;
  if (!source || typeof source !== "object") return target;
  const result: any = { ...target };
  for (const key of Object.keys(source)) {
    if (typeof result[key] === "object" && typeof source[key] === "object") {
      result[key] = mergeSection(result[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}


