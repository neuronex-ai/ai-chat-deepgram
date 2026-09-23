import type { IntegrationState } from "../tools/registry";

export function IntegrationPill({ integration }: { integration: IntegrationState }) {
  return (
    <div className={`integration-pill ${integration.state}`}>
      <span className="integration-dot" aria-hidden="true" />
      <span>{integration.label}</span>
      <span className="integration-state">
        {integration.state === "connected" ? "ready" : "next"}
      </span>
    </div>
  );
}
