import { useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { TabType } from "../usher/page"; // ✅ import the tab type
import "../styles/SajiliMahadhurio.css";
import type { SetActiveTab } from "@/types/tabs";

interface SajiliAliyeokokaProps {
  setActiveTab: SetActiveTab;
}

// ---- Supabase setup ----
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// ---- Types ----
interface Muumini {
  id: number;
  majina: string;
  muumini_namba: string;
  simu?: string;
}

interface Mahadhurio {
  id?: number;
  muumini_id: number;
  muumini_namba: string;
  majina: string;
  aina: string;
  ibada?: string;
  tarehe: string;
}

interface SajiliMahadhurioProps {
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>; // ✅ correct type
}

// ---- Component ----
const SajiliMahadhurio: React.FC<SajiliMahadhurioProps> = ({ setActiveTab }) => {
  const [searchNamba, setSearchNamba] = useState("");
  const [searchMajina, setSearchMajina] = useState("");
  const [searchResults, setSearchResults] = useState<Muumini[]>([]);
  const [selectedMuumini, setSelectedMuumini] = useState<Muumini | null>(null);

  const [ainaMahadhurio, setAinaMahadhurio] = useState("");
  const [ainaIbada, setAinaIbada] = useState("");
  const [tarehe, setTarehe] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");

  // ---- Handlers ----
  const handleSearch = async (namba: string, majina: string) => {
    setSearching(true);
    const { data, error } = await supabase
      .from("watu")
      .select("*")
      .or(`simu.ilike.%${namba}%,majina.ilike.%${majina}%`);

    if (error) {
      console.error(error);
      setSearchResults([]);
    } else {
      setSearchResults((data as Muumini[]) ?? []);
    }
    setSearching(false);
  };

  const handleSelectMuumini = (muu: Muumini) => {
    setSelectedMuumini(muu);
    setMessage("");
  };

  const handleWekaMahadhurio = async () => {
    if (
      !selectedMuumini ||
      !ainaMahadhurio ||
      !tarehe ||
      (ainaMahadhurio === "Ibada" && !ainaIbada)
    ) {
      alert("Tafadhali jaza taarifa zote");
      return;
    }

    setLoading(true);

    const { data: existing, error: existingError } = await supabase
      .from("mahadhurio")
      .select("*")
      .eq("muumini_id", selectedMuumini.id)
      .eq("tarehe", tarehe);

    if (existingError) {
      setMessage("Hitilafu wakati wa kutafuta rekodi: " + existingError.message);
      setLoading(false);
      return;
    }

    const existingRecords = (existing as Mahadhurio[]) ?? [];

    if (existingRecords.length > 0) {
      const { error: updateError } = await supabase
        .from("mahadhurio")
        .update({
          aina: ainaMahadhurio,
          ibada: ainaIbada,
        })
        .eq("id", existingRecords[0].id);

      if (updateError) {
        setMessage("Hitilafu wakati wa kusasisha: " + updateError.message);
      } else {
        setMessage(
          `Huwezi kujifadhi mahadhurio ya ${selectedMuumini.majina} (${ainaIbada}) mara mbili fuata`
        );
      }
    } else {
      const { error } = await supabase.from("mahadhurio").insert([
        {
          muumini_id: selectedMuumini.id,
          muumini_namba: selectedMuumini.muumini_namba,
          majina: selectedMuumini.majina,
          aina: ainaMahadhurio,
          ibada: ainaIbada,
          tarehe,
        },
      ]);

      if (error) {
        setMessage("Hitilafu: " + error.message);
      } else {
        setMessage(`✅ Mahadhurio yametunzwa kwa ${selectedMuumini.majina}`);
      }
    }

    setLoading(false);

    setTimeout(() => {
      setActiveTab("home"); // ✅ works safely now
    }, 2000);
  };

  // ---- Render ----
  return (
    <div className="wrapper">
      <h2 className="heading">Sajili Mahadhurio</h2>

      <div className="section">
        <h4>Tafuta Muumini kwa Namba au Majina</h4>
        <input
          className="input"
          placeholder="Namba"
          value={searchNamba}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            setSearchNamba(value);
            handleSearch(value, searchMajina);
          }}
          inputMode="numeric"
          pattern="\d*"
        />
        <input
          className="input"
          placeholder="Majina"
          value={searchMajina}
          onChange={(e) => {
            const value = e.target.value;
            setSearchMajina(value);
            handleSearch(searchNamba, value);
          }}
        />
        {searching && <p className="message">⏳ Inatafuta...</p>}
      </div>

      {searchResults.length > 0 && (
        <div className="result">
          <h4>Matokeo</h4>
          <table className="table">
            <thead>
              <tr>
                <th className="th">#</th>
                <th className="th">Namba ya Muumini</th>
                <th className="th">Majina Kamili</th>
                <th className="th">Chagua</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((muu, index) => (
                <tr key={muu.id} className={index % 2 === 0 ? "tr-even" : ""}>
                  <td className="td">{index + 1}</td>
                  <td className="td">{muu.muumini_namba}</td>
                  <td className="td">{muu.majina}</td>
                  <td className="td">
                    <button
                      className="button button-small"
                      onClick={() => handleSelectMuumini(muu)}
                    >
                      Chagua
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedMuumini && (
        <div className="section">
          <h4>Muumini Amechaguliwa: {selectedMuumini.majina}</h4>

          <label className="label">Aina ya Mahadhurio:</label>
          <select
            className="select"
            value={ainaMahadhurio}
            onChange={(e) => setAinaMahadhurio(e.target.value)}
          >
            <option value="">Chagua</option>
            <option value="Sherehe">Sherehe</option>
            <option value="Kikao">Kikao</option>
            <option value="Mkutano">Mkutano</option>
            <option value="Harusi">Harusi</option>
            <option value="Mahafali">Mahafali</option>
            <option value="Ibada">Ibada</option>
          </select>

          {ainaMahadhurio === "Ibada" && (
            <>
              <label className="label">Aina ya Ibada:</label>
              <select
                className="select"
                value={ainaIbada}
                onChange={(e) => setAinaIbada(e.target.value)}
              >
                <option value="">Chagua</option>
                <option value="IBADA YA KWANZA">IBADA YA KWANZA</option>
                <option value="IBADA YA PILI">IBADA YA PILI</option>
                <option value="IBADA YA MAJIBU">IBADA YA MAJIBU</option>
              </select>
            </>
          )}

          <label className="label">Tarehe:</label>
          <input
            className="input"
            type="date"
            value={tarehe}
            onChange={(e) => setTarehe(e.target.value)}
          />

          <button
            className="button"
            onClick={handleWekaMahadhurio}
            disabled={loading}
          >
            {loading ? "Inashughulikiwa..." : "Weka Mahadhurio"}
          </button>

          {message && <p className="message">{message}</p>}
        </div>
      )}
    </div>
  );
};

export default SajiliMahadhurio;
