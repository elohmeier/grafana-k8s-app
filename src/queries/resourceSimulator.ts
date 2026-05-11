import { EntityScope, scopedMatchers } from './prometheus';

function simulatorMatchers(scope: EntityScope = {}) {
  return scopedMatchers({
    cluster: scope.cluster,
    namespace: scope.namespace ?? '${namespace:regex}',
  });
}

function workloadOwnerSelector(scope: EntityScope = {}) {
  return `
group by (cluster, namespace, pod, workload, workload_type) (
  namespace_workload_pod:kube_pod_owner:relabel{
    ${simulatorMatchers(scope)},
    pod!="",
    workload!="",
    workload_type=~"deployment|statefulset"
  }
)
`;
}

export function simulatorQuotaQuery(scope: EntityScope = {}) {
  return `
sum by (cluster, namespace, resource, type) (
  kube_resourcequota{
    ${simulatorMatchers(scope)},
    resource=~"requests[.]cpu|requests[.]memory|limits[.]cpu|limits[.]memory|requests[.]storage|pods|persistentvolumeclaims|count/.*"
  }
)
`;
}

export function simulatorWorkloadReplicasQuery(scope: EntityScope = {}) {
  const filters = simulatorMatchers(scope);

  return `
max by (cluster, namespace, workload, workload_type) (
  label_replace(
    label_replace(
      kube_deployment_spec_replicas{${filters}, deployment!=""},
      "workload",
      "$1",
      "deployment",
      "(.+)"
    ),
    "workload_type",
    "deployment",
    "deployment",
    ".*"
  )
)
or
max by (cluster, namespace, workload, workload_type) (
  label_replace(
    label_replace(
      kube_statefulset_replicas{${filters}, statefulset!=""},
      "workload",
      "$1",
      "statefulset",
      "(.+)"
    ),
    "workload_type",
    "statefulset",
    "statefulset",
    ".*"
  )
)
`;
}

export function simulatorWorkloadPodsQuery(scope: EntityScope = {}) {
  return `
count by (cluster, namespace, workload, workload_type) (
  ${workloadOwnerSelector(scope)}
)
`;
}

export function simulatorWorkloadContainersQuery(scope: EntityScope = {}) {
  return `
count by (cluster, namespace, workload, workload_type, container) (
  kube_pod_container_info{
    ${simulatorMatchers(scope)},
    pod!="",
    container!="",
    container!="POD"
  }
  * on (cluster, namespace, pod) group_left(workload, workload_type)
  ${workloadOwnerSelector(scope)}
)
`;
}

export function simulatorWorkloadRequestsQuery(scope: EntityScope = {}) {
  return `
sum by (cluster, namespace, workload, workload_type, container, resource) (
  kube_pod_container_resource_requests{
    ${simulatorMatchers(scope)},
    pod!="",
    container!="",
    container!="POD",
    resource=~"cpu|memory"
  }
  * on (cluster, namespace, pod) group_left(workload, workload_type)
  ${workloadOwnerSelector(scope)}
)
`;
}

export function simulatorWorkloadLimitsQuery(scope: EntityScope = {}) {
  return `
sum by (cluster, namespace, workload, workload_type, container, resource) (
  kube_pod_container_resource_limits{
    ${simulatorMatchers(scope)},
    pod!="",
    container!="",
    container!="POD",
    resource=~"cpu|memory"
  }
  * on (cluster, namespace, pod) group_left(workload, workload_type)
  ${workloadOwnerSelector(scope)}
)
`;
}

function workloadPvcSelector(scope: EntityScope = {}) {
  return `
group by (cluster, namespace, workload, workload_type, persistentvolumeclaim) (
  kube_pod_spec_volumes_persistentvolumeclaims_info{
    ${simulatorMatchers(scope)},
    pod!="",
    persistentvolumeclaim!=""
  }
  * on (cluster, namespace, pod) group_left(workload, workload_type)
  ${workloadOwnerSelector(scope)}
)
`;
}

export function simulatorWorkloadPvcCountQuery(scope: EntityScope = {}) {
  return `
count by (cluster, namespace, workload, workload_type) (
  ${workloadPvcSelector(scope)}
)
`;
}

export function simulatorWorkloadPvcStorageQuery(scope: EntityScope = {}) {
  return `
sum by (cluster, namespace, workload, workload_type) (
  max by (cluster, namespace, persistentvolumeclaim) (
    kube_persistentvolumeclaim_resource_requests_storage_bytes{
      ${simulatorMatchers(scope)},
      persistentvolumeclaim!=""
    }
  )
  * on (cluster, namespace, persistentvolumeclaim) group_right()
  ${workloadPvcSelector(scope)}
)
`;
}

export function simulatorClusterAllocatableQuery(scope: EntityScope = {}) {
  return `
sum by (cluster, resource) (
  kube_node_status_allocatable{
    cluster=~"${scope.cluster ?? '${cluster:regex}'}",
    resource=~"cpu|memory|pods"
  }
)
`;
}
