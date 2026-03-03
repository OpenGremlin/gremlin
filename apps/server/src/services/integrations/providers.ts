export interface ProviderDef {
  id: string;
  service: string;
  description: string;
  scopes: { scope: string; label: string }[];
}

export const providers: ProviderDef[] = [
  {
    id: "google",
    service: "Google",
    description: "Gmail & Google Docs",
    scopes: [
      { scope: "gmail.readonly", label: "Read Gmail" },
      { scope: "gmail.send", label: "Send Gmail" },
      { scope: "documents.readonly", label: "Read Google Docs" },
    ],
  },
];
