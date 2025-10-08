"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

import SajiliMuumini from "../components/SajiliMuumini"
import SajiliMahadhurio from "../components/SajiliMahadhurio"
import SajiliAliyeokoka from "../components/SajiliAliyeokoka"
import MafunzoMuumini from "../components/MafunzoMuumini"
import SajiliUshuhuda from "../components/SajiliUshuhuda"
import ReportsDashboard from "../components/ReportsDashboard"
import MessagesPanel from "../components/MessagingApp"
import UsherProfile from "../components/UsherProfile"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home(): JSX.Element {
  const [activeTab, setActiveTab] = useState<
    "home" | "usajili" | "mafunzo" | "reports" | "messages" | "profile"
  >("home")

  const [usajiliSub, setUsajiliSub] = useState<
    "muumini" | "mahadhurio" | "wokovu" | "ushuhuda"
  >("muumini")

  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadUser = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      const email = sessionData?.session?.user?.email
      if (sessionError || !email) {
        window.location.href = "/login"
        return
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single()

      if (userError || !userData || !["admin", "usher"].includes(userData.role)) {
        window.location.href = "/login"
        return
      }

      setUser(userData)
    }

    loadUser()
  }, [])

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "10px 16px",
    borderRadius: 6,
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
    background: active ? "#6a1b9a" : "#f1eef7",
    color: active ? "#fff" : "#4a148c",
    marginBottom: 8,
    width: "100%",
    textAlign: "left"
  })

  const subTabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 12px",
    borderRadius: 6,
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
    background: active ? "#6a1b9a" : "#eae6f7",
    color: active ? "#fff" : "#4a148c",
    marginBottom: 6,
    width: "100%",
    textAlign: "left"
  })

  if (!user) return null

  const { role, username, full_name, branch } = user

  const allowedTabs: Record<string, string[]> = {
    admin: ["home", "usajili", "mafunzo", "reports", "messages", "profile"],
    usher: ["home", "usajili", "reports", "profile"]
  }

  const visibleTabs = allowedTabs[role] || []

  return (
    <div style={{
      fontFamily: "Inter, Roboto, Arial",
      background: "#f3f6fb",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "row",
      padding: 24,
      gap: 24
    }}>
      {/* Sidebar Navigation */}
      <aside style={{
        width: 220,
        display: "flex",
        flexDirection: "column"
      }}>
        {visibleTabs.includes("home") && (
          <button style={tabStyle(activeTab === "home")} onClick={() => setActiveTab("home")}>🏠 Home</button>
        )}
        {visibleTabs.includes("usajili") && (
          <button style={tabStyle(activeTab === "usajili")} onClick={() => setActiveTab("usajili")}>🗂️ Usajili</button>
        )}
        {visibleTabs.includes("mafunzo") && (
          <button style={tabStyle(activeTab === "mafunzo")} onClick={() => setActiveTab("mafunzo")}>📚 Mafunzo</button>
        )}
        {visibleTabs.includes("reports") && (
          <button style={tabStyle(activeTab === "reports")} onClick={() => setActiveTab("reports")}>📊 Reports</button>
        )}
        {visibleTabs.includes("messages") && (
          <button style={tabStyle(activeTab === "messages")} onClick={() => setActiveTab("messages")}>💬 Ujumbe</button>
        )}
        {visibleTabs.includes("profile") && (
          <button style={tabStyle(activeTab === "profile")} onClick={() => setActiveTab("profile")}>👤 Profile</button>
        )}
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        background: "#fff",
        padding: 24,
        borderRadius: 12,
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)"
      }}>
        {activeTab === "home" && (
          <div>
            <h2 style={{ color: "#3c1363", marginBottom: 8 }}>
              Karibu {role === "admin" ? "Admin" : "Mhudumu"} {full_name}
            </h2>
            <p style={{ color: "#555" }}>Tawi: {branch || "—"}</p>
            <p style={{ color: "#555" }}>Chagua kipengele upande wa kushoto ili kuendelea.</p>
          </div>
        )}

        {activeTab === "usajili" && (
          <div>
            <h3 style={{ marginBottom: 6, color: "#3c1363" }}>Usajili</h3>
            <p style={{ marginBottom: 12, color: "#666" }}>Chagua aina ya usajili:</p>

            <div style={{ display: "flex", flexDirection: "column", maxWidth: 300 }}>
              <button style={subTabStyle(usajiliSub === "muumini")} onClick={() => setUsajiliSub("muumini")}>📝 Muumini</button>
              <button style={subTabStyle(usajiliSub === "mahadhurio")} onClick={() => setUsajiliSub("mahadhurio")}>📋 Mahadhurio</button>
              <button style={subTabStyle(usajiliSub === "wokovu")} onClick={() => setUsajiliSub("wokovu")}>🙏 Wokovu</button>
              <button style={subTabStyle(usajiliSub === "ushuhuda")} onClick={() => setUsajiliSub("ushuhuda")}>🗣️ Ushuhuda</button>
            </div>

            <div style={{ marginTop: 20 }}>
              {usajiliSub === "muumini" && <SajiliMuumini />}
              {usajiliSub === "mahadhurio" && <SajiliMahadhurio setActiveTab={setActiveTab} />}
              {usajiliSub === "wokovu" && <SajiliAliyeokoka setActiveTab={setActiveTab} />}
              {usajiliSub === "ushuhuda" && <SajiliUshuhuda setActiveTab={setActiveTab} />}
            </div>
          </div>
        )}

        {activeTab === "mafunzo" && <MafunzoMuumini setActiveTab={setActiveTab} />}
        {activeTab === "reports" && <ReportsDashboard setActiveTab={setActiveTab} />}
        {activeTab === "messages" && <MessagesPanel setActiveTab={setActiveTab} />}
        {activeTab === "profile" && <UsherProfile onClose={() => setActiveTab("home")} />}
      </main>
    </div>
  )
}
