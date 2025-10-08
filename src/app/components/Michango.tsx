"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { ReceiptPDF } from "./ReceiptPDF"
import styles from "../components/Michango.module.css"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Michango() {
  const [activeTab, setActiveTab] = useState("form")
  const [muuminiNamba, setMuuminiNamba] = useState("")
  const [muuminiInfo, setMuuminiInfo] = useState<any>(null)
  const [showExcelForm, setShowExcelForm] = useState(false)
  const [form, setForm] = useState({
    majina: "",
    simu: "",
    mahali: "",
    mchango_type: "",
    target: "",
    kiasi_pangwa: 50000,
    kiasi_lipwa: 0,
    kiasi_punguzo: 0
  })
  const [message, setMessage] = useState("")
  const [savedData, setSavedData] = useState<any>(null)
  const [pendingList, setPendingList] = useState<any[]>([])
  const [finishedList, setFinishedList] = useState<any[]>([])

  useEffect(() => {
    if (activeTab === "recorded") {
      fetchRecorded()
    }
  }, [activeTab])

  async function fetchMuumini() {
    const { data, error } = await supabase
      .from("watu")
      .select("majina, simu")
      .eq("muumini_namba", muuminiNamba)
      .single()

    if (error || !data) {
      setMuuminiInfo(null)
      setShowExcelForm(true)
    } else {
      setMuuminiInfo(data)
      setForm({ ...form, majina: data.majina, simu: data.simu })
      setShowExcelForm(false)
    }
  }

  async function fetchRecorded() {
    const { data: pending } = await supabase
      .from("michango_entries")
      .select("*")
      .gt("kiasi_bado", 0)

    const { data: finished } = await supabase
      .from("michango_entries")
      .select("*")
      .eq("kiasi_bado", 0)

    setPendingList(pending ?? [])
    setFinishedList(finished ?? [])
  }

  function calculateRemaining() {
    const { kiasi_pangwa, kiasi_lipwa, kiasi_punguzo } = form
    return Math.max(0, kiasi_pangwa - (kiasi_lipwa + kiasi_punguzo))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const kiasi_bado = calculateRemaining()

    const { data, error } = await supabase
      .from("michango_entries")
      .insert({
        ...form,
        kiasi_bado,
        muumini_namba: muuminiNamba,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      setMessage("Hitilafu wakati wa kuhifadhi mchango")
    } else {
      setMessage("✅ Mchango umehifadhiwa. Risiti inatengenezwa...")
      setSavedData({ ...form, kiasi_bado, muumini_namba: muuminiNamba })
    }
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>🙏 Michango ya Waumini</h2>

      <div className={styles.tabBar}>
        <button onClick={() => setActiveTab("form")} className={activeTab === "form" ? styles.active : styles.tab}>💳 Fomu ya Mchango</button>
        <button onClick={() => setActiveTab("recorded")} className={activeTab === "recorded" ? styles.active : styles.tab}>📋 Recorded</button>
      </div>

      <div className={styles.panel}>
        {activeTab === "form" && (
          <>
            <input
              placeholder="Ingiza Muumini Namba"
              value={muuminiNamba}
              onChange={e => setMuuminiNamba(e.target.value)}
              onBlur={fetchMuumini}
              className={styles.input}
            />

            {muuminiInfo && (
              <div className={styles.infoBox}>
                <p><strong>Majina:</strong> {muuminiInfo.majina}</p>
                <p><strong>Simu:</strong> {muuminiInfo.simu}</p>
              </div>
            )}

            {showExcelForm && (
              <form onSubmit={handleSubmit} className={styles.form}>
                <input placeholder="Majina ya Mchangaji" value={form.majina} onChange={e => setForm({ ...form, majina: e.target.value })} required />
                <input placeholder="Mahali Anapotokea" value={form.mahali} onChange={e => setForm({ ...form, mahali: e.target.value })} />
                <input placeholder="Namba ya Simu" value={form.simu} onChange={e => setForm({ ...form, simu: e.target.value })} />

                <select value={form.mchango_type} onChange={e => setForm({ ...form, mchango_type: e.target.value })} required>
                  <option value="">Chagua Aina ya Mchango</option>
                  <option value="Harusi">Harusi</option>
                  <option value="Sherehe">Sherehe</option>
                  <option value="Zawadi">Zawadi</option>
                  <option value="Mengineyo">Mengineyo</option>
                </select>

                <input placeholder="Ni ya nani?" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} />

                <input
                  type="number"
                  placeholder="Kiasi kilichopangwa"
                  value={form.kiasi_pangwa || ""}
                  onChange={e => setForm({ ...form, kiasi_pangwa: parseFloat(e.target.value) || 0 })}
                  required
                />
                <input
                  type="number"
                  placeholder="Kiasi kilicholipwa"
                  value={form.kiasi_lipwa || ""}
                  onChange={e => setForm({ ...form, kiasi_lipwa: parseFloat(e.target.value) || 0 })}
                  required
                />
                <input
                  type="number"
                  placeholder="Kiasi kilichopunguzwa"
                  value={form.kiasi_punguzo || ""}
                  onChange={e => setForm({ ...form, kiasi_punguzo: parseFloat(e.target.value) || 0 })}
                />

                <p><strong>Bado:</strong> {calculateRemaining()} TZS</p>

                <button type="submit">📤 Hifadhi na Chapisha Risiti</button>
                {message && <p className={styles.message}>{message}</p>}

                {savedData && (
                  <div className={styles.receiptPreview}>
                    <PDFDownloadLink
                      document={<ReceiptPDF data={savedData} />}
                      fileName={`Risiti_${savedData.majina}.pdf`}
                    >
                      {({ loading }) => loading ? "⏳ Inatengeneza risiti..." : "📄 Pakua Risiti ya PDF"}
                    </PDFDownloadLink>
                  </div>
                )}
              </form>
            )}
          </>
        )}

        {activeTab === "recorded" && (
          <>
            <h3>⏳ Pending Michango</h3>
            {pendingList.map(m => (
              <div key={m.id} className={styles.card}>
                <p><strong>{m.majina}</strong> - Bado: {m.kiasi_bado} TZS</p>
              </div>
            ))}

            <h3>✅ Finished Michango</h3>
            {finishedList.map(m => (
              <div key={m.id} className={styles.card}>
                <p><strong>{m.majina}</strong> - Imekamilika</p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
