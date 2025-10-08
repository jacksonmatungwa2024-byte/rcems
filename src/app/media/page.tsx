"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import MediaPanel from "../components/MediaPanel"
import StoragePanel from "../components/StoragePanel"
import UsagePanel from "../components/UsagePanel"
import MediaProfile from "../components/MediaProfile"

import styles from "../components/MediaDashboard.module.css"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface TabBase {
  key: string
  label: string
}

interface TabWithComponent<P = {}> extends TabBase {
  component: React.ComponentType<P>
}

const allTabs: Array<TabWithComponent<any>> = [
  { key: "media", label: "📣 Matangazo", component: MediaPanel },
  { key: "storage", label: "🖼️ Gallery", component: StoragePanel },
  { key: "usage", label: "📊 Matumizi", component: UsagePanel },
  {
    key: "profile",
    label: "🙍‍♂️ Profile",
    component: MediaProfile as React.ComponentType<{ userId: number }>,
  },
]

export default function MediaDashboard() {
  const [activeTab, setActiveTab] = useState("media")
  const [allowedTabs, setAllowedTabs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<number | null>(null)

  useEffect(() => {
    const fetchUserTabs = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        window.location.href = "/login"
        return
      }

      const email = user.email

      // ✅ Fetch user record to get numeric `id`
      const { data: userData, error: userErr } = await supabase
        .from("users")
        .select("id, role, metadata")
        .eq("email", email)
        .single()

      if (userErr || !userData) {
        alert("Haiwezekani kupata metadata ya mtumiaji.")
        window.location.href = "/login"
        return
      }

      // ✅ Now we can safely set numeric userId
      setUserId(userData.id)

      const { role, metadata } = userData

      if (role === "admin") {
        setAllowedTabs(allTabs.map((t) => t.key)) // Admin sees all
        setActiveTab("media")
      } else {
        const tabs = metadata?.allowed_tabs
        if (Array.isArray(tabs)) {
          setAllowedTabs(tabs)
          setActiveTab(tabs[0] || "media")
        } else {
          setAllowedTabs(["media", "profile", "messages"]) // fallback
          setActiveTab("media")
        }
      }

      setLoading(false)
    }

    fetchUserTabs()
  }, [])

  if (loading) {
    return <div className={styles.container}>⏳ Inapakia dashibodi yako...</div>
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>🕊️ Dashibodi ya Vyombo vya Habari</h1>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          {allTabs
            .filter((tab) => allowedTabs.includes(tab.key))
            .map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={activeTab === tab.key ? styles.activeTab : styles.tab}
              >
                {tab.label}
              </button>
            ))}
        </aside>

        <main className={styles.panel}>
          {allTabs
            .filter(
              (tab) => tab.key === activeTab && allowedTabs.includes(tab.key)
            )
            .map((tab) => {
              const Component = tab.component
              if (tab.key === "profile" && userId !== null) {
                return <Component key={tab.key} userId={userId} />
              }
              return <Component key={tab.key} />
            })}
        </main>
      </div>
    </div>
  )
}
