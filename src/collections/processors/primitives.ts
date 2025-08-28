import { processCollectionData } from "../../collection/index";
import { convertObjectKeysToCamelCase, mergeCollectionData } from "../../utils/index";
import type { CollectionProcessor } from "../types";

export const primitivesProcessor: CollectionProcessor = {
  matches: (name) => name.trim().toLowerCase() === "primitives",
  process: async (collection, ctx, options) => {
    const primitivesData = await processCollectionData(collection, options);
    mergeCollectionData(
      ctx.theme.settings.custom,
      "",
      convertObjectKeysToCamelCase(primitivesData)
    );
  },
};


