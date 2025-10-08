"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import MediaPanel from "../components/MediaPanel"
import StoragePanel from "../components/StoragePanel"
import UsagePanel from "../components/UsagePanel"
import MediaProfile from "../components/MediaProfile"
import MessagesPanel from "../components/MessagingApp"
import styles from "../components/MediaDashboard.module.css"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const allTabs = [
  { key: "media", label: "📣 Matangazo", component: <MediaPanel /> },
  { key: "storage", label: "🖼️ Gallery", component: <StoragePanel /> },
  { key: "usage", label: "📊 Matumizi", component: <UsagePanel /> },
  { key: "profile", label: "🙍‍♂️ Profile", component: <MediaProfile userId={1} /> },
  
]

export default function MediaDashboard(): JSX.Element {
  const [activeTab, setActiveTab] = useState("media")
  const [allowedTabs, setAllowedTabs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserTabs = async () => {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser()

      if (error || !user) {
        window.location.href = "/login"
        return
      }

      const { id, email } = user

      let { data: userData, error: userErr } = await supabase
        .from("users")
        .select("role, metadata")
        .eq("id", id)
        .single()

      if (userErr || !userData) {
        const fallback = await supabase
          .from("users")
          .select("role, metadata")
          .eq("email", email)
          .single()

        userData = fallback.data
        userErr = fallback.error
      }

      if (userErr || !userData) {
        alert("Haiwezekani kupata metadata ya mtumiaji.")
        window.location.href = "/login"
        return
      }

      const { role, metadata } = userData

      if (role === "admin") {
        setAllowedTabs(allTabs.map(t => t.key)) // Admin sees all
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
            .filter(tab => allowedTabs.includes(tab.key))
            .map(tab => (
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
            .filter(tab => tab.key === activeTab && allowedTabs.includes(tab.key))
            .map(tab => (
              <React.Fragment key={tab.key}>{tab.component}</React.Fragment>
            ))}
        </main>
      </div>
    </div>
  )
}
