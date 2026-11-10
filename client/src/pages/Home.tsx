import { AssistantModule } from "@/components/workspace/AssistantModule";
import { ContainerModule } from "@/components/workspace/ContainerModule";
import { DocumentsModule } from "@/components/workspace/DocumentsModule";
import { OperationsModule } from "@/components/workspace/OperationsModule";
import { PricingModule } from "@/components/workspace/PricingModule";
import { RiskModule } from "@/components/workspace/RiskModule";
import {
  ApprovalsView,
  BankView,
  DashboardView,
  FinanceView,
  JournalsView,
  KnowledgeView,
  PartnersView,
  ProductsView,
  ReadinessView,
  ReportsView,
  SettingsView,
} from "@/components/workspace/SecondaryScreens";
import { TransactionsModule } from "@/components/workspace/TransactionsModule";
import { ALL_SCREENS, getScreenMeta, WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { useActiveShipment } from "@/hooks/useActiveShipment";
import { useWorkspaceFlow } from "@/hooks/useWorkspaceFlow";
import { AuthFlow } from "@/pages/AuthFlow";
import type { ScreenId } from "@shared/risk";
import { type DocumentType, getPaperSizeSpec, getDocMargins } from "@shared/shipment";
import { useCallback, useEffect, useState } from "react";

function readScreenFromUrl(): ScreenId {
  try {
    const raw = new URLSearchParams(window.location.search).get("screen");
    if (raw && ALL_SCREENS.some((item) => item.id === raw)) {
      return raw as ScreenId;
    }
  } catch {
    // Fallback ke dashboard.
  }
  return "dashboard";
}

function readDocFromUrl(): DocumentType {
  try {
    const raw = new URLSearchParams(window.location.search).get("doc");
    if (raw) {
      return raw as DocumentType;
    }
  } catch {
    // Fallback ke Proforma Invoice
  }
  return "Proforma Invoice";
}

export default function Home() {
  const [screen, setScreen] = useState<ScreenId>(readScreenFromUrl);
  const [selectedDocument, setSelectedDocument] = useState<DocumentType>(readDocFromUrl);

  const {
    user,
    isAuthLoading,
    shipment,
    activeShipmentId,
    version,
    saveState,
    statusNote,
    shipmentsList,
    isLoadingList,
    pricing,
    container,
    update,
    updateNumber,
    updateLineItems,
    saveShipment,
    loadShipment,
    loadCustomShipment,
    reloadLatest,
    createNewDraft,
    deleteShipment,
    resetTransaction,
    refreshAuth,
    logout,
  } = useActiveShipment();

  const flow = useWorkspaceFlow({
    userId: user?.id ?? null,
    shipment,
    pricing,
    container,
    update,
    updateLineItems,
  });

  const navigate = useCallback((next: ScreenId) => {
    setScreen(next);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("screen", next);
      window.history.pushState({}, "", url.toString());
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // Abaikan bila history API terbatas.
    }
  }, []);

  useEffect(() => {
    const onPopState = () => setScreen(readScreenFromUrl());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!user) return;
    const meta = getScreenMeta(screen);
    document.title = `EksporFlow · ${meta.label}`;
  }, [screen, user]);

  const printDocument = useCallback(async () => {
    // 1. Lepas fokus dari elemen aktif agar perubahan teks langsung tersinkronisasi
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // 2. Bersihkan seleksi sel tabel dan boks agar tidak ada garis/bingkai aktif yang terbawa ke cetak
    if (typeof document !== "undefined") {
      document.querySelectorAll(".active-cell, .table-cell-selected, .active-doc-box, .active-table").forEach((el) => {
        el.classList.remove("active-cell", "table-cell-selected", "active-doc-box", "active-table");
      });
      const pill = document.querySelector(".floating-merge-pill");
      if (pill) pill.remove();
    }

    // 3. Simpan otomatis secara instan sebelum dialog cetak terbuka
    if (saveState === "unsaved") {
      try {
        await saveShipment(true);
      } catch {
        // Lanjutkan cetak meskipun ada kendala jaringan
      }
    }

    // Pastikan seleksi sel, fokus tabel & outline editor bersih sebelum cetak
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    document.querySelectorAll(".table-cell-selected, .active-cell, .word-image-selected, .active-table, .active-doc-box").forEach((el) => {
      el.classList.remove("table-cell-selected", "active-cell", "word-image-selected", "active-table", "active-doc-box");
    });

    const existing = document.getElementById("eksporflow-print-page");
    if (existing) {
      existing.remove();
    }
    const margins = getDocMargins(shipment);
    const style = document.createElement("style");
    style.id = "eksporflow-print-page";
    const paperSpec = getPaperSizeSpec(shipment.paperSize);
    const orientationVal = shipment.documentOrientation ? shipment.documentOrientation.toLowerCase() : "portrait";
    style.textContent = `@media print {
      @page {
        size: ${paperSpec.cssSize} ${orientationVal} !important;
        margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm !important;
      }
      .paper-document {
        padding: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
      }
    }`;
    document.head.appendChild(style);

    const handleAfterPrint = () => {
      style.remove();
      window.removeEventListener("afterprint", handleAfterPrint);
    };
    window.addEventListener("afterprint", handleAfterPrint);

    window.print();

    setTimeout(() => {
      const el = document.getElementById("eksporflow-print-page");
      if (el) el.remove();
    }, 10000);
  }, [
    shipment,
    saveState,
    saveShipment,
  ]);

  if (isAuthLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-card">
          <div className="brand-mark">
            <span />
            <span />
          </div>
          <b>Memeriksa sesi workspace EksporFlow...</b>
          <small>Menghubungkan ke PostgreSQL / Supabase</small>
        </div>
      </div>
    );
  }

  // Wajib Registrasi -> Verifikasi -> Login sebelum masuk ke tampilan utama workspace.
  if (!user || !user.emailVerifiedAt) {
    return <AuthFlow onAuthenticated={refreshAuth} />;
  }

  return (
    <WorkspaceShell
      screen={screen}
      navigate={navigate}
      exporterName={shipment.exporter || user.companyName || "Workspace Baru"}
      reference={shipment.reference}
      user={user}
      saveState={saveState}
      statusNote={statusNote}
      version={version}
      activeShipmentId={activeShipmentId}
      shipment={shipment}
      pricing={pricing}
      container={container}
      flow={flow}
      onSave={saveShipment}
      onReloadLatest={reloadLatest}
      onReset={resetTransaction}
      onLogin={refreshAuth}
      onLogout={logout}
    >
      {screen === "dashboard" && (
        <DashboardView
          shipment={shipment}
          update={update}
          pricing={pricing}
          container={container}
          navigate={navigate}
          flow={flow}
        />
      )}
      {screen === "readiness" && (
        <ReadinessView shipment={shipment} update={update} navigate={navigate} flow={flow} />
      )}
      {screen === "transactions" && (
        <TransactionsModule
          user={user}
          shipment={shipment}
          update={update}
          activeShipmentId={activeShipmentId}
          version={version}
          saveState={saveState}
          shipmentsList={shipmentsList}
          isLoadingList={isLoadingList}
          pricing={pricing}
          container={container}
          flow={flow}
          loadShipment={loadShipment}
          loadCustomShipment={loadCustomShipment}
          saveShipment={saveShipment}
          deleteShipment={deleteShipment}
          createNewDraft={createNewDraft}
          login={refreshAuth}
          navigate={navigate}
          mode="active_management"
        />
      )}
      {screen === "po_intake" && (
        <TransactionsModule
          user={user}
          shipment={shipment}
          update={update}
          activeShipmentId={activeShipmentId}
          version={version}
          saveState={saveState}
          shipmentsList={shipmentsList}
          isLoadingList={isLoadingList}
          pricing={pricing}
          container={container}
          flow={flow}
          loadShipment={loadShipment}
          loadCustomShipment={loadCustomShipment}
          saveShipment={saveShipment}
          deleteShipment={deleteShipment}
          createNewDraft={createNewDraft}
          login={refreshAuth}
          navigate={navigate}
          mode="new_po_intake"
        />
      )}
      {screen === "pricing" && (
        <PricingModule
          shipment={shipment}
          update={update}
          updateNumber={updateNumber}
          updateLineItems={updateLineItems}
          pricing={pricing}
          navigate={navigate}
          partners={flow.partners}
          applyPartner={flow.applyPartner}
          effectiveApprovalStatus={flow.effectiveApprovalStatus}
        />
      )}
      {screen === "approvals" && (
        <ApprovalsView
          shipment={shipment}
          pricing={pricing}
          navigate={navigate}
          flow={flow}
          user={user}
          shipmentsList={shipmentsList}
          activeShipmentId={activeShipmentId}
          loadShipment={loadShipment}
          loadCustomShipment={loadCustomShipment}
        />
      )}
      {screen === "documents" && (
        <DocumentsModule
          shipment={shipment}
          update={update}
          pricing={pricing}
          container={container}
          selectedDocument={selectedDocument}
          setSelectedDocument={setSelectedDocument}
          printDocument={printDocument}
          navigate={navigate}
          effectiveApprovalStatus={flow.effectiveApprovalStatus}
        />
      )}
      {screen === "cargo" && (
        <ContainerModule
          shipment={shipment}
          update={update}
          updateNumber={updateNumber}
          updateLineItems={updateLineItems}
          container={container}
          navigate={navigate}
        />
      )}
      {screen === "shipment" && (
        <OperationsModule shipment={shipment} update={update} navigate={navigate} />
      )}
      {screen === "risk" && (
        <RiskModule
          shipment={shipment}
          update={update}
          pricing={pricing}
          container={container}
          navigate={navigate}
          legalChecklist={flow.legalChecklist}
          toggleLegalCheck={flow.toggleLegalCheck}
          evaluation={flow.riskEvaluation}
          effectiveApprovalStatus={flow.effectiveApprovalStatus}
        />
      )}
      {screen === "advisor" && (
        <AssistantModule
          shipment={shipment}
          pricing={pricing}
          container={container}
          navigate={navigate}
          isAuthenticated={Boolean(user)}
          onLogin={() => void refreshAuth()}
          publishedKnowledge={flow.publishedKnowledge}
        />
      )}
      {screen === "knowledge" && <KnowledgeView navigate={navigate} flow={flow} />}
      {screen === "partners" && (
        <PartnersView shipment={shipment} navigate={navigate} flow={flow} />
      )}
      {screen === "products" && (
        <ProductsView
          shipment={shipment}
          updateLineItems={updateLineItems}
          navigate={navigate}
          flow={flow}
        />
      )}
      {screen === "finance" && (
        <FinanceView shipment={shipment} pricing={pricing} navigate={navigate} flow={flow} />
      )}
      {screen === "bank" && (
        <BankView shipment={shipment} pricing={pricing} navigate={navigate} flow={flow} />
      )}
      {screen === "journals" && (
        <JournalsView shipment={shipment} pricing={pricing} navigate={navigate} flow={flow} />
      )}
      {screen === "reports" && (
        <ReportsView shipment={shipment} pricing={pricing} navigate={navigate} flow={flow} />
      )}
      {screen === "settings" && (
        <SettingsView
          user={user}
          shipment={shipment}
          version={version}
          saveState={saveState}
          activeShipmentId={activeShipmentId}
          login={refreshAuth}
          logout={logout}
          navigate={navigate}
        />
      )}
    </WorkspaceShell>
  );
}
