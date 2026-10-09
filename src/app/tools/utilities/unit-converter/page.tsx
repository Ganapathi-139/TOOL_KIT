"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Copy,
  Check,
  Shield,
  ChevronRight,
  Timer,
  AlignLeft,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

type UnitType = "length" | "weight" | "temperature" | "area" | "volume" | "speed" | "digital";

interface UnitDef {
  name: string;
  symbol: string;
  ratio: number; // Ratio to base unit (for non-temp)
}

const unitData: Record<UnitType, { label: string; base: string; units: Record<string, UnitDef> }> = {
  length: {
    label: "Length",
    base: "m",
    units: {
      m: { name: "Meter", symbol: "m", ratio: 1 },
      km: { name: "Kilometer", symbol: "km", ratio: 1000 },
      cm: { name: "Centimeter", symbol: "cm", ratio: 0.01 },
      mm: { name: "Millimeter", symbol: "mm", ratio: 0.001 },
      mi: { name: "Mile", symbol: "mi", ratio: 1609.344 },
      yd: { name: "Yard", symbol: "yd", ratio: 0.9144 },
      ft: { name: "Foot", symbol: "ft", ratio: 0.3048 },
      in: { name: "Inch", symbol: "in", ratio: 0.0254 },
    },
  },
  weight: {
    label: "Weight & Mass",
    base: "kg",
    units: {
      kg: { name: "Kilogram", symbol: "kg", ratio: 1 },
      g: { name: "Gram", symbol: "g", ratio: 0.001 },
      mg: { name: "Milligram", symbol: "mg", ratio: 0.000001 },
      t: { name: "Metric Ton", symbol: "t", ratio: 1000 },
      lb: { name: "Pound", symbol: "lb", ratio: 0.45359237 },
      oz: { name: "Ounce", symbol: "oz", ratio: 0.02834952 },
    },
  },
  temperature: {
    label: "Temperature",
    base: "c",
    units: {
      c: { name: "Celsius", symbol: "°C", ratio: 1 },
      f: { name: "Fahrenheit", symbol: "°F", ratio: 1 },
      k: { name: "Kelvin", symbol: "K", ratio: 1 },
    },
  },
  area: {
    label: "Area",
    base: "m2",
    units: {
      m2: { name: "Square Meter", symbol: "m²", ratio: 1 },
      km2: { name: "Square Kilometer", symbol: "km²", ratio: 1000000 },
      ft2: { name: "Square Foot", symbol: "ft²", ratio: 0.092903 },
      yd2: { name: "Square Yard", symbol: "yd²", ratio: 0.836127 },
      ac: { name: "Acre", symbol: "ac", ratio: 4046.86 },
      ha: { name: "Hectare", symbol: "ha", ratio: 10000 },
    },
  },
  volume: {
    label: "Volume",
    base: "l",
    units: {
      l: { name: "Liter", symbol: "L", ratio: 1 },
      ml: { name: "Milliliter", symbol: "mL", ratio: 0.001 },
      m3: { name: "Cubic Meter", symbol: "m³", ratio: 1000 },
      gal: { name: "Gallon (US)", symbol: "gal", ratio: 3.78541 },
      qt: { name: "Quart (US)", symbol: "qt", ratio: 0.946353 },
      pt: { name: "Pint (US)", symbol: "pt", ratio: 0.473176 },
      cup: { name: "Cup (US)", symbol: "cup", ratio: 0.236588 },
      floz: { name: "Fluid Ounce (US)", symbol: "fl oz", ratio: 0.0295735 },
    },
  },
  speed: {
    label: "Speed",
    base: "mps",
    units: {
      mps: { name: "Meters/second", symbol: "m/s", ratio: 1 },
      kph: { name: "Kilometers/hour", symbol: "km/h", ratio: 0.277778 },
      mph: { name: "Miles/hour", symbol: "mph", ratio: 0.44704 },
      knot: { name: "Knot", symbol: "kn", ratio: 0.514444 },
    },
  },
  digital: {
    label: "Digital Storage",
    base: "b",
    units: {
      b: { name: "Byte", symbol: "B", ratio: 1 },
      kb: { name: "Kilobyte (KB)", symbol: "KB", ratio: 1024 },
      mb: { name: "Megabyte (MB)", symbol: "MB", ratio: 1048576 },
      gb: { name: "Gigabyte (GB)", symbol: "GB", ratio: 1073741824 },
      tb: { name: "Terabyte (TB)", symbol: "TB", ratio: 1099511627776 },
    },
  },
};

export default function UnitConverterPage() {
  const [activeCategory, setActiveCategory] = useState<UnitType>("length");
  const [fromValue, setFromValue] = useState<number>(1);
  const [fromUnit, setFromUnit] = useState<string>("km");
  const [toUnit, setToUnit] = useState<string>("mi");
  const [precision, setPrecision] = useState<number>(4);
  const [copied, setCopied] = useState(false);

  // Switch category defaults
  const handleCategoryChange = (cat: UnitType) => {
    setActiveCategory(cat);
    const units = Object.keys(unitData[cat].units);
    setFromUnit(units[0]);
    setToUnit(units[1] || units[0]);
    setFromValue(1);
  };

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  // Convert temperature
  const convertTemperature = (val: number, from: string, to: string): number => {
    if (from === to) return val;
    let celsius = val;
    if (from === "f") celsius = (val - 32) * (5 / 9);
    else if (from === "k") celsius = val - 273.15;

    if (to === "c") return celsius;
    if (to === "f") return celsius * (9 / 5) + 32;
    if (to === "k") return celsius + 273.15;
    return val;
  };

  const calculatedToValue = useMemo(() => {
    if (isNaN(fromValue)) return 0;
    if (activeCategory === "temperature") {
      return convertTemperature(fromValue, fromUnit, toUnit);
    }
    const cat = unitData[activeCategory];
    const fromRatio = cat.units[fromUnit]?.ratio || 1;
    const toRatio = cat.units[toUnit]?.ratio || 1;
    const inBase = fromValue * fromRatio;
    return inBase / toRatio;
  }, [fromValue, fromUnit, toUnit, activeCategory]);

  const formattedResult = useMemo(() => {
    if (isNaN(calculatedToValue)) return "0";
    return Number(calculatedToValue.toFixed(precision)).toString();
  }, [calculatedToValue, precision]);

  const copyResult = () => {
    navigator.clipboard.writeText(formattedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentUnits = unitData[activeCategory].units;

  const relatedTools = [
    { name: "Pomodoro Timer", href: "/tools/utilities/pomodoro", icon: Timer },
    { name: "Word Counter", href: "/tools/student/word-counter", icon: AlignLeft },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-10 w-full">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Everyday Utilities", href: "/tools/utilities" },
            { label: "Unit Converter" },
          ]}
        />

        <div className="mt-6 mb-8">
          <div
            className="flex items-center gap-2 mb-2 font-body text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--amber-primary)" }}
          >
            <ArrowLeftRight size={16} />
            <span>Everyday Utility</span>
          </div>
          <h1
            className="font-headline font-bold text-3xl sm:text-4xl tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Unit Converter
          </h1>
          <p
            className="font-body text-base sm:text-lg mt-2 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Convert length, weight, temperature, area, volume, and data storage instantly with real-time accuracy.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Category Filter Tabs */}
            <div
              className="flex items-center gap-1.5 p-1.5 rounded-xl border overflow-x-auto scrollbar-none"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              {(Object.keys(unitData) as UnitType[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className="px-3.5 py-2 rounded-lg font-body text-xs sm:text-sm font-medium transition-all shrink-0"
                  style={{
                    backgroundColor: activeCategory === cat ? "var(--amber-tint)" : "transparent",
                    color: activeCategory === cat ? "var(--amber-primary)" : "var(--text-secondary)",
                    border: activeCategory === cat ? "1px solid var(--amber-primary)" : "1px solid transparent",
                  }}
                >
                  {unitData[cat].label}
                </button>
              ))}
            </div>

            {/* Interactive Conversion Box */}
            <div
              className="rounded-xl border p-6 flex flex-col gap-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
                {/* From Column (Cols 1-5) */}
                <div className="md:col-span-5 flex flex-col gap-2">
                  <label htmlFor="from-unit-select" className="font-body text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    From
                  </label>
                  <select
                    id="from-unit-select"
                    value={fromUnit}
                    onChange={(e) => setFromUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
                    style={{
                      backgroundColor: "var(--bg-warm)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {Object.entries(currentUnits).map(([key, def]) => (
                      <option key={key} value={key}>
                        {def.name} ({def.symbol})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    value={fromValue}
                    onChange={(e) => setFromValue(parseFloat(e.target.value) || 0)}
                    placeholder="Enter value"
                    className="w-full px-3.5 py-2.5 rounded-lg border font-headline font-bold text-2xl focus:outline-none mt-1"
                    style={{
                      backgroundColor: "var(--bg-warm)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                {/* Swap Button (Col 6) */}
                <div className="md:col-span-1 flex justify-center py-2 md:py-0">
                  <button
                    onClick={swapUnits}
                    className="p-3 rounded-full border hover:bg-black/5 dark:hover:bg-white/5 transition-transform hover:rotate-180"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--amber-primary)",
                    }}
                    title="Swap units"
                  >
                    <ArrowLeftRight size={18} />
                  </button>
                </div>

                {/* To Column (Cols 7-11) */}
                <div className="md:col-span-5 flex flex-col gap-2">
                  <label htmlFor="to-unit-select" className="font-body text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    To
                  </label>
                  <select
                    id="to-unit-select"
                    value={toUnit}
                    onChange={(e) => setToUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border font-body text-sm focus:outline-none"
                    style={{
                      backgroundColor: "var(--bg-warm)",
                      borderColor: "var(--border-warm)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {Object.entries(currentUnits).map(([key, def]) => (
                      <option key={key} value={key}>
                        {def.name} ({def.symbol})
                      </option>
                    ))}
                  </select>

                  <div
                    className="w-full px-3.5 py-2.5 rounded-lg border font-headline font-bold text-2xl truncate flex items-center justify-between mt-1"
                    style={{
                      backgroundColor: "var(--surface-tinted)",
                      borderColor: "var(--border-warm)",
                      color: "var(--amber-primary)",
                      minHeight: "52px",
                    }}
                  >
                    <span>{formattedResult}</span>
                    <button
                      onClick={copyResult}
                      className="text-xs font-body font-normal px-2 py-1 rounded border flex items-center gap-1 hover:underline"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--border-warm)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Decimal Precision Control */}
              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--border-warm)" }}>
                <span className="font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                  Decimal Precision:
                </span>
                <div className="flex gap-2">
                  {[2, 4, 6].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPrecision(p)}
                      className="px-2.5 py-1 rounded text-xs font-body font-medium transition-colors"
                      style={{
                        backgroundColor: precision === p ? "var(--amber-tint)" : "var(--surface-tinted)",
                        color: precision === p ? "var(--amber-primary)" : "var(--text-secondary)",
                        border: precision === p ? "1px solid var(--amber-primary)" : "1px solid var(--border-warm)",
                      }}
                    >
                      {p} Decimals
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Common Conversions Reference Table */}
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--surface-tinted)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-base mb-3" style={{ color: "var(--text-primary)" }}>
                Quick Reference ({unitData[activeCategory].label})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                {Object.entries(currentUnits).slice(0, 6).map(([key, def]) => {
                  if (key === unitData[activeCategory].base) return null;
                  const ratio = def.ratio;
                  return (
                    <div key={key} className="p-2 rounded bg-white dark:bg-black/20 flex justify-between">
                      <span>1 {def.name}</span>
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                        = {ratio} {unitData[activeCategory].units[unitData[activeCategory].base]?.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-lg mb-4" style={{ color: "var(--text-primary)" }}>
                Conversion Standards
              </h3>
              <div className="space-y-3 font-body text-xs" style={{ color: "var(--text-secondary)" }}>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Metric & Imperial</p>
                  <p>All ratios conform to the International System of Units (SI) and NIST definitions for exact precision.</p>
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Digital Binary Scale</p>
                  <p>Standard JEDEC binary powers of 1024 (1 KB = 1,024 Bytes, 1 MB = 1,024 KB) are applied.</p>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--amber-tint)",
                borderColor: "rgba(200, 123, 58, 0.25)",
              }}
            >
              <div className="flex items-center gap-2 mb-2 font-headline font-semibold text-base" style={{ color: "var(--amber-primary)" }}>
                <Shield size={18} />
                <h4>Client-Side Utility</h4>
              </div>
              <p className="font-body text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                No network delays. Calculations run instantaneously within your device without hitting any server APIs.
              </p>
            </div>

            <div
              className="rounded-xl border p-6"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border-warm)",
              }}
            >
              <h3 className="font-headline font-semibold text-base mb-4" style={{ color: "var(--text-primary)" }}>
                Related Utilities
              </h3>
              <div className="divide-y" style={{ borderColor: "var(--border-warm)" }}>
                {relatedTools.map((tool) => {
                  const ToolIcon = tool.icon;
                  return (
                    <Link
                      key={tool.name}
                      href={tool.href}
                      className="py-3 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ToolIcon size={16} style={{ color: "var(--amber-primary)" }} />
                        <span
                          className="font-body text-sm group-hover:text-[var(--amber-primary)] transition-colors"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {tool.name}
                        </span>
                      </div>
                      <ChevronRight
                        size={16}
                        className="transition-transform group-hover:translate-x-0.5"
                        style={{ color: "var(--text-muted)" }}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
