import packageJson from '../package.json';
import { fetchWithTimeout } from './util';

type TelemetryEvent = {
  event: string;
  packageVersion: string;
  properties: Record<string, string | number>;
};

type TelemetryEventTypes = 'eval_ran' | 'assertion_used' | 'command_used';

const TELEMETRY_ENDPOINT = 'https://api.promptfoo.dev/telemetry';

const TELEMETRY_TIMEOUT_MS = 1000;

export class Telemetry {
  private events: TelemetryEvent[] = [];

  get disabled() {
    return process.env.PROMPTFOO_DISABLE_TELEMETRY === '1';
  }

  record(eventName: TelemetryEventTypes, properties: Record<string, string | number>): void {
    if (!this.disabled) {
      this.events.push({
        event: eventName,
        packageVersion: packageJson.version,
        properties,
      });
    }
  }

  async send(): Promise<void> {
    if (!this.disabled && this.events.length > 0) {
      try {
        const response = await fetchWithTimeout(
          TELEMETRY_ENDPOINT,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(this.events),
          },
          TELEMETRY_TIMEOUT_MS,
        );

        if (response.ok) {
          this.events = [];
        }
      } catch (err) {}
    }
  }
}

const telemetry = new Telemetry();
export default telemetry;
