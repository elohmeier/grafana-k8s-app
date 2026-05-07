import { PLUGIN_BASE_URL, ROUTES } from '../constants';
import { namespaceLink, nodeLink, podLink, workloadLink } from './entityLinks';
import { prefixRoute } from './utils.routing';

describe('prefixRoute', () => {
  it('builds app routes from the plugin id', () => {
    expect(PLUGIN_BASE_URL).toBe('/a/kubernetes-observability-app');
    expect(prefixRoute(ROUTES.Overview)).toBe('/a/kubernetes-observability-app/overview');
    expect(prefixRoute(`${ROUTES.Namespaces}/:namespace/*`)).toBe('/a/kubernetes-observability-app/namespaces/:namespace/*');
  });
});

describe('entity data links', () => {
  it('builds drilldown URLs from table row fields', () => {
    expect(namespaceLink().url).toBe('/a/kubernetes-observability-app/namespaces/${__data.fields.cluster}/${__data.fields.namespace}');
    expect(workloadLink().url).toBe(
      '/a/kubernetes-observability-app/workloads/${__data.fields.cluster}/${__data.fields.namespace}/${__data.fields.workload_type}/${__data.fields.workload}'
    );
    expect(podLink().url).toBe(
      '/a/kubernetes-observability-app/pods/${__data.fields.cluster}/${__data.fields.namespace}/${__data.fields.pod}'
    );
    expect(nodeLink().url).toBe('/a/kubernetes-observability-app/nodes/${__data.fields.cluster}/${__data.fields.node}');
  });
});
