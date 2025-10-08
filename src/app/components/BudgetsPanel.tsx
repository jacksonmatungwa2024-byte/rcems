"use client"

import React, { useEffect, useState } from "react"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import styles from "../components/BudgetsPanel.module.css"

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

type BudgetRow = {
  id: number | string
  title?: string
  description?: string
  amount?: number | null
  currency?: string | null
  requested_by?: string | null
  requested_by_id?: number | null
  department?: string | null
  status?: string | null
  declined_reason?: string | null
  approved_at?: string | null
  declined_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  [key: string]: any
}

export default function BudgetsPanel(): JSX.Element {
  const [sub, setSub] = useState<"pending" | "approved" | "declined">("pending")
  const [pending, setPending] = useState<BudgetRow[]>([])
  const [approved, setApproved] = useState<BudgetRow[]>([])
  const [declined, setDeclined] = useState<BudgetRow[]>([])
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 50
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBudgets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub, page])

  async function fetchBudgets() {
    setLoading(true)
    setError(null)
    try {
      const offset = (page - 1) * PAGE_SIZE
      const p = await Promise.allSettled([
        supabase.from("pending_budgets").select("*").order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1),
        supabase.from("approved_budgets").select("*").order("approved_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1),
        supabase.from("declined_budgets").select("*").order("declined_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1),
      ])
      setPending(p[0].status === "fulfilled" ? (p[0].value as any).data ?? [] : [])
      setApproved(p[1].status === "fulfilled" ? (p[1].value as any).data ?? [] : [])
      setDeclined(p[2].status === "fulfilled" ? (p[2].value as any).data ?? [] : [])
    } catch (err: any) {
      console.error("fetchBudgets error", err)
      setError(String(err?.message ?? err))
      setPending([])
      setApproved([])
      setDeclined([])
    } finally {
      setLoading(false)
    }
  }

  async function approveBudget(b: BudgetRow) {
    setLoading(true)
    setError(null)
    try {
      const { data: created, error: createErr } = await supabase.from("approved_budgets").insert([b]).select().single()
      if (createErr) throw createErr
      const { error: delErr } = await supabase.from("pending_budgets").delete().eq("id", b.id)
      if (delErr) throw delErr
      fetchBudgets()
    } catch (err: any) {
      console.error("approveBudget error", err)
      setError(String(err?.message ?? err))
    } finally {
      setLoading(false)
    }
  }

  async function declineBudget(b: BudgetRow, reason?: string) {
    setLoading(true)
    setError(null)
    try {
      const payload = { ...b, declined_reason: reason ?? "Declined by pastor", status: "declined" }
      const { data: created, error: createErr } = await supabase.from("declined_budgets").insert([payload]).select().single()
      if (createErr) throw createErr
      const { error: delErr } = await supabase.from("pending_budgets").delete().eq("id", b.id)
      if (delErr) throw delErr
      fetchBudgets()
    } catch (err: any) {
      console.error("declineBudget error", err)
      setError(String(err?.message ?? err))
    } finally {
      setLoading(false)
    }
  }

  async function requeueFromDeclined(b: BudgetRow) {
    setLoading(true)
    setError(null)
    try {
      const { data: created, error: createErr } = await supabase.from("pending_budgets").insert([b]).select().single()
      if (createErr) throw createErr
      const { error: delErr } = await supabase.from("declined_budgets").delete().eq("id", b.id)
      if (delErr) throw delErr
      fetchBudgets()
    } catch (err: any) {
      console.error("requeueFromDeclined error", err)
      setError(String(err?.message ?? err))
    } finally {
      setLoading(false)
    }
  }

  function downloadCSV(rows: any[], filename = "export.csv") {
    if (!rows || rows.length === 0) {
      alert("Hakuna data ya kupakua")
      return
    }
    const keys = Array.from(rows.reduce((s, r) => { Object.keys(r || {}).forEach(k => s.add(k)); return s }, new Set<string>()))
    const csv = [keys.join(",")].concat(rows.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const tableHeader = (label: string) => <th className={styles.th}>{label}</th>

  return (
    <div className={styles.container}>
      <div className={styles.subnav}>
        <button className={sub === "pending" ? styles.subActive : styles.sub} onClick={() => { setSub("pending"); setPage(1) }}>Pending Budgets</button>
        <button className={sub === "approved" ? styles.subActive : styles.sub} onClick={() => { setSub("approved"); setPage(1) }}>Approved Budgets</button>
        <button className={sub === "declined" ? styles.subActive : styles.sub} onClick={() => { setSub("declined"); setPage(1) }}>Declined Budgets</button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {sub === "pending" && (
        <div className={styles.panel}>
          <div className={styles.controls}>
            <button className={styles.csvBtn} onClick={() => downloadCSV(pending, `pending_budgets_page_${page}.csv`)}>Pakua CSV</button>
            <div className={styles.pager}>
              <button className={styles.pagerBtn} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
              <div className={styles.pagerInfo}>Page {page}</div>
              <button className={styles.pagerBtn} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {tableHeader("#")}
                  {tableHeader("Title")}
                  {tableHeader("Amount")}
                  {tableHeader("Requested By")}
                  {tableHeader("Created At")}
                  {tableHeader("Actions")}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className={styles.cell} colSpan={6}>Loading...</td></tr>
                ) : pending.length === 0 ? (
                  <tr><td className={styles.cell} colSpan={6}>Hakuna pending budgets</td></tr>
                ) : (
                  pending.map((b, i) => (
                    <tr key={b.id}>
                      <td className={styles.cell}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td className={styles.cell}>{b.title ?? "—"}</td>
                      <td className={styles.cell}>{b.amount ?? "—"}</td>
                      <td className={styles.cell}>{b.requested_by ?? "—"}</td>
                      <td className={styles.cell}>{b.created_at ? String(b.created_at).split("T")[0] : "—"}</td>
                      <td className={styles.cell}>
                        <div className={styles.actions}>
                          <button className={styles.approve} onClick={() => approveBudget(b)}>Approve</button>
                          <button className={styles.decline} onClick={() => declineBudget(b, "Declined by pastor")}>Decline</button>
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

      {sub === "approved" && (
        <div className={styles.panel}>
          <div className={styles.controls}>
            <button className={styles.csvBtn} onClick={() => downloadCSV(approved, `approved_budgets_page_${page}.csv`)}>Pakua CSV</button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {tableHeader("#")}
                  {tableHeader("Title")}
                  {tableHeader("Amount")}
                  {tableHeader("Requested By")}
                  {tableHeader("Approved At")}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className={styles.cell} colSpan={5}>Loading...</td></tr>
                ) : approved.length === 0 ? (
                  <tr><td className={styles.cell} colSpan={5}>Hakuna approved budgets</td></tr>
                ) : (
                  approved.map((b, i) => (
                    <tr key={b.id}>
                      <td className={styles.cell}>{i + 1}</td>
                      <td className={styles.cell}>{b.title ?? "—"}</td>
                      <td className={styles.cell}>{b.amount ?? "—"}</td>
                      <td className={styles.cell}>{b.requested_by ?? "—"}</td>
                      <td className={styles.cell}>{b.approved_at ? String(b.approved_at).split("T")[0] : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sub === "declined" && (
        <div className={styles.panel}>
          <div className={styles.controls}>
            <button className={styles.csvBtn} onClick={() => downloadCSV(declined, `declined_budgets_page_${page}.csv`)}>Pakua CSV</button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {tableHeader("#")}
                  {tableHeader("Title")}
                  {tableHeader("Amount")}
                  {tableHeader("Requested By")}
                  {tableHeader("Declined Reason")}
                  {tableHeader("Declined At")}
                  {tableHeader("Actions")}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className={styles.cell} colSpan={7}>Loading...</td></tr>
                ) : declined.length === 0 ? (
                  <tr><td className={styles.cell} colSpan={7}>Hakuna declined budgets</td></tr>
                ) : (
                  declined.map((b, i) => (
                    <tr key={b.id}>
                      <td className={styles.cell}>{i + 1}</td>
                      <td className={styles.cell}>{b.title ?? "—"}</td>
                      <td className={styles.cell}>{b.amount ?? "—"}</td>
                      <td className={styles.cell}>{b.requested_by ?? "—"}</td>
                      <td className={styles.cell}>{b.declined_reason ?? "—"}</td>
                      <td className={styles.cell}>{b.declined_at ? String(b.declined_at).split("T")[0] : "—"}</td>
                      <td className={styles.cell}>
                        <button className={styles.requeue} onClick={() => requeueFromDeclined(b)}>Requeue</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
