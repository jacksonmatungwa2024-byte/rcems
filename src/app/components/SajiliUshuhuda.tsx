"use client"

import React, { useEffect, useState } from "react"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

type WatuRow = {
  id?: number
  muumini_id?: number
  muumini_namba?: string
  majina?: string
  tarehe?: string
  [key: string]: any
}

type Props = {
  setActiveTab?: (tab: string) => void
}

const container: React.CSSProperties = {
  maxWidth: 980,
  margin: "18px auto",
  padding: 16,
  fontFamily: '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial',
  background: "linear-gradient(180deg, #fff, #fbf8ff)",
  borderRadius: 12,
  boxShadow: "0 6px 24px rgba(105,30,120,0.06)",
  color: "#212121"
}
const header: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }
const h3Style: React.CSSProperties = { margin: 0, color: "#4a148c", fontSize: 18 }
const searchGroup: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }
const input: React.CSSProperties = { padding: "10px 12px", borderRadius: 8, border: "1px solid #e6dff2", background: "#fff", fontSize: 15, minWidth: 160, flex: "1 1 200px" }
const textarea: React.CSSProperties = { width: "100%", minHeight: 88, padding: "10px 12px", borderRadius: 8, border: "1px solid #e6dff2", background: "#fff", resize: "vertical", fontSize: 15 }
const smallBtn: React.CSSProperties = { padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: 700 }
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 15, marginTop: 8 }
const theadTh: React.CSSProperties = { textAlign: "left", padding: "10px 8px", borderBottom: "2px solid #f0e9f6", background: "#faf7fe", color: "#4b2a5a" }
const tdStyle: React.CSSProperties = { padding: "10px 8px", borderBottom: "1px solid #f4eef8", verticalAlign: "middle", color: "#333" }
const panel: React.CSSProperties = { marginTop: 14, padding: 14, borderRadius: 10, background: "linear-gradient(180deg,#f9f6ff,#ffffff)", border: "1px solid #f0e7fa" }
const labelStyle: React.CSSProperties = { display: "block", fontWeight: 700, marginTop: 10, color: "#3c1363" }
const highlight: React.CSSProperties = { fontWeight: 700, color: "#3c1363" }
const actionsStyle: React.CSSProperties = { display: "flex", gap: 10, marginTop: 12, alignItems: "center", flexWrap: "wrap" }
const buttonPrimary: React.CSSProperties = { background: "#6a1b9a", color: "#fff", border: "none", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700 }
const buttonOutline: React.CSSProperties = { background: "#fff", color: "#4a148c", border: "1px solid #e0d7ef", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700 }
const messageStyle: React.CSSProperties = { marginTop: 14, padding: "10px 12px", borderRadius: 8, background: "#fff8e6", color: "#4a148c", fontWeight: 700 }
const emptyStyle: React.CSSProperties = { padding: 12, color: "#666" }

export default function SajiliUshuhuda({ setActiveTab }: Props) {
  const [searchNamba, setSearchNamba] = useState<string>("")
  const [searchMajina, setSearchMajina] = useState<string>("")
  const [results, setResults] = useState<WatuRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [selected, setSelected] = useState<WatuRow | null>(null)

  const [tarehe, setTarehe] = useState<string>(new Date().toISOString().split("T")[0])
  const [jinaMshuhudiaji, setJinaMshuhudiaji] = useState<string>("")
  const [tatizo, setTatizo] = useState<string>("")
  const [ushuhuda, setUshuhuda] = useState<string>("")
  const [message, setMessage] = useState<string>("")
  const [submitting, setSubmitting] = useState<boolean>(false)

  useEffect(() => {
    const id = setTimeout(() => fetchWatu(), 300)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchNamba, searchMajina])

  async function fetchWatu() {
    setLoading(true)
    try {
      let query = supabase.from("watu").select("*").limit(200)
      if (searchNamba && searchMajina) {
        query = query.or(`muumini_namba.ilike.%${searchNamba}%,majina.ilike.%${searchMajina}%`)
      } else if (searchNamba) {
        query = query.ilike("muumini_namba", `%${searchNamba}%`)
      } else if (searchMajina) {
        query = query.ilike("majina", `%${searchMajina}%`)
      }
      const { data, error } = await query
      if (error) {
        console.error("Fetch watu error:", error)
        setMessage("Hitilafu wakati wa kutafuta muumini")
        setResults([])
      } else {
        setResults((data as WatuRow[]) || [])
        setMessage("")
      }
    } catch (err) {
      console.error(err)
      setMessage("Hitilafu isiyotarajiwa")
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function chooseMuumini(m: WatuRow) {
    setSelected(m)
    setMessage("")
  }

  async function handleHifadhiUshuhuda() {
    if (!selected) {
      setMessage("Chagua muumini kwanza")
      return
    }
    if (!jinaMshuhudiaji.trim()) {
      setMessage("Andika jina la mshuhudiaji")
      return
    }
    if (!ushuhuda.trim()) {
      setMessage("Andika ushuhuda kabla ya kuhifadhi")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        muumini_id: (selected.id ?? selected.muumini_id) ?? null,
        muumini_namba: selected.muumini_namba ?? null,
        majina: selected.majina ?? null,
        tarehe,
        jina_mshuhudiaji: jinaMshuhudiaji.trim(),
        tatizo: tatizo.trim() || null,
        ushuhuda: ushuhuda.trim(),
        inserted_at: new Date().toISOString()
      }

      console.log("Ushuhuda payload:", payload)

      const { data, error } = await supabase.from("ushuhuda").insert([payload]).select().single()

      if (error && Object.keys(error).length) {
        console.error("Insert ushuhuda error:", error)
        setMessage("Hitilafu wakati wa kuhifadhi ushuhuda: " + (error.message || "unknown"))
      } else if (!data) {
        console.error("Insert ushuhuda returned no data")
        setMessage("Hitilafu: hakuna rekodi iliyohifadhiwa. Angalia RLS na schema.")
      } else {
        setMessage("✅ Ushuhuda umehifadhiwa")
        setTarehe(new Date().toISOString().split("T")[0])
        setJinaMshuhudiaji("")
        setTatizo("")
        setUshuhuda("")
      }
    } catch (err) {
      console.error("Exception saving ushuhuda:", err)
      setMessage("Hitilafu isiyotarajiwa wakati wa kuhifadhi")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={container}>
      <div style={header}>
        <h3 style={h3Style}>Sajili Ushuhuda</h3>
        <div>
          <button
            style={buttonOutline}
            onClick={() => setActiveTab && setActiveTab("home")}
            type="button"
          >
            🔙 Home
          </button>
        </div>
      </div>

      <div style={searchGroup}>
        <input
          style={input}
          placeholder="Tafuta kwa Muumini Namba"
          value={searchNamba}
          onChange={(e) => setSearchNamba(e.target.value.replace(/\D/g, ""))}
          aria-label="Tafuta kwa Muumini Namba"
        />
        <input
          style={input}
          placeholder="Tafuta kwa Majina"
          value={searchMajina}
          onChange={(e) => setSearchMajina(e.target.value)}
          aria-label="Tafuta kwa Majina"
        />
        <button style={smallBtn} onClick={fetchWatu} disabled={loading} type="button">
          {loading ? "Inapakia..." : "Tafuta"}
        </button>
      </div>

      <div style={{ marginTop: 8 }}>
        {results.length === 0 ? (
          <div style={emptyStyle}>Hakuna muumini waliopatikana</div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={theadTh}>#</th>
                <th style={theadTh}>Namba</th>
                <th style={theadTh}>Majina</th>
                <th style={theadTh}>Chagua</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.id ?? r.muumini_id ?? i} style={{ background: i % 2 ? "rgba(106,27,154,0.03)" : "transparent" }}>
                  <td style={tdStyle}>{i + 1}</td>
                  <td style={tdStyle}>{r.muumini_namba}</td>
                  <td style={tdStyle}>{r.majina}</td>
                  <td style={tdStyle}>
                    <button style={smallBtn} onClick={() => chooseMuumini(r)} type="button">Chagua</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div style={panel}>
          <h4 style={{ margin: 0 }}>
            Ushuhuda kwa: <span style={highlight}>{selected.majina} ({selected.muumini_namba})</span>
          </h4>

          <label style={labelStyle}>Tarehe ya Ushuhuda</label>
          <input style={input} type="date" value={tarehe} onChange={(e) => setTarehe(e.target.value)} />

          <label style={labelStyle}>Jina la Mshuhudiaji</label>
          <input style={input} value={jinaMshuhudiaji} onChange={(e) => setJinaMshuhudiaji(e.target.value)} placeholder="Jina la mshuhudiaji" />

          <label style={labelStyle}>Tatizo au Changamoto</label>
          <textarea style={textarea} value={tatizo} onChange={(e) => setTatizo(e.target.value)} placeholder="Tatizo/changamoto (optional)" />

          <label style={labelStyle}>Ushuhuda</label>
          <textarea style={textarea} value={ushuhuda} onChange={(e) => setUshuhuda(e.target.value)} placeholder="Andika ushuhuda hapa" />

          <div style={actionsStyle}>
            <button style={{ ...buttonPrimary, minWidth: 180 }} onClick={handleHifadhiUshuhuda} disabled={submitting} type="button">
              {submitting ? "Inahifadhi..." : "HIFADHI USHUHUDA"}
            </button>
            <button style={{ ...buttonOutline, minWidth: 120 }} onClick={() => setSelected(null)} type="button">Ghairi</button>
          </div>
        </div>
      )}

      {message && <div style={messageStyle}>{message}</div>}
    </div>
  )
}
