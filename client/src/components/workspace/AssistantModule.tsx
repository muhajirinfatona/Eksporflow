import { AIChatBox, type Message } from "@/components/AIChatBox";
import type { KnowledgeSource } from "@/hooks/useWorkspaceFlow";
import { trpc } from "@/lib/trpc";
import { formatMoney } from "@shared/format";
import type { Pricing } from "@shared/pricing";
import { computeRecommendations, type ScreenId } from "@shared/risk";
import type { ContainerCalc, Shipment } from "@shared/shipment";
import { BookOpen, Bot, ChevronRight, Compass, Lock, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { recommendationIcon, StatusPill } from "./Primitives";
import { getCustomerSupportAnswer } from "./ScreenAIAdvisor";

export function AssistantModule({
  shipment,
  pricing,
  container,
  navigate,
  isAuthenticated,
  onLogin,
  publishedKnowledge,
}: {
  shipment: Shipment;
  pricing: Pricing;
  container: ContainerCalc;
  navigate: (screen: ScreenId) => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  publishedKnowledge: KnowledgeSource[];
}) {
  const [mode, setMode] = useState<"transaction" | "learn">("transaction");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Halo! Saya **AI Advisor EksporFlow** untuk transaksi **${shipment.reference}**${shipment.buyer ? ` (${shipment.buyer})` : ""}. Silakan pilih topik analisis atau ketik pertanyaan Anda.`,
    },
  ]);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: `Konteks aktif: **${shipment.reference}** (${shipment.buyer || "Buyer belum diisi"} · ${shipment.incoterm}). Apa yang ingin Anda analisis?`,
      },
    ]);
  }, [shipment.reference]);

  const assistant = trpc.assistant.ask.useMutation();

  const snapshot = JSON.stringify({
    mode,
    reference: shipment.reference,
    buyer: shipment.buyer,
    country: shipment.buyerCountry,
    destination: shipment.destination,
    incoterm: shipment.incoterm,
    namedPlace: shipment.namedPlace,
    currency: shipment.currency,
    product: shipment.product,
    hsCode: shipment.hsCode,
    quantity: shipment.quantity,
    offer: pricing.active.offer,
    profit: pricing.active.profit,
    margin: shipment.margin,
    containerType: shipment.containerType,
    totalVolume: container.totalVolume,
    totalWeight: container.totalWeight,
    volumeUtilization: container.volumeUtilization,
    weightUtilization: container.weightUtilization,
    status: shipment.shipmentStatus,
    documents: {
      po: shipment.poNumber,
      booking: shipment.bookingNumber,
      container: shipment.containerNumber,
      seal: shipment.sealNumber,
      attachments: shipment.attachments,
    },
    publishedSOPs: publishedKnowledge.map((item) => ({
      title: item.title,
      scope: item.scope,
      version: item.version,
    })),
  }).slice(0, 8000);

  const sendMessage = (content: string) => {
    setMessages((current) => [...current, { role: "user", content }]);
    if (!isAuthenticated) {
      const answer = getCustomerSupportAnswer(content, {
        screen: "advisor",
        screenTitle: "AI Advisor Ekspor",
        shipment,
        pricing,
        container,
      });
      const footnote = "\n\n---\n*Catatan: Anda sedang menggunakan Mode Demo (Bantuan Cepat). Masuk akun untuk konsultasi live AI cloud.*";
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `${answer}${footnote}`,
        },
      ]);
      return;
    }

    assistant.mutate(
      {
        question: content,
        snapshot: mode === "transaction" ? snapshot : JSON.stringify({ mode: "learn", countryOfOrigin: "Indonesia" }),
      },
      {
        onSuccess: (result) =>
          setMessages((current) => [...current, { role: "assistant", content: result.answer }]),
        onError: () => {
          const fallbackAns = getCustomerSupportAnswer(content, {
            screen: "advisor",
            screenTitle: "AI Advisor Ekspor",
            shipment,
            pricing,
            container,
          });
          setMessages((current) => [
            ...current,
            {
              role: "assistant",
              content: fallbackAns,
            },
          ]);
        },
      },
    );
  };

  const recommendations = computeRecommendations(shipment, pricing, container);

  return (
    <div className="copilot-layout">
      <section className="panel panel-padding copilot-panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">ADVISOR · MODE BELAJAR &amp; TRANSAKSI</span>
            <h2 className="ops-title">AI Advisor Konteks Transaksi</h2>
          </div>
          <StatusPill tone="blue">
            <Bot size={11} /> {mode === "transaction" ? `Transaksi · ${shipment.reference}` : "Mode Belajar"}
          </StatusPill>
        </div>

        <div className="clean-tabs" style={{ marginBottom: 14 }}>
          <button
            type="button"
            className={mode === "transaction" ? "active" : ""}
            onClick={() => setMode("transaction")}
          >
            Mode Transaksi · {shipment.reference}
          </button>
          <button
            type="button"
            className={mode === "learn" ? "active" : ""}
            onClick={() => setMode("learn")}
          >
            Mode Belajar Ekspor Umum
          </button>
          <button
            type="button"
            className="tab-link-right"
            onClick={() => navigate("knowledge")}
          >
            Lihat Pengetahuan Tim →
          </button>
        </div>

        {!isAuthenticated && (
          <div className="validation-banner auth-banner">
            <div className="auth-banner-copy">
              <Lock size={16} />
              <div>
                <b>Sesi login diperlukan untuk tanya-jawab AI Advisor</b>
                <small style={{ display: "block" }}>
                  Endpoint AI Advisor dilindungi autentikasi dan batas kuota per pengguna.
                </small>
              </div>
            </div>
            <button type="button" className="save-button" onClick={onLogin}>
              Masuk sekarang
            </button>
          </div>
        )}

        <AIChatBox
          className="advisor-chat-box"
          messages={messages}
          onSendMessage={sendMessage}
          isLoading={assistant.isPending}
          height="clamp(340px, 58vh, 460px)"
          placeholder="Contoh: risiko terbesar sebelum saya kirim quotation ini apa?"
          emptyStateMessage="Mulai percakapan dengan AI Advisor EksporFlow"
          suggestedPrompts={[
            "Ringkas risiko utama transaksi ini sebelum quotation dikirim",
            "Bandingkan kewajiban saya jika memakai FOB vs CIF",
            "Dokumen dan bukti apa yang masih belum lengkap?",
          ]}
        />
      </section>

      <aside className="copilot-aside">
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">REKOMENDASI AKTIF</span>
              <h3>Tindakan prioritas</h3>
            </div>
            <Compass size={17} className="panel-spark text-slate-500" />
          </div>
          <div className="copilot-recommendations">
            {recommendations.map((rec) => (
              <button type="button" key={rec.title} onClick={() => navigate(rec.screen)}>
                <span className={`copilot-rec-icon ${rec.tone}`}>{recommendationIcon(rec.kind)}</span>
                <span>
                  <b>{rec.title}</b>
                  <small>{rec.detail}</small>
                </span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </section>

        <section className="panel panel-padding copilot-context">
          <div className="panel-head">
            <div>
              <span className="eyebrow">TRANSACTION SNAPSHOT</span>
              <h3>Data yang dibaca Advisor</h3>
            </div>
          </div>
          <div className="context-list">
            <div>
              <span>BUYER</span>
              <b>{shipment.buyer || "Belum diisi"}</b>
            </div>
            <div>
              <span>OFFER</span>
              <b>{formatMoney(pricing.active.offer, shipment.currency)}</b>
            </div>
            <div>
              <span>MUATAN</span>
              <b>
                {container.containers} × {shipment.containerType} · {container.volumeUtilization.toFixed(0)}%
              </b>
            </div>
            <div>
              <span>STATUS</span>
              <b>{shipment.shipmentStatus}</b>
            </div>
            <div>
              <span>SOP PUBLISHED</span>
              <b>{publishedKnowledge.length} dokumen aktif</b>
            </div>
          </div>
          <div className="published-sop-list">
            {publishedKnowledge.map((sop) => (
              <button
                type="button"
                key={sop.id}
                className="sop-mini-pill"
                onClick={() => navigate("knowledge")}
              >
                <BookOpen size={12} /> {sop.title}
              </button>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
