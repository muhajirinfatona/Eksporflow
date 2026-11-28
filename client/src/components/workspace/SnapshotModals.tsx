import React, { useState } from "react";
import type { Shipment, DocumentType } from "@shared/shipment";
import { Lock, History, Copy, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  buildDocumentSnapshotPayload,
  computePayloadHash,
} from "@/lib/documents";
import { getDocumentNumber } from "@/lib/documentExporters";

export function SnapshotFinalizeModal({
  isOpen,
  onClose,
  shipment,
  selectedDocument,
  isId,
  currentShipmentId,
  onFinalize,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment;
  selectedDocument: DocumentType;
  isId: boolean;
  currentShipmentId: string | null;
  onFinalize: (notes: string) => void;
  isPending: boolean;
}) {
  const [notes, setNotes] = useState("");
  if (!isOpen) return null;

  const docNumber = getDocumentNumber(selectedDocument, isId);
  const payload = buildDocumentSnapshotPayload(selectedDocument, shipment);
  const hash = computePayloadHash(payload);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in-50 zoom-in-95">
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Kunci Snapshot Dokumen</h3>
              <p className="text-xs text-slate-500">Immutable Cryptographic Audit Trail (SHA-256)</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm text-slate-700">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Jenis Dokumen:</span>
              <span className="font-bold text-slate-900">{selectedDocument}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Nomor Dokumen:</span>
              <span className="font-mono font-semibold text-slate-800">{docNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Referensi Transaksi:</span>
              <span className="font-mono text-slate-800">{shipment.reference || "EXP-001"}</span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-500 block mb-0.5 font-semibold">Hash SHA-256 Payload (Preview):</span>
              <code className="block bg-slate-900 text-emerald-400 p-2 rounded text-[11px] font-mono break-all select-all">
                {hash}
              </code>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <b>Pemberitahuan Audit:</b> Setelah snapshot dikunci, rekaman bersifat <b>append-only</b> dan dilindungi trigger database PostgreSQL. Dokumen yang sudah berstatus Final tidak dapat ditimpa; perubahan data di masa depan akan dicatat sebagai nomor revisi baru (+1).
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Revisi / Alasan Penguncian (Opsional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Dokumen disetujui pembeli via email, final untuk pengajuan COO dan L/C..."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              rows={2}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onFinalize(notes)}
            disabled={isPending}
            className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            <Lock size={14} className="text-emerald-400" />
            <span>{isPending ? "Mengunci..." : "Kunci & Simpan Snapshot"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function SnapshotHistoryModal({
  isOpen,
  onClose,
  snapshots,
  isLoading,
  selectedDocument,
}: {
  isOpen: boolean;
  onClose: () => void;
  snapshots: any[];
  isLoading: boolean;
  selectedDocument: DocumentType;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 animate-in fade-in-50 zoom-in-95 max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
              <History size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Riwayat Snapshot Dokumen Terkunci</h3>
              <p className="text-xs text-slate-500">Audit trail kriptografis dengan verifikasi keutuhan hash SHA-256</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Memuat riwayat snapshot...</div>
          ) : snapshots.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
              Belum ada snapshot yang dikunci untuk transaksi ini. Klik tombol <b>"Kunci Snapshot"</b> untuk memfinalisasi versi pertama.
            </div>
          ) : (
            snapshots.map((item: any) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-lg border transition-colors ${
                  item.documentType.toLowerCase() === selectedDocument.toLowerCase()
                    ? "border-emerald-300 bg-emerald-50/40"
                    : "border-slate-200 bg-slate-50/70"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{item.documentType}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">
                      Rev {item.revision}
                    </span>
                    {item.isIntegrityValid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 size={11} /> Integritas SHA-256 Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800 border border-red-300">
                        <AlertTriangle size={11} /> Hash Mismatch
                      </span>
                    )}
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {new Date(item.createdAt).toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="space-y-1 mt-2 text-slate-600">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-slate-700">Hash SHA-256:</span>
                    <code className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-800 break-all select-all">
                      {item.contentHashSha256}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(item.contentHashSha256);
                        toast.success("Hash disalin ke clipboard!");
                      }}
                      className="p-1 hover:text-slate-900"
                      title="Salin Hash"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                  {item.overrideReason && (
                    <div className="text-slate-700 italic mt-1">
                      Catatan: &quot;{item.overrideReason}&quot;
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
