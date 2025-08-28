import { processCollectionData } from "../../collection/index";
import { processButtonStyles } from "../../button/index";
import { convertObjectKeysToCamelCase, extractWordPressElementsPath, isWordPressElementsCollection, mergeCollectionData } from "../../utils/index";
import type { CollectionProcessor } from "../types";

export const wpElementsProcessor: CollectionProcessor = {
  matches: (name) => isWordPressElementsCollection(name),
  process: async (collection, ctx, options) => {
    const collectionData = await processCollectionData(collection, options);

    ctx.theme.styles = ctx.theme.styles || ({} as any);
    (ctx.theme.styles as any).elements = (ctx.theme.styles as any).elements || {};
    const target = (ctx.theme.styles as any).elements as Record<string, any>;

    const rawPath = extractWordPressElementsPath(collection.name);
    const elementsPath = rawPath === "buttons" ? "button" : rawPath;
    if (elementsPath) {
      target[elementsPath] = target[elementsPath] || {};
      mergeCollectionData(target[elementsPath], "", convertObjectKeysToCamelCase(collectionData));
      if (elementsPath === "button" && collectionData && (collectionData as any).button) {
        processButtonStyles((collectionData as any).button, ctx.files);
      }
    } else {
      // Root wp.elements collection: merge known heading/font/text keys into styles.elements
      mergeCollectionData(target, "", convertObjectKeysToCamelCase(collectionData));
      if (collectionData && (collectionData as any).button) {
        processButtonStyles((collectionData as any).button, ctx.files);
      }
    }
  },
};


