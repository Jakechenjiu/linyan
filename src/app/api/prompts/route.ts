import { NextResponse } from "next/server";
import { loadBuiltInStoryPrompts } from "@/lib/prompts";

export async function GET() {
  return NextResponse.json(loadBuiltInStoryPrompts());
}
