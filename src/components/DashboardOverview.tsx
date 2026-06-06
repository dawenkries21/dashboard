import { useState, useMemo } from "react";
import { 
  StoreRecord, 
  DashboardFilters 
} from "../types";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  Layers, 
  Store, 
  Search, 
  FilterX, 
  Map as LucideMapIcon, 
  Tag, 
  TrendingDown, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  PieChart as LucidePieIcon,
  Barcode
} from "lucide-react";

interface DashboardOverviewProps {
  records: StoreRecord[];
  isDemo: boolean;
}

export default function DashboardOverview({ records, isDemo }: DashboardOverviewProps) {
  // Filters State
  const [filters, setFilters] = useState<DashboardFilters>({
    regional: "",
    branch: "",
    status: "",
    ac: "",
    am: "",
    tipeBeanspc: "",
    subdept: "",
    search: ""
  });

  // Table Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Active Dashboard Subnavigation Tab
  const [activeDashboardTab, setActiveDashboardTab] = useState<"semua" | "grafik" | "peringkat" | "tabel">("semua");

  // Derive unique options for filters from ALL available records
  const filterOptions = useMemo(() => {
    const acs = new Set<string>();
    const ams = new Set<string>();
    const tipeBeanspcs = new Set<string>();
    const subdepts = new Set<string>();

    records.forEach(r => {
      if (r.AC) acs.add(r.AC);
      if (r.AM) ams.add(r.AM);
      if (r.TIPE_BEANSPC) tipeBeanspcs.add(r.TIPE_BEANSPC);
      if (r.SUBDEPT) subdepts.add(r.SUBDEPT);
    });

    return {
      regional: [] as string[],
      branch: [] as string[],
      status: [] as string[],
      ac: Array.from(acs).sort(),
      am: Array.from(ams).sort(),
      tipeBeanspc: Array.from(tipeBeanspcs).sort(),
      subdept: Array.from(subdepts).sort()
    };
  }, [records]);

  // Handle individual filter updates
  const handleFilterChange = (key: keyof DashboardFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPage(1); // Reset to page 1 on filter
  };

  const clearFilters = () => {
    setFilters({
      regional: "",
      branch: "",
      status: "",
      ac: "",
      am: "",
      tipeBeanspc: "",
      subdept: "",
      search: ""
    });
    setPage(1);
  };

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Direct exact filters
      if (filters.ac && r.AC !== filters.ac) return false;
      if (filters.am && r.AM !== filters.am) return false;
      if (filters.tipeBeanspc && r.TIPE_BEANSPC !== filters.tipeBeanspc) return false;
      if (filters.subdept && r.SUBDEPT !== filters.subdept) return false;

      // Text Search: Store names, codes, AMs, Item Descriptions
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const searchPool = [
          r.NAMA_STORE,
          r.KD_STORE,
          r.DESCP,
          r.AC,
          r.AM,
          r.SUBDEPT
        ].map(val => (val || "").toString().toLowerCase());

        if (!searchPool.some(val => val.includes(query))) {
          return false;
        }
      }

      return true;
    });
  }, [records, filters]);

  // Format currency helpers
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatCompactCurrency = (value: number) => {
    if (value >= 1_000_000_000) {
      return `Rp ${(value / 1_000_000_000).toFixed(2).replace(".", ",")} M`;
    }
    if (value >= 1_000_000) {
      return `Rp ${(value / 1_000_000).toFixed(1).replace(".", ",")} Jt`;
    }
    return formatCurrency(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0
    }).format(value);
  };

  // Derived high-level stats based on filtered dataset
  const stats = useMemo(() => {
    const totalRecords = filteredRecords.length;
    const uniqueStores = new Set(filteredRecords.map(r => r.KD_STORE)).size;
    const uniqueAMs = new Set(filteredRecords.map(r => r.AM).filter(Boolean)).size;
    const uniqueACs = new Set(filteredRecords.map(r => r.AC).filter(Boolean)).size;
    
    // Franchise Ratio
    const franchiseCount = filteredRecords.filter(r => r.STATUS === "FRANCHISE").length;
    const regularCount = filteredRecords.filter(r => r.STATUS === "REGULER").length;
    
    // PLU count
    const uniquePLUs = new Set(filteredRecords.map(r => r.PLU).filter(Boolean)).size;

    // Numerical KPI metrics
    let totalSales = 0;
    let totalSalesQty = 0;
    let totalValueKorMusnah = 0;

    filteredRecords.forEach(r => {
      totalSales += r.SALES || 0;
      totalSalesQty += r.SALES_QTY || 0;
      totalValueKorMusnah += r.VALUE_KOR_MUSNAH || 0;
    });

    // Bean Spot Type counts by unique store inside the current filtered records
    const storeBeanspotMap = new Map<string, string>();
    filteredRecords.forEach(r => {
      if (r.KD_STORE) {
        storeBeanspotMap.set(String(r.KD_STORE), r.TIPE_BEANSPC || "N/A");
      }
    });

    const beanspotStoreCounts: Record<string, number> = {
      ADVANCE: 0,
      MEDIUM: 0,
      BASIC: 0,
      "NO BEAN SPOT": 0
    };

    storeBeanspotMap.forEach((type) => {
      const t = String(type).trim().toUpperCase();
      if (t === "ADVANCE") {
        beanspotStoreCounts.ADVANCE++;
      } else if (t === "MEDIUM") {
        beanspotStoreCounts.MEDIUM++;
      } else if (t === "BASIC") {
        beanspotStoreCounts.BASIC++;
      } else {
        beanspotStoreCounts["NO BEAN SPOT"]++;
      }
    });

    return {
      totalRecords,
      uniqueStores,
      uniqueAMs,
      uniqueACs,
      franchiseCount,
      regularCount,
      uniquePLUs,
      totalSales,
      totalSalesQty,
      totalValueKorMusnah,
      beanspotStoreCounts
    };
  }, [filteredRecords]);

  // Colors for visualization cards and cell elements
  const BEANSPC_COLORS: Record<string, string> = {
    ADVANCE: "#6366f1", // Neon Indigo
    MEDIUM: "#06b6d4", // Neon Cyan
    BASIC: "#10b981",  // Neon Emerald
    "NO BEAN SPOT": "#f43f5e", // Neon Rose
    DEFAULT: "#64748b" // Slate
  };

  const SUBDEPT_COLORS: Record<string, string> = {
    "READY TO DRINK": "#a855f7", // Purple
    "READY TO EAT": "#f97316",   // Orange
    "BAKERY AND SNACK": "#eab308", // Yellow
    "RAW MATERIAL": "#3b82f6",     // Blue
    DEFAULT: "#94a3b8"
  };

  // Recharts: Subdepartment Distribution
  const subdepartmentChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      const dept = r.SUBDEPT || "LAINNYA";
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: SUBDEPT_COLORS[name] || SUBDEPT_COLORS.DEFAULT
    })).sort((a, b) => b.value - a.value);
  }, [filteredRecords]);

  // Recharts: BeanSpot Type Distribution
  const beanspcChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      const type = r.TIPE_BEANSPC || "Belum Ditentukan";
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: BEANSPC_COLORS[name] || BEANSPC_COLORS.DEFAULT
    }));
  }, [filteredRecords]);

  // Recharts: Sales per Tanggal (Daily Sales Trend)
  const salesByDateChartData = useMemo(() => {
    const grouped: Record<string, { dateStr: string; dateVal: any; sales: number; musnah: number }> = {};
    
    filteredRecords.forEach(r => {
      const rawDate = r.TANGGAL;
      if (rawDate === undefined || rawDate === null || rawDate === "") return;
      
      const key = String(rawDate);
      if (!grouped[key]) {
        grouped[key] = {
          dateStr: key,
          dateVal: rawDate,
          sales: 0,
          musnah: 0
        };
      }
      grouped[key].sales += r.SALES || 0;
      grouped[key].musnah += r.VALUE_KOR_MUSNAH || 0;
    });

    // Sort chronologically based on raw value type (number index vs date string)
    return Object.values(grouped).sort((a, b) => {
      const valA = a.dateVal;
      const valB = b.dateVal;
      
      if (typeof valA === "number" && typeof valB === "number") {
        return valA - valB;
      }
      
      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      
      const dateA = new Date(valA);
      const dateB = new Date(valB);
      if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
        return dateA.getTime() - dateB.getTime();
      }
      
      return String(valA).localeCompare(String(valB));
    });
  }, [filteredRecords]);

  // Custom tooltips for trends
  const CustomDateTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="backdrop-blur-xl bg-slate-950/95 border border-white/10 rounded-xl p-3 shadow-2xl text-[11px] space-y-1.5 text-left">
          <p className="font-bold text-slate-200 font-sans tracking-wide">
            TANGGAL: <span className="font-mono text-amber-300">{data.dateStr}</span>
          </p>
          <div className="border-t border-white/5 pt-1.5 space-y-1">
            <div className="flex justify-between items-center gap-6">
              <span className="text-slate-400 text-[10px]">Total Sales:</span>
              <span className="text-emerald-450 font-mono font-black">{formatCurrency(data.sales)}</span>
            </div>
            <div className="flex justify-between items-center gap-6">
              <span className="text-slate-400 text-[10px]">Total Musnah:</span>
              <span className="text-rose-400 font-mono font-bold">{formatCurrency(data.musnah)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Recharts: Status Breakdown (REGULER vs FRANCHISE)
  const statusChartData = useMemo(() => {
    return [
      { name: "Reguler", value: stats.regularCount, color: "#6366f1" },
      { name: "Franchise", value: stats.franchiseCount, color: "#10b981" }
    ].filter(i => i.value > 0);
  }, [stats]);

  // Compute 10 Item Sales Tertinggi
  const topSalesItems = useMemo(() => {
    const grouped: Record<string, { PLU: string | number; DESCP: string; SUBDEPT: string; SALES: number; SALES_QTY: number }> = {};
    filteredRecords.forEach(r => {
      const key = `${r.PLU || "N/A"}-${r.DESCP || "N/A"}`;
      if (!grouped[key]) {
        grouped[key] = {
          PLU: r.PLU || "",
          DESCP: r.DESCP || "N/A",
          SUBDEPT: r.SUBDEPT || "N/A",
          SALES: 0,
          SALES_QTY: 0
        };
      }
      grouped[key].SALES += r.SALES || 0;
      grouped[key].SALES_QTY += r.SALES_QTY || 0;
    });

    return Object.values(grouped)
      .sort((a, b) => b.SALES - a.SALES)
      .slice(0, 10);
  }, [filteredRecords]);

  // Compute 10 Item Kor Musnah Tertinggi
  const topKorMusnahItems = useMemo(() => {
    const grouped: Record<string, { PLU: string | number; DESCP: string; SUBDEPT: string; VALUE_KOR_MUSNAH: number; SALES: number }> = {};
    filteredRecords.forEach(r => {
      const key = `${r.PLU || "N/A"}-${r.DESCP || "N/A"}`;
      if (!grouped[key]) {
        grouped[key] = {
          PLU: r.PLU || "",
          DESCP: r.DESCP || "N/A",
          SUBDEPT: r.SUBDEPT || "N/A",
          VALUE_KOR_MUSNAH: 0,
          SALES: 0
        };
      }
      grouped[key].VALUE_KOR_MUSNAH += r.VALUE_KOR_MUSNAH || 0;
      grouped[key].SALES += r.SALES || 0;
    });

    return Object.values(grouped)
      .sort((a, b) => b.VALUE_KOR_MUSNAH - a.VALUE_KOR_MUSNAH)
      .slice(0, 10);
  }, [filteredRecords]);

  // Group records by store (KD_STORE)
  const storeSummaries = useMemo(() => {
    const grouped: Record<string, {
      KD_STORE: string;
      NAMA_STORE: string;
      REGIONAL: string;
      BRANCH: string;
      STATUS: string;
      AC: string;
      AM: string;
      TIPE_BEANSPC: string;
      TANGGAL: string;
      SALES: number;
      SALES_QTY: number;
      VALUE_KOR_MUSNAH: number;
      PLU_COUNT: number;
    }> = {};

    filteredRecords.forEach(r => {
      const storeCode = String(r.KD_STORE || "N/A");
      if (!grouped[storeCode]) {
        grouped[storeCode] = {
          KD_STORE: storeCode,
          NAMA_STORE: r.NAMA_STORE || "N/A",
          REGIONAL: r.REGIONAL || "N/A",
          BRANCH: r.BRANCH || "N/A",
          STATUS: r.STATUS || "N/A",
          AC: r.AC || "N/A",
          AM: r.AM || "N/A",
          TIPE_BEANSPC: r.TIPE_BEANSPC || "N/A",
          TANGGAL: r.TANGGAL || "N/A",
          SALES: 0,
          SALES_QTY: 0,
          VALUE_KOR_MUSNAH: 0,
          PLU_COUNT: 0,
        };
      }
      grouped[storeCode].SALES += r.SALES || 0;
      grouped[storeCode].SALES_QTY += r.SALES_QTY || 0;
      grouped[storeCode].VALUE_KOR_MUSNAH += r.VALUE_KOR_MUSNAH || 0;
      grouped[storeCode].PLU_COUNT += 1;
    });

    return Object.values(grouped).sort((a, b) => b.SALES - a.SALES);
  }, [filteredRecords]);

  // Data reversed for horizontal bar charts so highest item appears on top
  const topSalesChartData = useMemo(() => {
    return [...topSalesItems].reverse().map((item, index) => ({
      ...item,
      rank: 10 - index,
      shortName: item.DESCP.length > 20 ? `${item.DESCP.substring(0, 17)}...` : item.DESCP
    }));
  }, [topSalesItems]);

  const topKorMusnahChartData = useMemo(() => {
    return [...topKorMusnahItems].reverse().map((item, index) => ({
      ...item,
      rank: 10 - index,
      shortName: item.DESCP.length > 20 ? `${item.DESCP.substring(0, 17)}...` : item.DESCP
    }));
  }, [topKorMusnahItems]);

  // 10 Toko Sales Tertinggi
  const topStoresSales = useMemo(() => {
    return [...storeSummaries]
      .sort((a, b) => b.SALES - a.SALES)
      .slice(0, 10);
  }, [storeSummaries]);

  // 10 Toko Musnah/Loss Tertinggi
  const topStoresMusnah = useMemo(() => {
    return [...storeSummaries]
      .sort((a, b) => b.VALUE_KOR_MUSNAH - a.VALUE_KOR_MUSNAH)
      .slice(0, 10);
  }, [storeSummaries]);

  // Adapters for Horizontal Bar Charts (reversing so highest appears on top)
  const topStoresSalesChartData = useMemo(() => {
    return [...topStoresSales].reverse().map((item, index) => ({
      ...item,
      rank: Math.min(10, topStoresSales.length) - index,
      shortName: item.NAMA_STORE.length > 20 ? `${item.NAMA_STORE.substring(0, 17)}...` : item.NAMA_STORE
    }));
  }, [topStoresSales]);

  const topStoresMusnahChartData = useMemo(() => {
    return [...topStoresMusnah].reverse().map((item, index) => ({
      ...item,
      rank: Math.min(10, topStoresMusnah.length) - index,
      shortName: item.NAMA_STORE.length > 20 ? `${item.NAMA_STORE.substring(0, 17)}...` : item.NAMA_STORE
    }));
  }, [topStoresMusnah]);

  const CustomStoreTooltip = ({ active, payload, isLoss }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="backdrop-blur-xl bg-slate-950/95 border border-white/10 rounded-xl p-3 shadow-2xl text-[11px] space-y-1 text-left">
          <p className="font-bold text-amber-300 font-sans tracking-wide uppercase line-clamp-2 max-w-[240px]">
            {data.NAMA_STORE}
          </p>
          <div className="flex gap-2 items-center text-slate-400 text-[10px] pb-1 border-b border-white/5">
            <span className="font-mono bg-white/5 px-1 py-0.5 rounded text-white">{data.KD_STORE}</span>
            <span>•</span>
            <span className="uppercase text-[9px]">{data.BRANCH}</span>
          </div>
          <div className="space-y-0.5 text-slate-400 text-[10px] pb-1 border-b border-white/5">
            <div className="flex justify-between gap-4">
              <span>AM:</span>
              <span className="text-slate-250 font-semibold">{data.AM}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>AC:</span>
              <span className="text-slate-250 font-semibold">{data.AC}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Status:</span>
              <span className="text-slate-250 font-semibold">{data.STATUS}</span>
            </div>
          </div>
          <p className="text-white pt-1 text-[11px] flex justify-between gap-4">
            <span>{isLoss ? "Beban Musnah:" : "Nilai Sales:"}</span>
            <strong className={isLoss ? "text-rose-400 font-mono text-xs font-black" : "text-emerald-400 font-mono text-xs font-black"}>
              {formatCurrency(payload[0].value)}
            </strong>
          </p>
          {!isLoss && data.SALES_QTY !== undefined && (
            <p className="text-slate-300 text-[10px] flex justify-between gap-4">
              <span>Qty Terjual:</span>
              <strong className="text-white font-mono">{formatNumber(data.SALES_QTY)} pcs</strong>
            </p>
          )}
          {isLoss && data.SALES !== undefined && (
            <>
              <p className="text-slate-300 text-[10px] flex justify-between gap-4">
                <span>Total Sales:</span>
                <strong className="text-white font-mono">{formatCurrency(data.SALES)}</strong>
              </p>
              <p className="text-slate-300 text-[10px] flex justify-between gap-4">
                <span>Rasio Loss:</span>
                <strong className="text-rose-350 font-mono">{((payload[0].value / (data.SALES || 1)) * 100).toFixed(1).replace(".", ",")}%</strong>
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, isLoss }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="backdrop-blur-xl bg-slate-950/95 border border-white/10 rounded-xl p-3 shadow-2xl text-[11px] space-y-1 text-left">
          <p className="font-bold text-amber-300 font-sans tracking-wide uppercase line-clamp-2 max-w-[240px]">
            {data.DESCP}
          </p>
          <div className="flex gap-2 items-center text-slate-400 text-[10px] pb-1 border-b border-white/5">
            <span className="font-mono bg-white/5 px-1 py-0.5 rounded text-white">PLU {data.PLU}</span>
            <span>•</span>
            <span className="uppercase text-[9px]">{data.SUBDEPT}</span>
          </div>
          <p className="text-white pt-1 text-[11px] flex justify-between gap-4">
            <span>{isLoss ? "Beban Musnah:" : "Nilai Sales:"}</span>
            <strong className={isLoss ? "text-rose-400 font-mono text-xs font-black" : "text-emerald-400 font-mono text-xs font-black"}>
              {formatCurrency(payload[0].value)}
            </strong>
          </p>
          {!isLoss && data.SALES_QTY !== undefined && (
            <p className="text-slate-300 text-[10px] flex justify-between gap-4">
              <span>Qty Terjual:</span>
              <strong className="text-white font-mono">{formatNumber(data.SALES_QTY)} pcs</strong>
            </p>
          )}
          {isLoss && data.SALES !== undefined && (
            <>
              <p className="text-slate-300 text-[10px] flex justify-between gap-4">
                <span>Total Sales:</span>
                <strong className="text-white font-mono">{formatCurrency(data.SALES)}</strong>
              </p>
              <p className="text-slate-300 text-[10px] flex justify-between gap-4">
                <span>Rasio Loss:</span>
                <strong className="text-rose-350 font-mono">{((payload[0].value / (data.SALES || 1)) * 100).toFixed(1).replace(".", ",")}%</strong>
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  // Paginated raw list
  const paginatedRecords = useMemo(() => {
    const offset = (page - 1) * itemsPerPage;
    return storeSummaries.slice(offset, offset + itemsPerPage);
  }, [storeSummaries, page, itemsPerPage]);

  const totalPages = Math.ceil(storeSummaries.length / itemsPerPage) || 1;

  return (
    <div className="space-y-8">
      {/* Seed State Disclaimer */}
      {isDemo && (
        <div className="backdrop-blur-md bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-white p-2.5 rounded-xl shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-400">Mode Demo Aktif (Pratinjau)</h4>
              <p className="text-xs text-amber-250/80 mt-0.5">
                Menggunakan database replika dari foto spreadsheet yang diunggah. Untuk melihat data Excel Anda secara real-time, silakan konfigurasikan Google Sheets Anda di tab tutorial di bawah.
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              const el = document.getElementById("tutorial_section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-xs font-semibold bg-amber-500 hover:bg-amber-650 text-white px-3.5 py-2 rounded-lg shadow transition cursor-pointer flex-shrink-0"
          >
            Hubungkan Spreadsheet Sekarang
          </button>
        </div>
      )}

      {/* Interactive Quick Filter Panel */}
      <div id="filter-wrapper" className="backdrop-blur-xl bg-white/[0.02] border border-white/10 rounded-2xl shadow-2xl shadow-black/40 p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="font-bold text-white flex items-center gap-2">
            <LucideMapIcon className="w-4 h-4 text-indigo-400" /> Filter & Navigasi Operasional
          </h3>
          <button
            onClick={clearFilters}
            id="clear_filters_btn"
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 py-1 px-2.5 hover:bg-white/5 rounded-md transition cursor-pointer"
          >
            <FilterX className="w-3.5 h-3.5" /> Atur Ulang Filter
          </button>
        </div>

        {/* Input Text Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            id="text_search_input"
            type="text"
            placeholder="Cari kode store, nama toko, nama brand description atau PIC AC/AM..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-white/[0.06] transition-all placeholder-slate-500 text-white"
          />
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* AC */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">AREA COORD (AC)</label>
            <select
              id="filter_ac"
              value={filters.ac}
              onChange={(e) => handleFilterChange("ac", e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-[#0b0f19] border border-white/10 rounded-lg text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="" className="bg-[#0b0f19] text-slate-250">Semua</option>
              {filterOptions.ac.map(ac => (
                <option key={ac} value={ac} className="bg-[#0b0f19] text-slate-200">{ac}</option>
              ))}
            </select>
          </div>

          {/* AM */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">AREA MGR (AM)</label>
            <select
              id="filter_am"
              value={filters.am}
              onChange={(e) => handleFilterChange("am", e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-[#0b0f19] border border-white/10 rounded-lg text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="" className="bg-[#0b0f19] text-slate-250">Semua</option>
              {filterOptions.am.map(am => (
                <option key={am} value={am} className="bg-[#0b0f19] text-slate-200">{am}</option>
              ))}
            </select>
          </div>

          {/* TIPE BEANSPC */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">BEAN SPOT TYPE</label>
            <select
              id="filter_beanspot"
              value={filters.tipeBeanspc}
              onChange={(e) => handleFilterChange("tipeBeanspc", e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-[#0b0f19] border border-white/10 rounded-lg text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="" className="bg-[#0b0f19] text-slate-250">Semua</option>
              {filterOptions.tipeBeanspc.map(t => (
                <option key={t} value={t} className="bg-[#0b0f19] text-slate-200">{t}</option>
              ))}
            </select>
          </div>

          {/* SUBDEPT */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SUBDEPT</label>
            <select
              id="filter_subdept"
              value={filters.subdept}
              onChange={(e) => handleFilterChange("subdept", e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-[#0b0f19] border border-white/10 rounded-lg text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="" className="bg-[#0b0f19] text-slate-250">Semua</option>
              {filterOptions.subdept.map(sd => (
                <option key={sd} value={sd} className="bg-[#0b0f19] text-slate-200">{sd}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL TOKO */}
        <div className="backdrop-blur-md bg-white/[0.03] border border-white/10 rounded-2xl shadow-xl p-4 md:p-5 flex items-center justify-between hover:bg-white/[0.05] transition-all duration-350">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Total Store (Toko)</span>
            <span className="text-2xl md:text-3xl font-black text-white tracking-tight">{stats.uniqueStores}</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20">
                {stats.regularCount} Reg
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20">
                {stats.franchiseCount} Fran
              </span>
            </div>
          </div>
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-lg">
            <Store className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* SALES REVENUE */}
        <div className="backdrop-blur-md bg-white/[0.03] border border-white/10 rounded-2xl shadow-xl p-4 md:p-5 flex items-center justify-between hover:bg-white/[0.05] transition-all duration-350">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Sales (Omset)</span>
            <span className="text-2xl md:text-3xl font-black text-white tracking-tight" title={formatCurrency(stats.totalSales)}>
              {formatCompactCurrency(stats.totalSales)}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 font-semibold border border-purple-500/20">OMSET</span>
              <span className="text-[10px] text-slate-400">Total penjualan</span>
            </div>
            {/* Bean Spot Type Breakdown */}
            <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-white/5">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/15 font-bold" title="Advance">
                ADV: {stats.beanspotStoreCounts.ADVANCE}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/15 font-bold" title="Medium">
                MED: {stats.beanspotStoreCounts.MEDIUM}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/15 font-bold" title="Basic">
                BAS: {stats.beanspotStoreCounts.BASIC}
              </span>
              {stats.beanspotStoreCounts["NO BEAN SPOT"] > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 font-bold" title="No Bean Spot">
                  NO: {stats.beanspotStoreCounts["NO BEAN SPOT"]}
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-lg self-start">
            <TrendingUp className="w-5 h-5 text-purple-450" />
          </div>
        </div>

        {/* SALES QTY */}
        <div className="backdrop-blur-md bg-white/[0.03] border border-white/10 rounded-2xl shadow-xl p-4 md:p-5 flex items-center justify-between hover:bg-white/[0.05] transition-all duration-350">
          <div className="space-y-1.5 w-full pr-2">
            <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Sales Qty (Volume)</span>
            <span className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {formatNumber(stats.totalSalesQty)} <span className="text-xs text-slate-400 font-normal">pcs</span>
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20">Kuantitas</span>
              <span className="text-[10px] text-slate-400">Qty barang terjual</span>
            </div>
          </div>
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-lg flex-shrink-0">
            <Barcode className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        {/* VALUE KOR MUSNAH */}
        <div className="backdrop-blur-md bg-white/[0.03] border border-white/10 rounded-2xl shadow-xl p-4 md:p-5 flex items-center justify-between hover:bg-white/[0.05] transition-all duration-350">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Value Kor Musnah</span>
            <span className="text-2xl md:text-3xl font-black text-rose-450 tracking-tight" title={formatCurrency(stats.totalValueKorMusnah)}>
              {formatCompactCurrency(stats.totalValueKorMusnah)}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 font-semibold border border-rose-500/20">
                Loss: {((stats.totalValueKorMusnah / (stats.totalSales || 1)) * 100).toFixed(1).replace(".", ",")}%
              </span>
              <span className="text-[10px] text-slate-400">Pemusnahan</span>
            </div>
          </div>
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-lg">
            <TrendingDown className="w-5 h-5 text-rose-450" />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Menu Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white/[0.02] border border-white/10 rounded-2xl w-full">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider px-2 py-0.5 bg-indigo-500/10 rounded border border-indigo-500/15">Menu Dashboard:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveDashboardTab("semua")}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all duration-205 cursor-pointer border ${
              activeDashboardTab === "semua"
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
            }`}
          >
            <LucideMapIcon className="w-3.5 h-3.5" /> Semua Halaman
          </button>
          <button
            onClick={() => setActiveDashboardTab("grafik")}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all duration-205 cursor-pointer border ${
              activeDashboardTab === "grafik"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
            }`}
          >
            <LucidePieIcon className="w-3.5 h-3.5" /> Deskripsi & Distribusi PLU
          </button>
          <button
            onClick={() => setActiveDashboardTab("peringkat")}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all duration-205 cursor-pointer border ${
              activeDashboardTab === "peringkat"
                ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> 10 Toko Tertinggi
          </button>
          <button
            onClick={() => setActiveDashboardTab("tabel")}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all duration-205 cursor-pointer border ${
              activeDashboardTab === "tabel"
                ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Store className="w-3.5 h-3.5" /> Tabel Detail Toko
          </button>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      {(activeDashboardTab === "semua" || activeDashboardTab === "grafik") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Subdept Share (Left 7 Columns) */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl shadow-2xl p-5 md:p-6 lg:col-span-7 space-y-4">
          <div>
            <h4 className="font-bold text-white text-sm">Distribusi Kategori Produk (Subdept)</h4>
            <p className="text-[11px] text-slate-450 mt-0.5">Sebaran item di dalam toko berdasarkan departemen operasional</p>
          </div>
          <div className="h-64 sm:h-72">
            {subdepartmentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subdepartmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(11, 15, 25, 0.95)", 
                      backdropFilter: "blur(12px)", 
                      border: "1px solid rgba(255, 255, 255, 0.1)", 
                      borderRadius: "12px", 
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" 
                    }}
                    labelStyle={{ color: "#94a3b8", fontWeight: "bold", fontSize: 11 }}
                    itemStyle={{ color: "#fff", fontSize: 12 }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={45}>
                    {subdepartmentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Tidak ada data untuk filter ini</div>
            )}
          </div>
        </div>

        {/* Bean Spot Type distribution (Right 5 Columns) */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl shadow-2xl p-5 md:p-6 lg:col-span-5 space-y-4">
          <div>
            <h4 className="font-bold text-white text-sm">Model Bean Spot (Tipe BeanSPC)</h4>
            <p className="text-[11px] text-slate-455 mt-0.5">Segmentasi toko berdasarkan jangkauan modal dan penawaran</p>
          </div>
          <div className="h-64 sm:h-72 flex flex-col sm:flex-row items-center justify-center gap-6">
            {beanspcChartData.length > 0 ? (
              <>
                <div className="w-full sm:w-1/2 h-44 sm:h-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={beanspcChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {beanspcChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: "rgba(11, 15, 25, 0.95)", 
                          backdropFilter: "blur(12px)", 
                          border: "1px solid rgba(255, 255, 255, 0.1)", 
                          borderRadius: "12px" 
                        }}
                        itemStyle={{ color: "#fff", fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center metrics counts */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <span className="text-2xl font-black text-white">{stats.totalRecords}</span>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Item Toko</span>
                  </div>
                </div>

                {/* Legends details list */}
                <div className="flex-1 space-y-2 text-xs w-full">
                  {beanspcChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between border-b border-white/5 pb-1.5 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-200 text-xs">{item.value} toko</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400 font-medium">Tidak ada data untuk filter ini</div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Sales Trend over Dates */}
      {(activeDashboardTab === "semua" || activeDashboardTab === "grafik") && (
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl shadow-2xl p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div>
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Tren Penjualan per Tanggal
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Tren fluktuasi nominal penjualan (IDR) dan pemusnahan barang harian</p>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-500/15">
            Trend Chart
          </span>
        </div>
        <div className="h-64 sm:h-72 w-full pt-2">
          {salesByDateChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={salesByDateChartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorMusnah" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis 
                  dataKey="dateStr" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => formatCompactCurrency(val)} 
                />
                <Tooltip 
                  content={<CustomDateTooltip />}
                  cursor={{ stroke: "rgba(255, 255, 255, 0.08)", strokeWidth: 1 }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                  iconSize={8}
                />
                <Area 
                  name="Total Sales" 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
                <Area 
                  name="Total Musnah" 
                  type="monotone" 
                  dataKey="musnah" 
                  stroke="#f43f5e" 
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fillOpacity={1} 
                  fill="url(#colorMusnah)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">Tidak ada data untuk filter ini</div>
          )}
        </div>
      </div>
      )}

      {/* Top 10 Lists */}
      {(activeDashboardTab === "semua" || activeDashboardTab === "grafik") && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Sales Items Bar Chart */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl shadow-2xl p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> 10 Item Sales/Omset Tertinggi
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Produk dengan akumulasi nominal penjualan tertinggi (IDR)</p>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-500/15">
              Bar Chart
            </span>
          </div>
          <div className="h-[380px] w-full pt-2">
            {topSalesItems.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topSalesChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis 
                    type="number" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => formatCompactCurrency(val)} 
                  />
                  <YAxis 
                    dataKey="shortName" 
                    type="category" 
                    stroke="#cbd5e1" 
                    fontSize={10} 
                    width={110} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    content={<CustomBarTooltip isLoss={false} />}
                    cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
                  />
                  <Bar dataKey="SALES" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Tidak ada data item sales</div>
            )}
          </div>
        </div>

        {/* Top 10 Kor Musnah Items Bar Chart */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl shadow-2xl p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-400" /> 10 Item Musnah Tertinggi
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Produk dengan kerugian pemusnahan barang terbesar (IDR)</p>
            </div>
            <span className="text-[10px] bg-rose-500/10 text-rose-300 font-semibold px-2 py-0.5 rounded border border-rose-500/15">
              Bar Chart
            </span>
          </div>
          <div className="h-[380px] w-full pt-2">
            {topKorMusnahItems.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topKorMusnahChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis 
                    type="number" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => formatCompactCurrency(val)} 
                  />
                  <YAxis 
                    dataKey="shortName" 
                    type="category" 
                    stroke="#cbd5e1" 
                    fontSize={10} 
                    width={110} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    content={<CustomBarTooltip isLoss={true} />}
                    cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
                  />
                  <Bar dataKey="VALUE_KOR_MUSNAH" fill="#f43f5e" radius={[0, 4, 4, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Tidak ada data item pemusnahan</div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Top 10 Stores Lists */}
      {(activeDashboardTab === "semua" || activeDashboardTab === "peringkat") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
        {/* Top 10 Sales Stores Bar Chart */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl shadow-2xl p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> 10 Toko Sales/Omset Tertinggi
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Toko (Store) dengan akumulasi nominal penjualan tertinggi (IDR)</p>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-500/15">
              Bar Chart
            </span>
          </div>
          <div className="h-[380px] w-full pt-2">
            {topStoresSales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topStoresSalesChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis 
                    type="number" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => formatCompactCurrency(val)} 
                  />
                  <YAxis 
                    dataKey="shortName" 
                    type="category" 
                    stroke="#cbd5e1" 
                    fontSize={10} 
                    width={110} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    content={<CustomStoreTooltip isLoss={false} />}
                    cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
                  />
                  <Bar dataKey="SALES" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Tidak ada data toko sales</div>
            )}
          </div>
        </div>

        {/* Top 10 Kor Musnah Stores Bar Chart */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl shadow-2xl p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <div>
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-400" /> 10 Toko kor Musnah Tertinggi
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Toko (Store) dengan beban/nominal pemusnahan barang terbesar (IDR)</p>
            </div>
            <span className="text-[10px] bg-rose-500/10 text-rose-300 font-semibold px-2 py-0.5 rounded border border-rose-500/15">
              Bar Chart
            </span>
          </div>
          <div className="h-[380px] w-full pt-2">
            {topStoresMusnah.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topStoresMusnahChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis 
                    type="number" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => formatCompactCurrency(val)} 
                  />
                  <YAxis 
                    dataKey="shortName" 
                    type="category" 
                    stroke="#cbd5e1" 
                    fontSize={10} 
                    width={110} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    content={<CustomStoreTooltip isLoss={true} />}
                    cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
                  />
                  <Bar dataKey="VALUE_KOR_MUSNAH" fill="#f43f5e" radius={[0, 4, 4, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Tidak ada data toko pemusnahan</div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Raw Database Grid */}
      {(activeDashboardTab === "semua" || activeDashboardTab === "tabel") && (
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 bg-white/[0.02] border-b border-white/5 flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-slate-200 text-sm">Tabel Rekapitulasi Sales & Kor Musnah per Store</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Akumulasi omset (sales), qty penjualan, nominal pemusnahan (kor musnah), serta persentase loss per store/toko</p>
          </div>
          <span className="text-xs bg-white/5 border border-white/10 text-slate-300 px-2.5 py-1 rounded-full font-mono font-bold">
            Menampilkan {storeSummaries.length} toko
          </span>
        </div>

        {/* Responsive Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01] border-b border-white/5 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3 px-4">KODE & NAMA STORE</th>
                <th className="py-3 px-4">REGIONAL & BRANCH</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">AC & AM</th>
                <th className="py-3 px-4">BEAN SPOT</th>
                <th className="py-3 px-4 text-right">TOTAL SALES</th>
                <th className="py-3 px-4 text-right">VALUE KOR MUSNAH</th>
                <th className="py-3 px-4 text-right">LOSS RATIO %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((item, index) => {
                  const beanspcColor = BEANSPC_COLORS[item.TIPE_BEANSPC] || BEANSPC_COLORS.DEFAULT;
                  const ratioLoss = item.SALES > 0 ? (item.VALUE_KOR_MUSNAH / item.SALES) * 100 : 0;

                  return (
                    <tr key={`${item.KD_STORE}-${index}`} className="hover:bg-white/[0.02] transition animate-fadeIn">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono bg-white/5 border border-white/10 text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded w-max mb-1">
                            {item.KD_STORE}
                          </span>
                          <span className="font-bold text-white text-[11px] line-clamp-1 uppercase">{item.NAMA_STORE}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-300">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-200">{item.REGIONAL}</span>
                          <span className="text-[10px] text-slate-400">{item.BRANCH}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.STATUS === "REGULER" ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20" : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                        }`}>
                          {item.STATUS}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-200 text-[11px]">
                        <div className="flex flex-col text-[10px]">
                          <span className="font-semibold text-slate-100">{item.AC} <span className="text-slate-450 text-[9px]">(AC)</span></span>
                          <span className="text-slate-400">{item.AM} <span className="text-slate-450 text-[9px]">(AM)</span></span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span 
                          className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white shadow-md"
                          style={{ backgroundColor: beanspcColor }}
                        >
                          {item.TIPE_BEANSPC}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <div className="flex flex-col items-end">
                          <span className="text-emerald-450 font-bold text-[11px]">{formatCurrency(item.SALES)}</span>
                          <span className="text-[10px] text-slate-405 font-medium">{formatNumber(item.SALES_QTY)} pcs</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-450 font-bold text-[11px]">
                        {formatCurrency(item.VALUE_KOR_MUSNAH)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <span className={`inline-flex px-2 py-0.5 rounded font-black text-[10px] ${
                          ratioLoss > 10 ? "bg-rose-500/15 text-rose-300" : ratioLoss > 5 ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300"
                        }`}>
                          {ratioLoss.toFixed(2).replace(".", ",")}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium bg-white/[0.01]">
                    Tidak ditemukan baris yang sesuai dengan kriteria filter Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar controls */}
        {storeSummaries.length > 0 && (
          <div className="px-5 py-3.5 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-405 font-medium">
              Halaman <strong className="text-slate-200">{page}</strong> dari <strong className="text-slate-200">{totalPages}</strong>
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1 px-3.5 bg-white/5 border border-white/10 text-slate-300 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition font-semibold text-xs flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1 px-3.5 bg-white/5 border border-white/10 text-slate-300 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition font-semibold text-xs flex items-center gap-1 cursor-pointer"
              >
                Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
