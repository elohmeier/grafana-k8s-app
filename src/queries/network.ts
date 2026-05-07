import { EntityScope, scopedMatchers } from './prometheus';

function baseNetworkMatchers(scope: EntityScope = {}) {
  const { workload, workloadType, node, ...baseScope } = scope;
  return scopedMatchers(baseScope);
}

function podMetadataJoin(scope: EntityScope = {}) {
  const joins: string[] = [];

  if (scope.node) {
    joins.push(`
  * on (cluster, namespace, pod) group_left(node)
  max by (cluster, namespace, pod, node) (
    kube_pod_info{${scopedMatchers({ cluster: scope.cluster, namespace: scope.namespace, node: scope.node })}, pod!="", node!=""}
  )
`);
  }

  if (scope.workload || scope.workloadType) {
    joins.push(`
  * on (cluster, namespace, pod) group_left(workload, workload_type)
  group by (cluster, namespace, pod, workload, workload_type) (
    namespace_workload_pod:kube_pod_owner:relabel{${scopedMatchers({
      cluster: scope.cluster,
      namespace: scope.namespace,
      workload: scope.workload,
      workloadType: scope.workloadType,
    })}, pod!=""}
  )
`);
  }

  return joins.join('\n');
}

function groupLabels(scope: EntityScope = {}) {
  if (scope.node) {
    return 'cluster, namespace, node, pod';
  }

  return scope.workload || scope.workloadType
    ? 'cluster, namespace, workload, workload_type, pod'
    : 'cluster, namespace, pod';
}

export function networkReceive(scope: EntityScope = {}) {
  return `
sum by (${groupLabels(scope)}) (
  max by (cluster, namespace, pod, interface) (
    rate(container_network_receive_bytes_total{${baseNetworkMatchers(scope)}, pod!=""}[$__rate_interval])
  )
  ${podMetadataJoin(scope)}
)
`;
}

export function networkTransmit(scope: EntityScope = {}) {
  return `
sum by (${groupLabels(scope)}) (
  max by (cluster, namespace, pod, interface) (
    rate(container_network_transmit_bytes_total{${baseNetworkMatchers(scope)}, pod!=""}[$__rate_interval])
  )
  ${podMetadataJoin(scope)}
)
`;
}

export function networkReceivePackets(scope: EntityScope = {}) {
  return `
sum by (${groupLabels(scope)}) (
  max by (cluster, namespace, pod, interface) (
    rate(container_network_receive_packets_total{${baseNetworkMatchers(scope)}, pod!=""}[$__rate_interval])
  )
  ${podMetadataJoin(scope)}
)
`;
}

export function networkTransmitPackets(scope: EntityScope = {}) {
  return `
sum by (${groupLabels(scope)}) (
  max by (cluster, namespace, pod, interface) (
    rate(container_network_transmit_packets_total{${baseNetworkMatchers(scope)}, pod!=""}[$__rate_interval])
  )
  ${podMetadataJoin(scope)}
)
`;
}

export function networkDrops(scope: EntityScope = {}) {
  return `
sum by (${groupLabels(scope)}) (
  (
    max by (cluster, namespace, pod, interface) (
      rate(container_network_receive_packets_dropped_total{${baseNetworkMatchers(scope)}, pod!=""}[$__rate_interval])
    )
    +
    max by (cluster, namespace, pod, interface) (
      rate(container_network_transmit_packets_dropped_total{${baseNetworkMatchers(scope)}, pod!=""}[$__rate_interval])
    )
  )
  ${podMetadataJoin(scope)}
)
`;
}

export function networkErrors(scope: EntityScope = {}) {
  return `
sum by (${groupLabels(scope)}) (
  (
    max by (cluster, namespace, pod, interface) (
      rate(container_network_receive_errors_total{${baseNetworkMatchers(scope)}, pod!=""}[$__rate_interval])
    )
    +
    max by (cluster, namespace, pod, interface) (
      rate(container_network_transmit_errors_total{${baseNetworkMatchers(scope)}, pod!=""}[$__rate_interval])
    )
  )
  ${podMetadataJoin(scope)}
)
`;
}
