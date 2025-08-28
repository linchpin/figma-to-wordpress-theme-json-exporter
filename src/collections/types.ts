import { ExportOptions, VariableCollection } from "../types";

export interface ExportContext {
  theme: any;
  files: Array<{ fileName: string; body: any }>;
}

export interface CollectionProcessor {
  matches: (collectionName: string) => boolean;
  process: (
    collection: VariableCollection,
    ctx: ExportContext,
    options: ExportOptions
  ) => Promise<void>;
}


