import React, { useState } from "react";
import { FileSpreadsheet, Copy, Check, ExternalLink, HelpCircle, Code, ArrowRight } from "lucide-react";

interface AppsScriptGuideProps {
  onConnect: (url: string) => void;
  isLoading: boolean;
  error: string | null;
  currentUrl: string;
}

export default function AppsScriptGuide({ onConnect, isLoading, error, currentUrl }: AppsScriptGuideProps) {
  const [urlInput, setUrlInput] = useState(currentUrl);
  const [copied, setCopied] = useState(false);

  const scriptCode = `function doGet(e) {
  // Mengambil spreadsheet aktif dan sheet pertama
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Mengambil semua baris data
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: "Sheet tidak memiliki baris data (kosong)" 
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Header kolom di baris 1
  var headers = rows[0];
  var data = [];
  
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var obj = {};
    var hasData = false;
    
    for (var j = 0; j < headers.length; j++) {
      var headerName = headers[j].toString().toUpperCase().trim();
      // Mengubah spasi menjadi underscore agar sesuai schema (contoh: NAMA STORE -> NAMA_STORE)
      var key = headerName.replace(/\\s+/g, '_');
      
      var val = row[j];
      // Format tanggal jika objek date
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
      }
      
      obj[key] = val;
      if (val !== "") {
        hasData = true;
      }
    }
    
    // Hanya tambahkan baris yang memiliki nilai
    if (hasData) {
      data.push(obj);
    }
  }
  
  // Buat output JSON dan dukung CORS
  var output = JSON.stringify({ status: "success", data: data });
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onConnect(urlInput.trim());
    }
  };

  return (
    <div id="tutorial_section" className="backdrop-blur-xl bg-white/[0.02] rounded-2xl shadow-2xl border border-white/10 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-350 border border-emerald-500/20 mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Google Sheets Integration
          </span>
          <h2 className="text-xl font-bold text-white">Menghubungkan Google Sheet sebagai Sumber Data</h2>
          <p className="text-sm text-slate-450 mt-1">
            Gunakan Google Apps Script untuk menjadikan Google Sheet Anda sebagai API Endpoint JSON yang aman.
          </p>
        </div>
        <a
          href="https://sheets.new"
          target="_blank"
          rel="referrer"
          className="inline-flex items-center gap-2 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/25 px-3.5 py-2 rounded-lg transition-all border border-indigo-500/25 cursor-pointer"
        >
          Buat Sheet Baru <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Grid Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step List */}
        <div className="space-y-6">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-400" /> Langkah-langkah Konfigurasi:
          </h3>

          <div className="relative border-l border-white/5 pl-6 ml-3 space-y-6">
            <div className="relative">
              <span className="absolute -left-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
                1
              </span>
              <h4 className="font-semibold text-sm text-white">Atur Struktur Baris Google Sheet</h4>
              <p className="text-xs text-slate-400 mt-1">
                Buat kolom-kolom persis seperti di bawah pada baris pertama spreadsheet Anda:
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {[
                  "TANGGAL",
                  "REGIONAL",
                  "BRANCH",
                  "KD STORE",
                  "NAMA STORE",
                  "STATUS",
                  "AC",
                  "AM",
                  "TIPE BEANSPC",
                  "PLU",
                  "DESCP",
                  "SUBDEPT",
                  "SALES",
                  "SALES QTY",
                  "VALUE KOR MUSNAH",
                ].map((col) => (
                  <span
                    key={col}
                    className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 shadow-sm"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <span className="absolute -left-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
                2
              </span>
              <h4 className="font-semibold text-sm text-white">Buka Penyetelan Apps Script</h4>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                Di menu atas Google Sheet, klik <strong className="text-slate-200">Ekstensi</strong> &rarr;{" "}
                <strong className="text-slate-200">Apps Script</strong>.
              </p>
            </div>

            <div className="relative">
              <span className="absolute -left-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
                3
              </span>
              <h4 className="font-semibold text-sm text-white">Tempelkan Kode</h4>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                Hapus semua kode bawaan di dalam editor Apps Script, lalu salin dan tempelkan kode di kolom sebelah kanan.
              </p>
            </div>

            <div className="relative">
              <span className="absolute -left-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
                4
              </span>
              <h4 className="font-semibold text-sm text-white">Terapkan sebagai Aplikasi Web</h4>
              <ul className="text-xs text-slate-400 mt-1 list-disc pl-4 space-y-1 font-sans">
                <li>
                  Klik tombol <strong className="text-slate-250">Terapkan (Deploy)</strong> &rarr;{" "}
                  <strong className="text-slate-250">Terapkan baru (New deployment)</strong>.
                </li>
                <li>
                  Pilih jenis terapkan: <strong className="text-slate-250">Aplikasi Web (Web App)</strong>.
                </li>
                <li>
                  Pada kolom <strong>"Yang memiliki akses (Who has access)"</strong>, pilih{" "}
                  <strong className="text-emerald-400 font-bold">Siapa saja (Anyone)</strong>.
                </li>
                <li>
                  Klik <strong className="text-slate-250">Terapkan</strong> dan berikan izin akses ke Google Akun Anda.
                </li>
              </ul>
            </div>

            <div className="relative">
              <span className="absolute -left-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
                5
              </span>
              <h4 className="font-semibold text-sm text-white">Hubungkan di Sini</h4>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                Salin tautan web app URL hasil deployment, masukkan ke form di bawah untuk mengakses spreadsheet secara langsung!
              </p>
            </div>
          </div>
        </div>

        {/* Code Block & Copy */}
        <div className="flex flex-col bg-[#050811] rounded-xl overflow-hidden border border-white/10 text-slate-300">
          <div className="flex items-center justify-between px-4 py-3 bg-[#0a0f1d] border-b border-white/5">
            <span className="text-xs font-mono font-medium flex items-center gap-1.5 text-slate-400">
              <Code className="w-3.5 h-3.5 text-emerald-400" /> code.gs (Google Apps Script)
            </span>
            <button
              onClick={copyToClipboard}
              id="copy_script_code_btn"
              className="inline-flex items-center gap-1 text-[10px] bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white px-2 py-1.5 rounded transition border border-white/10 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" /> Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Salin Kode
                </>
              )}
            </button>
          </div>
          <div className="p-4 overflow-y-auto max-h-[360px] font-mono text-xs leading-relaxed text-slate-300">
            <pre>{scriptCode}</pre>
          </div>
        </div>
      </div>

      {/* Sync URL Form */}
      <div className="backdrop-blur-md bg-white/[0.01] rounded-xl p-5 border border-white/10">
        <form onSubmit={handleSubmit} className="space-y-3.5 max-w-4xl">
          <div>
            <label htmlFor="sheets-url-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
              URL Aplikasi Web Google Apps Script Anda:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="sheets-url-input"
                type="url"
                required
                placeholder="https://script.google.com/macros/s/.../exec"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 px-4 py-2 text-sm bg-[#050811]/90 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-550 shadow-inner"
              />
              <button
                type="submit"
                id="connect_sheets_btn"
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-5 py-2 rounded-lg transition-colors inline-flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? "Menghubungkan..." : "Hubungkan Data"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-rose-450 font-medium bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">{error}</p>}
          {currentUrl && !error && (
            <p className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 animate-bounce" /> Terhubung dengan: {currentUrl}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
