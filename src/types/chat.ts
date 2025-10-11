export type Role = "user" | "model";

export interface ChatMessage {
  role: Role;
  content: string;
}
