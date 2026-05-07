import { EntityScope, joinMatchers, matcher, scopedMatchers } from './prometheus';

function basePodMatchers(scope: EntityScope = {}) {
  return scopedMatchers({ cluster: scope.cluster, namespace: scope.namespace, pod: scope.pod });
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

function podGroupLabels(scope: EntityScope = {}, suffix = '') {
  const labels = scope.node
    ? 'cluster, namespace, node, pod'
    : scope.workload || scope.workloadType
      ? 'cluster, namespace, workload, workload_type, pod'
      : 'cluster, namespace, pod';

  return suffix ? `${labels}, ${suffix}` : labels;
}

function workloadNativeMatchers(scope: EntityScope, nativeLabel: string, workloadType: string) {
  return joinMatchers(
    scopedMatchers({ cluster: scope.cluster, namespace: scope.namespace }),
    !scope.workloadType || scope.workloadType === workloadType ? matcher(nativeLabel, scope.workload) : `${nativeLabel}=~"^$"`
  );
}

export function podWaitingReasons(scope: EntityScope = {}) {
  return `
max by (${podGroupLabels(scope, 'container, reason')}) (
  (
    kube_pod_container_status_waiting_reason{${basePodMatchers(scope)}, reason!="", namespace!="", pod!="", container!=""} > 0
  )
  ${podMetadataJoin(scope)}
)
`;
}

export function podRestartCount(scope: EntityScope = {}) {
  return `
sum by (${podGroupLabels(scope, 'container')}) (
  increase(kube_pod_container_status_restarts_total{${basePodMatchers(scope)}, namespace!="", pod!="", container!=""}[$__range])
  ${podMetadataJoin(scope)}
)
`;
}

export function podsNotReady(scope: EntityScope = {}) {
  return `
max by (${podGroupLabels(scope, 'condition')}) (
  (
    kube_pod_status_ready{${basePodMatchers(scope)}, condition="false", namespace!="", pod!=""} == 1
  )
  ${podMetadataJoin(scope)}
)
`;
}

export function pendingPods(scope: EntityScope = {}) {
  return `
max by (${podGroupLabels(scope, 'phase')}) (
  (
    kube_pod_status_phase{${basePodMatchers(scope)}, phase="Pending", namespace!="", pod!=""} == 1
  )
  ${podMetadataJoin(scope)}
)
`;
}

export function deploymentReadiness(scope: EntityScope = {}) {
  const filters = workloadNativeMatchers(scope, 'deployment', 'deployment');

  return `
max by (cluster, namespace, workload, workload_type) (
  label_replace(
    label_replace(
      kube_deployment_status_replicas_ready{${filters}, namespace!="", deployment!=""}
      /
      clamp_min(kube_deployment_spec_replicas{${filters}, namespace!="", deployment!=""}, 1),
      "workload", "$1", "deployment", "(.+)"
    ),
    "workload_type", "deployment", "deployment", ".+"
  )
)
`;
}

export function statefulSetReadiness(scope: EntityScope = {}) {
  const filters = workloadNativeMatchers(scope, 'statefulset', 'statefulset');

  return `
max by (cluster, namespace, workload, workload_type) (
  label_replace(
    label_replace(
      kube_statefulset_status_replicas_ready{${filters}, namespace!="", statefulset!=""}
      /
      clamp_min(kube_statefulset_replicas{${filters}, namespace!="", statefulset!=""}, 1),
      "workload", "$1", "statefulset", "(.+)"
    ),
    "workload_type", "statefulset", "statefulset", ".+"
  )
)
`;
}

export function daemonSetReadiness(scope: EntityScope = {}) {
  const filters = workloadNativeMatchers(scope, 'daemonset', 'daemonset');

  return `
max by (cluster, namespace, workload, workload_type) (
  label_replace(
    label_replace(
      kube_daemonset_status_number_available{${filters}, namespace!="", daemonset!=""}
      /
      clamp_min(kube_daemonset_status_desired_number_scheduled{${filters}, namespace!="", daemonset!=""}, 1),
      "workload", "$1", "daemonset", "(.+)"
    ),
    "workload_type", "daemonset", "daemonset", ".+"
  )
)
`;
}
