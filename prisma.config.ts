import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import { resolve } from "path";

// 加载 .env 文件（确保 prisma 命令能读到 DATABASE_URL）
config({ path: resolve(__dirname, ".env") });

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrations: {
    path: "./prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
