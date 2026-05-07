import { expect, test } from '@grafana/plugin-e2e';

const pluginId = 'kubernetes-observability-app';

const topLevelRoutes = [
  { path: 'overview', text: 'Cluster inventory' },
  { path: 'search', text: 'Search scope' },
  { path: 'health', text: 'Nodes not ready' },
  { path: 'clusters', text: 'Clusters' },
  { path: 'namespaces', text: 'Namespaces' },
  { path: 'workloads', text: 'Workloads' },
  { path: 'pods', text: 'Pods' },
  { path: 'nodes', text: 'Nodes' },
  { path: 'persistent-volumes', text: 'PV/PVC inventory' },
  { path: 'jobs', text: 'CronJobs' },
  { path: 'alerts', text: 'Firing Kubernetes alerts' },
  { path: 'platform', text: 'Platform Operations backlog' },
  { path: 'configuration', text: 'Datasource contract' },
];

test.describe('Kubernetes observability app', () => {
  for (const route of topLevelRoutes) {
    test(`renders ${route.path}`, async ({ gotoAppPage, page }) => {
      await gotoAppPage({ pluginId, path: route.path });

      await expect(page).toHaveURL(new RegExp(`/a/${pluginId}/${route.path}`));
      await expect(page.getByText(route.text).first()).toBeVisible();
    });
  }

  test('renders namespace drilldown tabs', async ({ gotoAppPage, page }) => {
    await gotoAppPage({
      pluginId,
      path: 'namespaces/demo-cluster/payments-prod',
    });

    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Resources' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Storage' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Network' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Logs' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Events' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Metadata' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Alerts' })).toBeVisible();
  });

  test('renders time comparison control', async ({ gotoAppPage, page }) => {
    await gotoAppPage({ pluginId, path: 'overview' });

    await expect(page.getByRole('button', { name: 'Comparison: None' })).toBeVisible();
  });
});
