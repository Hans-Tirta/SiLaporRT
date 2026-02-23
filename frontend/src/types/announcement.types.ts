export enum AnnouncementType {
  GENERAL = "GENERAL",
  EVENT = "EVENT",
  MAINTENANCE = "MAINTENANCE",
  REGULATION = "REGULATION",
}

export enum Priority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
}

export type Author = {
  id: string;
  name: string;
  email?: string | null;
};

export type Attachment = {
  id: string;
  filename: string;
  url: string;
  fileType: string; // image, video, audio, document
};

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: Priority;
  isActive: boolean;
  isPinned: boolean;
  publishAt?: string | null;
  expireAt?: string | null;
  viewCount: number;
  author: Author;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CloudinaryFile {
  original_filename?: string;
  secure_url: string;
  resource_type: string;
  public_id: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
}
