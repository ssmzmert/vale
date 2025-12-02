export type UserRole = "ADMIN" | "VALET" | "VIEWER";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  placeId?: string | null;
  placeName?: string | null;
}
