"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import styles from "../components/HomePage.module.css";
import FinancePanel from "../components/FinancePanel";
import Michango from "../components/Michango";
import FinanceReports from "../components/FinanceReports";
import FinanceProfile from "../components/FinanceProfile";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const allTabs = [
  { key: "finance", label: "💰 FinancePanel", component: <FinancePanel /> },
  { key: "michango", label: "🙏 Michango", component: <Michango /> },
  { key: "reports", label: "📊 FinanceReports", component: <FinanceReports /> },
  { key: "profile", label: "👥 FinanceProfile", component: <FinanceProfile /> },
];

const logoutBtnStyle = {
  padding: "8px 16px",
  background: "#d32f2f",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
  marginTop: 12,
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("finance");
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Sign out user on page unload (e.g., browser/tab close)
  useEffect(() => {
    const handleUnload = async () => {
      await supabase.auth.signOut();
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  // Auto-logout after inactivity (5 minutes)
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        supabase.auth.signOut();
        window.location.href = "/login";
      }, 5 * 60 * 1000); // 5 minutes
    };

    const events = ["mousemove", "keydown", "scroll", "click"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(timeout);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, []);

  // Check if user session exists, redirect if not
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        window.location.href = "/login";
      }
    };
    checkSession();
  }, []);

  // Fetch user role and allowed tabs
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

      const { id, email } = user;

      let { data: userData, error: userErr } = await supabase
        .from("users")
        .select("role, username, email, metadata")
        .eq("id", id)
        .single();

      if (userErr || !userData) {
        const fallback = await supabase
          .from("users")
          .select("role, username, email, metadata")
          .eq("email", email)
          .single();

        userData = fallback.data;
        userErr = fallback.error;
      }

      if (userErr || !userData) {
        alert("Haiwezekani kupata taarifa zako.");
        window.location.href = "/login";
        return;
      }

      const { role, metadata } = userData;

      if (role === "admin") {
        setAllowedTabs(allTabs.map((t) => t.key)); // Admin sees all tabs
        setActiveTab("finance");
      } else {
        const tabs = metadata?.allowed_tabs;
        if (Array.isArray(tabs)) {
          setAllowedTabs(tabs);
          setActiveTab(tabs[0] || "finance");
        } else {
          setAllowedTabs(["finance", "profile", "messages"]); // fallback tabs
          setActiveTab("finance");
        }
      }

      setLoading(false);
    };

    fetchUserTabs();
  }, []);

  if (loading) {
    return <div className={styles.container}>⏳ Inapakia dashboard yako...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>🕊️ Dashboard ya Huduma</h1>

      <button onClick={handleLogout} style={logoutBtnStyle}>
        🚪 Toka / Logout
      </button>

      <div className={styles.tabBar}>
        {allTabs
          .filter((tab) => allowedTabs.includes(tab.key))
          .map((tab) => (
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
          .filter(
            (tab) => tab.key === activeTab && allowedTabs.includes(tab.key)
          )
          .map((tab) => (
            <React.Fragment key={tab.key}>{tab.component}</React.Fragment>
          ))}
      </div>
    </div>
  );
}
