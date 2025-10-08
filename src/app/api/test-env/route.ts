// src/app/api/test-env/route.ts
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || "undefined"
  })
}
