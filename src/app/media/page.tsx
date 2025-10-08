"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import MediaPanel from "../components/MediaPanel";
import StoragePanel from "../components/StoragePanel";
import UsagePanel from "../components/UsagePanel";
import MediaProfile from "../components/MediaProfile";

import styles from "../components/MediaDashboard.module.css";

// ✅ Secure Supabase client initialization
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

interface TabBase {
  key: string;
  label: string;
}

interface TabWithComponent<P = {}> extends TabBase {
  component: React.ComponentType<P>;
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
];

export default function MediaDashboard() {
  const [activeTab, setActiveTab] = useState("media");
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  // ✅ Fetch user & permission setup
  useEffect(() => {
    const fetchUserTabs = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        window.location.href = "/login";
        return;
      }

      const email = user.email;
      const { data: userData, error: userErr } = await supabase
        .from("users")
        .select("id, role, metadata")
        .eq("email", email)
        .single();

      if (userErr || !userData) {
        alert("Haiwezekani kupata metadata ya mtumiaji.");
        window.location.href = "/login";
        return;
      }

      setUserId(userData.id);
      setUserRole(userData.role);

      const { role, metadata } = userData;

      if (role === "admin") {
        setAllowedTabs(allTabs.map((t) => t.key));
        setActiveTab("media");
      } else {
        const tabs = metadata?.allowed_tabs;
        if (Array.isArray(tabs)) {
          setAllowedTabs(tabs);
          setActiveTab(tabs[0] || "media");
        } else {
          setAllowedTabs(["media", "profile", "usage"]);
          setActiveTab("media");
        }
      }

      setLoading(false);
    };

    fetchUserTabs();
  }, []);

  // ✅ Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // 🎨 Modern purple gradient Logout button with hover effects
  const logoutBtnStyle: React.CSSProperties = {
    padding: "10px 20px",
    background: hovered
      ? "linear-gradient(135deg, #8e24aa, #6a1b9a)"
      : "linear-gradient(135deg, #7b1fa2, #4a148c)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
    marginTop: 18,
    boxShadow: hovered
      ? "0 4px 12px rgba(106, 27, 154, 0.35)"
      : "0 2px 6px rgba(0, 0, 0, 0.1)",
    transform: hovered ? "translateY(-2px)" : "translateY(0)",
    transition: "all 0.25s ease-in-out",
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.2rem",
          color: "#6a1b9a",
          fontWeight: 500,
        }}
      >
        ⏳ Inapakia dashibodi yako...
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f4f2fb, #fafafa)",
        fontFamily: "Inter, Roboto, Arial, sans-serif",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          background: "#fff",
          padding: "20px 18px",
          borderRight: "1px solid #e0ddee",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "1.3rem",
              color: "#4a148c",
              marginBottom: 20,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            🎧 Media Center
          </h2>

          {allTabs
            .filter((tab) => allowedTabs.includes(tab.key))
            .map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  marginBottom: 8,
                  background:
                    activeTab === tab.key ? "#6a1b9a" : "transparent",
                  color: activeTab === tab.key ? "#fff" : "#4a148c",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={logoutBtnStyle}
        >
          🚪 Toka / Logout
        </button>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: "32px",
          background: "#fff",
          borderTopLeftRadius: 20,
          borderBottomLeftRadius: 20,
          margin: "20px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          overflowY: "auto",
        }}
      >
        <h1
          style={{
            fontSize: "1.6rem",
            color: "#4a148c",
            fontWeight: 700,
            marginBottom: 24,
          }}
        >
          🕊️ Dashibodi ya Vyombo vya Habari
        </h1>

        {allTabs
          .filter(
            (tab) => tab.key === activeTab && allowedTabs.includes(tab.key)
          )
          .map((tab) => {
            const Component = tab.component;
            if (tab.key === "profile" && userId !== null) {
              return <Component key={tab.key} userId={userId} />;
            }
            return <Component key={tab.key} />;
          })}
      </main>
    </div>
  );
}
