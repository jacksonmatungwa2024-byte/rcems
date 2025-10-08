"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function UserManagement(){
  const [users, setUsers] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("users")
        .select("id, email, full_name, role, metadata, active_until")
        .order("full_name", { ascending: true })

      if (data) setUsers(data)
    }

    fetchUsers()
  }, [])

  const deleteUser = async (userId: number, email: string) => {
    setSaving(true)
    const { data: authData } = await supabase.auth.admin.listUsers()
    const authUser = authData?.users?.find(u => u.email === email)
    if (!authUser) return alert("❌ Auth user not found.")

    await supabase.auth.admin.deleteUser(authUser.id)
    await supabase.from("users").delete().eq("id", userId)
    setUsers(prev => prev.filter(u => u.id !== userId))
    setSaving(false)
    alert("✅ Mtumiaji amefutwa kikamilifu.")
  }

  const initiatePasswordReset = async (userId: number) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    await supabase
      .from("users")
      .update({
        metadata: {
          password_reset_otp: otp,
          reset_status: "waiting_approval"
        }
      })
      .eq("id", userId)
    alert(`✅ OTP ya kubadilisha nenosiri: ${otp}`)
  }

  const approveResetRequest = async (userId: number) => {
    await supabase
      .from("users")
      .update({
        metadata: {
          reset_status: "approved_by_admin"
        }
      })
      .eq("id", userId)
    alert("✅ Ombi la kubadilisha nenosiri limeidhinishwa. Mtumiaji atasubiri lisaa limoja.")
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: "#4a148c", fontWeight: 900 }}>🛠️ User Management</h2>
      {users.map(user => {
        const status = user.metadata?.reset_status
        return (
          <div key={user.id} style={{ marginBottom: 24, padding: 16, border: "1px solid #ccc", borderRadius: 12 }}>
            <div style={{ fontWeight: 800 }}>{user.full_name} ({user.role})</div>
            <div>Email: {user.email}</div>
            <div>Status: {status || "✅ Active"}</div>
            <div>Active Until: {user.active_until ? new Date(user.active_until).toLocaleDateString() : "—"}</div>

            <button onClick={() => deleteUser(user.id, user.email)} style={btnStyle}>🗑️ Futa Mtumiaji</button>
            <button onClick={() => initiatePasswordReset(user.id)} style={btnStyle}>🔐 Tuma OTP</button>

            {status === "waiting_approval" && (
              <button onClick={() => approveResetRequest(user.id)} style={btnStyle}>
                ✅ Approve Reset Request
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  marginTop: 8,
  marginRight: 8,
  padding: "8px 12px",
  background: "#6a1b9a",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontWeight: 700,
  cursor: "pointer"
}
