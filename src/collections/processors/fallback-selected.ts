import { processCollectionData } from "../../collection/index";
import { convertObjectKeysToCamelCase, mergeCollectionData } from "../../utils/index";
import { sanitizeCollectionName } from "../../utils/css";
import type { CollectionProcessor } from "../types";

export const fallbackSelectedProcessor: CollectionProcessor = {
  matches: () => true,
  process: async (collection, ctx, options) => {
    const data = await processCollectionData(collection, options);
    const sanitized = sanitizeCollectionName(collection.name || "");
    const normalized = convertObjectKeysToCamelCase(data) as Record<string, any>;
    const cleaned = ((): Record<string, any> => {
      if (!normalized || typeof normalized !== "object") return normalized as any;
      const copy: Record<string, any> = { ...normalized };
      delete copy.color;
      delete copy.colors;
      return copy;
    })();
    if (cleaned && Object.keys(cleaned).length > 0) {
      mergeCollectionData(ctx.theme.settings.custom, sanitized, cleaned);
    }
  },
};


