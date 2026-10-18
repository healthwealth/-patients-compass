import React, { useMemo, useState } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Dot,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Download } from "lucide-react";
import { exportElementAsPDF } from "@/lib/pdfExport";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Reading {
  value: number;
  unit?: string;
  readingDate: number | string | Date;
  notes?: string;
}

interface RangeConfig {
  standardLow: number;
  standardHigh: number;
  optimalLow: number;
  optimalHigh: number;
  unit: string;
}

interface BiomarkerTrendChartProps {
  biomarkerName: string;
  readings: Reading[];
  rangeConfig?: RangeConfig;
  className?: string;
  showExport?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number | string | Date): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function getTrendStatus(readings: Reading[]): {
  direction: "up" | "down" | "stable";
  pctChange: number | null;
  aiAnnotation: string;
} {
  if (readings.length < 2) {
    return { direction: "stable", pctChange: null, aiAnnotation: "Only one reading — add more over time to see trends." };
  }
  const latest = readings[0].value;
  const previous = readings[readings.length - 1].value;
  const pct = previous !== 0 ? Math.round(((latest - previous) / previous) * 100) : 0;
  const direction = pct > 2 ? "up" : pct < -2 ? "down" : "stable";

  const annotations: Record<string, string> = {
    up: `Values have risen ${Math.abs(pct)}% since your first reading. Monitor for continued elevation.`,
    down: `Values have decreased ${Math.abs(pct)}% since your first reading. This may reflect positive lifestyle changes.`,
    stable: `Values have remained stable across your readings. Consistency is a good sign for monitoring purposes.`,
  };
  return { direction, pctChange: pct, aiAnnotation: annotations[direction] };
}

function getOptimalProgress(value: number, config: RangeConfig): { pct: number; label: string } {
  const { optimalLow, optimalHigh } = config;
  if (value >= optimalLow && value <= optimalHigh) return { pct: 100, label: "In Optimal Zone" };
  if (value < optimalLow) {
    const pct = Math.max(0, Math.round((value / optimalLow) * 100));
    return { pct, label: `${pct}% toward optimal` };
  }
  // above optimal
  const excess = value - optimalHigh;
  const range = optimalHigh - optimalLow;
  const pct = Math.max(0, Math.round(100 - (excess / range) * 100));
  return { pct, label: `${pct}% within optimal` };
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-[#EBE6DC] rounded-xl p-3 shadow-lg text-xs space-y-1 min-w-[140px]">
      <p className="font-bold text-[#2C2A29]">{label}</p>
      <p className="text-[#7E9A85] font-semibold">
        {d.value} {d.payload?.unit || ""}
      </p>
      {d.payload?.notes && (
        <p className="text-[#9E9A90] italic">{d.payload.notes}</p>
      )}
    </div>
  );
}

// ─── Custom Dot ───────────────────────────────────────────────────────────────

function CustomDot(props: any) {
  const { cx, cy, index, data } = props;
  const isLatest = index === data.length - 1;
  if (isLatest) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={7} fill="#7E9A85" stroke="white" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={12} fill="#7E9A85" fillOpacity={0.15} />
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={4} fill="#7E9A85" stroke="white" strokeWidth={1.5} />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BiomarkerTrendChart({
  biomarkerName,
  readings,
  rangeConfig,
  className = "",
  showExport = true,
}: BiomarkerTrendChartProps) {
  const [timeFilter, setTimeFilter] = useState<"all" | "6m" | "3m">("all");
  const [isExporting, setIsExporting] = useState(false);

  // Sort oldest → newest for chart display
  const sorted = useMemo(() => {
    return [...readings].sort(
      (a, b) => new Date(a.readingDate).getTime() - new Date(b.readingDate).getTime()
    );
  }, [readings]);

  // Apply time filter
  const filtered = useMemo(() => {
    if (timeFilter === "all") return sorted;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - (timeFilter === "6m" ? 6 : 3));
    return sorted.filter((r) => new Date(r.readingDate) >= cutoff);
  }, [sorted, timeFilter]);

  const chartData = useMemo(
    () =>
      filtered.map((r) => ({
        date: formatDate(r.readingDate),
        value: r.value,
        unit: r.unit,
        notes: r.notes,
      })),
    [filtered]
  );

  // Trend analysis uses newest-first order (readings prop is newest-first)
  const trend = useMemo(() => getTrendStatus([...readings].slice(0, 10)), [readings]);

  // Y-axis domain with padding
  const allValues = chartData.map((d) => d.value);
  const minVal = Math.min(...allValues, rangeConfig?.optimalLow ?? Infinity);
  const maxVal = Math.max(...allValues, rangeConfig?.optimalHigh ?? -Infinity);
  const padding = (maxVal - minVal) * 0.2 || 10;
  const yDomain = [Math.max(0, minVal - padding), maxVal + padding];

  const optimalProgress = rangeConfig && readings.length > 0
    ? getOptimalProgress(readings[0].value, rangeConfig)
    : null;

  const chartId = `trend-chart-${biomarkerName.replace(/\s+/g, "-").toLowerCase()}`;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportElementAsPDF(
        chartId,
        `trend-${biomarkerName.replace(/\s+/g, "-").toLowerCase()}`,
        `${biomarkerName} Trend Summary`,
        `${readings.length} readings · Generated ${new Date().toLocaleDateString()}`
      );
      toast.success("Trend summary exported as PDF");
    } catch (e) {
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (chartData.length === 0) {
    return (
      <div className={`bg-white border border-dashed border-[#C5C0B5] rounded-2xl p-8 text-center ${className}`}>
        <TrendingUp className="w-8 h-8 text-[#C5C0B5] mx-auto mb-2" />
        <p className="text-sm text-[#9E9A90]">No readings in selected time range</p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-[#EBE6DC] rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-serif font-bold text-base text-[#2C2A29]">{biomarkerName}</h3>
          {readings.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-serif font-bold text-[#7E9A85]">
                {readings[0].value}
              </span>
              <span className="text-xs text-[#9E9A90]">{readings[0].unit || ""}</span>
              {/* Trend arrow */}
              <span
                className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                  trend.direction === "up"
                    ? "bg-amber-50 text-amber-600"
                    : trend.direction === "down"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {trend.direction === "up" ? (
                  <TrendingUp className="w-3 h-3" />
                ) : trend.direction === "down" ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {trend.pctChange !== null ? `${trend.pctChange > 0 ? "+" : ""}${trend.pctChange}%` : "Stable"}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time filter */}
          {["3m", "6m", "all"].map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f as any)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                timeFilter === f
                  ? "bg-[#2C2A29] text-white"
                  : "bg-[#F9F6F0] text-[#5C5A59] hover:bg-[#EBE6DC]"
              }`}
            >
              {f === "all" ? "All" : f.toUpperCase()}
            </button>
          ))}
          {showExport && (
            <Button
              variant="outline"
              size="sm"
              className="border-[#EBE6DC] text-[#7E9A85] hover:bg-[#7E9A85]/5 rounded-lg text-[10px] h-7 px-2.5 gap-1"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="w-3 h-3" />
              {isExporting ? "Exporting..." : "PDF"}
            </Button>
          )}
        </div>
      </div>

      {/* Optimal progress bar */}
      {optimalProgress && (
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between text-[10px] font-semibold text-[#9E9A90] mb-1">
            <span>Progress toward optimal</span>
            <span className={optimalProgress.pct >= 100 ? "text-emerald-600" : "text-[#D48C70]"}>
              {optimalProgress.label}
            </span>
          </div>
          <div className="h-1.5 bg-[#EBE6DC] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                optimalProgress.pct >= 100 ? "bg-emerald-500" : "bg-[#D48C70]"
              }`}
              style={{ width: `${Math.min(100, optimalProgress.pct)}%` }}
            />
          </div>
        </div>
      )}

      {/* Chart */}
      <div id={chartId} className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EBE6DC" vertical={false} />

            {/* Optimal zone shading */}
            {rangeConfig && (
              <ReferenceArea
                y1={rangeConfig.optimalLow}
                y2={rangeConfig.optimalHigh}
                fill="#7E9A85"
                fillOpacity={0.08}
                stroke="#7E9A85"
                strokeOpacity={0.2}
                strokeDasharray="4 4"
              />
            )}

            {/* Standard range reference lines */}
            {rangeConfig && (
              <>
                <ReferenceLine
                  y={rangeConfig.standardLow}
                  stroke="#C5C0B5"
                  strokeDasharray="6 3"
                  strokeWidth={1}
                  label={{ value: "Std Low", position: "insideTopLeft", fontSize: 9, fill: "#9E9A90" }}
                />
                <ReferenceLine
                  y={rangeConfig.standardHigh}
                  stroke="#C5C0B5"
                  strokeDasharray="6 3"
                  strokeWidth={1}
                  label={{ value: "Std High", position: "insideTopLeft", fontSize: 9, fill: "#9E9A90" }}
                />
                <ReferenceLine
                  y={rangeConfig.optimalLow}
                  stroke="#7E9A85"
                  strokeDasharray="4 2"
                  strokeWidth={1}
                  label={{ value: "Opt Low", position: "insideBottomLeft", fontSize: 9, fill: "#7E9A85" }}
                />
                <ReferenceLine
                  y={rangeConfig.optimalHigh}
                  stroke="#7E9A85"
                  strokeDasharray="4 2"
                  strokeWidth={1}
                  label={{ value: "Opt High", position: "insideTopLeft", fontSize: 9, fill: "#7E9A85" }}
                />
              </>
            )}

            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: "#9E9A90" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={yDomain}
              tick={{ fontSize: 9, fill: "#9E9A90" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Area fill under line */}
            <Area
              type="monotone"
              dataKey="value"
              fill="#7E9A85"
              fillOpacity={0.06}
              stroke="none"
            />

            {/* Main trend line */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#7E9A85"
              strokeWidth={2.5}
              dot={<CustomDot data={chartData} />}
              activeDot={{ r: 6, fill: "#7E9A85", stroke: "white", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* AI Annotation */}
      <div className="px-5 pb-5">
        <div className="bg-[#F9F6F0] border border-[#EBE6DC] rounded-xl p-3 flex gap-2">
          <span className="text-base shrink-0">🤖</span>
          <p className="text-[11px] text-[#5C5A59] leading-relaxed">{trend.aiAnnotation}</p>
        </div>
      </div>

      {/* Legend */}
      {rangeConfig && (
        <div className="px-5 pb-4 flex flex-wrap gap-3 text-[10px] font-semibold text-[#9E9A90]">
          <span className="flex items-center gap-1">
            <span className="w-3 h-1.5 bg-[#7E9A85]/20 border border-[#7E9A85]/30 rounded-sm inline-block" />
            Optimal Zone
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 border-t border-dashed border-[#C5C0B5] inline-block" />
            Standard Range
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 border-t border-dashed border-[#7E9A85] inline-block" />
            Optimal Bounds
          </span>
        </div>
      )}
    </div>
  );
}
