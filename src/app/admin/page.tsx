"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import AdminTabManager from "../components/AdminTabManager"
import AdminReactivation from "../components/AdminReactivation"

import UserManagement from "../components/UserManagement"
import UserRegistration from "../components/UserRegistration"
import AdminDataManagement from "../components/AdminDataMangement"
import StorageDashboard from "../components/StorageDashboard"
import AdminProfile from "../components/AdminProfile"
import { BucketProvider } from "../components/BucketContext"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const tabs = [
  { id: "tabManager", label: "🛠️ Tab Manager", component: <AdminTabManager /> },
  { id: "reactivation", label: "🔁 Reactivation", component: <AdminReactivation /> },
 
  { id: "users", label: "👥 User Management", component: <UserManagement /> },
  { id: "registration", label: "📝 Registration", component: <UserRegistration /> },
  { id: "data", label: "📊 Data Management", component: <AdminDataManagement /> },
  { id: "storage", label: "🗄️ Storage", component: <StorageDashboard /> },
  { id: "profile", label: "👤 Profile", component: <AdminProfile /> }
]

export default function AdminPanel(): JSX.Element {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("tabManager")
  const [isMobile, setIsMobile] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const loadSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const email = sessionData?.session?.user?.email
      if (!email) {
        router.push("/login")
        return
      }

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single()

      if (!userData || userData.role !== "admin") {
        router.push("/login")
        return
      }

      setUser(userData)
    }

    loadSession()
  }, [router])

  if (!user) return null

  return (
    <BucketProvider>
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', Roboto, Inter, sans-serif",
        background: "#f9f6fc"
      }}>
        <nav style={{
          width: isMobile ? "100%" : 240,
          padding: 16,
          background: "#ede7f6",
          borderRight: isMobile ? "none" : "1px solid #ddd",
          borderBottom: isMobile ? "1px solid #ddd" : "none",
          display: "flex",
          flexDirection: isMobile ? "row" : "column",
          flexWrap: isMobile ? "wrap" : "nowrap",
          justifyContent: isMobile ? "center" : "flex-start",
          gap: 8,
          overflowX: isMobile ? "auto" : "visible"
        }}>
          <h2 style={{
            fontSize: "1.4rem",
            fontWeight: 900,
            color: "#4a148c",
            marginBottom: isMobile ? 8 : 12,
            textAlign: isMobile ? "center" : "left",
            width: "100%"
          }}>
            🧭 Admin Panel
          </h2>
          <div style={{
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "#333",
            marginBottom: isMobile ? 8 : 16
          }}>
            👤 {user.full_name} ({user.role})
          </div>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "none",
                fontWeight: 700,
                cursor: "pointer",
                textAlign: isMobile ? "center" : "left",
                background: activeTab === tab.id ? "#6a1b9a" : "#f3e5f5",
                color: activeTab === tab.id ? "#fff" : "#4a148c",
                flex: isMobile ? "1 1 auto" : undefined,
                minWidth: isMobile ? 120 : undefined
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <main style={{
          flex: 1,
          padding: isMobile ? 16 : 32,
          overflowY: "auto"
        }}>
          {tabs.find(tab => tab.id === activeTab)?.component}
        </main>
      </div>
    </BucketProvider>
  )
}
