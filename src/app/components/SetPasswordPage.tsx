"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const userId = params.get("user_id");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [readyAt, setReadyAt] = useState<Date | null>(null);
  const [readyString, setReadyString] = useState("");
  const [nowString, setNowString] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [message, setMessage] = useState("");
  const [canProceed, setCanProceed] = useState(false);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;

      const { data } = await supabase
        .from("users")
        .select("email, metadata")
        .eq("id", userId)
        .single();

      if (!data?.email) {
        setMessage("❌ Mtumiaji hajapatikana.");
        return;
      }

      setEmail(data.email);
      const resetStatus = data.metadata?.reset_status || "";
      const readyTime = data.metadata?.password_reset_ready_at;
      setStatus(resetStatus);

      const now = new Date();
      setNowString(formatEastAfricaTime(now));

      if (readyTime) {
        const parsedTime = new Date(readyTime);
        setReadyAt(parsedTime);
        setReadyString(formatEastAfricaTime(parsedTime));

        const timePassed = parsedTime.getTime() <= now.getTime();

        if (resetStatus === "ready_for_user" && timePassed) {
          setCanProceed(true);
          setMessage("✅ Sasa unaweza kuweka nenosiri.");
        } else if (resetStatus === "ready_for_user" && !timePassed) {
          startCountdown(parsedTime);
          setMessage("⏳ Subiri lisaa limoja kabla ya kuweka nenosiri.");
        } else {
          setMessage("🚫 Akaunti yako haiko kwenye hatua ya kuweka nenosiri.");
        }
      } else {
        if (resetStatus === "ready_for_user") {
          setCanProceed(true);
          setMessage("✅ Sasa unaweza kuweka nenosiri.");
        } else {
          setMessage("🚫 Hakuna muda wa kujiandaa uliohifadhiwa.");
        }
      }
    };

    fetchUser();
  }, [userId]);

  const formatEastAfricaTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
      timeZone: "Africa/Nairobi",
    };
    return new Intl.DateTimeFormat("sw-TZ", options).format(date);
  };

  const startCountdown = (targetTime: Date) => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetTime.getTime() - now;

      if (distance <= 0) {
        clearInterval(interval);
        setCountdown("");
        setCanProceed(true);
        setMessage("✅ Sasa unaweza kuweka nenosiri.");
        return;
      }

      const minutes = Math.floor((distance / (1000 * 60)) % 60);
      const seconds = Math.floor((distance / 1000) % 60);
      setCountdown(`Dakika ${minutes}, Sekunde ${seconds}`);
    }, 1000);
  };

  const handleSubmit = async () => {
    if (!password1 || !password2 || password1 !== password2) {
      setMessage("❌ Nenosiri hayafanani.");
      return;
    }

    const { data: authData } = await supabase.auth.admin.listUsers();
    const authUser = authData?.users?.find((u) => u.email === email);
    if (!authUser) {
      setMessage("❌ Mtumiaji wa Auth hajapatikana.");
      return;
    }

    try {
      const res = await fetch("/api/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: authUser.id, password: password1 }),
      });

      const result = await res.json();
      console.log("API response:", result);

      if (!res.ok) {
        setMessage(
          `❌ Imeshindikana kuweka nenosiri: ${result.error || "Unknown error"}`
        );
        return;
      }

      const oneYearLater = new Date();
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

      const { error: dbError } = await supabase
        .from("users")
        .update({
          metadata: {
            reset_status: "wait_before_login",
            password_reset_ready_at: null,
          },
          active_until: oneYearLater.toISOString(),
        })
        .eq("id", userId);

      if (dbError) {
        setMessage(
          "✅ Nenosiri limebadilishwa, lakini metadata haikuweza kusasishwa."
        );
      } else {
        setMessage("✅ Nenosiri limebadilishwa. Login tena baada ya lisaa limoja.");
      }

      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      console.error("Submit error:", err);
      setMessage("❌ Hitilafu isiyotarajiwa imetokea.");
    }
  };

  return (
    <div style={wrapperStyle}>
      <h2 style={headingStyle}>🔑 Weka Nenosiri Jipya</h2>

      <p style={debugStyle}>
        Status: {status} <br />
        Muda wa kujiandaa: {readyString || "—"} <br />
        Sasa ni: {nowString} <br />
        Ruhusa ya kuendelea: {canProceed ? "✅ Ndiyo" : "❌ Hapana"}
      </p>

      {countdown && (
        <div style={{ marginBottom: 12, fontWeight: 700, color: "#4a148c" }}>
          ⏳ {countdown}
        </div>
      )}

      {canProceed ? (
        <>
          <input
            type="password"
            placeholder="Nenosiri Jipya"
            value={password1}
            onChange={(e) => setPassword1(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Rudia Nenosiri"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            style={inputStyle}
          />
          <button onClick={handleSubmit} style={btnStyle}>
            ✅ Weka Nenosiri
          </button>
        </>
      ) : (
        <div style={{ marginTop: 12, fontWeight: 700 }}>{message}</div>
      )}
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  padding: 24,
  maxWidth: 400,
  margin: "0 auto",
  fontFamily: "Segoe UI, Roboto, sans-serif",
};

const headingStyle: React.CSSProperties = {
  color: "#6a1b9a",
  fontWeight: 900,
  marginBottom: 16,
};

const inputStyle: React.CSSProperties = {
  padding: "10px",
  marginBottom: "12px",
  width: "100%",
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: "1rem",
};

const btnStyle: React.CSSProperties = {
  padding: "10px 16px",
  background: "#6a1b9a",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  cursor: "pointer",
};

const debugStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  color: "#555",
  marginBottom: 12,
};
