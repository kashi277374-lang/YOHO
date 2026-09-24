import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Download, 
  X, 
  ShieldCheck, 
  Smartphone, 
  FileCheck2, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  Layers
} from 'lucide-react';

export const ApkDownloadModal: React.FC = () => {
  const { 
    showApkDownloadModal, 
    setShowApkDownloadModal, 
    activeApkRelease, 
    downloadActiveApk, 
    isApkDownloading 
  } = useApp();

  if (!showApkDownloadModal) return null;

  const currentVersion = activeApkRelease?.version || 'v1.2.0';
  const fileSizeMb = activeApkRelease?.fileSize 
    ? (activeApkRelease.fileSize / (1024 * 1024)).toFixed(1) + ' MB'
    : '28.5 MB';
  const releaseDate = activeApkRelease?.publishedAt 
    ? new Date(activeApkRelease.publishedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Latest Build';

  const changelog = activeApkRelease?.changelog || 
    'Official StarLive build: Live video broadcasting, 8-seat audio party rooms, instant real-time coin gifting, and direct messaging.';

  const handleDirectDownload = async () => {
    await downloadActiveApk();
  };

  return (
    <div 
      id="apk-download-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={() => setShowApkDownloadModal(false)}
    >
      <div 
        id="apk-download-modal-content"
        className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-5 text-white shadow-2xl relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Ambient background glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="close-apk-modal-btn"
          onClick={() => setShowApkDownloadModal(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Close"
        >
          <X size={18} />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
            <Smartphone size={28} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-lg text-white tracking-tight">StarLive APK</h3>
              <span className="flex items-center gap-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                <CheckCircle2 size={10} /> Official
              </span>
            </div>
            <p className="text-xs text-slate-400">Direct Android package download</p>
          </div>
        </div>

        {/* Version & Info Card */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 mb-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Layers size={13} className="text-teal-400" /> Active Version
            </span>
            <span className="font-mono font-bold text-xs bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded-md">
              {currentVersion}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <FileCheck2 size={13} className="text-teal-400" /> File Size
            </span>
            <span className="font-semibold text-slate-200">{fileSizeMb}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock size={13} className="text-teal-400" /> Published
            </span>
            <span className="font-semibold text-slate-200">{releaseDate}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-400" /> Security
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              Verified & Safe
            </span>
          </div>
        </div>

        {/* Release Notes / Changelog */}
        <div className="mb-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            What's New in {currentVersion}
          </span>
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-2.5 text-xs text-slate-300 leading-relaxed max-h-24 overflow-y-auto">
            {changelog}
          </div>
        </div>

        {/* Download Action Button */}
        <button
          id="modal-download-apk-btn"
          onClick={handleDirectDownload}
          disabled={isApkDownloading}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-sm shadow-xl shadow-teal-500/25 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
        >
          {isApkDownloading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Fetching & Starting Download...</span>
            </>
          ) : (
            <>
              <Download size={18} strokeWidth={2.5} />
              <span>Download {currentVersion} APK</span>
            </>
          )}
        </button>

        {/* Anti-Cache & Storage Delivery Footer Notice */}
        <p className="text-[10px] text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
          <ShieldCheck size={11} className="text-teal-400" />
          <span>Always serves the latest published release directly from Firebase Storage.</span>
        </p>

        {activeApkRelease?.downloadUrl && (
          <div className="mt-2 text-center">
            <a 
              href={activeApkRelease.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-teal-400/80 hover:text-teal-300 inline-flex items-center gap-1 underline decoration-dotted"
            >
              Direct Storage Link <ExternalLink size={9} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
