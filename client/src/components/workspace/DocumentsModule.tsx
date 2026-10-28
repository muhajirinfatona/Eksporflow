import { formatMoney, formatNumber, getDocumentNumber } from "@shared/format";
import type { Pricing } from "@shared/pricing";
import type {
  ContainerCalc,
  DocumentOrientation,
  DocumentTemplate,
  DocumentType,
  PaperSize,
  PreviewLanguage,
  Shipment,
} from "@shared/shipment";
import {
  Check,
  ClipboardList,
  FileCheck2,
  FileText,
  Printer,
  RefreshCcw,
  ShieldAlert,
  Ship,
  X,
} from "lucide-react";
import type React from "react";
import { toast } from "sonner";
import { Field, SelectField, StatusPill } from "./Primitives";

function docCopy(language: PreviewLanguage, english: string, indonesian: string) {
  return language === "Bahasa Indonesia" ? indonesian : english;
}

export function DocumentsModule({
  shipment,
  update,
  pricing,
  container,
  selectedDocument,
  setSelectedDocument,
  printDocument,
}: {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  pricing: Pricing;
  container: ContainerCalc;
  selectedDocument: DocumentType;
  setSelectedDocument: (doc: DocumentType) => void;
  printDocument: () => void;
}) {
  const documents: { type: DocumentType; caption: string; icon: React.ReactNode; status: string }[] = [
    { type: "Proforma Invoice", caption: "Penawaran awal & terms", icon: <FileText size={19} />, status: "Ready" },
    { type: "Commercial Invoice", caption: "Dokumen nilai komersial", icon: <FileCheck2 size={19} />, status: "Ready" },
    { type: "Packing List", caption: "Rincian koli & berat", icon: <ClipboardList size={19} />, status: "Ready" },
    {
      type: "Bill of Lading",
      caption: "DRAFT / REFERENCE · bukan carrier-issued",
      icon: <Ship size={19} />,
      status: "Draft / Reference",
    },
  ];

  const handleLetterheadImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File logo/kop harus berupa gambar", { description: "Gunakan PNG, JPG, atau WEBP." });
      return;
    }
    if (file.size > 2_000_000) {
      toast.error("Ukuran logo terlalu besar", { description: "Maksimal 2 MB agar draft tetap ringan." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("letterheadImage", String(reader.result));
    reader.readAsDataURL(file);
  };

  const finishReview = () => {
    update("previewLanguage", "English");
    update("documentReviewed", true);
    toast.success("Review dokumen ditandai selesai", {
      description: "Output PDF/print tetap English dan memakai setelan dokumen aktif.",
    });
  };

  return (
    <div className="documents-layout">
      <aside className="document-sidebar panel">
        <div className="document-sidebar-head">
          <div>
            <span className="eyebrow">DOCUMENT CENTER</span>
            <h3>Dokumen transaksi</h3>
          </div>
          <button
            className="icon-button small"
            type="button"
            onClick={() => toast("Dokumen disegarkan dari transaksi aktif")}
          >
            <RefreshCcw size={15} />
          </button>
        </div>
        {documents.map((doc) => (
          <button
            type="button"
            key={doc.type}
            className={`document-item ${selectedDocument === doc.type ? "active" : ""}`}
            onClick={() => setSelectedDocument(doc.type)}
          >
            <span className="document-icon">{doc.icon}</span>
            <span>
              <b>{doc.type}</b>
              <small>{doc.caption}</small>
            </span>
            <StatusPill tone={doc.status === "Ready" ? "green" : "amber"}>{doc.status}</StatusPill>
          </button>
        ))}
        <div className="document-sidebar-footer">
          <div className="mini-progress">
            <span>
              <b>4</b> dari 4 dokumen
            </span>
            <b>100%</b>
          </div>
          <div className="progress-track">
            <i style={{ width: "100%" }} />
          </div>
          <small>
            Draft memakai snapshot transaksi R{shipment.documentRevision}. Terbitkan hanya setelah review manusia.
          </small>
        </div>
      </aside>

      <section className="document-preview-wrap">
        <DocumentSettings
          shipment={shipment}
          update={update}
          onLetterheadImage={handleLetterheadImage}
        />
        <div className="preview-toolbar">
          <div>
            <span className="eyebrow">PREVIEW / {selectedDocument.toUpperCase()}</span>
            <h2>{selectedDocument}</h2>
            <div className="document-output-status">
              Output: English · {shipment.paperSize} · {shipment.documentOrientation} ·{" "}
              {shipment.documentTemplate} · R{shipment.documentRevision}
            </div>
          </div>
          <div className="preview-actions">
            <button className="ghost-button" type="button" onClick={finishReview}>
              <Check size={15} /> Selesai diperiksa → English
            </button>
            <button className="dark-button" type="button" onClick={printDocument}>
              <Printer size={15} /> Print / PDF · English
            </button>
          </div>
        </div>

        <div
          className={`paper-document paper-${shipment.paperSize.toLowerCase()} paper-${shipment.documentOrientation.toLowerCase()} paper-template-${shipment.documentTemplate.toLowerCase().replace(" ", "-")}`}
        >
          <div className="paper-header">
            <div className="paper-letterhead">
              {shipment.letterheadImage ? (
                <img src={shipment.letterheadImage} alt="Logo/kop perusahaan eksportir" />
              ) : (
                <div className="paper-no-logo">Logo perusahaan belum dipilih</div>
              )}
              <div>
                <b>{shipment.exporter}</b>
                <small>
                  {shipment.letterheadText || "Tambahkan alamat, kontak, dan identitas perusahaan"}
                </small>
              </div>
            </div>
            <div className="paper-title">
              <span>
                {selectedDocument === "Bill of Lading"
                  ? "DRAFT / REFERENCE B/L"
                  : selectedDocument.toUpperCase()}
              </span>
              <strong>{getDocumentNumber(selectedDocument, shipment.reference)}</strong>
              <small>
                {shipment.paperSize} · {shipment.documentOrientation} · R{shipment.documentRevision}
              </small>
            </div>
          </div>

          <div className="paper-rule" />

          <div className="paper-parties">
            <div>
              <span>{docCopy(shipment.previewLanguage, "EXPORTER / SHIPPER", "EKSPORTIR / PENGIRIM")}</span>
              <b>{shipment.exporter}</b>
              <p>{shipment.letterheadText || "Company address and contact"}</p>
            </div>
            <div>
              <span>{docCopy(shipment.previewLanguage, "BUYER / CONSIGNEE", "BUYER / PENERIMA")}</span>
              <b>{shipment.buyer}</b>
              <p>
                {shipment.destination}
                <br />
                {shipment.buyerCountry}
              </p>
            </div>
            <div>
              <span>{docCopy(shipment.previewLanguage, "SHIPMENT TERMS", "KETENTUAN PENGIRIMAN")}</span>
              <b>
                {shipment.incoterm} · {shipment.currency}
              </b>
              <p>
                {docCopy(shipment.previewLanguage, "Payment", "Pembayaran")}: {shipment.paymentTerms}
                <br />
                Named place: {shipment.namedPlace}
              </p>
            </div>
          </div>

          {selectedDocument === "Bill of Lading" ? (
            <BlContent shipment={shipment} container={container} language={shipment.previewLanguage} />
          ) : selectedDocument === "Packing List" ? (
            <PackingListContent
              shipment={shipment}
              container={container}
              language={shipment.previewLanguage}
            />
          ) : (
            <InvoiceContent
              shipment={shipment}
              pricing={pricing}
              commercial={selectedDocument === "Commercial Invoice"}
              language={shipment.previewLanguage}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function DocumentSettings({
  shipment,
  update,
  onLetterheadImage,
}: {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  onLetterheadImage: (file?: File) => void;
}) {
  const templates: { name: DocumentTemplate; detail: string }[] = [
    { name: "Classic Trade", detail: "Formal · tabel terstruktur" },
    { name: "Corporate Clean", detail: "Header identitas · hierarki jelas" },
    { name: "Minimal", detail: "Ringkas · whitespace cukup" },
  ];
  const changeLanguage = (value: string) => {
    update("previewLanguage", value as PreviewLanguage);
    update("documentReviewed", false);
  };
  return (
    <section className="document-settings panel panel-padding">
      <div className="document-settings-head">
        <div>
          <span className="eyebrow">DOCUMENT APPEARANCE</span>
          <h3>Setelan output & identitas perusahaan</h3>
          <p>
            Preview mengikuti setelan ini. Print/PDF selalu English dan tidak menyisipkan logo EksporFlow.
          </p>
        </div>
        <StatusPill tone={shipment.documentReviewed ? "green" : "blue"}>
          <FileText size={11} /> {shipment.documentReviewed ? "Reviewed" : `Draft R${shipment.documentRevision}`}
        </StatusPill>
      </div>
      <div className="document-settings-grid">
        <SelectField
          label="Ukuran kertas"
          value={shipment.paperSize}
          onChange={(value) => update("paperSize", value as PaperSize)}
        >
          <option value="A4">A4 · 210 × 297 mm</option>
          <option value="Letter">US Letter · 8.5 × 11 in</option>
          <option value="Legal">Legal · 8.5 × 14 in</option>
        </SelectField>
        <SelectField
          label="Orientasi"
          value={shipment.documentOrientation}
          onChange={(value) => update("documentOrientation", value as DocumentOrientation)}
        >
          <option value="Portrait">Portrait · default</option>
          <option value="Landscape">Landscape · tabel lebar</option>
        </SelectField>
        <SelectField
          label="Bahasa preview"
          value={shipment.previewLanguage}
          onChange={changeLanguage}
        >
          <option value="English">English</option>
          <option value="Bahasa Indonesia">Bahasa Indonesia · preview</option>
        </SelectField>
        <Field
          label="Named place / port"
          value={shipment.namedPlace}
          onChange={(value) => update("namedPlace", value)}
        />
        <Field
          label="Teks kop surat"
          value={shipment.letterheadText}
          onChange={(value) => update("letterheadText", value)}
        />
        <label className="file-field">
          <span>Upload logo/kop perusahaan</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => onLetterheadImage(event.target.files?.[0])}
          />
          <small>
            {shipment.letterheadImage
              ? "Logo perusahaan aktif · pilih file baru untuk mengganti"
              : "PNG, JPG, WEBP · maksimal 2 MB · opsional"}
          </small>
        </label>
        {shipment.letterheadImage && (
          <button
            type="button"
            className="remove-letterhead"
            onClick={() => update("letterheadImage", "")}
          >
            <X size={14} /> Hapus logo perusahaan
          </button>
        )}
      </div>
      <div className="template-gallery">
        <div>
          <span className="eyebrow">TEMPLATE GALLERY</span>
          <small>Disimpan pada draft dokumen; perubahan berikutnya menjadi revisi.</small>
        </div>
        <div className="template-options">
          {templates.map((template) => (
            <button
              type="button"
              key={template.name}
              className={shipment.documentTemplate === template.name ? "active" : ""}
              onClick={() => update("documentTemplate", template.name)}
            >
              <b>{template.name}</b>
              <small>{template.detail}</small>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function InvoiceContent({
  shipment,
  pricing,
  commercial,
  language,
}: {
  shipment: Shipment;
  pricing: Pricing;
  commercial: boolean;
  language: PreviewLanguage;
}) {
  return (
    <>
      <table className="paper-table">
        <thead>
          <tr>
            <th>{docCopy(language, "DESCRIPTION OF GOODS", "DESKRIPSI BARANG")}</th>
            <th>HS CODE</th>
            <th>{docCopy(language, "QUANTITY", "JUMLAH")}</th>
            <th>{docCopy(language, "UNIT PRICE", "HARGA UNIT")}</th>
            <th>{docCopy(language, "TOTAL", "TOTAL")}</th>
          </tr>
        </thead>
        <tbody>
          {shipment.lineItems.map((item) => (
            <tr key={item.id}>
              <td>
                <b>{item.description}</b>
                <small>Export grade · Indonesia</small>
              </td>
              <td>{item.hsCode || "—"}</td>
              <td>
                {formatNumber(item.quantity)} {item.unit}
              </td>
              <td>{formatMoney(item.unitPrice, shipment.currency)}</td>
              <td>
                <b>{formatMoney(item.quantity * item.unitPrice, shipment.currency)}</b>
              </td>
            </tr>
          ))}
          <tr>
            <td>
              <b>
                {docCopy(
                  language,
                  "Export packaging & handling",
                  "Kemasan & handling ekspor",
                )}
              </b>
              <small>Ready for review</small>
            </td>
            <td>—</td>
            <td>1 lot</td>
            <td>—</td>
            <td>
              <b>{formatMoney(shipment.packaging, shipment.currency)}</b>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="paper-summary">
        <div>
          <span>{docCopy(language, "Subtotal", "Subtotal")}</span>
          <b>{formatMoney(pricing.active.cost, shipment.currency)}</b>
        </div>
        <div>
          <span>
            {docCopy(
              language,
              commercial ? "Margin / commercial value" : "Margin / offer",
              commercial ? "Margin / nilai komersial" : "Margin / penawaran",
            )}
          </span>
          <b>{formatMoney(pricing.active.profit, shipment.currency)}</b>
        </div>
        <div className="paper-total">
          <span>{commercial ? "TOTAL COMMERCIAL VALUE" : "TOTAL AMOUNT DUE"}</span>
          <strong>{formatMoney(pricing.active.offer, shipment.currency)}</strong>
        </div>
      </div>
      <div className="paper-notes">
        <div>
          <span>{docCopy(language, "NOTES", "CATATAN")}</span>
          <p>
            {docCopy(language, "Country of origin", "Negara asal")}: Indonesia
            <br />
            Incoterm: {shipment.incoterm} · Named place: {shipment.namedPlace}
            <br />
            All banking charges outside Indonesia are for buyer&apos;s account.
          </p>
        </div>
        <div className="signature-box">
          <span>AUTHORIZED SIGNATURE</span>
          <div />
        </div>
      </div>
    </>
  );
}

function BlContent({
  shipment,
  container,
  language,
}: {
  shipment: Shipment;
  container: { totalVolume: number; totalWeight: number };
  language: PreviewLanguage;
}) {
  return (
    <>
      <div className="draft-warning">
        <ShieldAlert size={14} />{" "}
        {docCopy(
          language,
          "DRAFT / REFERENCE ONLY — not carrier-issued and not proof of shipment.",
          "HANYA DRAFT / REFERENSI — bukan dokumen carrier dan bukan bukti pengiriman.",
        )}
      </div>
      <div className="bl-grid">
        <div>
          <span>PORT OF LOADING</span>
          <b>Surabaya, Indonesia</b>
        </div>
        <div>
          <span>PORT OF DISCHARGE</span>
          <b>{shipment.namedPlace}</b>
        </div>
        <div>
          <span>PLACE OF DELIVERY</span>
          <b>{shipment.destination}</b>
        </div>
        <div>
          <span>FREIGHT TERMS</span>
          <b>Prepaid · {shipment.incoterm}</b>
        </div>
      </div>
      <table className="paper-table">
        <thead>
          <tr>
            <th>MARKS & NUMBERS</th>
            <th>NO. OF PACKAGES</th>
            <th>DESCRIPTION</th>
            <th>GROSS WEIGHT</th>
            <th>MEASUREMENT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{shipment.reference}</td>
            <td>{formatNumber(shipment.cartonQty)} CTNS</td>
            <td>
              <b>{shipment.product}</b>
              <small>
                {shipment.containerType} · {shipment.packageType}
              </small>
            </td>
            <td>{formatNumber(container.totalWeight, 0)} KG</td>
            <td>{formatNumber(container.totalVolume, 2)} CBM</td>
          </tr>
        </tbody>
      </table>
      <div className="bl-footer-note">
        Draft prepared from transaction workspace data. Carrier, customs, and operational review required.
      </div>
    </>
  );
}

function PackingListContent({
  shipment,
  language,
}: {
  shipment: Shipment;
  container: { totalVolume: number; totalWeight: number };
  language: PreviewLanguage;
}) {
  return (
    <>
      <div className="bl-grid">
        <div>
          <span>{docCopy(language, "PACKING TYPE", "JENIS KEMASAN")}</span>
          <b>{shipment.packageType}</b>
        </div>
        <div>
          <span>CONTAINER</span>
          <b>{shipment.containerType}</b>
        </div>
        <div>
          <span>CONTAINER NUMBER</span>
          <b>{shipment.containerNumber || "To be assigned"}</b>
        </div>
        <div>
          <span>SEAL NUMBER</span>
          <b>{shipment.sealNumber || "To be assigned"}</b>
        </div>
      </div>
      <table className="paper-table">
        <thead>
          <tr>
            <th>PACKING MARKS</th>
            <th>NO. OF PACKAGES</th>
            <th>DESCRIPTION OF GOODS</th>
            <th>NET / GROSS WEIGHT</th>
            <th>MEASUREMENT</th>
          </tr>
        </thead>
        <tbody>
          {shipment.lineItems.map((item) => {
            const itemGross = item.weight * item.quantity;
            const itemNet =
              itemGross * (1 - Math.min(100, Math.max(0, item.shrinkageRate || 0)) / 100);
            const itemVolume = (item.length * item.width * item.height * item.quantity) / 1_000_000;
            return (
              <tr key={item.id}>
                <td>
                  {shipment.reference}
                  <small>Made in Indonesia</small>
                </td>
                <td>
                  {formatNumber(item.quantity)} {item.unit.toUpperCase()}
                </td>
                <td>
                  <b>{item.description}</b>
                  <small>
                    HS Code {item.hsCode || "—"} · {item.packagingType}
                  </small>
                </td>
                <td>
                  {formatNumber(itemNet, 0)} / {formatNumber(itemGross, 0)} KG
                </td>
                <td>{formatNumber(itemVolume, 2)} CBM</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="paper-notes">
        <div>
          <span>{docCopy(language, "PACKING NOTES", "CATATAN KEMASAN")}</span>
          <p>
            {docCopy(
              language,
              "Gross weight excludes no product shrinkage; shrinkage is shown separately in the load plan.",
              "Berat kotor tidak dikurangi susut produk; susut ditampilkan terpisah di rencana muatan.",
            )}
            <br />
            Net/gross weight remains an operational estimate and must be confirmed at stuffing.
          </p>
        </div>
        <div className="signature-box">
          <span>WAREHOUSE CHECK</span>
          <div />
        </div>
      </div>
    </>
  );
}
