# Kubernetes Observability App

Grafana app plugin for Kubernetes and OpenShift observability with a Scenes-based navigation and drilldown experience.

The implementation is driven by:

- `ENTERPRISE_SPEC.md` for the enterprise implementation plan.
- `SPEC.md` and `research/` for upstream Grafana Kubernetes app research.
- `ENTERPRISE_SPEC.md` can be adapted for organization-specific legacy dashboard replacement scope.

## Development

Use Node 22 LTS or Node 24. The repo includes `.nvmrc` with Node 22 because the Grafana plugin e2e tooling does not support Node 25 yet.

```bash
nvm use
npm install
npm run typecheck
npm run build
```

Run a local Grafana with the plugin mounted:

```bash
npm run server
```

The local provisioning file uses generic datasource UIDs (`prometheus`, `prometheus-nonprod`, `elasticsearch`, and `infra-metadata`). In production, override these with existing Grafana datasource variables or provisioning.
