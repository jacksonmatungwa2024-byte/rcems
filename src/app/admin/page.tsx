"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import AdminTabManager from "../components/AdminTabManager";
import AdminReactivation from "../components/AdminReactivation";
import UserManagement from "../components/UserManagement";
import UserRegistration from "../components/UserRegistration";
import AdminDataManagement from "../components/AdminDataMangement";
import StorageDashboard from "../components/StorageDashboard";
import AdminProfile from "../components/AdminProfile";
import { BucketProvider } from "../components/BucketContext";

// ✅ Secure Supabase Client
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

const tabs = [
  { id: "tabManager", label: "🛠️ Tab Manager", component: <AdminTabManager /> },
  { id: "reactivation", label: "🔁 Reactivation", component: <AdminReactivation /> },
  { id: "users", label: "👥 User Management", component: <UserManagement /> },
  { id: "registration", label: "📝 Registration", component: <UserRegistration /> },
  { id: "data", label: "📊 Data Management", component: <AdminDataManagement /> },
  { id: "storage", label: "🗄️ Storage", component: <StorageDashboard /> },
  { id: "profile", label: "👤 Profile", component: <AdminProfile /> },
];

export default function AdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("tabManager");
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [hovered, setHovered] = useState(false);

  // ✅ Handle screen resizing for responsive layout
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Session validation and role check
  useEffect(() => {
    const loadSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData?.session?.user?.email;

      if (!email) {
        router.push("/login");
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (!userData || userData.role !== "admin") {
        router.push("/login");
        return;
      }

      setUser(userData);
    };

    loadSession();
  }, [router]);

  // ✅ Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // 🎨 Logout button style (animated gradient purple)
  const logoutBtnStyle: React.CSSProperties = {
    padding: "10px 20px",
    background: hovered
      ? "linear-gradient(135deg, #8e24aa, #6a1b9a)"
      : "linear-gradient(135deg, #7b1fa2, #4a148c)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 16,
    textAlign: "center",
    boxShadow: hovered
      ? "0 4px 12px rgba(106, 27, 154, 0.3)"
      : "0 2px 6px rgba(0,0,0,0.1)",
    transform: hovered ? "translateY(-2px)" : "translateY(0)",
    transition: "all 0.25s ease-in-out",
  };

  if (!user)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          color: "#6a1b9a",
          fontWeight: 600,
          fontSize: "1.2rem",
        }}
      >
        ⏳ Inapakia dashibodi ya admin...
      </div>
    );

  return (
    <BucketProvider>
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          minHeight: "100vh",
          fontFamily: "Inter, Roboto, Segoe UI, sans-serif",
          background: "linear-gradient(135deg, #f8f6fb, #fafafa)",
        }}
      >
        {/* Sidebar Navigation */}
        <nav
          style={{
            width: isMobile ? "100%" : 260,
            background: "linear-gradient(135deg, #ede7f6, #f3e5f5)",
            borderRight: isMobile ? "none" : "1px solid #e0ddee",
            borderBottom: isMobile ? "1px solid #e0ddee" : "none",
            padding: 20,
            display: "flex",
            flexDirection: isMobile ? "row" : "column",
            alignItems: isMobile ? "center" : "flex-start",
            justifyContent: "space-between",
            gap: 10,
            overflowX: isMobile ? "auto" : "visible",
          }}
        >
          <div style={{ width: "100%" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                color: "#4a148c",
                fontWeight: 800,
                textAlign: isMobile ? "center" : "left",
                marginBottom: 10,
              }}
            >
              🧭 Admin Panel
            </h2>
            <p
              style={{
                color: "#4a148c",
                fontWeight: 600,
                textAlign: isMobile ? "center" : "left",
                marginBottom: 14,
              }}
            >
              👤 {user.full_name}
            </p>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "row" : "column",
                gap: 8,
                flexWrap: isMobile ? "wrap" : "nowrap",
              }}
            >
              {tabs.map((tab) => (
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
                    background:
                      activeTab === tab.id
                        ? "#6a1b9a"
                        : "rgba(155, 89, 182, 0.1)",
                    color: activeTab === tab.id ? "#fff" : "#4a148c",
                    flex: isMobile ? "1 1 auto" : undefined,
                    transition: "all 0.25s ease-in-out",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
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
        </nav>

        {/* Main Content Area */}
        <main
          style={{
            flex: 1,
            padding: isMobile ? 16 : 32,
            background: "#fff",
            borderTopLeftRadius: 24,
            borderBottomLeftRadius: 24,
            margin: isMobile ? 0 : "20px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            overflowY: "auto",
          }}
        >
          {tabs.find((tab) => tab.id === activeTab)?.component}
        </main>
      </div>
    </BucketProvider>
  );
}
