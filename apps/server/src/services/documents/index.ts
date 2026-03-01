import { createDocument } from "./createDocument.js";
import { getDocument } from "./getDocument.js";
import { getDocuments } from "./getDocuments.js";
import { updateDocument } from "./updateDocument.js";

export const documentService = {
  createDocument,
  getDocument,
  getDocuments,
  updateDocument,
};

export type DocumentService = typeof documentService;
