/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SGXStock, MarketMetrics } from '../types/sgx';
import { exportToCSV, exportToJSON, copyMarkdownAnalysis } from '../services/exportService';
import { FileSpreadsheet, FileCode, Copy, Printer, Check, X, Shield, Download } from 'lucide-react';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: SGXStock[];
  marketMetrics: MarketMetrics;
  onRequireAuth: () => void;
  isUnlocked: boolean;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  stocks,
  marketMetrics,
  onRequireAuth,
  isUnlocked,
}) => {
  const [copied, setCopied] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportCSV = () => {
    if (!isUnlocked) {
      onRequireAuth();
      return;
    }
    exportToCSV(stocks);
    setExportStatus('CSV Report downloaded successfully.');
    setTimeout(() => setExportStatus(null), 3000);
  };

  const handleExportJSON = () => {
    if (!isUnlocked) {
      onRequireAuth();
      return;
    }
    exportToJSON(stocks);
    setExportStatus('JSON Dataset exported successfully.');
    setTimeout(() => setExportStatus(null), 3000);
  };

  const handleCopyMarkdown = async () => {
    const success = await copyMarkdownAnalysis(stocks);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Export SGX Dividend Analysis & Reports
            </h2>
            <p className="text-xs text-slate-400">
              Generate institutional audit reports, CSV sheets, and printable research dossiers
            </p>
          </div>
        </div>

        {exportStatus && (
          <div className="mb-4 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{exportStatus}</span>
          </div>
        )}

        <div className="space-y-3">
          {/* CSV Excel Export */}
          <div
            onClick={handleExportCSV}
            className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                  Export CSV Spreadsheet (.csv)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Comprehensive 20-field matrix with 5-year DPS history, gearing, and ex-dates
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-medium">Download</span>
          </div>

          {/* Formatted Markdown */}
          <div
            onClick={handleCopyMarkdown}
            className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                  Copy Markdown Analysis Table
                </h4>
                <p className="text-[11px] text-slate-400">
                  Clean GitHub/Notion-formatted leaderboard table with yield takeaways
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-medium">
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </div>

          {/* JSON Developer Export */}
          <div
            onClick={handleExportJSON}
            className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                  Export Structured JSON Data
                </h4>
                <p className="text-[11px] text-slate-400">
                  Raw programmatic payload with nested distribution breakdowns
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-indigo-400 font-medium">Download</span>
          </div>

          {/* Printable Executive Dossier */}
          <div
            onClick={handlePrintDossier}
            className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200 group-hover:text-amber-400 transition-colors">
                  Print Executive PDF Dossier
                </h4>
                <p className="text-[11px] text-slate-400">
                  Printer-optimized clean research memo with high-yield rankings and STI summary
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-amber-400 font-medium">Print PDF</span>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Biometric Vault Protection Active
          </span>
          <span>MAS Regulated Securities</span>
        </div>
      </div>
    </div>
  );
};
