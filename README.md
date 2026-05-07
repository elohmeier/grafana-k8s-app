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

To run a packaged build locally, download the release ZIP and extract it in the repository root so the plugin directory exists at `kubernetes-observability-app`. Use the exact ZIP version you want to run:

```bash
rm -rf kubernetes-observability-app
unzip kubernetes-observability-app-1.0.2.zip
docker compose -f docker-compose.release.yaml up
```

Grafana is available at <http://localhost:3010>. The release compose file also mounts `provisioning/` and starts the local Prometheus container used by the development setup. If you extract the ZIP somewhere else, set `PLUGIN_DIR` to that extracted `kubernetes-observability-app` directory.

For a one-off `docker run`, extract the ZIP the same way and mount the plugin plus provisioning directories:

```bash
docker run --rm -p 3010:3000 \
  -e GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=kubernetes-observability-app \
  -e GF_AUTH_ANONYMOUS_ENABLED=true \
  -e GF_AUTH_ANONYMOUS_ORG_ROLE=Admin \
  -v "$PWD/kubernetes-observability-app:/var/lib/grafana/plugins/kubernetes-observability-app:ro" \
  -v "$PWD/provisioning:/etc/grafana/provisioning:ro" \
  -v "$PWD/grafana.ini:/etc/grafana/grafana.ini:ro" \
  grafana/grafana-enterprise:12.3.2
```

## Sidebar placement

By default Grafana hides app plugins under **More apps**. The repo ships a `grafana.ini` that promotes this plugin into the top-level **Observability** sidebar group via:

```ini
[navigation.app_sections]
kubernetes-observability-app = observability 10
```

The compose file and the `docker run` example above mount this file into `/etc/grafana/grafana.ini`. For your own Grafana deployment, merge the snippet into your existing config (or set the equivalent in your config-management tooling). Use `root` instead of `observability` to pin it at the very top of the sidebar; adjust the trailing number to change sort weight. Restart Grafana after changes.
