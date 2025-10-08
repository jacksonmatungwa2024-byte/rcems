"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminReactivation(): JSX.Element {
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("users")
        .select("id, full_name, email, role, is_active, metadata, reactivation_requested_at")
        .eq("is_active", false)

      if (data) setUsers(data)
    }

    fetchUsers()
  }, [])

  const reactivateUser = async (userId: number, requestedAt: string) => {
    const now = new Date()
    const requestedDate = new Date(requestedAt)
    const hoursPassed = (now.getTime() - requestedDate.getTime()) / (1000 * 60 * 60)

    if (hoursPassed < 48) {
      alert(`⏳ Bado haijafika masaa 48 (${Math.floor(hoursPassed)}hrs passed).`)
      return
    }

    await supabase
      .from("users")
      .update({ is_active: true, login_attempts: 0, reactivation_requested_at: null })
      .eq("id", userId)

    alert("✅ Akaunti imewezeshwa tena.")
    setUsers(prev => prev.filter(u => u.id !== userId))
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: "#4a148c", fontWeight: 900 }}>🔓 Admin Reactivation Panel</h2>
      {users.length === 0 ? (
        <p>✅ Hakuna akaunti zinazohitaji uamsho.</p>
      ) : (
        users.map(user => (
          <div key={user.id} style={{ marginBottom: 24, padding: 16, border: "1px solid #ccc", borderRadius: 12 }}>
            <div style={{ fontWeight: 800 }}>{user.full_name} ({user.role})</div>
            <div>Email: {user.email}</div>
            <div>⏳ Requested: {new Date(user.reactivation_requested_at).toLocaleString()}</div>
            <button onClick={() => reactivateUser(user.id, user.reactivation_requested_at)} style={btnStyle}>
              ✅ Approve Reactivation
            </button>
          </div>
        ))
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  marginTop: 8,
  padding: "8px 12px",
  background: "#6a1b9a",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontWeight: 700,
  cursor: "pointer"
}
