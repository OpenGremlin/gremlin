import { createDocument } from "./createDocument.js";
import { getDocument } from "./getDocument.js";
import { updateDocument } from "./updateDocument.js";

export const documentService = { createDocument, getDocument, updateDocument };

export type DocumentService = typeof documentService;
