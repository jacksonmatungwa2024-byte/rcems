// src/app/api/update-password/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const { userId, password } = await req.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // 👈 Hii ni service role key
  )

  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    password
  })

  if (error) {
    console.error("❌ Supabase Admin SDK error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
