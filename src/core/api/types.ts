export interface MaterialType {
  id: number;
  name: string;
}

export interface Massif {
  id: number;
  name: string;
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
  type: 'main' | 'additional';
}

export interface GlassType {
  id: number;
  name: string;
}

export interface Threshold {
  id: number;
  name: string;
}
