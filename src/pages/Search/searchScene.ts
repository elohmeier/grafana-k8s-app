import { TextBoxVariable } from '@grafana/scenes';
import { SEARCH_CONTROLS, full, item, pageScene, row } from '../../scenes/common';
import { linkedTablePanel, tablePanel, textPanel } from '../../scenes/panels';
import {
  searchClustersQuery,
  searchContainersQuery,
  searchArgoCdApplicationsQuery,
  searchNamespacesQuery,
  searchNodesQuery,
  searchPodsQuery,
  searchPersistentVolumeClaimsQuery,
  searchWorkloadsQuery,
} from '../../queries/search';
import { clusterLink, namespaceLink, nodeLink, podLink, workloadLink } from '../../utils/entityLinks';

export function searchScene() {
  const searchVariable = new TextBoxVariable({
    name: 'search',
    label: 'Search',
    value: '.+',
  });

  return pageScene(
    [
      full(
        textPanel(
          'Search scope',
          'Enter a regex-compatible term in the Search variable. Results prefer OTEL semantic `k8s_*` labels where available and fall back to kube-state metrics labels.'
        ),
        130
      ),
      row(
        [
          item(linkedTablePanel('Clusters', searchClustersQuery(), [clusterLink()]), '50%', 260),
          item(linkedTablePanel('Namespaces', searchNamespacesQuery(), [namespaceLink()]), '50%', 260),
        ],
        280
      ),
      row(
        [
          item(linkedTablePanel('Workloads', searchWorkloadsQuery(), [workloadLink()]), '50%', 260),
          item(linkedTablePanel('Pods', searchPodsQuery(), [podLink()]), '50%', 260),
        ],
        280
      ),
      row(
        [
          item(tablePanel('Containers', searchContainersQuery()), '50%', 260),
          item(linkedTablePanel('Nodes', searchNodesQuery(), [nodeLink()]), '50%', 260),
        ],
        280
      ),
      row(
        [
          item(linkedTablePanel('PVCs', searchPersistentVolumeClaimsQuery(), [namespaceLink()]), '50%', 260),
          item(tablePanel('ArgoCD applications', searchArgoCdApplicationsQuery()), '50%', 260),
        ],
        280
      ),
    ],
    'now-1h',
    [searchVariable],
    SEARCH_CONTROLS
  );
}
