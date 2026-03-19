export type FileAttachment = { type: "file"; path: string };
export type LinkAttachment = {
  type: "link";
  url: string;
  title?: string;
  description?: string;
};

export type Attachment = FileAttachment | LinkAttachment;
