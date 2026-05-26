import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/workspace/:path*", "/api/novels/:path*", "/api/chapters/:path*", "/api/notes/:path*", "/api/photon/:path*", "/api/wanxiang/:path*", "/api/contents/:path*", "/api/mindmaps/:path*", "/api/stories/:path*", "/api/settings/:path*"],
};
