// Dynamic premium calculation - ported from Python (dynamic_pricing.py)
// Uses the exact same hybrid AI risk model: rule-based + weighted scoring

export interface PricingResult {
  risk_score: number;
  weekly_premium: number;
  coverage: string;
}

/**
 * Hybrid risk prediction combining rule-based logic
 * Exact port of predict_risk() from dynamic_pricing.py
 */
export function predictRisk(
  rainfall: number,
  temperature: number,
  aqi: number,
  safeZone: number
): number {
  // Clamp values to reasonable ranges
  rainfall = Math.max(0, rainfall);
  temperature = Math.max(-50, temperature);
  aqi = Math.max(0, aqi);
  safeZone = Math.max(0, Math.min(1, safeZone));

  // Strong domain logic (rule-based risk)
  const ruleRisk =
    (rainfall / 100) * 0.5 +
    (temperature / 50) * 0.2 +
    (aqi / 500) * 0.4 -
    safeZone * 0.15;

  // Clamp final risk between 0 and 1
  return Math.max(0, Math.min(1, parseFloat(ruleRisk.toFixed(2))));
}

/**
 * Premium calculation - exact port of calculate_premium() from dynamic_pricing.py
 */
export function calculatePremium(riskScore: number, safeZone: number): number {
  riskScore = Math.max(0, Math.min(1, riskScore));
  safeZone = Math.max(0, Math.min(1, safeZone));

  const basePrice = 25;
  const multiplier = 20;

  let premium = basePrice + riskScore * multiplier;

  // Safe zone discount
  if (safeZone > 0.7) {
    premium -= 2;
  }

  // High risk surcharge
  if (riskScore > 0.7) {
    premium += 5;
  }

  return parseFloat(Math.max(premium, 15).toFixed(2));
}

/**
 * Coverage adjustment - exact port of adjust_coverage() from dynamic_pricing.py
 */
export function adjustCoverage(riskScore: number): string {
  riskScore = Math.max(0, Math.min(1, riskScore));

  if (riskScore > 0.7) {
    return "Extended Coverage (10 hrs/day)";
  } else if (riskScore > 0.4) {
    return "Standard Coverage (6 hrs/day)";
  } else {
    return "Basic Coverage (4 hrs/day)";
  }
}

/**
 * Full dynamic pricing pipeline - exact port of dynamic_pricing_pipeline()
 */
export function dynamicPricingPipeline(
  rainfall: number,
  temperature: number,
  aqi: number,
  safeZone: number
): PricingResult {
  const riskScore = predictRisk(rainfall, temperature, aqi, safeZone);
  const weeklyPremium = calculatePremium(riskScore, safeZone);
  const coverage = adjustCoverage(riskScore);

  return {
    risk_score: riskScore,
    weekly_premium: weeklyPremium,
    coverage,
  };
}

export function getRiskLevel(score: number): string {
  if (score <= 0.3) return "Low";
  if (score <= 0.6) return "Medium";
  return "High";
}

export function getRiskColor(score: number): string {
  if (score <= 0.3) return "text-success";
  if (score <= 0.6) return "text-warning";
  return "text-destructive";
}
