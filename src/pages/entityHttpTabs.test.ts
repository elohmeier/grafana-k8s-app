import { SceneAppPageLike } from '@grafana/scenes';
import { getClustersPage } from './Clusters/clustersPage';
import { getNamespacesPage } from './Namespaces/namespacesPage';
import { getNodesPage } from './Nodes/nodesPage';
import { getPodsPage } from './Pods/podsPage';
import { getWorkloadsPage } from './Workloads/workloadsPage';

function tabTitles(page: SceneAppPageLike) {
  return page.state.tabs?.map((tab) => tab.state.title) ?? [];
}

describe('entity HTTP tabs', () => {
  it('adds HTTP tabs to cluster, namespace, workload, and pod drilldowns', () => {
    const clusterPage = getClustersPage().state.drilldowns?.[0].getPage(
      { params: { cluster: 'c1' } } as never,
      getClustersPage()
    );
    const namespacePage = getNamespacesPage().state.drilldowns?.[0].getPage(
      { params: { cluster: 'c1', namespace: 'ns1' } } as never,
      getNamespacesPage()
    );
    const workloadPage = getWorkloadsPage().state.drilldowns?.[0].getPage(
      { params: { cluster: 'c1', namespace: 'ns1', workloadType: 'deployment', workload: 'checkout' } } as never,
      getWorkloadsPage()
    );
    const podPage = getPodsPage().state.drilldowns?.[0].getPage(
      { params: { cluster: 'c1', namespace: 'ns1', pod: 'pod-a' } } as never,
      getPodsPage()
    );

    expect(tabTitles(clusterPage!)).toContain('HTTP');
    expect(tabTitles(namespacePage!)).toContain('HTTP');
    expect(tabTitles(workloadPage!)).toContain('HTTP');
    expect(tabTitles(podPage!)).toContain('HTTP');
  });

  it('keeps node drilldowns focused on node network/runtime views', () => {
    const nodePage = getNodesPage().state.drilldowns?.[0].getPage(
      { params: { cluster: 'c1', node: 'node-a' } } as never,
      getNodesPage()
    );

    expect(tabTitles(nodePage!)).not.toContain('HTTP');
  });
});
