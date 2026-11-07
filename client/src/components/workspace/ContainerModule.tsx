import { formatNumber } from "@shared/format";
import type { ScreenId } from "@shared/risk";
import { emptyLineItem, type ContainerCalc, type LineItem, type Shipment } from "@shared/shipment";
import { ArrowDownRight, ArrowUpRight, Check, FileText, Package, PenLine, RotateCcw, Truck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Field, LineItemsEditor, SectionTitle, SelectField, StatusPill, UsageBar } from "./Primitives";

type ThreeEngine = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  cargoGroup: THREE.Group;
};

export function ContainerModule({
  shipment,
  update,
  updateNumber,
  updateLineItems,
  container,
  navigate,
}: {
  shipment: Shipment;
  update: <K extends keyof Shipment>(key: K, value: Shipment[K]) => void;
  updateNumber: (key: keyof Shipment, value: string) => void;
  updateLineItems: (items: LineItem[]) => void;
  container: ContainerCalc;
  navigate: (screen: ScreenId) => void;
}) {
  const overload = container.weightUtilization > 100 || container.volumeUtilization > 100;
  return (
    <div className="module-stack">
      <div className="container-top-grid">
        <section className="panel panel-padding">
          <SectionTitle
            eyebrow="PACKING INPUT"
            title="Detail kemasan & rencana muatan"
            description="Ukuran, jenis kemasan, susut, dan pallet kayu setiap produk bisa diatur langsung di halaman ini tanpa mencampur layar dokumen."
          />
          <div className="form-grid two">
            <Field
              label="Jenis kemasan default"
              value={shipment.packageType}
              onChange={(value) => update("packageType", value)}
            />
            <SelectField
              label="Tipe kontainer"
              value={shipment.containerType}
              onChange={(value) => update("containerType", value as Shipment["containerType"])}
            >
              <option value="20GP">20&apos; General Purpose</option>
              <option value="40GP">40&apos; General Purpose</option>
              <option value="40HC">40&apos; High Cube</option>
            </SelectField>
            <Field
              label="Panjang karton"
              value={shipment.cartonLength}
              type="number"
              suffix="cm"
              onChange={(value) => updateNumber("cartonLength", value)}
            />
            <Field
              label="Lebar karton"
              value={shipment.cartonWidth}
              type="number"
              suffix="cm"
              onChange={(value) => updateNumber("cartonWidth", value)}
            />
            <Field
              label="Tinggi karton"
              value={shipment.cartonHeight}
              type="number"
              suffix="cm"
              onChange={(value) => updateNumber("cartonHeight", value)}
            />
            <Field
              label="Berat per karton"
              value={shipment.cartonWeight}
              type="number"
              suffix="kg"
              step="0.1"
              onChange={(value) => updateNumber("cartonWeight", value)}
            />
            <Field
              label="Jumlah karton"
              value={shipment.cartonQty}
              type="number"
              suffix="ctns"
              onChange={(value) => updateNumber("cartonQty", value)}
            />
          </div>
        </section>

        <section className={`load-result ${overload ? "overload" : ""}`}>
          <div className="load-result-head">
            <span className="eyebrow light">STUFFING ESTIMATE</span>
            <StatusPill tone={overload ? "amber" : "green"}>
              {overload ? "Melebihi batas input" : "Dalam batas kapasitas terhitung"}
            </StatusPill>
          </div>
          <div className="container-visual">
            <div className="container-shell">
              <div
                className="container-fill"
                style={{ width: `${Math.min(100, container.volumeUtilization)}%` }}
              >
                <span>{container.volumeUtilization.toFixed(0)}%</span>
              </div>
              <div className="container-lines">
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="container-end">
              <span>{shipment.containerType}</span>
              <small>{container.name}</small>
            </div>
          </div>
          <div className="load-numbers">
            <div>
              <span>EST. CONTAINERS</span>
              <strong>{container.containers}</strong>
              <small>
                {container.byVolume > 1
                  ? `Volume meminta ${container.byVolume}`
                  : container.byWeight > 1
                    ? `Berat meminta ${container.byWeight}`
                    : "1 kontainer cukup"}
              </small>
            </div>
            <div>
              <span>TOTAL VOLUME</span>
              <strong>
                {formatNumber(container.totalVolume, 1)} <small>m³</small>
              </strong>
              <small>Kapasitas {formatNumber(container.volume, 1)} m³ / unit</small>
            </div>
            <div>
              <span>TOTAL WEIGHT</span>
              <strong>
                {formatNumber(container.totalWeight, 0)} <small>kg</small>
              </strong>
              <small>Batas {formatNumber(container.weight / 1000, 1)} ton / unit</small>
            </div>
          </div>
          <div className="load-simulation-strip">
            <div>
              <span>VOLUME PRODUK</span>
              <b>{formatNumber(container.productVolume, 2)} m³</b>
            </div>
            <div>
              <span>VOLUME PALLET</span>
              <b>{formatNumber(container.palletVolume, 2)} m³</b>
            </div>
            <div>
              <span>BERAT NET</span>
              <b>{formatNumber(container.netWeight, 0)} kg</b>
            </div>
            <div>
              <span>BERAT KOTOR</span>
              <b>{formatNumber(container.grossWeight, 0)} kg</b>
            </div>
            <div>
              <span>BERAT SUSUT</span>
              <b>{formatNumber(container.shrinkageLoss, 0)} kg</b>
            </div>
          </div>
        </section>
      </div>

      {/* Full-width Line Items Table so product columns breathe comfortably */}
      <section className="panel panel-padding">
        <SectionTitle
          eyebrow="DAFTAR PRODUK"
          title="Rincian komoditas & kuantitas muatan"
          description="Tambahkan atau sesuaikan kuantitas komoditas ekspor. Data ini otomatis tersinkronisasi ke seluruh dokumen ekspor dan simulasi stuffing."
        />
        <LineItemsEditor
          items={shipment.lineItems}
          updateItems={updateLineItems}
          currency={shipment.currency}
          onOpenCatalog={() => navigate("products")}
        />
        <div className="row-actions" style={{ marginTop: 14 }}>
          <button type="button" className="ghost-button" onClick={() => navigate("documents")}>
            <FileText size={14} /> Lihat Packing List
          </button>
          <button type="button" className="save-button" onClick={() => navigate("shipment")}>
            <Truck size={14} /> Lanjut ke Logistik &amp; Kontainer <ArrowUpRight size={14} />
          </button>
        </div>
      </section>

      <Container3DSimulator shipment={shipment} container={container} />

      <div className="content-grid two-thirds">
        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">CAPACITY USAGE</span>
              <h3>Utilisasi per kontainer</h3>
            </div>
            <span className="muted-note">{container.name}</span>
          </div>
          <UsageBar
            label="Volume"
            value={container.volumeUtilization}
            detail={`${formatNumber(container.totalVolume, 1)} dari ${formatNumber(container.volume * container.containers, 1)} m³`}
            tone="saffron"
          />
          <UsageBar
            label="Berat kotor"
            value={container.weightUtilization}
            detail={`${formatNumber(container.totalWeight, 0)} dari ${formatNumber((container.weight * container.containers) / 1000, 1)} ton`}
            tone="mint"
          />
          <div className={`load-alert ${overload ? "warning" : "ok"}`}>
            {overload ? <ArrowDownRight size={17} /> : <Check size={17} />}
            <span>
              <b>
                {overload ? "Kapasitas melebihi 1 kontainer" : "Kapasitas muatan aman"}
              </b>
              <small>
                {overload
                  ? "Sesuaikan kuantitas atau gunakan lebih dari 1 kontainer."
                  : "Berat kotor dan volume berada dalam batas aman kontainer."}
              </small>
            </span>
          </div>
        </section>

        <section className="panel panel-padding">
          <div className="panel-head">
            <div>
              <span className="eyebrow">STANDAR STUFFING</span>
              <h3>Checklist Pemuatan</h3>
            </div>
            <PenLine size={16} className="panel-spark" />
          </div>
          <div className="packing-notes">
            <div>
              <span className="note-number">01</span>
              <p>Verifikasi pola susun (stacking) dan lashing kontainer di gudang.</p>
            </div>
            <div>
              <span className="note-number">02</span>
              <p>Pastikan kemasan/pallet kayu memiliki cap fumigasi ISPM-15.</p>
            </div>
            <div>
              <span className="note-number">03</span>
              <p>Pasang desiccant dan pelindung sudut untuk pelayaran jarak jauh.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Container3DSimulator({
  shipment,
  container,
}: {
  shipment: Shipment;
  container: ContainerCalc;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ThreeEngine | null>(null);
  const [view, setView] = useState<"iso" | "side" | "top">("iso");
  const [webglError, setWebglError] = useState<boolean>(false);

  const resetView = () => {
    setView("iso");
    const engine = engineRef.current;
    if (!engine) return;
    engine.camera.position.set(container.innerL * 0.95, container.innerH * 1.1, container.innerW * 1.75);
    engine.controls.target.set(0, container.innerH * 0.3, 0);
    engine.controls.update();
  };

  const palette: Record<string, number> = {
    "Karton box": 0xf2b84b,
    "Karung goni": 0xc8914c,
    Drum: 0x5ca6bd,
    Sack: 0x8fbd8d,
    "Crate kayu": 0xb87548,
    "Kemasan custom": 0x9d7bd9,
  };
  const items = useMemo(
    () => shipment.lineItems.map((item) => ({ ...emptyLineItem, ...item })),
    [shipment.lineItems],
  );
  const previewUnits = Math.min(
    180,
    items.reduce((total, item) => total + item.quantity, 0),
  );

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      setWebglError(true);
      return;
    }
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1322);
    const camera = new THREE.PerspectiveCamera(
      42,
      Math.max(1, mount.clientWidth) / Math.max(1, mount.clientHeight),
      1,
      5000,
    );
    camera.position.set(container.innerL * 0.95, container.innerH * 1.1, container.innerW * 1.75);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setSize(Math.max(1, mount.clientWidth), Math.max(1, mount.clientHeight));
    mount.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.target.set(0, container.innerH * 0.3, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 1.35));
    const light = new THREE.DirectionalLight(0xfff4d6, 1.7);
    light.position.set(container.innerL, container.innerH * 2, container.innerW);
    scene.add(light);
    const cargoGroup = new THREE.Group();
    scene.add(cargoGroup);
    engineRef.current = { scene, camera, renderer, controls, cargoGroup };
    const resize = () => {
      if (!mountRef.current) return;
      camera.aspect =
        Math.max(1, mountRef.current.clientWidth) / Math.max(1, mountRef.current.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(
        Math.max(1, mountRef.current.clientWidth),
        Math.max(1, mountRef.current.clientHeight),
      );
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      engineRef.current = null;
    };
  }, [container.innerL, container.innerW, container.innerH]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    while (engine.cargoGroup.children.length) {
      engine.cargoGroup.remove(engine.cargoGroup.children[0]);
    }
    const { innerL: cL, innerW: cW, innerH: cH } = container;
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(cL, cH, cW)),
      new THREE.LineBasicMaterial({ color: 0x6ec9d8 }),
    );
    frame.position.set(0, cH / 2, 0);
    engine.cargoGroup.add(frame);
    const floor = new THREE.GridHelper(Math.max(cL, cW), 24, 0x26404d, 0x172532);
    engine.cargoGroup.add(floor);
    const cellL = Math.max(25, ...items.map((item) => item.length));
    const cellW = Math.max(25, ...items.map((item) => item.width));
    const cellH = Math.max(20, ...items.map((item) => item.height));
    const fitL = Math.max(1, Math.floor(cL / cellL));
    const fitW = Math.max(1, Math.floor(cW / cellW));
    const fitH = Math.max(1, Math.floor(cH / cellH));
    let slot = 0;
    const baseLift = items.some((item) => item.palletEnabled)
      ? Math.max(...items.map((item) => (item.palletEnabled ? item.palletHeight : 0)))
      : 0;
    items.forEach((item) => {
      const itemUnits = Math.min(item.quantity, Math.max(0, previewUnits - slot));
      for (let index = 0; index < itemUnits; index += 1) {
        const layer = Math.floor(slot / (fitL * fitW));
        const row = Math.floor(slot / fitL) % fitW;
        const col = slot % fitL;
        if (layer >= fitH) break;
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(
            Math.max(5, item.length - 2),
            Math.max(5, item.height - 2),
            Math.max(5, item.width - 2),
          ),
          new THREE.MeshLambertMaterial({
            color: palette[item.packagingType] || 0xf2b84b,
            transparent: true,
            opacity: 0.86,
          }),
        );
        box.position.set(
          -cL / 2 + cellL * col + item.length / 2,
          baseLift + item.height / 2 + cellH * layer,
          -cW / 2 + cellW * row + item.width / 2,
        );
        engine.cargoGroup.add(box);
        slot += 1;
      }
    });
    let palletSlot = 0;
    items
      .filter((item) => item.palletEnabled && item.palletCount > 0)
      .forEach((item) => {
        const palletLimit = Math.min(item.palletCount, 36);
        for (let index = 0; index < palletLimit; index += 1) {
          const row = Math.floor(
            palletSlot / Math.max(1, Math.floor(cL / Math.max(1, item.palletLength))),
          );
          const col =
            palletSlot % Math.max(1, Math.floor(cL / Math.max(1, item.palletLength)));
          const pallet = new THREE.Mesh(
            new THREE.BoxGeometry(
              Math.min(item.palletLength, cL),
              item.palletHeight,
              Math.min(item.palletWidth, cW),
            ),
            new THREE.MeshLambertMaterial({
              color: 0x8b5e3c,
              transparent: true,
              opacity: 0.75,
            }),
          );
          pallet.position.set(
            -cL / 2 + item.palletLength / 2 + col * item.palletLength,
            item.palletHeight / 2,
            -cW / 2 +
              item.palletWidth / 2 +
              (row % Math.max(1, Math.floor(cW / Math.max(1, item.palletWidth)))) *
                item.palletWidth,
          );
          engine.cargoGroup.add(pallet);
          palletSlot += 1;
        }
      });
  }, [container, items, previewUnits]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const positions: Record<"iso" | "side" | "top", [number, number, number]> = {
      iso: [container.innerL * 0.95, container.innerH * 1.1, container.innerW * 1.75],
      side: [0, container.innerH * 0.75, container.innerW * 2.3],
      top: [0, container.innerH * 2.8, 0],
    };
    engine.camera.position.set(...positions[view]);
    engine.controls.target.set(0, container.innerH * 0.3, 0);
    engine.controls.update();
  }, [view, container.innerH, container.innerL, container.innerW]);

  return (
    <section className="container-3d-panel panel">
      <div className="container-3d-head">
        <div>
          <span className="eyebrow">3D LOAD SIMULATOR</span>
          <h3>Simulasi tata letak kontainer</h3>
          <small>
            {previewUnits} unit divisualkan · Drag untuk memutar · Scroll untuk zoom
          </small>
        </div>
        <div className="view-switcher">
          {(["iso", "side", "top"] as const).map((mode) => (
            <button
              type="button"
              className={view === mode ? "active" : ""}
              key={mode}
              onClick={() => setView(mode)}
            >
              {mode === "iso" ? "Isometric" : mode === "side" ? "Samping" : "Atas"}
            </button>
          ))}
        </div>
        <button type="button" className="view-reset" onClick={resetView}>
          <RotateCcw size={13} /> Reset view
        </button>
      </div>
      <div className="container-3d-viewport" ref={mountRef}>
        {webglError && (
          <div style={{ padding: 24, color: "#9eb6bd" }}>
            WebGL tidak tersedia di perangkat/browser ini. Angka kapasitas volume dan berat di atas tetap akurat.
          </div>
        )}
        <div className="container-3d-legend">
          <span>
            <i className="legend-swatch amber" />
            Karton box
          </span>
          <span>
            <i className="legend-swatch blue" />
            Drum
          </span>
          <span>
            <i className="legend-swatch green" />
            Sack / goni
          </span>
          <span>
            <i className="legend-swatch wood" />
            Pallet kayu
          </span>
          <span>
            <i className="legend-swatch custom" />
            Custom
          </span>
        </div>
        <span className="container-3d-badge">
          {container.innerL} × {container.innerW} × {container.innerH} cm
        </span>
      </div>
      <div className="container-3d-stats">
        <div>
          <span>GRID SIMULASI</span>
          <b>
            {Math.floor(container.innerL / Math.max(25, ...items.map((item) => item.length)))} ×{" "}
            {Math.floor(container.innerW / Math.max(25, ...items.map((item) => item.width)))} ×{" "}
            {Math.floor(container.innerH / Math.max(20, ...items.map((item) => item.height)))} layer
          </b>
        </div>
        <div>
          <span>ITEM VISUAL</span>
          <b>
            {previewUnits} / {formatNumber(items.reduce((total, item) => total + item.quantity, 0))} unit
          </b>
        </div>
        <div>
          <span>PALLET TERDETEKSI</span>
          <b>{container.palletCount || "Tidak ada"}</b>
        </div>
      </div>
    </section>
  );
}
