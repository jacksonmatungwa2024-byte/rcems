"use client";

import { useState, ChangeEvent } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

const SajiliMuumini: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [majina, setMajina] = useState("");
  const [simu, setSimu] = useState("");
  const [jinsi, setJinsi] = useState<"me" | "ke">("me");
  const [umbo, setUmbo] = useState<"mtoto" | "mtu mzima">("mtoto");
  const [bahasha, setBahasha] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [overlay, setOverlay] = useState("");

  const handleOpenForm = () => {
    setShowForm(true);
    setMessage("");
    setOverlay("");
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setMessage("");
    setOverlay("");
  };

  const handleSajili = async () => {
    if (!majina.trim()) {
      setMessage("❌ Tafadhali jaza majina.");
      return;
    }
    setLoading(true);

    try {
      // Step 1: Insert without muumini_namba
      const { data, error } = await supabase
        .from("watu")
        .insert([
          {
            majina,
            simu: simu || null,
            jinsi,
            umbo,
            bahasha: bahasha || null,
          },
        ])
        .select();

      if (error) {
        setMessage("❌ Hitilafu: " + error.message);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setMessage("❌ Hakuna data iliyoingizwa.");
        setLoading(false);
        return;
      }

      const insertedId = data[0].id;
      const muuminiNamba = `RHEMA${("000" + insertedId).slice(-3)}`;

      // Step 2: Check if muumini_namba already exists
      const { data: existing } = await supabase
        .from("watu")
        .select("id")
        .eq("muumini_namba", muuminiNamba);

      if (existing && existing.length > 0) {
        setMessage(
          `⚠️ Namba ${muuminiNamba} tayari ipo. Tafadhali jaribu tena.`
        );
        setLoading(false);
        return;
      }

      // Step 3: Update with unique muumini_namba
      const { error: updateError } = await supabase
        .from("watu")
        .update({ muumini_namba: muuminiNamba })
        .eq("id", insertedId);

      if (updateError) {
        setMessage("❌ Hitilafu wakati wa update: " + updateError.message);
      } else {
        setMessage(
          `✅ ${majina} amesajiliwa kama muumini mpya.\nNamba yake ni ${muuminiNamba}`
        );
        setOverlay(
          `“Umeandikwa katika kumbukumbu ya walioitwa kwa jina la Bwana.” – RHEMA Legacy Registry`
        );
      }

      setShowForm(false);
      setMajina("");
      setSimu("");
      setJinsi("me");
      setUmbo("mtoto");
      setBahasha("");
    } catch (error) {
      setMessage("❌ Hitilafu isiyotarajiwa: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Inline styles
  const styles = {
    wrapper: {
      maxWidth: 400,
      margin: "20px auto",
      padding: 16,
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: "#f8f9fa",
      borderRadius: 8,
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      color: "#212529",
    },
    button: {
      padding: "12px 20px",
      fontSize: 16,
      borderRadius: 6,
      border: "none",
      cursor: "pointer",
      margin: "10px 0",
      width: "100%",
      fontWeight: "600",
    },
    openButton: {
      backgroundColor: "#007bff",
      color: "#fff",
      border: "none",
    },
    cancelButton: {
      backgroundColor: "#6c757d",
      color: "#fff",
      border: "none",
      marginLeft: 10,
      flex: 1,
    },
    submitButton: {
      backgroundColor: "#28a745",
      color: "#fff",
      border: "none",
      flex: 2,
    },
    formContainer: {
      display: "flex",
      flexDirection: "column" as const,
      gap: 12,
      padding: 16,
      backgroundColor: "#fff",
      borderRadius: 8,
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    },
    label: {
      fontWeight: 600,
      marginBottom: 4,
      fontSize: 14,
      color: "#343a40",
    },
    input: {
      padding: "10px 12px",
      fontSize: 16,
      borderRadius: 6,
      border: "1.5px solid #ced4da",
      width: "100%",
      boxSizing: "border-box" as const,
      outlineColor: "#007bff",
      transition: "border-color 0.2s ease-in-out",
    },
    select: {
      padding: "10px 12px",
      fontSize: 16,
      borderRadius: 6,
      border: "1.5px solid #ced4da",
      width: "100%",
      boxSizing: "border-box" as const,
      outlineColor: "#007bff",
      transition: "border-color 0.2s ease-in-out",
      backgroundColor: "#fff",
      appearance: "none" as const,
    },
    buttonRow: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 12,
      gap: 10,
    },
    message: {
      marginTop: 16,
      fontWeight: 600,
      whiteSpace: "pre-line" as const,
      color: message.startsWith("❌") ? "#dc3545" : "#28a745",
      textAlign: "center" as const,
    },
    spiritualOverlay: {
      marginTop: 8,
      fontStyle: "italic",
      fontSize: 14,
      color: "#6c757d",
      textAlign: "center" as const,
    },
  };

  return (
    <div style={styles.wrapper}>
      {!showForm && (
        <button
          onClick={handleOpenForm}
          style={{ ...styles.button, ...styles.openButton }}
          aria-label="Fungua fomu ya usajili wa muumini"
        >
          Sajili Muumini
        </button>
      )}

      {showForm && (
        <form
          style={styles.formContainer}
          onSubmit={(e) => {
            e.preventDefault();
            handleSajili();
          }}
          noValidate
        >
          <h3 style={{ textAlign: "center", marginBottom: 16 }}>
            Jaza taarifa za Muumini
          </h3>

          <label htmlFor="majina" style={styles.label}>
            Majina:
          </label>
          <input
            id="majina"
            type="text"
            value={majina}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setMajina(e.target.value)
            }
            style={styles.input}
            required
            placeholder="Ingiza majina kamili"
            autoComplete="name"
          />

          <label htmlFor="simu" style={styles.label}>
            Namba ya simu (optional):
          </label>
          <input
            id="simu"
            type="tel"
            value={simu}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSimu(e.target.value)}
            style={styles.input}
            placeholder="07xxxxxxxx"
            autoComplete="tel"
          />

          <label htmlFor="jinsi" style={styles.label}>
            Jinsi:
          </label>
          <select
            id="jinsi"
            value={jinsi}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setJinsi(e.target.value as "me" | "ke")
            }
            style={styles.select}
          >
            <option value="me">Me</option>
            <option value="ke">Ke</option>
          </select>

          <label htmlFor="umbo" style={styles.label}>
            Umbo (Mtoto/Mtu Mzima):
          </label>
          <select
            id="umbo"
            value={umbo}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setUmbo(e.target.value as "mtoto" | "mtu mzima")
            }
            style={styles.select}
          >
            <option value="mtoto">Mtoto</option>
            <option value="mtu mzima">Mtu Mzima</option>
          </select>

          <label htmlFor="bahasha" style={styles.label}>
            No ya Bahasha ya Ujenzi (optional):
          </label>
          <input
            id="bahasha"
            type="text"
            value={bahasha}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setBahasha(e.target.value)}
            style={styles.input}
            placeholder="Namba ya bahasha"
            autoComplete="off"
          />

          <div style={styles.buttonRow}>
            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.button, ...styles.submitButton }}
            >
              {loading ? "Inashughulikiwa..." : "Sajili"}
            </button>
            <button
              type="button"
              onClick={handleCloseForm}
              style={{ ...styles.button, ...styles.cancelButton }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Messages */}
      {message && <p style={styles.message}>{message}</p>}
      {overlay && <p style={styles.spiritualOverlay}>{overlay}</p>}
    </div>
  );
};

export default SajiliMuumini;
