import { readFileSync } from 'node:fs';
import { Injectable } from '@nestjs/common';
import {
  findBusyPorts,
  leaseSlot,
  parseRegistry,
  portsForSlot,
  recommendWidth,
} from '@open-kingdom/shared-backend-util-port-lease';
import { PortLeaseStatusDto } from './port-lease.dto';

// This app's stack, as slot-0 bases — the ports the main checkout uses today.
export const DEMO_PORT_MAP = {
  PORT: 3000, // demo-scaffold-backend
  FRONTEND_PORT: 4200, // vite dev
  PREVIEW_PORT: 4300, // vite preview / e2e baseURL
  GCS_TWIN_PORT: 9013,
  GMAIL_TWIN_PORT: 9014,
  GOOGLE_AUTH_TWIN_PORT: 9015,
  YOUTUBE_TWIN_PORT: 9016,
  GOOGLE_CALENDAR_TWIN_PORT: 9017,
  SPOTIFY_TWIN_PORT: 9018,
};

export const DEMO_MAX_SLOTS = 8;

@Injectable()
export class PortLeaseService {
  async status(): Promise<PortLeaseStatusDto> {
    const warnings: string[] = [];
    // No env cache: a long-lived server should re-read the registry per request.
    const lease = leaseSlot({
      slotCacheEnvVar: false,
      onWarning: (message) => warnings.push(message),
    });

    const width = recommendWidth(DEMO_PORT_MAP, { maxSlots: DEMO_MAX_SLOTS });
    const leased = portsForSlot(DEMO_PORT_MAP, lease.slot, { width });
    const busy = new Set(await findBusyPorts(Object.values(leased)));

    return {
      ...lease,
      width,
      maxSlots: DEMO_MAX_SLOTS,
      backendPort: Number(process.env['PORT'] || 3000),
      ports: Object.entries(DEMO_PORT_MAP).map(([name, base]) => ({
        name,
        base,
        leased: leased[name as keyof typeof DEMO_PORT_MAP],
        busy: busy.has(leased[name as keyof typeof DEMO_PORT_MAP]),
      })),
      registry: this.readRegistry(lease.registryPath, lease.slot),
      warnings,
    };
  }

  private readRegistry(registryPath: string | null, currentSlot: number) {
    if (!registryPath) return [];
    let raw: string | null = null;
    try {
      raw = readFileSync(registryPath, 'utf8');
    } catch {
      return [];
    }
    return Object.entries(parseRegistry(raw).slots)
      .map(([slot, record]) => ({
        slot: Number(slot),
        path: record.path,
        branch: record.branch,
        current: Number(slot) === currentSlot,
      }))
      .sort((a, b) => a.slot - b.slot);
  }
}
