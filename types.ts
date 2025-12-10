export enum ElementType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  NOTE = 'NOTE'
}

// We map Tldraw shapes to this interface for the Gemini Service
export interface CanvasElement {
  id: string;
  type: ElementType;
  content: string; // Text content or Image URL
  prompt?: string;
}

export type ToolMode = 'select' | 'hand' | 'text' | 'draw' | 'note';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // base64 data url for user uploads
  timestamp: number;
}

export interface ChatResponse {
  text: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  name: string;
  args: any;
  id: string;
}

// SaaS Data Models
export interface Project {
  id: string;
  name: string;
  updatedAt: number;
}