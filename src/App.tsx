import { useState, useEffect } from "react";
import { SAMPLE_STORE_RECORDS } from "./data/sampleData";
import { StoreRecord, AppsScriptConfig } from "./types";
import AppsScriptGuide from "./components/AppsScriptGuide";
import DashboardOverview from "./components/DashboardOverview";
import { 
  FileSpreadsheet, 
  BarChart2, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Layers, 
  BookOpen, 
  Info,
  ExternalLink,
  ChevronRight
} from "lucide-react";

// Helper function to normalize keys and support dynamic columns
const normalizeRecords = (rawData: any[], isDemoMode: boolean = false): StoreRecord[] => {
  if (!Array.isArray(rawData)) return [];

  return rawData.map(item => {
    const findValue = (keys: string[]): any => {
      for (const k of keys) {
        if (item[k] !== undefined && item[k] !== null) return item[k];
        
        // Try UPPERCASE with underscores
        const upperUnderscore = k.toUpperCase().replace(/\s+/g, '_');
        if (item[upperUnderscore] !== undefined && item[upperUnderscore] !== null) return item[upperUnderscore];
        
        // Try UPPERCASE with spaces
        const upperSpace = k.toUpperCase().replace(/_+/g, ' ');
        if (item[upperSpace] !== undefined && item[upperSpace] !== null) return item[upperSpace];
        
        // Try lowercase
        const lower = k.toLowerCase();
        if (item[lower] !== undefined && item[lower] !== null) return item[lower];
        
        // Try CamelCase
        const camel = k.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
        if (item[camel] !== undefined && item[camel] !== null) return item[camel];
      }
      return "";
    };

    const getNormalizedString = (keys: string[]): string => {
      const val = findValue(keys);
      if (val === undefined || val === null) return "";
      return String(val).trim().toUpperCase();
    };

    const parseNumber = (val: any): number => {
      if (val === undefined || val === null || val === "") return 0;
      if (typeof val === "number") return val;
      // String sanitize
      const cleaned = val.toString()
        .replace(/Rp\.?/gi, "")   // Remove Rp
        .replace(/[^\d,\.-]/g, ""); // Keep digits, minus, dot, comma
      
      if (cleaned.includes(",") && cleaned.includes(".")) {
        const lastCommaPos = cleaned.lastIndexOf(",");
        const lastDotPos = cleaned.lastIndexOf(".");
        if (lastCommaPos > lastDotPos) {
          return parseFloat(cleaned.replace(/\./g, "").replace(/,/g, "."));
        } else {
          return parseFloat(cleaned.replace(/,/g, ""));
        }
      } else if (cleaned.includes(",")) {
        const parts = cleaned.split(",");
        if (parts[parts.length - 1].length === 3) {
          return parseFloat(cleaned.replace(/,/g, ""));
        } else {
          return parseFloat(cleaned.replace(/,/g, "."));
        }
      } else if (cleaned.includes(".")) {
        const parts = cleaned.split(".");
        if (parts[parts.length - 1].length === 3) {
          return parseFloat(cleaned.replace(/\./g, ""));
        } else {
          return parseFloat(cleaned);
        }
      }
      return parseFloat(cleaned) || 0;
    };

    const rawSales = findValue([
      "SALES_COFFEE", "RP_SALES", "TOTAL_SALES", "TOTAL SALES", "RP SALES", "RP. SALES", 
      "SALES", "REVENUE", "OMSET", "PENJUALAN", "RP_PENJUALAN", "RP. PENJUALAN",
      "RP_OMSET", "RP. OMSET", "TOTAL_PENJUALAN", "TOTAL PENJUALAN", "TOTAL_OMSET", "TOTAL OMSET"
    ]);
    const rawSalesQty = findValue([
      "SALES_QTY", "SALES QTY", "QTY", "QUANTITY", "JUMLAH", "PCS", "UNIT", 
      "QTY_SALES", "QTY PENJUALAN", "QTY_PENJUALAN", "VOLUME", "VOLUME_PENJUALAN"
    ]);
    const rawValueKorMusnah = findValue([
      "VALUE_KOR_MUSNAH", "VALUE KOR MUSNAH", "KOR_MUSNAH", "KOR MUSNAH", 
      "NOMINAL MUSNAH", "BEBAN_MUSNAH", "BEBAN MUSNAH", "NOMINAL_MUSNAH", 
      "VALUE_MUSNAH", "VALUE MUSNAH", "BEBAN PEMUSNAHAN", "BEBAN_PEMUSNAHAN",
      "TOTAL MUSNAH", "TOTAL_MUSNAH", "RUPIAH_MUSNAH", "RUPIAH MUSNAH",
      "COR_MUSNAH", "COREKSI_MUSNAH", "KOREKSI_MUSNAH", "COR MUSNAH",
      "RP_KOR_MUSNAH", "RP_COR_MUSNAH", "RP. KOR MUSNAH", "RP. COR MUSNAH",
      "VALUE_COR_MUSNAH", "NILAI_KOR_MUSNAH", "NILAI_COR_MUSNAH",
      "KOR_MSH", "KOR MSH", "RP_KOR_MSH", "RP KOR MSH", "RP. KOR MSH",
      "BEBAN_KOR_MSH", "BEBAN KOR MSH", "VALUE_KOR_MSH", "VALUE KOR MSH",
      "NOMINAL_KOR_MSH", "NOMINAL KOR MSH", "MUSNAH", "RP_MUSNAH", "RP. MUSNAH",
      "RUPIAH_KOR_MUSNAH", "RUPIAH_COR_MUSNAH", "KOR_RP", "COR_RP", "BEBAN_MUSNAH"
    ]);

    let sales = parseNumber(rawSales);
    let salesQty = parseNumber(rawSalesQty);
    // Ensure valueKorMusnah is always represented as a positive burden/expense
    let valueKorMusnah = Math.abs(parseNumber(rawValueKorMusnah));

    // Generative realistic seed fallback if columns don't exist (only in Sandbox / Demo mode)
    const genericPlu = findValue(["PLU", "KODE PLU", "PLU CODE", "MATERIAL"]);
    const numericPlu = typeof genericPlu === "number" ? genericPlu : parseInt(genericPlu, 10) || 12345;
    const seedHash = (numericPlu % 100) + 1; // 1-100

    if (sales === 0 && isDemoMode) {
      sales = seedHash * 45000 + 400000;
    }
    if (salesQty === 0 && isDemoMode) {
      salesQty = Math.round(seedHash * 1.5 + 10);
    }
    if (valueKorMusnah === 0 && isDemoMode) {
      const subdeptStr = (findValue(["SUBDEPT", "SUB DEPT", "SUB_DEPT", "DEPT", "DEPARTMENT", "CATEGORY", "KATEGORI"]) || "").toString().toUpperCase();
      let wasteRate = 0.055;
      if (subdeptStr.includes("EAT")) {
        wasteRate = 0.18 + ((numericPlu % 5) * 0.01); // 18% - 22%
      } else if (subdeptStr.includes("BAKERY") || subdeptStr.includes("SNACK")) {
        wasteRate = 0.11 + ((numericPlu % 5) * 0.01); // 11% - 15%
      } else if (subdeptStr.includes("DRINK")) {
        wasteRate = 0.01 + ((numericPlu % 3) * 0.005); // 1% - 2%
      } else if (subdeptStr.includes("RAW") || subdeptStr.includes("MATERIAL")) {
        wasteRate = 0.04 + ((numericPlu % 4) * 0.01); // 4% - 7%
      }
      
      const wasteOffsetSeed = ((numericPlu * 3) % 40) - 20; // -20 to +19
      const baseLoss = sales * wasteRate;
      valueKorMusnah = Math.max(1500, Math.round(baseLoss + (wasteOffsetSeed * 1000)));
    }

    // Advanced Normalization for status
    let statusVal = getNormalizedString(["STATUS", "STATUS TOKO", "SITUASI", "STATUS_TOKO"]);
    if (statusVal.includes("FRAN")) {
      statusVal = "FRANCHISE";
    } else if (statusVal.includes("REG") || !statusVal) {
      statusVal = "REGULER";
    }

    // Advanced Normalization for tipe beanspot
    let tipeBeanspcVal = getNormalizedString(["TIPE_BEANSPC", "TIPE BEANSPC", "BEANSPOT_TYPE", "TIPE BEAN SPOT", "BEAN SPOT", "TIPE_BEAN_SPOT", "TIPE_BEAN", "TIPE BEAN"]);
    if (tipeBeanspcVal.includes("ADV")) {
      tipeBeanspcVal = "ADVANCE";
    } else if (tipeBeanspcVal.includes("MED")) {
      tipeBeanspcVal = "MEDIUM";
    } else if (tipeBeanspcVal.includes("BAS")) {
      tipeBeanspcVal = "BASIC";
    } else {
      tipeBeanspcVal = "NO BEAN SPOT";
    }

    return {
      TANGGAL: findValue(["TANGGAL", "DATE", "HARI"]),
      REGIONAL: getNormalizedString(["REGIONAL", "WILAYAH", "REGION", "REG"]),
      BRANCH: getNormalizedString(["BRANCH", "CABANG", "AREA", "BRNCH"]),
      KD_STORE: getNormalizedString(["KD_STORE", "KD STORE", "KODE STORE", "KODE_STORE", "KD TOKO", "KODE TOKO", "KDSTOR", "STORE CODE", "STORE_CODE", "KD_STOR"]),
      NAMA_STORE: getNormalizedString(["NAMA_STORE", "NAMA STORE", "NAMA TOKO", "NAMA_TOKO", "STORE NAME", "STORENAME", "NAMA_TOR"]),
      STATUS: statusVal,
      AC: getNormalizedString(["AC", "AREA_CO_ORD", "AREA COORDINATOR", "C_ORD", "AREA_COORDINATOR", "COORD", "PIC_AC"]),
      AM: getNormalizedString(["AM", "AREA_MANAGER", "AREA_MNGR", "AREA MANAGER", "MANAGER", "PIC_AM"]),
      TIPE_BEANSPC: tipeBeanspcVal,
      PLU: getNormalizedString(["PLU", "KODE PLU", "PLU CODE", "MATERIAL", "KODE_PLU"]),
      DESCP: getNormalizedString(["DESCP", "DESCRIPTION", "NAMA BARANG", "DESKRIPSI", "NAMA_BARANG", "DESKRIPSI_BARANG", "NAMA BARANG UNTUK BEANSPOT"]),
      SUBDEPT: getNormalizedString(["SUBDEPT", "SUB DEPT", "SUB_DEPT", "DEPT", "DEPARTMENT", "CATEGORY", "KATEGORI", "SUBDEPARTMENT", "SUB_DEPARTMENT"]),
      SALES: sales,
      SALES_QTY: salesQty,
      VALUE_KOR_MUSNAH: valueKorMusnah
    };
  });
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "guide">("dashboard");
  const [records, setRecords] = useState<StoreRecord[]>(() => normalizeRecords(SAMPLE_STORE_RECORDS, true));
  const [isDemo, setIsDemo] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState<AppsScriptConfig>({
    url: "",
    isConnected: false,
    lastFetched: null
  });

  // Load configured Web App URL from localStorage on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem("sheet_apps_script_url");
    const wasConnected = localStorage.getItem("sheet_is_connected") === "true";
    const lastFetchTime = localStorage.getItem("sheet_last_fetched");

    if (savedUrl) {
      setConfig({
        url: savedUrl,
        isConnected: wasConnected,
        lastFetched: lastFetchTime
      });
      // Fetch fresh data if previously connected
      if (wasConnected) {
        fetchData(savedUrl);
      }
    }
  }, []);

  const fetchData = async (url: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Direct Web App fetch
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP Error: Terjadi kesalahan status respon ${res.status}`);
      }

      const rawJson = await res.json();
      
      let rawArray: any[] = [];
      if (rawJson && rawJson.status === "success" && Array.isArray(rawJson.data)) {
        rawArray = rawJson.data;
      } else if (Array.isArray(rawJson)) {
        rawArray = rawJson;
      } else if (rawJson && Array.isArray(rawJson.data)) {
        rawArray = rawJson.data;
      } else {
        throw new Error("Respon Apps Script tidak valid. Pastikan return data berupa array []");
      }

      if (rawArray.length === 0) {
        throw new Error("Koneksi berhasil tetapi spreadsheet tidak mengembalikan baris data apa pun.");
      }

      const normalized = normalizeRecords(rawArray, false);
      
      setRecords(normalized);
      setIsDemo(false);
      
      const currentTime = new Date().toLocaleString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "numeric",
        month: "short"
      });

      setConfig({
        url,
        isConnected: true,
        lastFetched: currentTime
      });

      // Save to localStorage
      localStorage.setItem("sheet_apps_script_url", url);
      localStorage.setItem("sheet_is_connected", "true");
      localStorage.setItem("sheet_last_fetched", currentTime);

      // Transition smoothly back to dashboard
      setActiveTab("dashboard");

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Gagal menghubungi Apps Script URL. Pastikan Anda telah mengaktifkan akses 'Anyone' (Siapa Saja) pada deployment Apps Script.");
      setConfig(prev => ({
        ...prev,
        isConnected: false
      }));
      localStorage.setItem("sheet_is_connected", "false");
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectSpreadsheet = () => {
    localStorage.removeItem("sheet_apps_script_url");
    localStorage.removeItem("sheet_is_connected");
    localStorage.removeItem("sheet_last_fetched");
    
    setConfig({
      url: "",
      isConnected: false,
      lastFetched: null
    });
    setRecords(normalizeRecords(SAMPLE_STORE_RECORDS, true));
    setIsDemo(true);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      {/* Absolute Frosted Glass Radial Glows */}
      <div className="absolute top-[-150px] left-[-150px] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute top-[30%] right-[-100px] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-150px] left-[15%] w-[600px] h-[600px] bg-emerald-600/8 rounded-full blur-[140px] pointer-events-none z-0"></div>

      {/* High-craft header with Backdrop Blur */}
      <header className="backdrop-blur-xl bg-[#0b0f19]/75 border-b border-white/5 sticky top-0 z-40 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Logo Title */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-500 to-violet-500 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <FileSpreadsheet className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white tracking-tight">Bean Spot Ops Controller</h1>
                <span className="text-[10px] bg-white/5 border border-white/10 text-slate-300 font-mono px-2 py-0.5 rounded font-bold">v1.1</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Dashboard Pemantauan & Analisis Penjualan Toko</p>
            </div>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center gap-2 sm:self-center">
            {config.isConnected ? (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3.5 py-1.5 rounded-xl">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span className="font-semibold text-[11px]">Sheet Terkoneksi</span>
                <span className="text-[10px] text-emerald-300">({config.lastFetched})</span>
                <button 
                  onClick={() => fetchData(config.url)}
                  disabled={isLoading}
                  title="Refresh Data Sekarang"
                  className="p-1 hover:bg-emerald-500/20 rounded text-emerald-400 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                </button>
                <div className="h-3 w-px bg-emerald-500/20" />
                <button 
                  onClick={disconnectSpreadsheet}
                  className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition cursor-pointer"
                >
                  Ganti
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 text-slate-300 text-xs px-3.5 py-1.5 rounded-xl">
                <WifiOff className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-[11px] text-slate-400">Mode Sandbox (Data Replikasi)</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab switcher navigation bar */}
        <div className="border-t border-white/5 bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
            <button
              onClick={() => setActiveTab("dashboard")}
              id="tab_analitik"
              className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? "border-indigo-500 text-indigo-400 bg-white/5"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <BarChart2 className="w-4 h-4" /> Dashboard Analitik ({records.length})
            </button>
            <button
              onClick={() => setActiveTab("guide")}
              id="tab_sheets"
              className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === "guide"
                  ? "border-indigo-500 text-indigo-400 bg-white/5"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <BookOpen className="w-4 h-4" /> Integrasi Google Sheet
            </button>
          </div>
        </div>
      </header>

      {/* Main dashboard content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 relative z-10 w-full">
        {activeTab === "dashboard" ? (
          <DashboardOverview records={records} isDemo={isDemo} />
        ) : (
          <AppsScriptGuide 
            onConnect={fetchData} 
            isLoading={isLoading} 
            error={error} 
            currentUrl={config.url} 
          />
        )}
      </main>

      {/* Corporate Styled Footer */}
      <footer className="bg-[#050811]/90 backdrop-blur-md text-slate-400 border-t border-white/5 py-8 mt-12 text-center text-xs relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-semibold">Store Operations Controller © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Dukungan Teknis: dawenkries@gmail.com</span>
            <span className="hidden md:inline text-white/5">·</span>
            <button
              onClick={() => {
                setActiveTab("guide");
                const el = document.getElementById("tutorial_section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="hover:text-white transition font-medium cursor-pointer"
            >
              Petunjuk Integrasi API
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
