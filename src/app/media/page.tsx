"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import MediaPanel from "../components/MediaPanel";
import StoragePanel from "../components/StoragePanel";
import UsagePanel from "../components/UsagePanel";
import MediaProfile from "../components/MediaProfile";

import styles from "../components/MediaDashboard.module.css";

// ✅ Secure client initialization
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

  // ✅ Load user and allowed tabs
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
        setAllowedTabs(allTabs.map((t) => t.key)); // Admin sees all
        setActiveTab("media");
      } else {
        const tabs = metadata?.allowed_tabs;
        if (Array.isArray(tabs)) {
          setAllowedTabs(tabs);
          setActiveTab(tabs[0] || "media");
        } else {
          setAllowedTabs(["media", "profile", "usage"]); // fallback
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

  // ✅ Logout button styles
  const logoutBtnStyle: React.CSSProperties = {
    padding: "8px 16px",
    background: "#d32f2f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 12,
  };

  if (loading) {
    return <div className={styles.container}>⏳ Inapakia dashibodi yako...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>🕊️ Dashibodi ya Vyombo vya Habari</h1>

      <div className={styles.layout}>
        {/* ✅ Sidebar Navigation */}
        <aside className={styles.sidebar}>
          {allTabs
            .filter((tab) => allowedTabs.includes(tab.key))
            .map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={
                  activeTab === tab.key ? styles.activeTab : styles.tab
                }
              >
                {tab.label}
              </button>
            ))}

          {/* ✅ Secure Logout Button */}
          <button onClick={handleLogout} style={logoutBtnStyle}>
            🚪 Toka / Logout
          </button>
        </aside>

        {/* ✅ Main Content */}
        <main className={styles.panel}>
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
    </div>
  );
}
