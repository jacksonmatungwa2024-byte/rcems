"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import styles from "../components/HomePage.module.css"
import FinancePanel from "../components/FinancePanel"
import Michango from "../components/Michango"
import FinanceReports from "../components/FinanceReports"
import FinanceProfile from "../components/FinanceProfile"


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const allTabs = [
  { key: "finance", label: "💰 FinancePanel", component: <FinancePanel /> },
  { key: "michango", label: "🙏 Michango", component: <Michango /> },
  { key: "reports", label: "📊 FinanceReports", component: <FinanceReports /> },
  { key: "profile", label: "👥 FinanceProfile", component: <FinanceProfile /> },
 
]

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("finance")
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
        .select("role, username, email, metadata")
        .eq("id", id)
        .single()

      if (userErr || !userData) {
        const fallback = await supabase
          .from("users")
          .select("role, username, email, metadata")
          .eq("email", email)
          .single()

        userData = fallback.data
        userErr = fallback.error
      }

      if (userErr || !userData) {
        alert("Haiwezekani kupata taarifa zako.")
        window.location.href = "/login"
        return
      }

      const { role, metadata } = userData

      if (role === "admin") {
        setAllowedTabs(allTabs.map(t => t.key)) // Admin sees all
        setActiveTab("finance")
      } else {
        const tabs = metadata?.allowed_tabs
        if (Array.isArray(tabs)) {
          setAllowedTabs(tabs)
          setActiveTab(tabs[0] || "finance")
        } else {
          setAllowedTabs(["finance", "profile", "messages"]) // fallback
          setActiveTab("finance")
        }
      }

      setLoading(false)
    }

    fetchUserTabs()
  }, [])

  if (loading) {
    return <div className={styles.container}>⏳ Inapakia dashboard yako...</div>
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>🕊️ Dashboard ya Huduma</h1>

      <div className={styles.tabBar}>
        {allTabs
          .filter(tab => allowedTabs.includes(tab.key))
          .map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={activeTab === tab.key ? styles.active : styles.tab}
            >
              {tab.label}
            </button>
          ))}
      </div>

      <div className={styles.panel}>
        {allTabs
          .filter(tab => tab.key === activeTab && allowedTabs.includes(tab.key))
          .map(tab => (
            <React.Fragment key={tab.key}>{tab.component}</React.Fragment>
          ))}
      </div>
    </div>
  )
}
