"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

// ✅ Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ✅ No explicit JSX.Element return type (fixes Vercel build)
export default function AdminDataManagement() {
  const [tables, setTables] = useState<{ name: string }[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [rows, setRows] = useState<any[]>([])
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [primaryKey, setPrimaryKey] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [editingCell, setEditingCell] = useState<{ rowId: string; column: string } | null>(null)
  const [editValue, setEditValue] = useState("")

  // ✅ Fetch table list from Supabase RPC
  useEffect(() => {
    const fetchTables = async () => {
      const { data, error } = await supabase.rpc("list_tables")
      if (!error && data) setTables(data)
    }
    fetchTables()
  }, [])

  const loadTableData = async (tableName: string) => {
    setSelectedTable(tableName)
    setStatus("⏳ Inapakia data...")
    const { data, error } = await supabase.from(tableName).select("*")

    if (error) {
      setStatus("❌ Imeshindikana kupakia data.")
      return
    }

    if (!data || data.length === 0) {
      setRows([])
      setFormData({})
      setPrimaryKey("")
      setSelectedRows(new Set())
      setStatus("✅ Hakuna data kwenye jedwali hili.")
      return
    }

    const sample = data[0]
    const key =
      Object.keys(sample).find(k => k === "id" || k.endsWith("_id")) ||
      Object.keys(sample)[0]

    setPrimaryKey(key)
    setRows(data)
    setFormData(Object.fromEntries(Object.keys(sample).map(k => [k, ""])))
    setSelectedRows(new Set())
    setStatus("")
  }

  const resetSequence = async () => {
    const sequenceName = `${selectedTable}_id_seq`
    const { error } = await supabase.rpc("reset_sequence", { seq_name: sequenceName })
    if (error) setStatus(`❌ Imeshindikana: ${error.message}`)
    else setStatus("✅ Namba imewekwa upya kuanzia 0.")
  }

  const saveEdit = async (rowId: string, column: string) => {
    setStatus("⏳ Inahifadhi mabadiliko...")
    const { error } = await supabase
      .from(selectedTable!)
      .update({ [column]: editValue })
      .eq(primaryKey, rowId)

    if (error) setStatus(`❌ Imeshindikana: ${error.message}`)
    else {
      setStatus("✅ Imesasishwa.")
      loadTableData(selectedTable!)
    }
    setEditingCell(null)
  }

  const handleInsert = async () => {
    if (!selectedTable) return
    setStatus("⏳ Inatuma data mpya...")
    const { error } = await supabase.from(selectedTable).insert([formData])
    if (error) setStatus(`❌ Imeshindikana: ${error.message}`)
    else {
      setStatus("✅ Data mpya imeongezwa.")
      loadTableData(selectedTable)
    }
  }

  const deleteSelected = async () => {
    const ids = Array.from(selectedRows)
    const { error } = await supabase.from(selectedTable!).delete().in(primaryKey, ids)
    if (error) setStatus(`❌ Imeshindikana: ${error.message}`)
    else {
      setRows(prev => prev.filter(row => !selectedRows.has(row[primaryKey])))
      setSelectedRows(new Set())
      setStatus("✅ Rows zilizochaguliwa zimefutwa.")
    }
  }

  const deleteAll = async () => {
    const ids = rows.map(row => row[primaryKey]).filter(Boolean)
    const { error } = await supabase.from(selectedTable!).delete().in(primaryKey, ids)
    if (error) setStatus(`❌ Imeshindikana: ${error.message}`)
    else {
      setRows([])
      setSelectedRows(new Set())
      setStatus("✅ Data zote zimefutwa.")
    }
  }

  // ✅ JSX UI
  return (
    <div style={styles.container}>
      <h2 style={styles.header}>🧹 Usimamizi wa Data kwa Admin</h2>
      <p style={styles.subtext}>
        Chagua jedwali, angalia data, hariri, ongeza au weka upya namba kwa hekima ya kiroho.
      </p>

      {/* Table List */}
      <div style={styles.tableList}>
        {tables.map(table => (
          <button
            key={table.name}
            onClick={() => loadTableData(table.name)}
            style={styles.tableButton}
          >
            📁 {table.name}
          </button>
        ))}
      </div>

      {/* Data Panel */}
      {selectedTable && (
        <div style={styles.panel}>
          <h3 style={styles.subheader}>📂 {selectedTable} ({rows.length} rows)</h3>

          <div style={styles.scrollBox}>
            {rows.length > 0 ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th></th>
                    {Object.keys(rows[0]).map(col => (
                      <th key={col} style={styles.th}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row[primaryKey]}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedRows.has(row[primaryKey])}
                          onChange={() => {
                            const copy = new Set(selectedRows)
                            copy.has(row[primaryKey])
                              ? copy.delete(row[primaryKey])
                              : copy.add(row[primaryKey])
                            setSelectedRows(copy)
                          }}
                        />
                      </td>
                      {Object.keys(row).map(col => (
                        <td
                          key={col}
                          style={styles.td}
                          onClick={() => {
                            setEditingCell({ rowId: row[primaryKey], column: col })
                            setEditValue(String(row[col]))
                          }}
                        >
                          {editingCell?.rowId === row[primaryKey] &&
                          editingCell?.column === col ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={() => saveEdit(row[primaryKey], col)}
                              onKeyDown={e =>
                                e.key === "Enter" && saveEdit(row[primaryKey], col)
                              }
                              style={styles.input}
                              autoFocus
                            />
                          ) : (
                            String(row[col])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={styles.status}>✅ Hakuna data kwenye jedwali hili.</p>
            )}
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button
              onClick={deleteSelected}
              disabled={selectedRows.size === 0}
              style={styles.actionBtn}
            >
              🗑️ Futa Zilizochaguliwa ({selectedRows.size})
            </button>
            <button
              onClick={deleteAll}
              style={{ ...styles.actionBtn, background: "#d32f2f" }}
            >
              🧨 Futa Data Zote
            </button>
            {primaryKey === "id" && (
              <button
                onClick={resetSequence}
                style={{ ...styles.actionBtn, background: "#ff9800" }}
              >
                🔄 Weka Upya Namba (Anza 0)
              </button>
            )}
          </div>

          {/* Insert New Data */}
          <h4 style={styles.formHeader}>➕ Ongeza Data Mpya</h4>
          <div style={styles.form}>
            {Object.keys(formData).map(field => (
              <div key={field} style={styles.formGroup}>
                <label style={styles.label}>{field}</label>
                <input
                  type="text"
                  value={formData[field]}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, [field]: e.target.value }))
                  }
                  style={styles.input}
                />
              </div>
            ))}
            <button
              onClick={handleInsert}
              style={{ ...styles.actionBtn, background: "#009688" }}
            >
              ✅ Tuma Data
            </button>
          </div>

          {status && <div style={styles.status}>{status}</div>}
        </div>
      )}
    </div>
  )
}

// ✅ Inline styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 16,
    maxWidth: 960,
    margin: "0 auto",
    fontFamily: "'Segoe UI', Roboto, sans-serif"
  },
  header: {
    color: "#4a148c",
    fontWeight: 900,
    fontSize: "1.6rem",
    marginBottom: 8
  },
  subtext: {
    fontSize: "0.95rem",
    color: "#555",
    marginBottom: 16
  },
  tableList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24
  },
  tableButton: {
    padding: "8px 12px",
    background: "#6a1b9a",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "0.9rem"
  },
  panel: {
    background: "#f9f6ff",
    padding: 16,
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
  },
  subheader: {
    color: "#6a1b9a",
    fontWeight: 800,
    fontSize: "1.2rem",
    marginBottom: 12
  },
  scrollBox: {
    overflowX: "auto",
    marginBottom: 16
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.85rem"
  },
  th: {
    background: "#ede7f6",
    padding: "6px 8px",
    borderBottom: "1px solid #ccc",
    textAlign: "left",
    whiteSpace: "nowrap"
  },
  td: {
    padding: "6px 8px",
    borderBottom: "1px solid #eee",
    whiteSpace: "nowrap",
    cursor: "pointer"
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16
  },
  actionBtn: {
    padding: "8px 12px",
    background: "#6a1b9a",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontWeight: 700,
    cursor: "pointer"
  },
  formHeader: {
    fontSize: "1.1rem",
    fontWeight: 800,
    color: "#4a148c",
    marginTop: 24,
    marginBottom: 12
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginBottom: 16
  },
  formGroup: {
    display: "flex",
    flexDirection: "column"
  },
  label: {
    fontWeight: 600,
    fontSize: "0.9rem",
    marginBottom: 4,
    color: "#3c1363"
  },
  input: {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: "0.9rem",
    background: "#fff"
  },
  status: {
    marginTop: 12,
    fontWeight: 700,
    color: "#333"
  }
}
