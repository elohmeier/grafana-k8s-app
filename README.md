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

## Release build

GitHub Actions builds the plugin on pushes, pull requests, and manual runs. The release workflow uses semantic-release on `main` to create version tags and GitHub releases from Conventional Commits. When a release is created, CI attaches a packaged plugin ZIP named `kubernetes-observability-app-<version>.zip` to the GitHub release.

To run a packaged build locally, download the workflow artifact and extract it so the plugin directory exists at `release/kubernetes-observability-app`:

```bash
mkdir -p release
unzip kubernetes-observability-app-*.zip -d release
docker compose -f docker-compose.release.yaml up
```

Grafana is available at <http://localhost:3010>. The release compose file also mounts `provisioning/` and starts the local Prometheus container used by the development setup.

For a one-off `docker run`, extract the ZIP the same way and mount the plugin plus provisioning directories:

```bash
docker run --rm -p 3010:3000 \
  -e GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=kubernetes-observability-app \
  -e GF_AUTH_ANONYMOUS_ENABLED=true \
  -e GF_AUTH_ANONYMOUS_ORG_ROLE=Admin \
  -v "$PWD/release/kubernetes-observability-app:/var/lib/grafana/plugins/kubernetes-observability-app:ro" \
  -v "$PWD/provisioning:/etc/grafana/provisioning:ro" \
  grafana/grafana-enterprise:12.3.2
```
