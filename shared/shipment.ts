// Tipe domain dan data awal transaksi EksporFlow. Dipisahkan dari Home.tsx agar dapat dipakai bersama oleh client, server, dan test.

export type Incoterm = "EXW" | "FCA" | "FOB" | "CFR" | "CIF" | "DAP" | "DDP";
export type DocumentType =
  | "Proforma Invoice"
  | "Sales Contract"
  | "Commercial Invoice"
  | "Packing List"
  | "Shipping Instruction"
  | "Bill of Lading";
export type PaperSize =
  | "A4"
  | "Letter"
  | "Legal"
  | "Folio"
  | "Executive"
  | "A3"
  | "A5"
  | "B4"
  | "B5"
  | "Tabloid"
  | "Statement";

export interface PaperSizeSpec {
  size: PaperSize;
  label: string;
  widthMm: number;
  heightMm: number;
  widthIn: number;
  heightIn: number;
  widthDxa: number;
  heightDxa: number;
  cssSize: string;
  description: string;
}

export const PAPER_SIZE_SPECS: Record<PaperSize, PaperSizeSpec> = {
  A4: {
    size: "A4",
    label: "A4",
    widthMm: 210,
    heightMm: 297,
    widthIn: 8.27,
    heightIn: 11.69,
    widthDxa: 11906,
    heightDxa: 16838,
    cssSize: "210mm 297mm",
    description: "A4 (210 × 297 mm) · Standar Internasional ISO",
  },
  Letter: {
    size: "Letter",
    label: "Letter",
    widthMm: 215.9,
    heightMm: 279.4,
    widthIn: 8.5,
    heightIn: 11.0,
    widthDxa: 12240,
    heightDxa: 15840,
    cssSize: "8.5in 11in",
    description: "Letter (8.5 × 11 in / 216 × 279 mm) · Standar US",
  },
  Legal: {
    size: "Legal",
    label: "Legal",
    widthMm: 215.9,
    heightMm: 355.6,
    widthIn: 8.5,
    heightIn: 14.0,
    widthDxa: 12240,
    heightDxa: 20160,
    cssSize: "8.5in 14in",
    description: "Legal (8.5 × 14 in / 216 × 356 mm) · US Legal",
  },
  Folio: {
    size: "Folio",
    label: "Folio / F4",
    widthMm: 215.9,
    heightMm: 330.2,
    widthIn: 8.5,
    heightIn: 13.0,
    widthDxa: 12240,
    heightDxa: 18720,
    cssSize: "215.9mm 330.2mm",
    description: "Folio / F4 (8.5 × 13 in / 216 × 330 mm) · Standar Bisnis & Ekspor RI",
  },
  Executive: {
    size: "Executive",
    label: "Executive",
    widthMm: 184.1,
    heightMm: 266.7,
    widthIn: 7.25,
    heightIn: 10.5,
    widthDxa: 10440,
    heightDxa: 15120,
    cssSize: "7.25in 10.5in",
    description: "Executive (7.25 × 10.5 in / 184 × 267 mm)",
  },
  A3: {
    size: "A3",
    label: "A3",
    widthMm: 297,
    heightMm: 420,
    widthIn: 11.69,
    heightIn: 16.54,
    widthDxa: 16838,
    heightDxa: 23811,
    cssSize: "297mm 420mm",
    description: "A3 (297 × 420 mm) · Format Besar ISO",
  },
  A5: {
    size: "A5",
    label: "A5",
    widthMm: 148,
    heightMm: 210,
    widthIn: 5.83,
    heightIn: 8.27,
    widthDxa: 8391,
    heightDxa: 11906,
    cssSize: "148mm 210mm",
    description: "A5 (148 × 210 mm) · Format Ringkas ISO",
  },
  B4: {
    size: "B4",
    label: "B4 (JIS)",
    widthMm: 257,
    heightMm: 364,
    widthIn: 10.12,
    heightIn: 14.33,
    widthDxa: 14570,
    heightDxa: 20636,
    cssSize: "257mm 364mm",
    description: "B4 JIS (257 × 364 mm) · Standar Jepang",
  },
  B5: {
    size: "B5",
    label: "B5 (JIS)",
    widthMm: 182,
    heightMm: 257,
    widthIn: 7.17,
    heightIn: 10.12,
    widthDxa: 10318,
    heightDxa: 14570,
    cssSize: "182mm 257mm",
    description: "B5 JIS (182 × 257 mm) · Standar Jepang",
  },
  Tabloid: {
    size: "Tabloid",
    label: "Tabloid",
    widthMm: 279.4,
    heightMm: 431.8,
    widthIn: 11.0,
    heightIn: 17.0,
    widthDxa: 15840,
    heightDxa: 24480,
    cssSize: "11in 17in",
    description: "Tabloid / Ledger (11 × 17 in / 279 × 432 mm)",
  },
  Statement: {
    size: "Statement",
    label: "Statement",
    widthMm: 139.7,
    heightMm: 215.9,
    widthIn: 5.5,
    heightIn: 8.5,
    widthDxa: 7920,
    heightDxa: 12240,
    cssSize: "5.5in 8.5in",
    description: "Statement / Half Letter (5.5 × 8.5 in / 140 × 216 mm)",
  },
};

export function getPaperSizeSpec(size: PaperSize = "A4"): PaperSizeSpec {
  return PAPER_SIZE_SPECS[size] || PAPER_SIZE_SPECS.A4;
}

// --- Microsoft Word Standard Page Margins ---
export type DocMarginPreset = "Normal" | "Sempit" | "Sedang" | "Lebar" | "Kustom";

export interface DocMarginSpec {
  preset: DocMarginPreset;
  top: number; // in mm
  bottom: number; // in mm
  left: number; // in mm
  right: number; // in mm
  label: string;
}

export const DOC_MARGIN_PRESETS: Record<"Normal" | "Sempit" | "Sedang" | "Lebar", DocMarginSpec> = {
  Normal: {
    preset: "Normal",
    top: 25.4,
    bottom: 25.4,
    left: 25.4,
    right: 25.4,
    label: "Normal (Atas: 2.54cm · Bawah: 2.54cm · Kiri: 2.54cm · Kanan: 2.54cm)",
  },
  Sempit: {
    preset: "Sempit",
    top: 12.7,
    bottom: 12.7,
    left: 12.7,
    right: 12.7,
    label: "Sempit / Narrow (Atas/Bawah: 1.27cm · Kiri/Kanan: 1.27cm)",
  },
  Sedang: {
    preset: "Sedang",
    top: 25.4,
    bottom: 25.4,
    left: 19.1,
    right: 19.1,
    label: "Sedang / Moderate (Atas/Bawah: 2.54cm · Kiri/Kanan: 1.91cm)",
  },
  Lebar: {
    preset: "Lebar",
    top: 25.4,
    bottom: 25.4,
    left: 50.8,
    right: 50.8,
    label: "Lebar / Wide (Atas/Bawah: 2.54cm · Kiri/Kanan: 5.08cm)",
  },
};

export function getDocMargins(shipment: Partial<Shipment>): DocMarginSpec {
  const preset = shipment.docMarginPreset || "Normal";
  if (preset !== "Kustom" && DOC_MARGIN_PRESETS[preset]) {
    return DOC_MARGIN_PRESETS[preset];
  }
  return {
    preset: "Kustom",
    top: shipment.docMarginTop ?? 25.4,
    bottom: shipment.docMarginBottom ?? 25.4,
    left: shipment.docMarginLeft ?? 25.4,
    right: shipment.docMarginRight ?? 25.4,
    label: "Kustom",
  };
}

export type DocumentOrientation = "Portrait" | "Landscape";
export type DocumentTemplate = "Classic Trade" | "Corporate Clean" | "Minimal";
export type PreviewLanguage = "English" | "Bahasa Indonesia";
export type ShipmentStatus = "Draft" | "Quotation" | "Confirmed" | "Ready to Ship" | "Booked" | "Stuffing" | "Departed" | "In Transit" | "Completed";
export type LineItem = { id: string; description: string; hsCode: string; quantity: number; unit: string; unitPrice: number; weight: number; length: number; width: number; height: number; packagingType: string; shrinkageRate: number; palletEnabled: boolean; palletCount: number; palletLength: number; palletWidth: number; palletHeight: number; palletWeight: number };

export type AdditionalCostFactor = {
  id: string;
  name: string;
  amount: number;
  section: "goods" | "logistics" | "strategy";
  category?: string;
};

export type ContainerCalc = {
  name: string;
  innerL: number;
  innerW: number;
  innerH: number;
  volume: number;
  weight: number;
  cartonVolume: number;
  totalVolume: number;
  totalWeight: number;
  netWeight: number;
  grossWeight: number;
  productVolume: number;
  palletVolume: number;
  palletWeight: number;
  byVolume: number;
  byWeight: number;
  containers: number;
  volumeUtilization: number;
  weightUtilization: number;
  packagingVolume: number;
  palletCount: number;
  shrinkageLoss: number;
};

export type Shipment = {
  reference: string;
  exporter: string;
  buyer: string;
  buyerCountry: string;
  destination: string;
  product: string;
  hsCode: string;
  currency: string;
  incoterm: Incoterm;
  paymentTerms: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  packaging: number;
  inlandTransport: number;
  originHandling: number;
  customs: number;
  freight: number;
  insurance: number;
  destinationHandling: number;
  importDuty: number;
  lastMile: number;
  margin: number;
  discount: number;
  contingency: number;
  exchangeRate: number;
  exchangeRateSource: string;
  exchangeRateDate: string;
  formulaVersion: string;
  namedPlace: string;
  cartonLength: number;
  cartonWidth: number;
  cartonHeight: number;
  cartonWeight: number;
  cartonQty: number;
  containerType: "20GP" | "40GP" | "40HC";
  packageType: string;
  paperSize: PaperSize;
  documentOrientation: DocumentOrientation;
  documentTemplate: DocumentTemplate;
  previewLanguage: PreviewLanguage;
  documentReviewed: boolean;
  documentRevision: number;
  letterheadText: string;
  letterheadImage: string;
  letterheadLogoScale?: number;
  letterheadLogoWrap?: "inline" | "square" | "tight" | "through" | "behind" | "front" | "topBottom";
  letterheadLogoAlign?: "left" | "center" | "right" | "custom";
  letterheadLogoPositionPreset?:
    | "inline"
    | "top-left"
    | "top-center"
    | "top-right"
    | "middle-left"
    | "middle-center"
    | "middle-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  letterheadLogoX?: number;
  letterheadLogoY?: number;
  letterheadLogoOpacity?: number;
  letterheadLogoRotate?: number;
  letterheadLogoFlipH?: boolean;
  letterheadLogoFlipV?: boolean;
  letterheadLogoBorder?: "none" | "solid" | "dashed" | "rounded" | "double" | "oval";
  letterheadLogoBorderColor?: string;
  letterheadLogoShadow?: boolean;
  letterheadMode?: "standard" | "banner";
  letterheadBannerImage?: string;
  letterheadBannerHeight?: number;
  letterheadFooterImage?: string;
  letterheadFooterHeight?: number;
  letterheadFooterEnabled?: boolean;
  letterheadFullPageBg?: string;
  letterheadFullPageBgEnabled?: boolean;
  letterheadBleed?: boolean;
  letterheadWatermarkImage?: string;
  letterheadWatermarkOpacity?: number;
  letterheadShowAddress?: boolean;
  letterheadSpacing?: number;
  letterheadDividerGap?: number;
  letterheadDividerStyle?:
    | "single"
    | "double"
    | "thick-thin"
    | "thin-thick"
    | "thin"
    | "bold"
    | "accent-gradient"
    | "dashed"
    | "dotted"
    | "none";
  letterheadDividerColor?: string;
  letterheadLayout?: "left" | "center" | "split" | "geometric";
  letterheadGeometricStyle?:
    | "teal-slant"
    | "sidebar-strip"
    | "top-banner-slant"
    | "diagonal-frame"
    | "ribbon-divider"
    | "hexagon-badge"
    | "navy-arrow"
    | "modern-hex"
    | "diagonal-split"
    | "minimal-blocks"
    | "creative-wave";
  exporterContact?: string;
  poNumber: string;
  bookingNumber: string;
  containerNumber: string;
  sealNumber: string;
  signatoryName?: string;
  signatoryRole?: string;
  buyerAddress?: string;
  buyerPicName?: string;
  buyerPicRole?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  vesselName?: string;
  bankName?: string;
  bankAddress?: string;
  bankAccountNo?: string;
  bankSwift?: string;
  shipmentStatus: ShipmentStatus;
  attachments: string[];
  lineItems: LineItem[];
  additionalCostFactors: AdditionalCostFactor[];
  hppMode?: "trader" | "manufacturer";
  traderBuyPrice?: number;
  traderShrinkage?: number;
  traderSourcingFreight?: number;
  traderSortingLabor?: number;
  traderInnerPackaging?: number;
  traderLabelPackaging?: number;
  traderStaffingOverhead?: number;
  traderMargin?: number;
  contractSpecialTerms?: string;
  contractLayout?: "1-page" | "2-page";
  defaultExportFormat?: "pdf" | "docx" | "xlsx" | "html" | "txt";
  blNumber?: string;
  sellerSignatureImage?: string;
  sellerSignatureType?: "draw" | "upload" | "font" | "stamp";
  sellerSignatureDate?: string;
  sellerSignatureHeight?: number;
  sellerSignatureAlign?: "left" | "center" | "right";
  sellerSignatureX?: number;
  sellerSignatureY?: number;
  sellerVerificationCode?: string;
  buyerSignatureImage?: string;
  buyerSignatureType?: "draw" | "upload" | "font" | "stamp";
  buyerSignatureDate?: string;
  buyerVerificationCode?: string;
  includeOfficialStamp?: boolean;
  officialStampColor?: "red" | "blue";
  docEditorFontFamily?: string;
  docEditorFontSize?: number;
  docEditorLineHeight?: number;
  docEditorTextAlign?: "left" | "center" | "right" | "justify";
  docEditorMode?: boolean;
  docMarginPreset?: DocMarginPreset;
  docMarginTop?: number;
  docMarginBottom?: number;
  docMarginLeft?: number;
  docMarginRight?: number;
  docHeaderEnabled?: boolean;
  docHeaderText?: string;
  docFooterEnabled?: boolean;
  docFooterText?: string;
  docShowPageNumber?: boolean;
  docShowRuler?: boolean;
  mfgRawMaterial?: number;
  mfgAuxiliary?: number;
  mfgDirectLabor?: number;
  mfgOverhead?: number;
};

export const DEFAULT_INDICO_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIgAAACfCAYAAAAiaZFxAAAea0lEQVR4nO2deXAUx9XA5S93nDiJc1ROJ6nYVbGr4lSuSlK5XEnlrrgq8YGvsuP4wgaDsbHFZQ5jsLhPA+I+zCEBxiBAHOK+JJBAIGxuEEKcAnFfAtxf/SbbSu/sTM/M7szuzEp/vAJJu297u3/T/fq9169zhBA5Ovnwww+1f09VmvWHW3/oG9isvxmQZv0h1m+8oFmiITdu3Mi5dOlSfjo/M/QEN+v/Lxg7duwQFRUVgv+ndQYJQwc067eW8+fPl5eXl4t33nlHrFixQgTxWc2ARFD/mTNnxKpVq8SYMWPEqFGjxNKlS32fOZoBiaB+wGCmGD16tMjPzzdk+fLlgcHRDEhE9GN4rlmzxpgxJBjI6tWrA1lWmgGJiH5mhu3bt4sJEybEgYEsWLDAmDky3f5Id7CVXLhwYWlDQ0Po289yMmfOnAQwkIKCAnHlypXcMLQ/6wA5ffq0mDt3rpg4caIxAMuWLRObN28WtbW1QgUnk+3ft2+fGD9+vCUc/J7vEJb+zzpApM5t27aJsWPHGrsA2fms8fPmzRNbtmwRPMGZaD+fbQWGFOAJU/9nJSBSeBLnz59vOxizZ88W2ABXr15NS/s3bdqkhYOtbdj6P6sBkfp37dolxo0bZzswTOtr164V586d2xdU+6uqqrRwzJgxw3IJzHT/h2IA06G/vr5eFBYWageJJYinGEPXz/YfOXIkzrdhJUePHrVc8jLd/6EZwHToZylZvHixdqAQZhtc3NevX0+5/Xzm1KlTtZ/H7BWG/mnygMifS0tLHSGR077dk+22/evXr9d+xqRJkxq3tGHonyYPiBSMUzeQsDSUlZXZurt17cemMXtHzfLBBx+kBGAzIAHq3717t6NtIIXt8cWLFwu96GfpcJqhnOIsme7/UA9gOvQDiRtAEGyJU6dOufJTsCOxc4ZJ4bPD3j+hH8B06He73CDETY4dO+bo6dyzZ48jbG6itJnun9A3MF363Rqu0m8iIbHTTw6HTgce1Sj0j6/5i1EWnmY8q7jm3Qi7D11+6OTJk7XvP3v2bH2mv7MbCT3B6dSPM03ncbUyXK18JexedO8jWutH+/kboNXU1IidO3casxIzIcYxuSQ4/fiXn/k9rn5eQ5yK3RM2EEsh8R8EPWZvbqQGMB366Wi3gCDEeq5duxanY//+/dr3bNiwISlAmOXwym7cuNGIWHuBWQfrunXrjGi3lU0UuQFMh/4lS5a47mCWC7MnFC+s7j0HDhzwBAg7JwaRZStVIPDLADWGOUnRjjZIFAcwaP3YFtgYbgHh30OHDjUOOjkouvewLDi1gaeZIOO7776bMhTMNBjNLCdmr22TBASd2AFMm3QK6y1PDP+y1rIDAQKdDgbHCyDTp09vtEeY/nXvcdreHjx40Jj6Vf1ehZ0WoLLc6RKlmgwgPBkcLlq0aJGRTWYeQCthlli4cKFhuB0/fjwuQZj/Ow20Wb/cuuIh1U3xdt8BT605mOgFELzC5LLu3bs3wS5qsoCwPnM0wC7m4aWDWeOx+g8fPmzAUldX5wkQwCR667Q8Wc0g2CUq2F7aP2XKFGOH4iVNIesBoTOc1vpUpuhp06YZuaw8kV70V1ZWOu4uVBsEWHQRX137WdaYNd2kJTQZQHg9toRTnCNVQNyKWT9gOQUAsW9EbFnUpUTatZ+Z5v333/flQFVWAUKHukn4ySQgboRZiS2mU4ablf6SkhJx+fLlvHT1f2QAIQtdWvZRByQ/Zjd41U9eq9/jkRWAnDhxQrj1S0QFEK/6nRKLmiwg+CysjiZaCWszSxDbzerqaiN3g6kcnwdGLbsStoAYhcnMRpkChAPdmer/UAPCzOEEBz4HYhNmP4Zb/azpbrPKMgUIbnbABnC3/o2sBwSbw25ZARpOw9tB4aX9/J3tbJgBUX8G5pkzZxrf38lLmrWAYKVbeSOJSxBt9fIU2bVfxjpSXWoybePgc8FRyMPSJABh4IqKiho7gPO1K1euFCwHfujnZ548nTs8SoCoQthAPfidlYCQK5Efsy22bt2a8p5f1Y8H08kxFWVA8mOxHhKC3I5bpAAh+orFTlKMX58rU+fwPPqRYBN2QKRgfPtxMjDjOY/pELa1bnNNs0mwTVLtu1DNIH4L4XPW5TA+4enST3ZbSjNItgJCwhDRzrAPoJ1gS3B2hp0bydGATgyH/7PzchuszHfwwjZJQPCeElWNwhOuCgPPcogNJiO1dv3D75khyUQnF8Su3ll+zHeCfdcMSCziq0ZJowSIKgTzyHchZdJtBSRCCgT0rPJYCUNYbYGbFCDoKi4uTssAplM/ywnhBC+lsnCcAZgaRsB10KSTlvGbJDuADAKBPnQwbTvV9cgEgNgkTvVKzELIgt2MBAU/kJpo1GQAoSPwunodQDoMz6rqMyAwFqYZRP0Z45Vlx2v/ENmWTkJO3Ml+bzKA2G1n7QaQ3YBV/ILfWYEWFkDyY0anl8NXqvA+ZiIClE0GECx0tx1MJJggndXnssbL3U+YAcmPBem8xl2kEAFmCSXhuUkAwmzgpoOx7nWlLgkK+jWAbFlxdxM6oH1OheySAZDvk0r/MVtySEunI/KAEOV108EcPdSlCZC5lsoAcqaGtZ0p3C7AWLpihWj/73+LLq1bi16dOolBffqIUSNHpjRDMQuk2v+6fok8IAyKUwerRpmd6GYhO5G5GDyFbqsFDezcWbS+775GyX3ySbG5vNyYaay8o06AcBtV87kYG6FjnFIS8TI6fYbX2YPPJMaBT8Fr+w/t3y9efOCBOEj6vPqquHrlSi62AW5x1Q5yY+O4qXXWJAHBX6HrOAbRjX5mAbdwcDRTXUKSaX/BmDFxgCCThgxpbCvgk9PBjOIGEGa/ZkAshGReu07D5pAha50O1l83eSIE/qycVMm0/8K5c/teffzxBEjWLF4cpx+DmsPobsAl/tQMiElI3rUbTOmWdtKP/eDU+exG7JKDk23/knffTQDkpYceErXV1QllNjFEnQryUt6iGZCYYBAera21PK7ArmBwjx5iwsCBYtrIkWIuQa9580Rlaak4UlMjrpssdpniaCe43nVtTLZ/ALjLs88mQPLmSy+JBiXmIvUDss6Bx0zTZAHh6d1VVSXmvvOOGNSli2j38MPitaeesuyonh06xHV4q3/9K/4pbdFC9OvQQcyeMEFUbdpk3BljpYcn1ny5j9/9s3bJkgRAENpmpR9I7GYSorXJtCWygGAbbN24UYwfMEC0f+yxhE58vU2bhE4aNmhQwg7BDIhZRgwfnqCHJ5XB8AtwO+E7vv7ccwltevH++8XeWJKPWb+u8hFVGn0HJN35oU7C8rFh+XLR+ZlnjMG1k565uQk5mECje49Z2rRoYZnLWRXLCk+HLJ4927JtfXNzbdtAGN+q3QQZ/W5faGaQa8QHSkpEj9attU+8lLe6do17eoYPGZIwezjNIK88/njCU5jXtavo9vzzYlVxsatTa6n2z7kzZ4wl06p95WvXWi4b+F+sYkZO+adJzSDpAuRiQ+JNCSK252fG6NqypfUgPvqo6NWunXi7Z08xeehQMXPcODFv6lQxwbQWF0yaJMb06ycGdOxozD5uAMl9+uk4HQPz8ozpXf4dI3LDsmVaL6kf/TN91CjL9vE9LtpsX4mjmO0RtvaRBGRV9SpRc6YmYftG56tgdHvhBTFx8GCxvKhI7Nq2TZytr7c1vNS0OtzN5kG8cvlyXvWePaJsxQrD6OvfoYNoY5phOrVsGTcDtX3oIcuBwtN5wMZb6Uf/HD10yBbikb172/YB5a5UQGbNmhU9QCqOVIjOyzrHNfxYba2xG+n+wgti6ogRomzlSnH65ElPX049U4vX0U37L1+8WLhlwwYxZdgwgaOqS6tW/90ajxplzCa6JY2ZBdCuekzZcyvMkFafywxYbnNl2YemSox4XiMFyP76/eKOoXeIExdONFrk28vLBYYZDiFpCCWjW4bP8YLqcjVtd0kNDTkrS0oMHW+atsY6ebNtW1GrJOv4BQg7NjtAeJDM/hspZNKpnmDd9WahAuTM5TPirrfvEp1KOjV2JvaGWV+y+mUJJ6u7Zt3qx/tIBvzxw4fFrPHjxcuPPOIKEoxK7CY/AaFvOlvMYtKGWmtyw8fBpeTinvQ4E2cEkGs3ruX8cfIfxS1v3SJOXTqV9ADqBLuDDnEqe+AECGdQ5M/sKFhGXrKxRawcWjdSCLWb5b3Jk20BwVazm0XkVSb0BwHM0APStrityOmeI3KX5gbmiWSJYavn9H7d3+0CXCfZIfTr5wqS/h07ivq6Ol9KRB2urtZu0zHq7d5L4hShB1liM7SATKqcZMDxiZ6fEEfOHQkMEIxU7kAJSj9SVV4urDyd5gHkNXUejyPYCbEYO0D4m+77kIrAzia0gGw+ull86s1PGYA8Pe/pQF3VbHPV5SEIQJCLFy4sZeutA0T6TE4lWeVHlfkzZtgCgnygucqMPBW3V52lHRCM0tuH3G7AgWw7Zr/19GMAudPFbZofHlGqHFJAhn+TKQTH9N7OwjZRB7B7q1YCOyYVQGr27dMCMuqtt7T6vRbcSQsgvKbFzBaNcPxuwu8cO8npcLKTOK21gMCBKFIOyRh777334iomUiAPHwLLFIE5N3mdB/fsEeadhnkA++XmJvhKvA6Y+hlm/YQTvPqMMg7I+M3jG+FApldN134BBsPp1kgncbvfV/Xzf/wG5H2SP6G6qnEycezBaZtYf/Kk6KXYCVau/AmDBqV0HGHysGFa/YuS8JhmDJB99fvEZ3p/phGOW/NuFZev6ac5DiLLQFi6goF2kLHVNRe0Ax5d6Jz4CDOF3QAiKxcsSHoQ8SzrAOnZpo2vJboCA+TGhzdyfjv+t3GzR6sFrbQdQ3kCxG0Dg+4A+Royw9UIKbMLINstPZcuXiwEEjtA2rZoIWpcJBxZyakTJ7SAIGTHhx6QoaVD4+BA1tWss204Ti38F6qRGAZApNAubBI1lZHdkp2/hOTjAZ062e5wcMsnW+hW2iF2gBRN1y/jGQek+nS1uLnXzXFw3DboNsGsYvV6OopkYvM2LEyASGH7rN4wiVvfzjbhew3t3t0WkqJp05IayNF5eVpAerdrF25A7p12b8Ls0W6RfaO5OpRUPq8FTDIBiIh5WdVKReR8WkGCfmySHq1aWS81Dz4ojtmUf9LJwoICLSBIvQ+7mUAAKdpVlAAHsnz/cssGs7QwbVvdWhBWQETMp6AerWBWMS83Uj9u8nY2wb4Rb77peSBJS3ACZL3G9Z4xQK5cu5J7+9DbE+D43FufEw3XE9db3i8LrPl18ChdgIhYKU3VeCUophquqv51S5faDuZOTc6KlXBEwwkQMuwCB8RrEuvELRPFTd1uSpC/TPmLZcIsFw6TkINjyutnhUWwSWRiEUK8w+61BO+skpCZRbx8JhlxEhDbxO3YdjdI8UQYYfw7h99pubz0WNnDkmZ5a6TdpThhn0GkEAiTswgeWXkxs1k/aY5WydNkpB07fNjTE0/Wm24GIYXyio+17C1nEC8KzB5TVVZXr0748mrtjv02+/aoAMJuReagqIlKVvpJrLYaUJKTvXwmydpO53r2pnhVmW+AYF98d/B3LeH42BsfE5caEq86l/fa4nSySwuMCiDCVNwOo5vgn5X+SxcuLO3w5JMJg0kmml2WupWwfXYCZNXCheEAZMKWCbazx0/zf5rQSKZgGesgUJaOAQxaP7rUXQ11vuz0r160KGUX/LgBAxwBKRg9OvOA4Pyysz2QZ4ueTWgkmeayI3WJPVECBOHGK9U3Ypc6QHogycbmAeUIhdvPIuPfCRBmmYwDMn/XfFs4kGFlwxIaqdYOt7M/oggIQKilogDG7rXrSkosB/W4S2N15tixjoAAYcYB+fOUP2sBMTvIyMVQo6NnNEk0UQMEKYkdl0C4Ps0WpoaGnE4WmepL58xxNajvTpzoCAhBwVS+Y8qAbD22VdzU/SYtIAfPxJ+EV6dh3Ou6RkQREPWEPcaqLiBXPHNmwqAOfv113wBBvBi+vgNiFXNR5eM9Py6u34gPiePzaDwzW1AQyLGHTALCjCi/H44z3YWLHB9t8+CDCU+9G/8F22U3gJxwkZsbCCB7Tu1xnD2+M/g7CY1TE3CoD55tgKBTnmYDEKdCM+SRmgd1l5ITYydUSHIDSLJ5JykD0nNVT8ONrgPk52N+Htc4/B2q/bHMIaAURUCEcjYYQHQ3OiEV69YlDCrHT50+Y/zAga4AScVZlhIgd4+82xGQv0/9e1zjzJWPuSE6GwGRhXcBhBs1da9lOTHXAKFyktNnDOvRwxUgu13MRr4DcuD0AQMAJ0AemvVQXOPMV2lQJC4bAZG3SwCIm3LYo3r3jhtUEp+d3tPbhavdACTJCocpATJi4whXgDw9N/6AlPlSH6fTb1EFRAYhAaTaVLrSSqhYZHa7O7XNKVgnZb/GFxMYIP+c8U9XgDxX9Fxc4wBCBQR3dDYCQvhAAuKmeBxZZeaB1R2yYuva2kURPsRcWzVwQHCtf7HPF10B0nJ+y7jGYXOogBAmz0ZAZBIRuxm3J/zMAbxazaVAVDRyC8gpzTY7EEB21O1oBMAJkP/M/U9c48x3ruB1zDZAyCiTme9O30+Vkb16uTYu18fc9G4AafBw2aEvgEzeOtk1IA/PejjuS5qv53AqNB9FQOrq6hq/n5sD5FI4qqAO7LaNG23fWzh2rCtAXnviifTHYtovbu8akL9N/VtcA8leVwGZ5pD2H0VA2Nby3Qj9e9FPrTF1cLdodnj9Y2WxnADxEh1OChCrPMR7p99rmXdqJTjK1PeWlZXFFXclJ4Q1OujcyXQKywrfTdZxdyukI6o5pZvXrbN8P0sYVY7cFAMe269foHmpltT8YMQPXM8gZLir7zWXZkTIvMqWGQTYOf5AyJ+kKC/6z54+Hff0by0rs3z61RIQTjMI9esDnUGs3vDZ3p91DQiVhNTTdNzpagZEF6uIGiBk6fOdKioqPFcn4LVq/TO7YjCkA7gFhFkorYCcvXK2XgXACRDk0NlDjY20ut5L5wuJGiBUM+bEnTwb41W/WjjYrjjvkK5dXQNyMsWqRp4BIYLrFZDFe/9XopGjlWZAZmsCU1EChFN1LC3qEUyv+jEq5eBa1TXjQLiaHqADhNpoQfdPwi82Hd7kGZB+6/rFNdSq0Lw8RxJlQHD6mS8Q9Kp/SLdu//NfWCQaUepKhUAHCBWj0w4IddW9AkL5KVWHmpInxS6gFRVAuOWaXUuq+kfEnGWUd7D6+/A33nANSEWK9kdSgCzdt9QzIN8a+K24hko/gSp2iUNRAaTOphaqV/35sbIOzCQJEJ486fpCJIzdyzazcqCAlOwv8QwIgu0idbCtNQOSb3MzY1QA8Uu/BIR0QvPfrPJX7QAZ07dvZuqDrDm4JilA3t74dlyD1doaUjZauJbDNoBB65dLTKnprDK7otctLjm0A2Srxk0fKCCVRyuTAoSjEaoe/ARmQDjhbz5oFLYBDFq/NFLNZ2M2r19vCYIVIF2eeSal69hTAoSLf5IBhPO5auF+LgW2WmbMd7uEbQCD1s82t+NTT8XFcPi/rJroBpCMlsGkQIyaye4WEGTkppFxDZdZV6rgpla3d2EbwKD1d33+eeMadvV3O7Zutd2pmAF55bHHUjoHkzIgyNf6fy0pQH42+mdxX5yrKaxmEdUWCdsABqmf15JquElJouJ3Azt3dg0I9/Wls/2Wv/zN+N8kBQhSVlsW9+W5R80MCKft8CuEbQCD1o+XlIudqbEqf8cNXDpXugoIuR9cLpBxQFoWtUwaEHOWOwm9VrMIddJlSDksAxi0fqK0ZLfLn7mMqJfp+g8dIKuLi32dPZIGJL88P2lAPtLjI2LXyV1xs4g8Q2IWWesrLAMYtP7yNWvEZiVwudqU6a4DpO9rr/l6u1VKgFQeq0waEOSR2Y/EkU5wS61eLIVkogOaxN1sA4TiMddiBvr5s2frWTLcAMJZXl2Cc9oB4TD2rX1uTRoQdkEba+MdOebjEOrpeK/3rEUVkAPKFSaUsHSCQwKyxGW5iLQBgtxfeH/SgCC/HPvLuEQiHGRW3lVS98wh9GwFRDoJSRRyAwcyZfhwV8cqAgPELheRk3Vu81LtpGB7QVy+JIV085V6o6pQ5J9ckiDzK8MgeEDfePFFV/mmJC5nOp/XlhzugUllBkG+N+R74vzVeKcOZ3XNM4i6s9Fdkhz1GQRZoqQT6oRDVnXHjmXciNf+kYz1VADJsThYxRNRXFxsCUh+7PoNu+SiqANycO9ew+B0guOVRx8VZMCHof3aP+I6TxUQhKtSVb242mWROzMg8izNqVP6C5mjBgjOse42N0Kowu3fuy0uXGLjsGjvIt9nlJQAIYH5C3lfSBkQrkollVHVjb1BrqoVIPLMqzm9L6qA8Joxffo4wtH+sccSSjnw3p11O8Wvxv1KrK/RH4RPOyAIJS5TBQT5av+vCmqOmCFZvHixJSBSqFDk9gLDsAJC9NUJDqoh1pjKhdZdrBOvLH7FeMDaLGwTHj+IKkxt3x/2fV8guWPoHQm3cdNAcj2tHGlSuPGJ8zbJDHamASGxh0L+Ojj6tG8fdzkQOidXThZf7vtlY4nH2L9w1d8YjG+AoGDqtqm+AILc9fZdcZDIBnIgiYQi3WxCTQ55nWoUACH28rLNJUNSpo0YEXc6nwupuXdY9tdH3/ioWFuzNnyOMlUBDq8fjvyhb5DwRLCNNjeQAryytJNOeM3hw4ddzSiZAoQDTVZFdNXIrJqVznLSemFrI5Yl++n/evyfmFaV3J13aQWEf6mm7BcgCNMnN2SaG/hh7IpS9VJBO8HIJYNe5zvJBCBUDsIZZgfHuP79xdlYVSJuyei7tq/4fN7nE/qo87LO4faDmBVQC8RPSDjX221FN8urRBh0EovUuuh2Qn4Jxi4VkM0+lHR3MFeBqKfnVOGa1A8qKw0wuF6FqDlHRqz65g+T/mAUKI4UIMcvHBdf6fcVXyHBCPvRqB+J7SesK/VxsSAJ0BiqTqBIIUmJOiXMRJxnSfbuWq8dzDmVAR07JoDBEUnus8PNTkrnmIoxwu7unZxYcWKWnEwAnhIgyJwdc3wHRM4meWvzLC9GFDEPLMlHnNrjSjC3sEg/C4Bh5HL4mjpqzE7c4csOih1Sst5b2T8GHKZLlllmAIMQ/7kr5/YNXD9QfGPAN7T9QWUF6uO7HcDQAYJQ2dBvQKRQm2TZfn11Zp5ESj8xs+C2J9DnBIjqgMN2oZYa9gsVClMZBN5LGmD/2MzBPXKU3t5eUWHoxRh/qfglcctbtzj2BTuWBbsXJLgBIgfI5WuX87hlKghApFDBufxwuWsLnlA6ea6Aw0xDTRKEhKTa2lpjqfFa8MWNUGEwr3170a9DB7G8qEicqa8XV69fzSGS/afJfzJ2Im77YtzmxNN2kQQEqT5TLdTsd78BUUHhvHCyHRVkB+O/qCwtFfV1dUbuC6cSKQsqS4h6kf7r+4fy7HJKCnjCb+51c6CASMHB1nddX3HsfHgcZfWX6sW8nfNEqwWtHG0LnfRa3Su09VNSVkDxGAzMoAGRgiPpnon3iKGlQ8XOkzsdZxY/O/hiw8VC/EFszcmYoy2pRrvz1uSFugpkygoQniKOXqYDELN8e9C3jVqtwzcONxxvRKD96GCOkaIPX8Xz8583DoVZfcdk249tYj7wnrWAIFjfn+716bQDkqCv+03i6wO+Ln49/tfikVmPGFFQbgUftGGQwP9AbgrCFfOjNo0SbD27LO9iQEB9+p/k/0R8qe+XAm3/J3t+UhS+X+hqqcw4IH7mL+IjYYBSzWXNZmErW7SrKNDapn6K7wTzZHiZSfyeQcKsn3jLwt3ebsrO+AwSRAPZ3WAbRG0Ag9T/4/wfi72n9nqOzGYlICJm5P1j2j8iM4BB6WfJbVvcVhCDCWIAIwuIiN07M7xsuNZXkukBDFL/bYNuM5x8QQ5gpAGRsrd+r/j9pN+HbgCD0o9/hN0TAbqgBzArAJF6ZlTNMLagmR7AIPWzva44UpG2ElFZA4gUvJHcxyujm9kCyJ3D7xSzP5id9nMrWQeIFBJicFn7nYCUbkB+MfYXYsrWKQnX0zcD4pOQIFS4vVDcM+GeyABC7OmJOU8I6qhkegCzHhBVf9XxKvHyopcT7JSwAEJq5JDSIY3pgGEYwCYFiJRrN67llOwrES8ufNE2qTcdgBBQYwnBZuL4Y1j6p8kDYv47g4M/5YHCBwzfQlCAAMTdI+4WLyx4QUyvmi5I0g57/zR5QKzk6PmjxiVGg0sHGxlcf33nr0YuK5lc6sEjK0CwH7458JtG1Pa+gvvEq0teFaPLR4vS2lJxocH78cYw9k+TB8RJHw4qIOKqtOrT1ca/2A1ssbNtGxq0/v8Hh6zoW5eot/IAAAAASUVORK5CYII=";

export const initialShipment: Shipment = {
  reference: "EXP-2026-084",
  exporter: "Indico Export Indonesia",
  buyer: "Nordic Pantry AB",
  buyerCountry: "Swedia",
  destination: "Gothenburg, Swedia",
  product: "Organic Coconut Sugar",
  hsCode: "1702.90",
  currency: "USD",
  incoterm: "CIF",
  paymentTerms: "30% DP / 70% before shipment",
  quantity: 2400,
  unit: "carton",
  unitPrice: 18.5,
  packaging: 1320,
  inlandTransport: 640,
  originHandling: 380,
  customs: 275,
  freight: 2860,
  insurance: 185,
  destinationHandling: 450,
  importDuty: 920,
  lastMile: 520,
  margin: 12,
  discount: 0,
  contingency: 2,
  exchangeRate: 18274,
  exchangeRateSource: "Bank Indonesia (Kurs Jual BI)",
  exchangeRateDate: "2026-10-25",
  formulaVersion: "v1.8 · cost/(1-target margin)",
  namedPlace: "Port of Gothenburg, Sweden",
  cartonLength: 40,
  cartonWidth: 30,
  cartonHeight: 25,
  cartonWeight: 12,
  cartonQty: 2400,
  containerType: "40HC",
  packageType: "Carton box",
  paperSize: "A4",
  documentOrientation: "Portrait",
  documentTemplate: "Classic Trade",
  previewLanguage: "English",
  documentReviewed: false,
  documentRevision: 1,
  contractLayout: "1-page",
  defaultExportFormat: "pdf",
  blNumber: "KMTC-MKS0091827",
  sellerSignatureImage: "",
  sellerSignatureType: "font",
  sellerSignatureDate: "",
  sellerSignatureHeight: 48,
  sellerSignatureAlign: "left",
  sellerSignatureX: 0,
  sellerSignatureY: 0,
  sellerVerificationCode: "IEI-DIGISIG-8849-DXB",
  buyerSignatureImage: "",
  buyerSignatureType: "font",
  buyerSignatureDate: "",
  buyerVerificationCode: "ABF-DIGISIG-1092-DXB",
  includeOfficialStamp: true,
  officialStampColor: "red",
  docEditorFontFamily: "Calibri",
  docEditorFontSize: 12,
  docEditorLineHeight: 1.35,
  docEditorTextAlign: "left",
  docEditorMode: true,
  docMarginPreset: "Normal",
  docMarginTop: 25.4,
  docMarginBottom: 25.4,
  docMarginLeft: 25.4,
  docMarginRight: 25.4,
  docHeaderEnabled: true,
  docHeaderText: "OFFICIAL COMMERCIAL EXPORT CONTRACT",
  docFooterEnabled: true,
  docFooterText: "CONFIDENTIAL & LEGALLY BINDING INTERNATIONAL COMMERCIAL DOCUMENT",
  docShowPageNumber: true,
  docShowRuler: true,
  contractSpecialTerms: "",
  letterheadText: "Indico Export Indonesia",
  letterheadImage: DEFAULT_INDICO_LOGO,
  letterheadLogoScale: 100,
  letterheadLogoWrap: "inline",
  letterheadLogoAlign: "left",
  letterheadLogoPositionPreset: "inline",
  letterheadLogoX: 0,
  letterheadLogoY: 0,
  letterheadLogoOpacity: 100,
  letterheadLogoRotate: 0,
  letterheadLogoFlipH: false,
  letterheadLogoFlipV: false,
  letterheadLogoBorder: "none",
  letterheadLogoBorderColor: "#cbd5e1",
  letterheadLogoShadow: false,
  letterheadMode: "standard",
  letterheadBannerImage: "",
  letterheadBannerHeight: 110,
  letterheadFooterImage: "",
  letterheadFooterHeight: 65,
  letterheadFooterEnabled: true,
  letterheadFullPageBg: "",
  letterheadFullPageBgEnabled: false,
  letterheadBleed: true,
  letterheadWatermarkImage: "",
  letterheadWatermarkOpacity: 8,
  letterheadShowAddress: false,
  letterheadSpacing: 2,
  letterheadDividerGap: 4,
  letterheadDividerStyle: "double",
  letterheadDividerColor: "#0f2942",
  letterheadLayout: "left",
  letterheadGeometricStyle: "teal-slant",
  exporterContact: "Telp: +62 812 3456 7890 · Email: official@indicoexport.com",
  poNumber: "ABF/LOI/2026/108",
  bookingNumber: "KMTC SHIMIZU V.2611N",
  containerNumber: "TGHU 2468135",
  sealNumber: "IDMKS998877",
  signatoryName: "Muhajirin Fatona",
  signatoryRole: "Export Director",
  buyerAddress: "P.O. Box 112233, Al Ras Area, Deira, Dubai, United Arab Emirates",
  buyerPicName: "Tariq Al-Mansoor",
  buyerPicRole: "Procurement Director",
  buyerPhone: "+971 4 223 4567",
  buyerEmail: "procurement@albarakahfoods.ae",
  vesselName: "KMTC SHIMIZU V.2611N",
  bankName: "PT. Bank Mandiri (Persero) Tbk",
  bankAddress: "Jl. Boulevard, Panakkukang, Makassar, South Sulawesi, Indonesia",
  bankAccountNo: "152-00-9876543-2",
  bankSwift: "BMRIIDJA",
  shipmentStatus: "Quotation",
  attachments: ["Buyer_PO_NPI-2026-118.pdf"],
  additionalCostFactors: [],
  hppMode: "trader",
  traderBuyPrice: 15.5,
  traderShrinkage: 5,
  traderSourcingFreight: 0.3,
  traderSortingLabor: 0.4,
  traderInnerPackaging: 0.4,
  traderLabelPackaging: 0.2,
  traderStaffingOverhead: 0.2,
  traderMargin: 0,
  mfgRawMaterial: 14,
  mfgAuxiliary: 1.5,
  mfgDirectLabor: 1.2,
  mfgOverhead: 0.8,
  lineItems: [{ id: "item-1", description: "Organic Coconut Sugar", hsCode: "1702.90", quantity: 2400, unit: "carton", unitPrice: 18.5, weight: 12, length: 40, width: 30, height: 25, packagingType: "Karton box", shrinkageRate: 1.5, palletEnabled: true, palletCount: 60, palletLength: 120, palletWidth: 100, palletHeight: 15, palletWeight: 22 }],
};


export const emptyLineItem: LineItem = {
  id: "item-1",
  description: "",
  hsCode: "",
  quantity: 0,
  unit: "carton",
  unitPrice: 0,
  weight: 0,
  length: 0,
  width: 0,
  height: 0,
  packagingType: "Karton box",
  shrinkageRate: 0,
  palletEnabled: false,
  palletCount: 0,
  palletLength: 120,
  palletWidth: 100,
  palletHeight: 15,
  palletWeight: 20,
};

export function createEmptyShipment(options?: { exporter?: string; reference?: string }): Shipment {
  const company = options?.exporter?.trim() ?? "";
  return {
    reference: options?.reference?.trim() || "",
    exporter: company,
    buyer: "",
    buyerCountry: "",
    destination: "",
    product: "",
    hsCode: "",
    currency: "USD",
    incoterm: "FOB",
    paymentTerms: "",
    quantity: 0,
    unit: "carton",
    unitPrice: 0,
    packaging: 0,
    inlandTransport: 0,
    originHandling: 0,
    customs: 0,
    freight: 0,
    insurance: 0,
    destinationHandling: 0,
    importDuty: 0,
    lastMile: 0,
    margin: 15,
    discount: 0,
    contingency: 0,
    exchangeRate: 18274,
    exchangeRateSource: "Kurs referensi internal",
    exchangeRateDate: new Date().toISOString().slice(0, 10),
    formulaVersion: "v1.8 · cost/(1-target margin)",
    namedPlace: "",
    cartonLength: 0,
    cartonWidth: 0,
    cartonHeight: 0,
    cartonWeight: 0,
    cartonQty: 0,
    containerType: "20GP",
    packageType: "Karton box",
    paperSize: "A4",
    documentOrientation: "Portrait",
    documentTemplate: "Corporate Clean",
    previewLanguage: "English",
    documentReviewed: false,
    documentRevision: 1,
    letterheadText: company || "PT. INDICO EXPORT INDONESIA",
    letterheadImage: !company || company.toLowerCase().includes("indico") ? DEFAULT_INDICO_LOGO : "",
    letterheadLogoScale: 100,
    letterheadLogoWrap: "inline",
    letterheadLogoAlign: "left",
    letterheadLogoPositionPreset: "inline",
    letterheadLogoX: 0,
    letterheadLogoY: 0,
    letterheadLogoOpacity: 100,
    letterheadLogoRotate: 0,
    letterheadLogoFlipH: false,
    letterheadLogoFlipV: false,
    letterheadLogoBorder: "none",
    letterheadLogoBorderColor: "#cbd5e1",
    letterheadLogoShadow: false,
    letterheadMode: "standard",
    letterheadBannerImage: "",
    letterheadBannerHeight: 110,
    letterheadFooterImage: "",
    letterheadFooterHeight: 65,
    letterheadFooterEnabled: true,
    letterheadFullPageBg: "",
    letterheadFullPageBgEnabled: false,
    letterheadBleed: true,
    letterheadWatermarkImage: "",
    letterheadWatermarkOpacity: 8,
    letterheadShowAddress: false,
    letterheadSpacing: 2,
    letterheadDividerGap: 4,
    letterheadDividerStyle: "double",
    letterheadDividerColor: "#0f2942",
    letterheadLayout: "left",
    letterheadGeometricStyle: "teal-slant",
    exporterContact: "Telp: +62 812 3456 7890 · Email: official@indicoexport.com",
    poNumber: "",
    bookingNumber: "",
    containerNumber: "",
    sealNumber: "",
    signatoryName: "Muhajirin Fatona",
    signatoryRole: "Export Director",
    buyerAddress: "",
    buyerPicName: "",
    buyerPicRole: "",
    buyerPhone: "",
    buyerEmail: "",
    vesselName: "",
    bankName: "PT. Bank Mandiri (Persero) Tbk",
    bankAddress: "Jl. Boulevard, Panakkukang, Makassar, South Sulawesi, Indonesia",
    bankAccountNo: "152-00-9876543-2",
    bankSwift: "BMRIIDJA",
    shipmentStatus: "Draft",
    attachments: [],
    lineItems: [{ ...emptyLineItem }],
    additionalCostFactors: [],
    hppMode: "trader",
    traderBuyPrice: 0,
    traderShrinkage: 5,
    traderSourcingFreight: 0,
    traderSortingLabor: 0,
    traderInnerPackaging: 0,
    traderLabelPackaging: 0,
    traderStaffingOverhead: 0,
    traderMargin: 0,
    mfgRawMaterial: 0,
    mfgAuxiliary: 0,
    mfgDirectLabor: 0,
    mfgOverhead: 0,
  };
}

const REVISION_KEYS: (keyof Shipment)[] = [
  "reference",
  "exporter",
  "buyer",
  "buyerCountry",
  "destination",
  "product",
  "hsCode",
  "currency",
  "incoterm",
  "paymentTerms",
  "quantity",
  "unit",
  "unitPrice",
  "packaging",
  "inlandTransport",
  "originHandling",
  "customs",
  "freight",
  "insurance",
  "destinationHandling",
  "importDuty",
  "lastMile",
  "margin",
  "discount",
  "contingency",
  "namedPlace",
  "lineItems",
  "paperSize",
  "documentOrientation",
  "documentTemplate",
  "letterheadText",
  "letterheadImage",
  "letterheadLogoScale",
  "letterheadLogoWrap",
  "letterheadLogoAlign",
  "letterheadLogoPositionPreset",
  "letterheadLogoX",
  "letterheadLogoY",
  "letterheadLogoOpacity",
  "letterheadLogoRotate",
  "letterheadLogoFlipH",
  "letterheadLogoFlipV",
  "letterheadLogoBorder",
  "letterheadLogoBorderColor",
  "letterheadLogoShadow",
  "letterheadMode",
  "letterheadBannerImage",
  "letterheadBannerHeight",
  "letterheadFooterImage",
  "letterheadFooterHeight",
  "letterheadFooterEnabled",
  "letterheadFullPageBg",
  "letterheadFullPageBgEnabled",
  "letterheadBleed",
  "letterheadWatermarkImage",
  "letterheadShowAddress",
  "letterheadSpacing",
  "letterheadDividerGap",
  "letterheadDividerStyle",
  "letterheadDividerColor",
  "letterheadLayout",
  "letterheadGeometricStyle",
  "exporterContact",
  "signatoryName",
  "signatoryRole",
  "buyerAddress",
  "buyerPicName",
  "buyerPicRole",
  "buyerPhone",
  "buyerEmail",
  "vesselName",
  "containerNumber",
  "sealNumber",
  "poNumber",
  "bankName",
  "bankAddress",
  "bankAccountNo",
  "bankSwift",
];

/**
 * Merekam ulang objek Shipment dari snapshot JSON database/localStorage dengan fallback aman.
 */
export function hydrateShipment(input: {
  reference?: string;
  status?: string;
  snapshot?: Record<string, unknown> | Partial<Shipment>;
  lineItems?: Record<string, unknown>[];
}): Shipment {
  const base = createEmptyShipment();
  const raw = (input.snapshot ?? {}) as Partial<Shipment>;
  const merged = { ...base, ...raw } as Shipment;
  if (input.reference) merged.reference = input.reference;
  if (input.status) merged.shipmentStatus = input.status as ShipmentStatus;

  const rawItems =
    input.lineItems && input.lineItems.length > 0
      ? (input.lineItems as Partial<LineItem>[])
      : Array.isArray(raw.lineItems) && raw.lineItems.length > 0
        ? (raw.lineItems as Partial<LineItem>[])
        : null;

  const migratedItems: LineItem[] = rawItems
    ? rawItems.map((item, idx) => ({
        ...emptyLineItem,
        ...item,
        id: String(item.id ?? `item-${idx + 1}`),
      }))
    : [
        {
          ...emptyLineItem,
          description: merged.product,
          hsCode: merged.hsCode,
          quantity: merged.quantity,
          unit: merged.unit,
          unitPrice: merged.unitPrice,
          weight: merged.cartonWeight,
          length: merged.cartonLength,
          width: merged.cartonWidth,
          height: merged.cartonHeight,
        },
      ];

  return {
    ...merged,
    lineItems: migratedItems,
    exporter: typeof raw.exporter === "string" ? raw.exporter : base.exporter,
    letterheadText: typeof raw.letterheadText === "string" ? raw.letterheadText : base.letterheadText,
    letterheadImage:
      typeof raw.letterheadImage === "string" && raw.letterheadImage.trim() !== ""
        ? raw.letterheadImage
        : (typeof raw.exporter === "string" ? raw.exporter : base.exporter).toLowerCase().includes("indico")
          ? DEFAULT_INDICO_LOGO
          : (raw.letterheadImage || base.letterheadImage),
    letterheadLogoScale:
      typeof raw.letterheadLogoScale === "number" && !isNaN(raw.letterheadLogoScale) && raw.letterheadLogoScale >= 30
        ? Math.min(300, raw.letterheadLogoScale)
        : 100,
    letterheadLogoX:
      typeof raw.letterheadLogoX === "number" && !isNaN(raw.letterheadLogoX)
        ? Math.max(-10, Math.min(260, raw.letterheadLogoX))
        : 0,
    letterheadLogoY:
      typeof raw.letterheadLogoY === "number" && !isNaN(raw.letterheadLogoY)
        ? Math.max(-10, Math.min(80, raw.letterheadLogoY))
        : 0,
    additionalCostFactors: Array.isArray(raw.additionalCostFactors) ? (raw.additionalCostFactors as AdditionalCostFactor[]) : [],
  };
}

/**
 * Mengubah state Shipment menjadi payload tRPC `shipments.create` / `shipments.update`.
 */
export function toShipmentPersistencePayload(shipment: Shipment): {
  reference: string;
  status: string;
  snapshot: Record<string, unknown>;
  lineItems: Record<string, unknown>[];
} {
  const { lineItems, ...rest } = shipment;
  return {
    reference:
      shipment.reference.trim() ||
      (shipment.buyer.trim() ? `Ekspor ${shipment.buyer.trim()}` : "Transaksi Ekspor"),
    status: shipment.shipmentStatus,
    snapshot: rest as unknown as Record<string, unknown>,
    lineItems: lineItems.map((item) => ({ ...item })),
  };
}

export function applyShipmentFieldUpdate<K extends keyof Shipment>(
  current: Shipment,
  key: K,
  value: Shipment[K],
): Shipment {
  const next = { ...current, [key]: value } as Shipment;
  if (REVISION_KEYS.includes(key)) {
    next.documentRevision = Math.max(1, current.documentRevision + 1);
  }
  if (current.lineItems.length && (key === "product" || key === "hsCode" || key === "unit")) {
    const lineKey = key === "product" ? "description" : key;
    next.lineItems = current.lineItems.map((item, index) =>
      index === 0 ? { ...item, [lineKey]: value } : item,
    ) as LineItem[];
  }
  if (current.lineItems.length && key === "unitPrice") {
    next.lineItems = current.lineItems.map((item, index) =>
      index === 0 ? { ...item, unitPrice: value } : item,
    ) as LineItem[];
  }
  return next;
}

export function applyShipmentNumberUpdate(current: Shipment, key: keyof Shipment, rawValue: string): Shipment {
  const parsed = Number(rawValue);
  const numericValue = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  const next = { ...current, [key]: numericValue } as Shipment;
  if (REVISION_KEYS.includes(key)) {
    next.documentRevision = Math.max(1, current.documentRevision + 1);
  }
  if (key === "quantity") {
    next.cartonQty = numericValue;
    next.lineItems = current.lineItems.map((item, index) =>
      index === 0 ? { ...item, quantity: numericValue } : item,
    );
  }
  if (key === "unitPrice") {
    next.lineItems = current.lineItems.map((item, index) =>
      index === 0 ? { ...item, unitPrice: numericValue } : item,
    );
  }
  if (key === "cartonQty") {
    next.quantity = numericValue;
  }
  return next;
}

export function applyLineItemsUpdate(current: Shipment, items: LineItem[]): Shipment {
  const safeItems = (items.length ? items : [emptyLineItem]).map((item) => ({
    ...emptyLineItem,
    ...item,
  }));
  const first = safeItems[0];
  const totalQuantity = safeItems.reduce((sum, item) => sum + item.quantity, 0);
  return {
    ...current,
    documentRevision: Math.max(1, current.documentRevision + 1),
    lineItems: safeItems,
    product: first.description,
    hsCode: first.hsCode,
    quantity: totalQuantity,
    cartonQty: totalQuantity,
    unit: first.unit,
    unitPrice: first.unitPrice,
    cartonWeight: first.weight,
    cartonLength: first.length,
    cartonWidth: first.width,
    cartonHeight: first.height,
  };
}
