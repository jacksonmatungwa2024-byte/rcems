"use client"
import type { TabType } from "../usher/page"; // ✅ import the tab type
import React, { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import styles from "./MafunzoMuumini.module.css"
import type { SetActiveTab } from "@/types/tabs";

interface MafunzoMuuminiProps {
  setActiveTab: SetActiveTab;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)


interface Props {
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>; // ✅ correct type
}

type Muumini = {
  id?: string
  muumini_id?: number
  muumini_namba?: string
  majina?: string
  tarehe?: string
}

const tareheLeo = new Date().toISOString().split("T")[0]


export default function MafunzoMuumini({ setActiveTab }: Props) {
  const [searchNamba, setSearchNamba] = useState("")
  const [searchMajina, setSearchMajina] = useState("")
  const [waliyookoka, setWaliyookoka] = useState<Muumini[]>([])
  const [loadingList, setLoadingList] = useState(false)

  const [selected, setSelected] = useState<Muumini | null>(null)
  const [masomoYaliyofundishwa, setMasomoYaliyofundishwa] = useState<any[]>([])
  const [masomoYaLeo, setMasomoYaLeo] = useState<any[]>([])
  const [totalTarget, setTotalTarget] = useState<number>(20)
  const [somoMoja, setSomoMoja] = useState("")
  const [alreadyTaughtToday, setAlreadyTaughtToday] = useState<string[]>([])
  const [ushauriLeo, setUshauriLeo] = useState("")
  const [hudumaLeo, setHudumaLeo] = useState("")
  const [mwalimuLeo, setMwalimuLeo] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => {
      fetchWaliyookoka()
    }, 300)
    return () => clearTimeout(id)
  }, [searchNamba, searchMajina])

  async function fetchWaliyookoka() {
    setLoadingList(true)
    try {
      const { data: wokovu } = await supabase
        .from("wokovu")
        .select("*")
        .order("tarehe", { ascending: false })

      const { data: lessons } = await supabase
        .from("mafunzo")
        .select("muumini_id, status")

      const lessonCounts: Record<number, number> = {}
      const approvedIds = new Set<number>()

      for (const r of lessons ?? []) {
        const id = r.muumini_id
        if (!id) continue
        lessonCounts[id] = (lessonCounts[id] ?? 0) + 1
        if (r.status === "approved") approvedIds.add(id)
      }

      const filtered = (wokovu ?? []).filter((r: any) => {
        const id = r.muumini_id
        const count = lessonCounts[id] ?? 0
        return (
          id &&
          !approvedIds.has(id) &&
          (count < totalTarget || count === 0) &&
          (!searchNamba || r.muumini_namba?.includes(searchNamba)) &&
          (!searchMajina || r.majina?.toLowerCase().includes(searchMajina.toLowerCase()))
        )
      })

      setWaliyookoka(filtered)
      setMessage("")
    } catch (err) {
      console.error("Fetch error:", err)
      setMessage("Hitilafu wakati wa ku-load waliokoka")
      setWaliyookoka([])
    } finally {
      setLoadingList(false)
    }
  }

  async function openMafunzo(muu: Muumini) {
    setSelected(muu)
    setMasomoYaliyofundishwa([])
    setMasomoYaLeo([])
    setSomoMoja("")
    setUshauriLeo("")
    setHudumaLeo("")
    setMwalimuLeo("")
    setMessage("")

    try {
      const muuminiRef = muu.muumini_id
      if (!muuminiRef) {
        setMessage("Selected row haina muumini_id")
        return
      }

      const { data, error } = await supabase
        .from("mafunzo")
        .select("*")
        .eq("muumini_id", muuminiRef)
        .order("tarehe", { ascending: true })

      if (error) throw error

      const all = data ?? []
      const alreadyApproved = all.some((r: any) => r.status === "approved")
      if (alreadyApproved) {
        setMessage("✅ Muumini huyu tayari amepelekwa kwa approval")
        setSelected(null)
        return
      }

      setMasomoYaliyofundishwa(all)
      const leo = all.filter((r: any) => r.tarehe === tareheLeo)
      setMasomoYaLeo(leo)
      setAlreadyTaughtToday(leo.map((r: any) => r.somo))

      if (all.length < totalTarget) {
        setMessage("⚠️ Huyu mtu bado yupo kwenye mafunzo, endelea kumfundisha")
      } else {
        setMessage("✅ Idadi ya masomo imefikia kikomo, unaweza kumwasilisha kwa approval")
      }
    } catch (err) {
      console.error(err)
      setMessage("Hitilafu wakati wa ku-load mafunzo")
    }
  }

  async function submitSingleLesson() {
    if (!selected?.muumini_id || !somoMoja) return
    if (alreadyTaughtToday.includes(somoMoja)) {
      setMessage("⚠️ Somo hili tayari limefundishwa leo")
      return
    }

    try {
      const { error } = await supabase.from("mafunzo").insert({
        muumini_id: selected.muumini_id,
        somo: somoMoja,
        tarehe: tareheLeo,
        mwalimu: mwalimuLeo,
        ushauri: ushauriLeo,
        huduma: hudumaLeo,
        aliyefundisha: mwalimuLeo,
        tarehefundisha: tareheLeo,
        status: "pending",
      })

      if (error) throw error

      setMessage(`✅ Somo "${somoMoja}" limehifadhiwa`)
      setSomoMoja("")
      await openMafunzo(selected)
    } catch (err) {
      console.error(err)
      setMessage("Hitilafu wakati wa kuhifadhi somo")
    }
  }

  async function submitForApproval() {
    if (!selected?.muumini_id) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from("mafunzo").insert({
        muumini_id: selected.muumini_id,
        somo: "Approval marker",
        tarehe: tareheLeo,
        status: "approved",
        mwalimu: mwalimuLeo,
        ushauri: ushauriLeo,
        huduma: hudumaLeo,
      })
      if (error) throw error
      setMessage("✅ Muumini amewasilishwa kwa approval")
      setSelected(null)
      fetchWaliyookoka()
    } catch (err) {
      console.error(err)
      setMessage("Hitilafu wakati wa kuwasilisha kwa approval")
    } finally {
      setSubmitting(false)
    }
  }

  const progressPercent = () => {
    if (!totalTarget || totalTarget === 0) return 0
    return Math.min(100, Math.round((masomoYaliyofundishwa.length / totalTarget) * 100))
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>📘 Mafunzo ya Muumini</h3>
        <button className={styles.backBtn} onClick={() => setActiveTab("home")}>🔙 Home</button>
      </div>

      <div className={styles.searchGroup}>
        <input type="text" placeholder="Namba ya Muumini" value={searchNamba} onChange={(e) => setSearchNamba(e.target.value.replace(/\D/g, ""))} />
        <input type="text" placeholder="Majina ya Muumini" value={searchMajina} onChange={(e) => setSearchMajina(e.target.value)} />
        <button className={styles.refreshBtn} onClick={fetchWaliyookoka}>🔄 Tafuta</button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Namba</th>
            <th>Majina</th>
                        <th>Tarehe</th>
            <th>Chagua</th>
          </tr>
        </thead>
        <tbody>
          {loadingList ? (
            <tr><td colSpan={5}>Inapakia...</td></tr>
          ) : waliyookoka.length === 0 ? (
            <tr><td colSpan={5}>Hakuna waliokoka waliopatikana</td></tr>
          ) : (
            waliyookoka.map((muu, i) => (
              <tr key={muu.id ?? i}>
                <td>{i + 1}</td>
                <td>{muu.muumini_namba}</td>
                <td>{muu.majina}</td>
                <td>{muu.tarehe}</td>
                <td>
                  <button className={styles.selectBtn} onClick={() => openMafunzo(muu)}>
                    Fungua
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {selected && (
        <div className={styles.lessonPanel}>
          <h4>{selected.majina} ({selected.muumini_namba})</h4>

          <div className={styles.lessonInputs}>
            <input
              type="number"
              placeholder="Idadi ya masomo anayopaswa kufundishwa (jumla)"
              value={totalTarget}
              onChange={(e) => setTotalTarget(parseInt(e.target.value))}
              className={styles.input}
            />

            <input
              type="text"
              placeholder="Andika somo moja"
              value={somoMoja}
              onChange={(e) => setSomoMoja(e.target.value)}
              className={styles.input}
            />

            <input
              type="text"
              placeholder="Jina la mwalimu"
              value={mwalimuLeo}
              onChange={(e) => setMwalimuLeo(e.target.value)}
              className={styles.input}
            />

            <input
              type="text"
              placeholder="Ushauri wa siku"
              value={ushauriLeo}
              onChange={(e) => setUshauriLeo(e.target.value)}
              className={styles.input}
            />

            <input
              type="text"
              placeholder="Huduma ulizotoa"
              value={hudumaLeo}
              onChange={(e) => setHudumaLeo(e.target.value)}
              className={styles.input}
            />

            <button
              className={styles.submitLessonBtn}
              onClick={submitSingleLesson}
              disabled={!somoMoja || alreadyTaughtToday.includes(somoMoja)}
            >
              💾 Hifadhi Somo
            </button>
          </div>

          <div className={styles.previousLessons}>
            <strong>📖 Masomo Yaliyopita</strong>
            <ul>
              {masomoYaliyofundishwa.map((m, i) => (
                <li key={m.id ?? i}>📅 {m.tarehe} — {m.somo}</li>
              ))}
            </ul>
          </div>

          <div className={styles.todayLessons}>
            <strong>📆 Masomo ya Leo ({tareheLeo})</strong>
            <ul>
              {masomoYaLeo.map((m, i) => (
                <li key={m.id ?? i}>📖 {m.somo}</li>
              ))}
            </ul>
          </div>

          <div className={styles.progressBarContainer}>
            <div className={styles.progressBar} style={{ width: `${progressPercent()}%` }} />
          </div>
          <p className={styles.progressText}>
            Progress: {masomoYaliyofundishwa.length}/{totalTarget}
          </p>

          <button
            className={styles.approvalBtn}
            disabled={progressPercent() < 100 || submitting}
            onClick={submitForApproval}
          >
            🟢 Wasilisha Muumini (Approval)
          </button>
        </div>
      )}

      {message && <div className={styles.message}>{message}</div>}
    </div>
  )
}
