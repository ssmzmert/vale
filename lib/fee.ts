import type { IPricingConfig } from "@/models/PricingConfig";

export interface FeeCalculationResult {
  feeCents: number;
  billableMinutes: number;
}

export type PricingTier = "STANDARD" | "BRONZE" | "SILVER" | "GOLD";

export function applyRounding(minutes: number, roundingMinutes: number) {
  if (!roundingMinutes || roundingMinutes <= 0) return minutes;
  const remainder = minutes % roundingMinutes;
  if (remainder === 0) return minutes;
  return minutes + (roundingMinutes - remainder);
}

export function calculateFee(
  durationMinutes: number,
  config: IPricingConfig,
  tier: PricingTier = "STANDARD"
): FeeCalculationResult {
  if (durationMinutes <= (config.graceMinutes || 0)) {
    return { feeCents: 0, billableMinutes: durationMinutes };
  }

  const pickFee = () => {
    switch (tier) {
      case "BRONZE":
        return {
          fixed: config.bronzeFixedFeeCents,
          hourly: config.bronzeHourlyFeeCents
        };
      case "SILVER":
        return {
          fixed: config.silverFixedFeeCents,
          hourly: config.silverHourlyFeeCents
        };
      case "GOLD":
        return {
          fixed: config.goldFixedFeeCents,
          hourly: config.goldHourlyFeeCents
        };
      default:
        return { fixed: config.fixedFeeCents, hourly: config.hourlyFeeCents };
    }
  };

  const { fixed, hourly } = pickFee();

  if (config.mode === "FIXED") {
    return { feeCents: fixed ?? config.fixedFeeCents ?? 0, billableMinutes: durationMinutes };
  }

  const rounded = applyRounding(durationMinutes, config.roundingMinutes || 0);
  const billableHours = Math.ceil(rounded / 60 * 100) / 100; // two decimal precision
  const feeCents = Math.round((hourly ?? config.hourlyFeeCents ?? 0) * billableHours);

  return { feeCents, billableMinutes: rounded };
}

export function formatTL(cents?: number) {
  const amount = (cents || 0) / 100;
  return amount.toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2
  });
}

export function formatDuration(minutes?: number) {
  const mins = minutes || 0;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  if (hours <= 0) return `${rest} dk`;
  return `${hours} sa ${rest} dk`;
}
