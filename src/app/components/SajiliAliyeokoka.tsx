// src/app/components/SajiliAliyeokoka.tsx

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import '../styles/SajiliAliyeokoka.css' // External styles

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface SajiliAliyeokokaProps {
  setActiveTab: (tab: string) => void
}

interface Muumini {
  id: number
  muumini_namba: string
  majina: string
}

const SajiliAliyeokoka: React.FC<SajiliAliyeokokaProps> = ({ setActiveTab }) => {
  const [searchNamba, setSearchNamba] = useState('')
  const [searchMajina, setSearchMajina] = useState('')
  const [muumini, setMuumini] = useState<Muumini | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSearch = async () => {
    if (!searchNamba && !searchMajina) {
      setMuumini(null)
      setMessage('')
      return
    }

    let query = supabase.from('watu').select('*').limit(1)

    if (searchNamba && searchMajina) {
      query = query.or(`muumini_namba.ilike.%${searchNamba}%, majina.ilike.%${searchMajina}%`)
    } else if (searchNamba) {
      query = query.ilike('muumini_namba', `%${searchNamba}%`)
    } else if (searchMajina) {
      query = query.ilike('majina', `%${searchMajina}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Search error:', error)
      setMessage('Hitilafu wakati wa kutafuta')
      setMuumini(null)
    } else {
      setMuumini(data?.[0] || null)
      setMessage(data?.[0] ? '' : 'Hakuna muumini aliyepatikana')
    }
  }

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      handleSearch()
    }, 400)
    return () => clearTimeout(delaySearch)
  }, [searchNamba, searchMajina])

  const handleSajiliWokovu = async () => {
    if (!muumini) return
    setLoading(true)

    const tareheLeo = new Date().toISOString().split('T')[0]

    const { data: existing, error: checkError } = await supabase
      .from('wokovu')
      .select('*')
      .eq('muumini_id', muumini.id)

    if (checkError) {
      console.error('Check error:', checkError)
      setMessage('Hitilafu wakati wa kuhakiki wokovu')
      setLoading(false)
      return
    }

    if (existing && existing.length > 0) {
      setMessage('⚠️ Muumini huyu ameshasajiliwa wokovu. Kuokoka ni mara moja, basi uishi wokovu 🙏')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('wokovu')
      .insert([{
        muumini_id: muumini.id,
        muumini_namba: muumini.muumini_namba,
        majina: muumini.majina,
        tarehe: tareheLeo
      }])

    if (error) {
      console.error('Wokovu error:', error)
      setMessage('Hitilafu: ' + error.message)
    } else {
      setMessage(`✅ Wokovu umesajiliwa kwa ${muumini.majina}`)
      setTimeout(() => setActiveTab('home'), 2000)
    }

    setLoading(false)
  }

  return (
    <div className="wrapper">
      <h2 className="heading">Sajili Aliyeokoka</h2>

      <div className="section">
        <input
          className="input"
          placeholder="Muumini Namba"
          value={searchNamba}
          onChange={(e) => setSearchNamba(e.target.value.replace(/\D/g, ''))}
        />
        <input
          className="input"
          placeholder="Majina (optional)"
          value={searchMajina}
          onChange={(e) => setSearchMajina(e.target.value)}
        />
      </div>

      {muumini && (
        <div className="result">
          <p><strong>Namba:</strong> {muumini.muumini_namba}</p>
          <p><strong>Majina:</strong> {muumini.majina}</p>
          <button className="button" onClick={handleSajiliWokovu} disabled={loading}>
            {loading ? 'Inasajili...' : 'SAJILI WOKOVU'}
          </button>
        </div>
      )}

      {message && <p className="message">{message}</p>}
    </div>
  )
}

export default SajiliAliyeokoka
