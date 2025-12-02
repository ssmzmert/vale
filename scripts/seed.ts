/* eslint-disable no-console */
import { loadEnvConfig } from "@next/env";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "../lib/mongodb";
import { User } from "../models/User";
import { PricingConfig } from "../models/PricingConfig";

async function seed() {
  // Load environment variables from .env before touching database config.
  loadEnvConfig(process.cwd());
  await connectToDatabase();
  const adminPassword = await bcrypt.hash("admin123", 10);
  const valetPassword = await bcrypt.hash("valet123", 10);

  await User.updateOne(
    { email: "admin@example.com" },
    {
      name: "Admin",
      email: "admin@example.com",
      role: "ADMIN",
      passwordHash: adminPassword,
      active: true
    },
    { upsert: true }
  );

  await User.updateOne(
    { email: "valet@example.com" },
    {
      name: "Vale",
      email: "valet@example.com",
      role: "VALET",
      passwordHash: valetPassword,
      active: true
    },
    { upsert: true }
  );

  const existingConfig = await PricingConfig.findOne({ active: true });
  if (!existingConfig) {
    await PricingConfig.create({
      mode: "HOURLY",
      hourlyFeeCents: 3000,
      bronzeHourlyFeeCents: 2500,
      silverHourlyFeeCents: 3500,
      goldHourlyFeeCents: 4500,
      fixedFeeCents: 0,
      bronzeFixedFeeCents: 0,
      silverFixedFeeCents: 0,
      goldFixedFeeCents: 0,
      graceMinutes: 10,
      roundingMinutes: 15
    });
  }

  console.log("Seed tamamlandı");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
