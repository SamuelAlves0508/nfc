// Replace these interfaces with authenticated server adapters when infrastructure exists.
// Private Google credentials belong exclusively in a server route/environment.
export interface GooglePlace {
  id: string;
  name: string;
  address: string;
  reviewUrl: string;
}
export interface PlacesService {
  search(query: string): Promise<GooglePlace[]>;
}
export interface DynamicQRService {
  create(destination: string): Promise<{ slug: string; url: string }>;
  update(slug: string, destination: string): Promise<void>;
}
export interface ScanEvent {
  qrId: string;
  plateId?: string;
  at: string;
  device: string;
  browser: string;
  city: string;
  country: string;
}
export interface AnalyticsService {
  getScans(days: 1 | 7 | 30): Promise<ScanEvent[]>;
}
export const integrations = {
  places: false,
  dynamicQR: false,
  analytics: false,
} as const;
