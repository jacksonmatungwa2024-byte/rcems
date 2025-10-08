"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import PastorUsajili from "../components/PastorUsajili"
import BudgetsPanel from "../components/BudgetsPanel"
import MessagesPanel from "../components/MessagingApp"
import ReportsDashboard2 from "../components/ReportsDashboard2"
import PastorProfile from "../components/PastorProfile"
import PastorSummary from "../components/PastorSummary"
import SummaryApproval from "../components/SummaryApproval"
import ApprovedSummaries from "../components/ApprovedSummaries"
import RejectedSummaries from "../components/RejectedSummaries"
import PastorMatangazo from "../components/PastorMatangazo"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const defaultAccess: Record<string, string[]> = {
  admin: [
    "dashboard", "usajili", "bajeti", "messages", "reports",
    "summary", "approval", "approved", "rejected", "matangazo", "profile"
  ],
  pastor: [
    "dashboard", "usajili", "messages", "reports",
    "summary", "approval", "matangazo", "profile"
  ],
  user: ["dashboard", "messages", "profile"]
}

const tabs = [
  { key: "dashboard", label: "🏠 Dashboard" },
  { key: "usajili", label: "🗂️ *Usajili*" },
  { key: "bajeti", label: "💰 Bajeti" },
  ,
  { key: "reports", label: "📊 Reports" },
  { key: "summary", label: "📝 Muhtasari" },
  { key: "approval", label: "✅ Approval" },
  { key: "approved", label: "📁 Approved" },
  { key: "rejected", label: "⛔ Rejected" },
  { key: "matangazo", label: "📣 Matangazo" },
  { key: "profile", label: "👤 Profile" }
]

export default function PastorPage(): JSX.Element {
  const [active, setActive] = useState("dashboard")
  const [allowedTabs, setAllowedTabs] = useState<string[]>([])
  const [username, setUsername] = useState("")
  const [role, setRole] = useState("")

  useEffect(() => {
    const loadUser = async () => {
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
        .select("role, username, metadata")
        .eq("id", id)
        .single()

      if (userErr || !userData) {
        const fallback = await supabase
          .from("users")
          .select("role, username, metadata")
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

      setRole(userData.role)
      setUsername(userData.username || "")

      const metadataTabs = userData.metadata?.allowed_tabs
      if (Array.isArray(metadataTabs)) {
        setAllowedTabs(metadataTabs)
      } else {
        setAllowedTabs(defaultAccess[userData.role] || [])
      }
    }

    loadUser()
  }, [])

  const container: React.CSSProperties = {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Inter, Roboto, Arial",
    background: "#f3f6fb"
  }

  const sidebar: React.CSSProperties = {
    width: 260,
    padding: 18,
    background: "linear-gradient(180deg,#fff,#faf8ff)",
    borderRight: "1px solid rgba(15,23,42,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: 12
  }

  const navItem = (activeFlag = false): React.CSSProperties => ({
    padding: "10px 12px",
    borderRadius: 8,
    cursor: "pointer",
    background: activeFlag ? "linear-gradient(90deg,#6a1b9a,#9c27b0)" : "transparent",
    color: activeFlag ? "#fff" : "#3b3050",
    fontWeight: 800
  })

  const main: React.CSSProperties = { flex: 1, padding: 20 }

  return (
    <div style={container}>
      <aside style={sidebar}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "linear-gradient(135deg,#6a1b9a,#9c27b0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 900
          }}>P</div>
          <div>
            <div style={{ fontWeight: 900, color: "#3c1363" }}>Pastor Panel</div>
            <div style={{ fontSize: 12, color: "#8b7aa3", fontWeight: 700 }}>{username}</div>
          </div>
        </div>

        {tabs
          .filter(tab => allowedTabs.includes(tab.key))
          .map(tab => (
            <div key={tab.key} onClick={() => setActive(tab.key)} style={navItem(active === tab.key)}>
              {tab.label}
            </div>
          ))}

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          <button style={{
            padding: 10,
            borderRadius: 8,
            background: "#6a1b9a",
            color: "#fff",
            border: "none",
            fontWeight: 800
          }} onClick={() => setActive("profile")}>My Account</button>
          <button style={{
            padding: 10,
            borderRadius: 8,
            background: "#ef4444",
            color: "#fff",
            border: "none",
            fontWeight: 800
          }} onClick={() => { window.location.href = "/login" }}>Logout</button>
        </div>
      </aside>

      <main style={main}>
        {allowedTabs.includes(active) && (
          <>
            {active === "dashboard" && <div style={{ fontWeight: 900, color: "#3c1363" }}>Pastor Dashboard</div>}
            {active === "usajili" && <PastorUsajili />}
            {active === "bajeti" && <BudgetsPanel />}
            {active === "messages" && <MessagesPanel />}
            {active === "reports" && <ReportsDashboard2 />}
            {active === "summary" && <PastorSummary />}
            {active === "approval" && <SummaryApproval />}
            {active === "approved" && <ApprovedSummaries />}
            {active === "rejected" && <RejectedSummaries />}
            {active === "matangazo" && <PastorMatangazo />}
            {active === "profile" && <PastorProfile />}
          </>
        )}
      </main>
    </div>
  )
}
