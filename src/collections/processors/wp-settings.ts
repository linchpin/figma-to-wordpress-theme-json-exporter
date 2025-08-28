import { processCollectionData } from "../../collection/index";
import {
  convertObjectKeysToCamelCase,
  extractWordPressSettingsPath,
  isWordPressSettingsCollection,
  isWordPressSettingsColorCollection,
  mergeCollectionData,
} from "../../utils/index";
import { sanitizeCollectionName } from "../../utils/css";
import type { CollectionProcessor } from "../types";

export const wpSettingsProcessor: CollectionProcessor = {
  matches: (name) => isWordPressSettingsCollection(name) && !isWordPressSettingsColorCollection(name),
  process: async (collection, ctx, options) => {
    const collectionData = await processCollectionData(collection, options);
    const name = collection.name;
    const settingsPath = extractWordPressSettingsPath(name);

    if (settingsPath === "") {
      // Exact match: intelligently merge into settings.
      // Known settings top-level keys go straight under settings; everything else goes to settings.custom.
      const raw =
        collectionData &&
        typeof collectionData === "object" &&
        (collectionData as any)["wp.settings"]
          ? (collectionData as any)["wp.settings"]
          : collectionData;
      const normalized = convertObjectKeysToCamelCase(raw) as Record<string, any>;
      const knownSettingsKeys = new Set([
        "appearanceTools",
        "layout",
        "spacing",
        "typography",
        "color",
        "shadow",
        "custom",
        "useRootPaddingAwareAlignments",
        "writingMode",
        "dropCap",
        "defaultFontSizes",
        "fluid",
      ]);
      ctx.theme.settings = ctx.theme.settings || {};
      ctx.theme.settings.custom = ctx.theme.settings.custom || {};

      for (const [key, value] of Object.entries(normalized)) {
        if (knownSettingsKeys.has(key)) {
          // Deep merge into settings[key]
          const existing = (ctx.theme.settings as any)[key] || {};
          (ctx.theme.settings as any)[key] = mergeDeep(existing, value);
        } else {
          // Anything else: settings.custom[key]
          const existing = (ctx.theme.settings.custom as any)[key] || {};
          (ctx.theme.settings.custom as any)[key] = mergeDeep(existing, value);
        }
      }
    } else {
      const targetPath = settingsPath || sanitizeCollectionName(name);
      mergeCollectionData(
        ctx.theme.settings.custom,
        targetPath,
        convertObjectKeysToCamelCase(collectionData)
      );
    }
  },
};

function mergeDeep(target: any, source: any): any {
  if (!target || typeof target !== "object") return source;
  if (!source || typeof source !== "object") return target;
  const result: any = { ...target };
  for (const key of Object.keys(source)) {
    const tv = result[key];
    const sv = source[key];
    if (typeof tv === "object" && typeof sv === "object") {
      result[key] = mergeDeep(tv, sv);
    } else {
      result[key] = sv;
    }
  }
  return result;
}


