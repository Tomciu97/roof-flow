export type RoofType = "gabled" | "hip" | "monopitch" | "flat";

export type CoveringStandard = "budget" | "standard" | "premium";

export type InsulationMaterial = "wool" | "pur" | "pir";

export type FacadeMaterial = "styrofoam" | "wool";

export type LeadStatus =
  | "new"
  | "contacted"
  | "measured"
  | "signed"
  | "rejected";

export type PlanTier = "starter" | "pro";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete";

export interface RoofGeometryInput {
  lengthM: number;
  widthM: number;
  roofType: RoofType;
  pitchDeg: number;
  eavesM: number;
}

export interface CoveringInput {
  standard: CoveringStandard;
  gutters: boolean;
  roofWindows: number;
}

export interface InsulationInput {
  enabled: boolean;
  material: InsulationMaterial;
  thicknessCm: number;
}

export interface FacadeInput {
  enabled: boolean;
  material: FacadeMaterial;
  storeyHeightM: number;
}

export interface PricingRates {
  baseLaborRate: number;
  timberRate: number;
  tileRates: Record<CoveringStandard, number>;
  insulationRates: Record<InsulationMaterial, number>;
  facadeRates: Record<FacadeMaterial, number>;
  gutterRatePerM: number;
  roofWindowRate: number;
  plasterRate: number;
  scaffoldingRate: number;
  gkFinishRate: number;
  marginBuffer: number;
}

export interface CalculationBreakdown {
  projectionAreaM2: number;
  roofAreaM2: number;
  roofAreaWithWasteM2: number;
  insulationAreaM2: number;
  facadeGrossAreaM2: number;
  facadeNetAreaM2: number;
  coveringCost: number;
  timberCost: number;
  insulationCost: number;
  facadeCost: number;
  laborCost: number;
  extrasCost: number;
  baseTotal: number;
  priceMin: number;
  priceMax: number;
}

export interface Tenant {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string;
  phone: string | null;
  city: string | null;
  postal_code: string | null;
  service_radius_km: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  plan_tier: PlanTier;
  has_insulation_addon: boolean;
  has_facade_addon: boolean;
  custom_domain: string | null;
  created_at: string;
}

export interface PricingConfig {
  id: string;
  tenant_id: string;
  base_labor_rate: number;
  timber_rate: number;
  tile_rates: Record<CoveringStandard, number>;
  insulation_rates: Record<InsulationMaterial, number>;
  facade_rates: Record<FacadeMaterial, number>;
  margin_buffer: number;
  updated_at: string;
}

export interface Lead {
  id: string;
  tenant_id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  location: string | null;
  schedule: string | null;
  roof_type: string | null;
  roof_area_m2: number | null;
  insulation_area_m2: number | null;
  facade_area_m2: number | null;
  est_price_min: number | null;
  est_price_max: number | null;
  project_file_url: string | null;
  status: LeadStatus;
  calculation_data?: Record<string, unknown> | null;
  created_at: string;
}

export interface B2COrder {
  id: string;
  stripe_session_id: string;
  client_email: string;
  client_name?: string | null;
  client_phone?: string | null;
  client_city?: string | null;
  client_postal_code?: string | null;
  client_schedule?: string | null;
  calculation_data: Record<string, unknown>;
  amount_paid: number;
  status: "pending" | "paid" | "failed";
  pdf_url: string | null;
  marketplace_request_id?: string | null;
  created_at: string;
}

export interface WizardState {
  lengthM: number;
  widthM: number;
  roofType: RoofType;
  pitchDeg: number;
  eavesM: number;
  covering: CoveringStandard;
  gutters: boolean;
  roofWindows: number;
  insulationEnabled: boolean;
  insulationMaterial: InsulationMaterial;
  insulationThicknessCm: number;
  facadeEnabled: boolean;
  facadeMaterial: FacadeMaterial;
  storeyHeightM: number;
  /** Dane klienta B2C (marketplace) */
  clientName: string;
  clientPhone: string;
  email: string;
  city: string;
  postalCode: string;
  schedule: string;
}
