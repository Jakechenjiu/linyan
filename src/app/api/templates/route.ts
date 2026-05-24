import { NextResponse } from "next/server";
import { loadBuiltInTemplates } from "@/lib/templates";

export async function GET() {
  return NextResponse.json(loadBuiltInTemplates());
}
