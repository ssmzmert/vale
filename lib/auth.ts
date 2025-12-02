import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions, User } from "next-auth";
import { connectToDatabase } from "./mongodb";
import { User as UserModel } from "@/models/User";
// Ensure Place model is registered before populate is used
import "@/models/Place";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import type { SessionUser } from "./types";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/giris"
  },
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Email ve Şifre",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Şifre", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        await connectToDatabase();
        const user = await UserModel.findOne({ email: credentials.email })
          .populate("place", "name")
          .lean();
        if (!user || !user.active) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          placeId: user.place ? (user.place as any)._id.toString() : null,
          placeName: user.place ? (user.place as any).name : null
        } as User & { role: string };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.placeId = (user as any).placeId || null;
        token.placeName = (user as any).placeName || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as SessionUser).role = token.role as any;
        (session.user as SessionUser).id = token.sub as string;
        (session.user as SessionUser).placeId = (token as any).placeId || null;
        (session.user as SessionUser).placeName = (token as any).placeName || null;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/admin") || url.startsWith("/valet")) {
        return new URL(url, baseUrl).toString();
      }
      return `${baseUrl}/valet`;
    }
  }
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}
