"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const allTabs = [
  "home", "usajili", "mafunzo", "reports", "messages", "profile",
  "muumini", "mahadhurio", "wokovu", "ushuhuda",
  "dashboard", "bajeti", "summary", "approval", "approved", "rejected", "matangazo",
  "media", "storage", "usage",
  "finance", "michango", "reports_finance"
]

export default function AdminTabManager(){
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMap, setSuccessMap] = useState<Record<number, boolean>>({})

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("users")
        .select("id, username, role, metadata")
        .order("role", { ascending: true })
        .order("username", { ascending: true })

      if (!error && data) setUsers(data)
      setLoading(false)
    }

    fetchUsers()
  }, [])

  const toggleTab = (userId: number, tab: string) => {
    setUsers(prev =>
      prev.map(user => {
        if (user.id !== userId) return user
        const currentTabs = user.metadata?.allowed_tabs || []
        const updatedTabs = currentTabs.includes(tab)
          ? currentTabs.filter((t: string) => t !== tab)
          : [...currentTabs, tab]
        return {
          ...user,
          metadata: { ...user.metadata, allowed_tabs: updatedTabs }
        }
      })
    )
  }

  const saveTabs = async (userId: number, metadata: any) => {
    setSaving(true)
    await supabase
      .from("users")
      .update({ metadata })
      .eq("id", userId)
    setSaving(false)
    setSuccessMap(prev => ({ ...prev, [userId]: true }))
    setTimeout(() => {
      setSuccessMap(prev => ({ ...prev, [userId]: false }))
    }, 3000)
  }

  const grouped = users.reduce((acc, user) => {
    const role = user.role || "other"
    if (!acc[role]) acc[role] = []
    acc[role].push(user)
    return acc
  }, {} as Record<string, any[]>)

  return (
  <div style={{ padding: 20, fontFamily: "Segoe UI, Roboto, sans-serif" }}>
    <h2 style={{ color: "#4a148c", fontWeight: 900 }}>🛠️ Tab Manager kwa Kila Paneli</h2>
    {loading ? (
      <p>⏳ Inapakia watumiaji...</p>
    ) : (
      Object.entries(grouped).map(([role, group]) => {
        const usersInRole = group as any[];

        return (
          <div key={role} style={{ marginBottom: 40 }}>
            <h3 style={{ color: "#6a1b9a", fontWeight: 800, marginBottom: 12 }}>
              👥 {role.charAt(0).toUpperCase() + role.slice(1)} Panel
            </h3>

            {usersInRole.map((user) => (
              <div
                key={user.id}
                style={{
                  marginBottom: 24,
                  padding: 16,
                  border: "1px solid #ddd",
                  borderRadius: 12,
                  background: "#faf8ff",
                }}
              >
                <div style={{ fontWeight: 800, color: "#3c1363" }}>
                  {user.username} ({user.role})
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  {allTabs.map((tab) => (
                    <label
                      key={tab}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: user.metadata?.allowed_tabs?.includes(tab)
                          ? "#6a1b9a"
                          : "#e0e0e0",
                        color: user.metadata?.allowed_tabs?.includes(tab)
                          ? "#fff"
                          : "#333",
                        padding: "6px 10px",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={user.metadata?.allowed_tabs?.includes(tab) || false}
                        onChange={() => toggleTab(user.id, tab)}
                        style={{ display: "none" }}
                      />
                      {tab}
                    </label>
                  ))}
                </div>

                <button
                  onClick={() => saveTabs(user.id, user.metadata)}
                  disabled={saving}
                  style={{
                    marginTop: 12,
                    padding: "8px 16px",
                    background: "#4a148c",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  💾 Hifadhi Tab
                </button>

                {successMap[user.id] && (
                  <div
                    style={{
                      marginTop: 8,
                      fontWeight: 700,
                      color: "#2e7d32",
                    }}
                  >
                    ✅ Tabs zimehifadhiwa kwa mafanikio
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })
       )}
  </div>
);
}
