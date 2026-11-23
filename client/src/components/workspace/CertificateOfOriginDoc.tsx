import React from "react";
import type { Shipment } from "@shared/shipment";
import { formatMoney, formatNumber } from "@shared/format";
import {
  calculateDocumentItems,
  calculateDocumentTotals,
} from "@/lib/documents";
import { getDocumentNumber } from "@/lib/documentExporters";

export function CertificateOfOriginDoc({
  shipment,
  exporterName,
  exporterAddress,
  buyerName,
  buyerAddress,
  buyerCountry,
  pol,
  pod,
  vesselName,
  signatoryName,
  signatoryRole,
  isId = false,
  onOpenSignatureModal,
  update,
}: {
  shipment?: Shipment;
  exporterName: string;
  exporterAddress: string;
  buyerName: string;
  buyerAddress: string;
  buyerCountry: string;
  pol: string;
  pod: string;
  vesselName: string;
  signatoryName?: string;
  signatoryRole?: string;
  isId?: boolean;
  onOpenSignatureModal?: (party: "seller" | "buyer") => void;
  update?: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
}) {
  const docLineItems = calculateDocumentItems(shipment || {});
  const docTotals = calculateDocumentTotals(docLineItems, shipment?.currency || "USD");

  const departureDate = new Date().toISOString().split("T")[0];
  const refNo = getDocumentNumber("Certificate of Origin", isId);

  return (
    <div className="unlk-doc-wrapper font-sans text-slate-800">
      <div className="unlk-doc-container border-2 border-slate-700 bg-white">
        {/* Top Header Bar */}
        <div className="grid grid-cols-12 border-b-2 border-slate-700 bg-slate-50 p-2 text-xs">
          <div className="col-span-8">
            <span className="font-bold text-slate-900 tracking-wider">
              {isId ? "SURAT KETERANGAN ASAL (CERTIFICATE OF ORIGIN)" : "CERTIFICATE OF ORIGIN"}
            </span>
            <div className="text-[10px] text-slate-600">
              {isId
                ? "STANDAR FORMAT RESMI UN/CEFACT & FORM AK (ASEAN-KOREA FTA / ORDINARY)"
                : "UN/CEFACT TRADE DOCUMENTATION STANDARD · PREFERENTIAL TARIFF TREATMENT"}
            </div>
          </div>
          <div className="col-span-4 text-right">
            <div className="font-mono font-bold text-slate-900">{refNo}</div>
            <div className="text-[10px] text-slate-600">ORIGINAL · REPUBLIC OF INDONESIA</div>
          </div>
        </div>

        {/* BOX 1 & BOX 2 & BOX 3 GRID */}
        <div className="grid grid-cols-12 border-b-2 border-slate-700 text-xs">
          {/* Left Column: Box 1, 2, 3 */}
          <div className="col-span-7 border-r-2 border-slate-700">
            {/* Box 1: Exporter */}
            <div className="p-2 border-b-2 border-slate-700 min-h-[90px]">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                1. Goods consigned from (Exporter&apos;s business name, address, country)
              </div>
              <div className="font-bold text-slate-900">{exporterName}</div>
              <div className="text-slate-700 whitespace-pre-line text-[11px] leading-tight">
                {exporterAddress}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">REPUBLIC OF INDONESIA</div>
            </div>

            {/* Box 2: Consignee */}
            <div className="p-2 border-b-2 border-slate-700 min-h-[90px]">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                2. Goods consigned to (Consignee&apos;s name, address, country)
              </div>
              <div className="font-bold text-slate-900">{buyerName}</div>
              <div className="text-slate-700 text-[11px] leading-tight">{buyerAddress}</div>
              <div className="text-[11px] font-semibold text-slate-900">{buyerCountry}</div>
            </div>

            {/* Box 3: Transport */}
            <div className="p-2 min-h-[85px]">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                3. Means of transport and route (as far as known)
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <div>
                  <span className="text-slate-500 text-[10px]">Departure Date:</span>
                  <div className="font-medium font-mono">{departureDate}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">Vessel / Voyage:</span>
                  <div className="font-medium font-mono">{vesselName}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">Port of Loading (POL):</span>
                  <div className="font-medium">{pol}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">Port of Discharge (POD):</span>
                  <div className="font-medium">{pod}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Box 4 & Reference */}
          <div className="col-span-5 flex flex-col justify-between">
            <div className="p-2 border-b-2 border-slate-700">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Issued in: REPUBLIC OF INDONESIA
              </div>
              <div className="text-[11px] text-slate-700 leading-tight">
                For official use in accordance with the rules of origin of international trade agreements.
              </div>
            </div>

            <div className="p-2 flex-fill min-h-[140px] bg-slate-50/60">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                4. For official use
              </div>
              <div className="p-2 border border-dashed border-slate-400 bg-white rounded text-[11px] text-slate-600">
                <div className="font-semibold text-emerald-800">✓ Preferential Tariff Treatment Accorded</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Customs Entry Verification Office</div>
              </div>
            </div>
          </div>
        </div>

        {/* BOX 5 - 9: MULTI-ITEM GOODS TABLE */}
        <div className="border-b-2 border-slate-700">
          <table className="w-full text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-700 text-slate-700 font-bold text-[10px] uppercase">
                <th className="p-1 border-r border-slate-400 w-[5%] text-center">5. Item</th>
                <th className="p-1 border-r border-slate-400 w-[18%] text-left">6. Marks & Numbers</th>
                <th className="p-1 border-r border-slate-400 w-[35%] text-left">
                  7. Number & Kind of Packages, Description of Goods
                </th>
                <th className="p-1 border-r border-slate-400 w-[12%] text-center">8. Origin Criterion</th>
                <th className="p-1 border-r border-slate-400 w-[15%] text-right">9. Gross Weight (Kg) / Qty</th>
                <th className="p-1 w-[15%] text-right">Invoice No & Date</th>
              </tr>
            </thead>
            <tbody>
              {docLineItems.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-300">
                  <td className="p-1.5 border-r border-slate-400 text-center font-mono">{idx + 1}</td>
                  <td className="p-1.5 border-r border-slate-400 font-mono text-[10px]">
                    {item.marksAndNumbers}
                  </td>
                  <td className="p-1.5 border-r border-slate-400">
                    <div className="font-bold text-slate-900">{item.description.toUpperCase()}</div>
                    <div className="text-[10px] font-mono text-slate-600">
                      HS CODE: <b>{item.hsCode}</b>
                    </div>
                    <div className="text-[10px] text-slate-600">
                      Packing: {item.packagingType} ({item.unit}) · {formatNumber(item.quantity)} Unit
                    </div>
                  </td>
                  <td className="p-1.5 border-r border-slate-400 text-center font-mono font-bold text-emerald-800">
                    WO
                    <div className="text-[9px] font-normal text-slate-500">(Wholly Obtained)</div>
                  </td>
                  <td className="p-1.5 border-r border-slate-400 text-right font-mono tabular-nums">
                    <div className="font-semibold">{formatNumber(item.grossWeightKg)} Kg</div>
                    <div className="text-[10px] text-slate-500">Net: {formatNumber(item.netWeightKg)} Kg</div>
                  </td>
                  <td className="p-1.5 text-right font-mono text-[10px]">
                    <div>{refNo.replace("COO/", "INV/")}</div>
                    <div className="text-slate-500">{departureDate}</div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-700 font-bold text-xs">
                <td
                  colSpan={2}
                  className="p-1.5 border-r border-slate-400 text-center uppercase tracking-wider text-[10px]"
                >
                  Total Consignment
                </td>
                <td className="p-1.5 border-r border-slate-400">
                  {docLineItems.length} Commodities / Export Cargo
                </td>
                <td className="p-1.5 border-r border-slate-400 text-center font-mono text-emerald-800">
                  WO (100%)
                </td>
                <td className="p-1.5 border-r border-slate-400 text-right font-mono tabular-nums text-xs">
                  <div>{formatNumber(docTotals.totalGrossWeightMT, 3)} MT G.W.</div>
                  <div className="text-[10px] text-slate-500">
                    {formatNumber(docTotals.totalNetWeightMT, 3)} MT N.W.
                  </div>
                </td>
                <td className="p-1.5 text-right font-mono tabular-nums text-xs text-slate-700">
                  FOB: {docTotals.currency} {formatMoney(docTotals.totalAmount, docTotals.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* BOX 11 & BOX 12 (DECLARATION & CERTIFICATION) */}
        <div className="grid grid-cols-12 text-xs">
          {/* Box 11: Exporter Declaration */}
          <div className="col-span-6 border-r-2 border-slate-700 p-2 flex flex-col justify-between min-h-[140px]">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                11. Declaration by the exporter
              </div>
              <p className="text-[10px] text-slate-700 leading-tight">
                The undersigned hereby declares that the above details and statements are correct, that all the goods were produced in INDONESIA, and that they comply with the origin requirements specified for export.
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] text-slate-500">Jakarta, Indonesia · {departureDate}</div>
                  <div className="font-bold text-slate-900 mt-1">{signatoryName || "Muhajirin Fatona"}</div>
                  <div className="text-[10px] text-slate-600">
                    {signatoryRole || "Export Managing Director"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block border border-emerald-600 text-emerald-800 text-[9px] font-bold px-2 py-1 rounded bg-emerald-50">
                    EXPORTER OFFICIAL SEAL
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Box 12: Issuing Authority Certification */}
          <div className="col-span-6 p-2 flex flex-col justify-between min-h-[140px] bg-slate-50/40">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                12. Certification (Issuing Authority)
              </div>
              <p className="text-[10px] text-slate-700 leading-tight">
                It is hereby certified, on the basis of control carried out, that the declaration by the exporter is correct and that the goods originate in the Republic of Indonesia.
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] text-slate-500">Jakarta, Indonesia · {departureDate}</div>
                  <div className="font-bold text-slate-900 mt-1">IPSKA / MINISTRY OF TRADE RI</div>
                  <div className="text-[10px] text-slate-600">Authorized Certifying Officer</div>
                </div>
                <div className="text-right">
                  <div className="inline-block border-2 border-red-700 text-red-800 text-[9px] font-black px-2 py-1 rounded bg-red-50">
                    OFFICIAL IPSKA STAMP
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
