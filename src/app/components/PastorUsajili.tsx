"use client"

import React, { useEffect, useState } from "react"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import styles from "../components/PastorUsajili.module.css"

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

type WatuRow = {
  id: number
  majina: string
  simu?: string | null
  jinsi: string
  umbo: string
  bahasha?: string | null
  muumini_namba?: string | null
  created_at?: string | null
  [key: string]: any
}

type MahadhurioRow = {
  id: number
  muumini_id?: number | null
  muumini_namba?: string | null
  majina?: string | null
  aina?: string | null
  ibada?: string | null
  tarehe?: string | null
  created_at?: string | null
  [key: string]: any
}

type ApprovalRow = {
  id: number
  muumini_id: string
  status?: string
  tarehe: string
  created_at?: string
  updated_at?: string
  [key: string]: any
}

type WokovuRow = {
  id: string
  muumini_id?: number | null
  muumini_namba?: string | null
  majina?: string | null
  tarehe?: string | null
  ushuhuda?: string | null
  sajili_na?: string | null
  created_at?: string | null
  [key: string]: any
}

export default function PastorUsajili() {
  const [active, setActive] = useState<"waliosajiliwa" | "mahadhurio" | "wachanga">("waliosajiliwa")
  const [wachangaSub, setWachangaSub] = useState<"approval" | "waliokoka">("approval")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const REFRESH_MS = 2 * 60 * 1000

  // watu
  const [watu, setWatu] = useState<WatuRow[]>([])
  const [watuQuery, setWatuQuery] = useState("")
  const [watuPage, setWatuPage] = useState(1)
  const WATU_PAGE_SIZE = 50

  // mahadhurio
  const [mahadhurio, setMahadhurio] = useState<MahadhurioRow[]>([])
  const [mhFilterRange, setMhFilterRange] = useState<"siku" | "wiki" | "mwezi">("siku")
  const [mhDate, setMhDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [mhPage, setMhPage] = useState(1)
  const MH_PAGE_SIZE = 50

  // approvals & wokovu
  const [approvals, setApprovals] = useState<ApprovalRow[]>([])
  const [approvalsPage, setApprovalsPage] = useState(1)
  const APPROVALS_PAGE_SIZE = 50

  const [wokovu, setWokovu] = useState<WokovuRow[]>([])
  const [wokovuPage, setWokovuPage] = useState(1)
  const WOKOVU_PAGE_SIZE = 50

  useEffect(() => {
    fetchWatu()
  }, [watuPage, watuQuery])

  useEffect(() => {
    fetchMahadhurio()
  }, [mhFilterRange, mhDate, mhPage])

  useEffect(() => {
    fetchApprovals()
    fetchWokovu()
  }, [approvalsPage, wokovuPage, wachangaSub])

  useEffect(() => {
    let mounted = true
    if (!autoRefresh) return
    const t = window.setInterval(() => {
      if (!mounted) return
      if (active === "waliosajiliwa") fetchWatu()
      if (active === "mahadhurio") fetchMahadhurio()
      if (active === "wachanga") {
        fetchApprovals()
        fetchWokovu()
      }
    }, REFRESH_MS)
    return () => {
      mounted = false
      clearInterval(t)
    }
  }, [autoRefresh, active, mhFilterRange, mhDate, watuPage, mhPage, approvalsPage, wokovuPage])

  /* ---------- fetch functions ---------- */

  async function fetchWatu() {
    setLoading(true)
    setError(null)
    try {
      const offset = (watuPage - 1) * WATU_PAGE_SIZE
      let q = supabase.from("watu").select("*").order("created_at", { ascending: false }).range(offset, offset + WATU_PAGE_SIZE - 1)
      if (watuQuery && watuQuery.trim()) {
        const like = `%${watuQuery.trim()}%`
        q = supabase
          .from("watu")
          .select("*")
          .or(`majina.ilike.${like},muumini_namba.ilike.${like},simu.ilike.${like},bahasha.ilike.${like}`)
          .order("created_at", { ascending: false })
          .range(offset, offset + WATU_PAGE_SIZE - 1)
      }
      const { data, error } = await q
      if (error) throw error
      setWatu((data as WatuRow[]) ?? [])
    } catch (err: any) {
      console.error("fetchWatu error", err)
      setError(String(err?.message ?? err))
      setWatu([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchMahadhurio() {
    setLoading(true)
    setError(null)
    try {
      const offset = (mhPage - 1) * MH_PAGE_SIZE
      const baseDate = new Date(mhDate)
      let start = new Date(baseDate)
      let end = new Date(baseDate)
      if (mhFilterRange === "siku") {
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
      } else if (mhFilterRange === "wiki") {
        const day = baseDate.getDay()
        const diffToMonday = (day + 6) % 7
        start = new Date(baseDate)
        start.setDate(baseDate.getDate() - diffToMonday)
        start.setHours(0, 0, 0, 0)
        end = new Date(start)
        end.setDate(start.getDate() + 6)
        end.setHours(23, 59, 59, 999)
      } else {
        start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
        end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0)
        end.setHours(23, 59, 59, 999)
      }

      const startISO = start.toISOString().split("T")[0]
      const endISO = end.toISOString().split("T")[0]

      const { data, error } = await supabase
        .from("mahadhurio")
        .select("*")
        .gte("tarehe", startISO)
        .lte("tarehe", endISO)
        .order("tarehe", { ascending: false })
        .range(offset, offset + MH_PAGE_SIZE - 1)

      if (error) throw error
      setMahadhurio((data as MahadhurioRow[]) ?? [])
    } catch (err: any) {
      console.error("fetchMahadhurio error", err)
      setError(String(err?.message ?? err))
      setMahadhurio([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchApprovals() {
    setLoading(true)
    setError(null)
    try {
      const offset = (approvalsPage - 1) * APPROVALS_PAGE_SIZE
     const { data, error } = await supabase
  .from("mafunzo")
  .select("*, wokovu(majina)")

        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .range(offset, offset + APPROVALS_PAGE_SIZE - 1)
      if (error) throw error
      setApprovals((data as ApprovalRow[]) ?? [])
    } catch (err: any) {
      console.error("fetchApprovals error", err)
      setError(String(err?.message ?? err))
      setApprovals([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchWokovu() {
    setLoading(true)
    setError(null)
    try {
      const offset = (wokovuPage - 1) * WOKOVU_PAGE_SIZE
      const { data, error } = await supabase
        .from("wokovu")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + WOKOVU_PAGE_SIZE - 1)
      if (error) throw error
      setWokovu((data as WokovuRow[]) ?? [])
    } catch (err: any) {
      console.error("fetchWokovu error", err)
      setError(String(err?.message ?? err))
      setWokovu([])
    } finally {
      setLoading(false)
    }
  }

  /* ---------- actions ---------- */

  async function approveAndSubmit(row: ApprovalRow) {
    setLoading(true)
    setError(null)
    try {
      const payload: Partial<WatuRow> = {
        majina: (row as any).majina ?? `Muumini ${row.muumini_id}`,
        simu: (row as any).simu ?? null,
        jinsi: (row as any).jinsi ?? "m",
        umbo: (row as any).umbo ?? "N/A",
        bahasha: (row as any).bahasha ?? null,
        muumini_namba: (row as any).muumini_namba ?? row.muumini_id ?? null,
        created_at: row.tarehe ?? new Date().toISOString().slice(0, 10),
      }

      const insertRes = await supabase.from("watu").insert([payload]).select().single()
      if (insertRes.error) throw insertRes.error

      const updateRes = await supabase
        .from("approval")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", row.id)
      if (updateRes.error) throw updateRes.error

      fetchApprovals()
      fetchWatu()
    } catch (err: any) {
      console.error("approveAndSubmit error", err)
      setError(String(err?.message ?? err))
    } finally {
      setLoading(false)
    }
  }

  async function rejectApproval(row: ApprovalRow, reason = "Rejected by pastor") {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase
        .from("approval")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", row.id)
      if (error) throw error
      fetchApprovals()
    } catch (err: any) {
      console.error("rejectApproval error", err)
      setError(String(err?.message ?? err))
    } finally {
      setLoading(false)
    }
  }

  /* ---------- helpers ---------- */

  function downloadCSV<T extends Record<string, any>>(rows: T[], filename = "export.csv") {
  if (!rows || rows.length === 0) {
    alert("Hakuna data ya kupakua")
    return
  }

  const keys = Array.from(rows.reduce((s, r) => {
    Object.keys(r).forEach(k => s.add(k))
    return s
  }, new Set<string>()))

  const csv = [
    keys.join(","),
    ...rows.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))
  ].join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}


  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Usajili</h1>
          <p className={styles.subtitle}>Manage registrations, mahadhurio and approvals</p>
        </div>

        <div className={styles.headerActions}>
          <label className={styles.label}>Auto-refresh</label>
          <input className={styles.checkbox} type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
        </div>
      </header>

      <nav className={styles.tabs}>
        <button className={active === "waliosajiliwa" ? styles.tabActive : styles.tab} onClick={() => setActive("waliosajiliwa")}>Waliosajiliwa</button>
        <button className={active === "mahadhurio" ? styles.tabActive : styles.tab} onClick={() => setActive("mahadhurio")}>Mahadhurio</button>
        <button className={active === "wachanga" ? styles.tabActive : styles.tab} onClick={() => setActive("wachanga")}>Wachanga</button>
      </nav>

      {error && <div className={styles.error}>{error}</div>}

      {/* Waliosajiliwa */}
      {active === "waliosajiliwa" && (
        <section className={styles.panel}>
          <div className={styles.controls}>
            <input className={styles.input} placeholder="Tafuta majina, muumini_namba, simu..." value={watuQuery} onChange={(e) => { setWatuQuery(e.target.value); setWatuPage(1) }} />
            <button className={styles.primary} onClick={() => fetchWatu()}>Tafuta</button>
            <button className={styles.outline} onClick={() => downloadCSV(watu, `waliosajiliwa_page_${watuPage}.csv`)}>Pakua CSV</button>

            <div className={styles.pager}>
              <button className={styles.pagerBtn} onClick={() => { setWatuPage(p => Math.max(1, p - 1)); }}>Prev</button>
              <div className={styles.pagerInfo}>Page {watuPage}</div>
              <button className={styles.pagerBtn} onClick={() => { setWatuPage(p => p + 1); }}>Next</button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Majina</th>
                  <th>Simu</th>
                  <th>Jinsi</th>
                  <th>Umbo</th>
                  <th>Bahasha</th>
                  <th>Muumini Namba</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className={styles.cell}>Loading...</td></tr>
                ) : watu.length === 0 ? (
                  <tr><td colSpan={8} className={styles.cell}>Hakuna watumiaji</td></tr>
                ) : (
                  watu.map((u, i) => (
                    <tr key={u.id}>
                      <td className={styles.cell}>{(watuPage - 1) * WATU_PAGE_SIZE + i + 1}</td>
                      <td className={styles.cell}>{u.majina}</td>
                      <td className={styles.cell}>{u.simu ?? "—"}</td>
                      <td className={styles.cell}>{u.jinsi}</td>
                      <td className={styles.cell}>{u.umbo}</td>
                      <td className={styles.cell}>{u.bahasha ?? "—"}</td>
                      <td className={styles.cell}>{u.muumini_namba ?? "—"}</td>
                      <td className={styles.cell}>{u.created_at ? String(u.created_at).split("T")[0] : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Mahadhurio */}
      {active === "mahadhurio" && (
        <section className={styles.panel}>
          <div className={styles.controls}>
            <div className={styles.filterGroup}>
              <button className={mhFilterRange === "siku" ? styles.filterActive : styles.filter} onClick={() => { setMhFilterRange("siku"); setMhPage(1) }}>Siku</button>
              <button className={mhFilterRange === "wiki" ? styles.filterActive : styles.filter} onClick={() => { setMhFilterRange("wiki"); setMhPage(1) }}>Wiki</button>
              <button className={mhFilterRange === "mwezi" ? styles.filterActive : styles.filter} onClick={() => { setMhFilterRange("mwezi"); setMhPage(1) }}>Mwezi</button>
            </div>

            <input className={styles.input} type="date" value={mhDate} onChange={(e) => { setMhDate(e.target.value); setMhPage(1) }} />
            <button className={styles.outline} onClick={() => downloadCSV(mahadhurio, `mahadhurio_${mhFilterRange}_${mhDate}.csv`)}>Pakua CSV</button>

            <div className={styles.pager}>
              <button className={styles.pagerBtn} onClick={() => setMhPage(p => Math.max(1, p - 1))}>Prev</button>
              <div className={styles.pagerInfo}>Page {mhPage}</div>
              <button className={styles.pagerBtn} onClick={() => setMhPage(p => p + 1)}>Next</button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tarehe</th>
                  <th>Jina / Majina</th>
                  <th>Aina</th>
                  <th>Ibada</th>
                  <th>Muumini Namba</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className={styles.cell}>Loading...</td></tr>
                ) : mahadhurio.length === 0 ? (
                  <tr><td colSpan={7} className={styles.cell}>Hakuna mahadhurio</td></tr>
                ) : (
                  mahadhurio.map((m, i) => (
                    <tr key={m.id}>
                      <td className={styles.cell}>{(mhPage - 1) * MH_PAGE_SIZE + i + 1}</td>
                      <td className={styles.cell}>{m.tarehe ?? "—"}</td>
                      <td className={styles.cell}>{m.majina ?? "—"}</td>
                      <td className={styles.cell}>{m.aina ?? "—"}</td>
                      <td className={styles.cell}>{m.ibada ?? "—"}</td>
                      <td className={styles.cell}>{m.muumini_namba ?? m.muumini_id ?? "—"}</td>
                      <td className={styles.cell}>{m.created_at ? String(m.created_at).split("T")[0] : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Wachanga */}
      {active === "wachanga" && (
        <section className={styles.panel}>
          <div className={styles.subTabs}>
            <button className={wachangaSub === "approval" ? styles.tabActive : styles.tab} onClick={() => setWachangaSub("approval")}>Approval</button>
            <button className={wachangaSub === "waliokoka" ? styles.tabActive : styles.tab} onClick={() => setWachangaSub("waliokoka")}>Waliokoka</button>
          </div>

          {wachangaSub === "approval" && (
            <div>
              <div className={styles.controls}>
                <button className={styles.outline} onClick={() => downloadCSV(approvals, `approvals_page_${approvalsPage}.csv`)}>Pakua CSV</button>
                <div className={styles.pager}>
                  <button className={styles.pagerBtn} onClick={() => setApprovalsPage(p => Math.max(1, p - 1))}>Prev</button>
                  <div className={styles.pagerInfo}>Page {approvalsPage}</div>
                  <button className={styles.pagerBtn} onClick={() => setApprovalsPage(p => p + 1)}>Next</button>
                </div>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Muumini Id</th>
                      <th>Status</th>
                      <th>Tarehe</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className={styles.cell}>Loading...</td></tr>
                    ) : approvals.length === 0 ? (
                      <tr><td colSpan={6} className={styles.cell}>Hakuna approvals</td></tr>
                    ) : (
                      approvals.map((a, i) => (


                        <tr key={a.id}>
                          <td className={styles.cell}>{(approvalsPage - 1) * APPROVALS_PAGE_SIZE + i + 1}</td>
                          <td className={styles.cell}>{a.muumini_id}</td>
                          <td className={styles.cell}>{a.status}</td>
                          <td className={styles.cell}>{a.tarehe ?? "—"}</td>
                          <td className={styles.cell}>{a.created_at ? String(a.created_at).split("T")[0] : "—"}</td>
                          <td className={styles.cell}>
                            <div className={styles.actions}>
                              <button className={styles.approveBtn} onClick={() => approveAndSubmit(a)}>Approve</button>
                              <button className={styles.rejectBtn} onClick={() => rejectApproval(a)}>Reject</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {wachangaSub === "waliokoka" && (
            <div>
              <div className={styles.controls}>
              <button className={styles.outline} onClick={() => downloadCSV(wokovu, "wokovu_page_" + wokovuPage + ".csv")}>Pakua CSV</button>

                <div className={styles.pager}>
                  <button className={styles.pagerBtn} onClick={() => setWokovuPage(p => Math.max(1, p - 1))}>Prev</button>
                  <div className={styles.pagerInfo}>Page {wokovuPage}</div>
                  <button className={styles.pagerBtn} onClick={() => setWokovuPage(p => p + 1)}>Next</button>
                </div>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Majina</th>
                      <th>Tarehe</th>
                      <th>Branch</th>
                      <th>Ushuhuda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className={styles.cell}>Loading...</td></tr>
                    ) : wokovu.length === 0 ? (
                      <tr><td colSpan={5} className={styles.cell}>Hakuna waliokoka</td></tr>
                    ) : (
                      wokovu.map((w, i) => (
                        <tr key={w.id}>
                          <td className={styles.cell}>{(wokovuPage - 1) * WOKOVU_PAGE_SIZE + i + 1}</td>
                          <td className={styles.cell}>{w.majina ?? "—"}</td>
                          <td className={styles.cell}>{w.tarehe ?? (w.created_at ? String(w.created_at).split("T")[0] : "—")}</td>
                          <td className={styles.cell}>{w.branch ?? "—"}</td>
                          <td className={styles.cell}>{w.ushuhuda ?? "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
    
)}
</div>
)
}


