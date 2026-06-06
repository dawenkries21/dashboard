export interface StoreRecord {
  TANGGAL: string | number;
  REGIONAL: string;
  BRANCH: string;
  KD_STORE: string;
  NAMA_STORE: string;
  STATUS: string;
  AC: string;
  AM: string;
  TIPE_BEANSPC: string;
  PLU: string | number;
  DESCP: string;
  SUBDEPT: string;
  SALES?: number;
  SALES_QTY?: number;
  VALUE_KOR_MUSNAH?: number;
}

export interface DashboardFilters {
  regional: string;
  branch: string;
  status: string;
  ac: string;
  am: string;
  tipeBeanspc: string;
  subdept: string;
  search: string;
}

export interface AppsScriptConfig {
  url: string;
  isConnected: boolean;
  lastFetched: string | null;
}
