export interface Product {
  id: string;
  accountId: string;
  name: string;
  meta: {
    href: string;
    type: string;
    mediaType: string;
  };
}

export type AccessoryType =
  | "cube"
  | "leg"
  | "glass"
  | "lock"
  | "topsa"
  | "beading";

export interface Accessory {
  id: string;
  accountId: string;
  name: string;
  type: AccessoryType;
  meta: {
    href: string;
    type: string;
    mediaType: string;
  };
}

export interface MaterialType {
  id: number;
  name: string;
}

export interface Massif {
  id: number;
  name: string;
}

export interface AttributeSettings {
  id: number;
  casing_size: number;
  crown_size: number;
  casing_formula: boolean;
}

export interface Color {
  id: number;
  name: string;
}

export interface PatinaColor {
  id: number;
  name: string;
}

export interface Beading {
  id: number;
  name: string;
  type: "main" | "additional";
}

export interface GlassType {
  id: number;
  name: string;
}

export interface Threshold {
  id: number;
  name: string;
}

export interface CasingRange {
  id?: number;
  min_size: number;
  max_size: number;
  casing_size: number;
}

export interface MonthlySalary {
  id?: number;
  month: string; // Format: "2025-07-01"
  user: number;
  fixed_salary: number;
  order_percentage: number;
  order_percentage_salary: number;
  penalties: number;
  bonuses: number;
  total_salary: number;
  orders_total_sum?: number;
  user_details?: {
    id: number;
    username: string;
    full_name: string;
    phone_number: string;
    role: string;
    fixed_salary: number;
    order_percentage: number;
  };
}

export interface Frame {
  id: number;
  name: string;
}

export interface Cladding {
  id: number;
  name: string;
}

export interface Lock {
  id: number;
  name: string;
}

export interface SteelColor {
  id: number;
  name: string;
}
