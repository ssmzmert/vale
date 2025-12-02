import NextAuth, { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id: string;
      role: "ADMIN" | "VALET" | "VIEWER";
    };
  }

  interface User {
    role: "ADMIN" | "VALET" | "VIEWER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ADMIN" | "VALET" | "VIEWER";
  }
}
