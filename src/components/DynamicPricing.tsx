import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dynamicPricingPipeline, getRiskLevel, getRiskColor, type PricingResult } from "@/lib/dynamicPricing";

interface DynamicPricingProps {
  onResult?: (result: PricingResult) => void;
}

const DynamicPricing = ({ onResult }: DynamicPricingProps) => {
  const [rainfall, setRainfall] = useState("");
  const [temperature, setTemperature] = useState("");
  const [aqi, setAqi] = useState("");
  const [safeZone, setSafeZone] = useState("");
  const [result, setResult] = useState<PricingResult | null>(null);

  const calculate = useCallback(() => {
    const r = parseFloat(rainfall);
    const t = parseFloat(temperature);
    const a = parseFloat(aqi);
    const s = parseFloat(safeZone);

    if (isNaN(r) || isNaN(t) || isNaN(a) || isNaN(s)) {
      setResult(null);
      return;
    }

    if (r < 0 || t < -50 || t > 60 || a < 0 || s < 0 || s > 1) {
      setResult(null);
      return;
    }

    const pricing = dynamicPricingPipeline(r, t, a, s);
    setResult(pricing);
    onResult?.(pricing);
  }, [rainfall, temperature, aqi, safeZone, onResult]);

  useEffect(() => {
    const timer = setTimeout(calculate, 400);
    return () => clearTimeout(timer);
  }, [calculate]);

  return (
    <motion.div
      className="safety-card p-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="data-label">Dynamic Premium Calculator</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Rainfall (mm)</Label>
          <Input
            type="number"
            value={rainfall}
            onChange={(e) => setRainfall(e.target.value)}
            placeholder="0"
            min="0"
            className="bg-secondary/50 border-border h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Temperature (°C)</Label>
          <Input
            type="number"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            placeholder="30"
            min="-50"
            max="60"
            className="bg-secondary/50 border-border h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">AQI</Label>
          <Input
            type="number"
            value={aqi}
            onChange={(e) => setAqi(e.target.value)}
            placeholder="100"
            min="0"
            className="bg-secondary/50 border-border h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Safe Zone (0-1)</Label>
          <Input
            type="number"
            value={safeZone}
            onChange={(e) => setSafeZone(e.target.value)}
            placeholder="0.8"
            min="0"
            max="1"
            step="0.1"
            className="bg-secondary/50 border-border h-9 text-sm"
          />
        </div>
      </div>

      {result ? (
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Risk Score</span>
            <span className={`text-sm font-semibold tabular-nums ${getRiskColor(result.risk_score)}`}>
              {(result.risk_score * 100).toFixed(1)}% ({getRiskLevel(result.risk_score)})
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Weekly Premium</span>
            <span className="text-sm font-bold text-foreground tabular-nums">
              ₹{result.weekly_premium.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Coverage</span>
            <span className="text-xs text-foreground">{result.coverage}</span>
          </div>
        </div>
      ) : (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Enter values to calculate premium
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default DynamicPricing;
