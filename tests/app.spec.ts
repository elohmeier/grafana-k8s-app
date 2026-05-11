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
  { path: 'resource-simulator', text: 'Resource Simulator' },
  { path: 'platform', text: 'Platform Operations' },
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

  test('renders resource simulator workload editor and restores URL state', async ({ gotoAppPage, page }) => {
    await gotoAppPage({
      pluginId,
      path: 'resource-simulator',
    });

    await expect(page.getByText('Workloads').first()).toBeVisible();
    await expect(page.getByText('Projected Quota And Capacity')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Used' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Comparison:/ })).toHaveCount(0);

    await page.getByRole('button', { name: 'Add workload' }).click();
    await expect(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();
    await expect(page.getByLabel('Temporary workload name')).toHaveValue(/temp-workload-/);

    await page.getByLabel('Temporary workload name').fill('load-test');
    await page.getByLabel('Simulated replicas for load-test').fill('3');
    await page.getByRole('button', { name: 'Expand containers for load-test' }).click();
    await page.getByLabel('CPU request for container app in load-test').fill('1');
    await page.getByLabel('Memory request for container app in load-test').fill('2 Gi');
    await page.getByLabel('PVC count for load-test').fill('1');
    await page.getByLabel('PVC storage for load-test').fill('20Gi');

    await expect(page).toHaveURL(/scenario=/);
    await page.reload();
    await expect(page.getByLabel('Temporary workload name')).toHaveValue('load-test');
    await expect(page.getByLabel('Simulated replicas for load-test')).toHaveValue('3');
    await page.getByRole('button', { name: 'Expand containers for load-test' }).click();
    await expect(page.getByLabel('CPU request for container app in load-test')).toHaveValue('1');
    await expect(page.getByLabel('Memory request for container app in load-test')).toHaveValue('2Gi');
    await expect(page.getByLabel('PVC storage for load-test')).toHaveValue('20Gi');
  });
});
