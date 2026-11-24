import React from "react";
import { X, MessageSquare, Mail, Phone, ExternalLink, ShieldCheck, Headphones } from "lucide-react";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCompany?: string;
}

export function SupportModal({ isOpen, onClose, userCompany = "PT Nusantara Ekspor Mandiri" }: SupportModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 480,
          maxWidth: "100%",
          background: "#FFFFFF",
          borderRadius: 14,
          border: "1px solid #E2E8F0",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "#EFF6FF",
                border: "1px solid #DBEAFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1D4ED8",
              }}
            >
              <Headphones size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                Pusat Bantuan & Dukungan Sistem
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>
                Tim operasional EksporFlow siap membantu kendala Anda.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#94A3B8",
              padding: 4,
              borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Company Card context */}
          <div
            style={{
              padding: "10px 14px",
              background: "#F8FAFC",
              borderRadius: 8,
              border: "1px solid #E2E8F0",
              fontSize: 12,
              color: "#475569",
            }}
          >
            Akun Perusahaan: <strong style={{ color: "#0F172A" }}>{userCompany}</strong>
            <div style={{ fontSize: 11, color: "#166534", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
              <ShieldCheck size={13} /> Jalur Prioritas Layanan Pelanggan Aktif
            </div>
          </div>

          {/* Contact Option 1: WhatsApp */}
          <a
            href="https://wa.me/6281234567890?text=Halo%20Tim%20EksporFlow,%20saya%20membutuhkan%20bantuan%20sistem"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: 10,
              textDecoration: "none",
              color: "#166534",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#22C55E",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageSquare size={16} />
              </div>
              <div>
                <strong style={{ fontSize: 13, display: "block" }}>Chat WhatsApp CS EksporFlow</strong>
                <span style={{ fontSize: 11.5, color: "#15803D" }}>Respon cepat dalam &lt; 5 menit</span>
              </div>
            </div>
            <ExternalLink size={15} />
          </a>

          {/* Contact Option 2: Email */}
          <a
            href="mailto:support@eksporflow.com?subject=Kendala%20Sistem%20EksporFlow"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              textDecoration: "none",
              color: "#334155",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#EFF6FF",
                  color: "#2563EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Mail size={16} />
              </div>
              <div>
                <strong style={{ fontSize: 13, display: "block" }}>Email Dukungan Teknis</strong>
                <span style={{ fontSize: 11.5, color: "#64748B" }}>support@eksporflow.com</span>
              </div>
            </div>
            <ExternalLink size={15} style={{ color: "#94A3B8" }} />
          </a>

          {/* Contact Option 3: Phone Hotline */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              color: "#334155",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#F1F5F9",
                  color: "#475569",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Phone size={16} />
              </div>
              <div>
                <strong style={{ fontSize: 13, display: "block" }}>Hotline Operasional 24/7</strong>
                <span style={{ fontSize: 11.5, color: "#64748B" }}>+62 (021) 5088-9900</span>
              </div>
            </div>
            <span style={{ fontSize: 11, background: "#F1F5F9", padding: "3px 8px", borderRadius: 4, color: "#475569" }}>
              Toll Free
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "12px 20px",
            background: "#F8FAFC",
            borderTop: "1px solid #F1F5F9",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            className="space-btn-secondary"
            onClick={onClose}
            style={{ padding: "6px 14px", fontSize: 12 }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
