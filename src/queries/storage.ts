import { CLUSTER_FILTER, NAMESPACE_FILTER } from './compat';
import { EntityScope, scopedMatchers } from './prometheus';

function storageBaseMatchers(scope: EntityScope = {}) {
  return scopedMatchers({
    cluster: scope.cluster,
    namespace: scope.namespace,
  });
}

function podVolumeSelector(scope: EntityScope = {}) {
  const podScope = {
    cluster: scope.cluster,
    namespace: scope.namespace,
    pod: scope.pod,
  };

  const podVolumes = `
group by (cluster, namespace, pod, persistentvolumeclaim, volume) (
  kube_pod_spec_volumes_persistentvolumeclaims_info{${scopedMatchers(podScope)}, pod!="", volume!="", persistentvolumeclaim!=""}
)
`;

  if (!scope.workload && !scope.workloadType) {
    return podVolumes;
  }

  const workloadScope = {
    cluster: scope.cluster,
    namespace: scope.namespace,
    workload: scope.workload,
    workloadType: scope.workloadType,
  };

  return `
${podVolumes}
* on (cluster, namespace, pod) group_left(workload, workload_type)
group by (cluster, namespace, pod, workload, workload_type) (
  namespace_workload_pod:kube_pod_owner:relabel{${scopedMatchers(workloadScope)}, pod!=""}
)
`;
}

function volumeGroupLabels(scope: EntityScope = {}) {
  if (scope.workload || scope.workloadType) {
    return 'cluster, namespace, workload, workload_type, pod, persistentvolumeclaim';
  }

  if (scope.pod) {
    return 'cluster, namespace, pod, persistentvolumeclaim';
  }

  return 'cluster, namespace, persistentvolumeclaim';
}

function scopedPvcFilter(scope: EntityScope = {}) {
  return Boolean(scope.pod || scope.workload || scope.workloadType);
}

export function persistentVolumeInventoryQuery() {
  return `
max by (cluster, namespace, persistentvolumeclaim, persistentvolume, storageclass, volumename) (
  kube_persistentvolumeclaim_info{cluster=~"${CLUSTER_FILTER}", namespace=~"${NAMESPACE_FILTER}"}
)
or
max by (cluster, namespace, persistentvolumeclaim, phase) (
  kube_persistentvolumeclaim_status_phase{cluster=~"${CLUSTER_FILTER}", namespace=~"${NAMESPACE_FILTER}", phase!=""} == 1
)
`;
}

export function persistentVolumeUsageQuery() {
  return `
max by (cluster, namespace, persistentvolumeclaim) (
  kubelet_volume_stats_used_bytes{cluster=~"${CLUSTER_FILTER}", namespace=~"${NAMESPACE_FILTER}"}
)
/
max by (cluster, namespace, persistentvolumeclaim) (
  kubelet_volume_stats_capacity_bytes{cluster=~"${CLUSTER_FILTER}", namespace=~"${NAMESPACE_FILTER}"} > 0
)
`;
}

export function persistentVolumeRiskQuery() {
  return `
(
  max by (cluster, namespace, persistentvolumeclaim) (
    kubelet_volume_stats_used_bytes{cluster=~"${CLUSTER_FILTER}", namespace=~"${NAMESPACE_FILTER}"}
  )
  /
  max by (cluster, namespace, persistentvolumeclaim) (
    kubelet_volume_stats_capacity_bytes{cluster=~"${CLUSTER_FILTER}", namespace=~"${NAMESPACE_FILTER}"} > 0
  )
) > 0.85
or
max by (cluster, namespace, persistentvolumeclaim, phase) (
  kube_persistentvolumeclaim_status_phase{cluster=~"${CLUSTER_FILTER}", namespace=~"${NAMESPACE_FILTER}", phase=~"Pending|Lost"} == 1
)
`;
}

export function scopedPersistentVolumeInventoryQuery(scope: EntityScope = {}) {
  if (scopedPvcFilter(scope)) {
    const selector = podVolumeSelector(scope);
    const base = storageBaseMatchers(scope);

    return `
${selector}
* on (cluster, namespace, persistentvolumeclaim) group_left(storageclass, volumename)
max by (cluster, namespace, persistentvolumeclaim, storageclass, volumename) (
  kube_persistentvolumeclaim_info{${base}, persistentvolumeclaim!=""}
)
or
${selector}
* on (cluster, namespace, persistentvolumeclaim) group_left(phase)
max by (cluster, namespace, persistentvolumeclaim, phase) (
  kube_persistentvolumeclaim_status_phase{${base}, persistentvolumeclaim!="", phase!=""} == 1
)
`;
  }

  return `
max by (cluster, namespace, persistentvolumeclaim, persistentvolume, storageclass, volumename) (
  kube_persistentvolumeclaim_info{${scopedMatchers(scope)}, namespace!="", persistentvolumeclaim!=""}
)
or
max by (cluster, namespace, persistentvolumeclaim, phase) (
  kube_persistentvolumeclaim_status_phase{${scopedMatchers(scope)}, namespace!="", persistentvolumeclaim!="", phase!=""} == 1
)
`;
}

export function scopedPersistentVolumeUsageQuery(scope: EntityScope = {}) {
  if (scopedPvcFilter(scope)) {
    const selector = podVolumeSelector(scope);
    const base = storageBaseMatchers(scope);

    return `
sum by (${volumeGroupLabels(scope)}) (
  ${selector}
  * on (cluster, namespace, persistentvolumeclaim) group_left()
  (
    max by (cluster, namespace, persistentvolumeclaim) (
      kubelet_volume_stats_used_bytes{${base}, persistentvolumeclaim!=""}
    )
    /
    max by (cluster, namespace, persistentvolumeclaim) (
      kubelet_volume_stats_capacity_bytes{${base}, persistentvolumeclaim!=""} > 0
    )
  )
)
`;
  }

  return `
max by (cluster, namespace, persistentvolumeclaim) (
  kubelet_volume_stats_used_bytes{${scopedMatchers(scope)}, namespace!="", persistentvolumeclaim!=""}
)
/
max by (cluster, namespace, persistentvolumeclaim) (
  kubelet_volume_stats_capacity_bytes{${scopedMatchers(scope)}, namespace!="", persistentvolumeclaim!=""} > 0
)
`;
}

export function filesystemReadBytes(scope: EntityScope = {}) {
  const { workload, workloadType, ...baseScope } = scope;

  return `
sum by (${scope.workload || scope.workloadType ? 'cluster, namespace, workload, workload_type, pod' : 'cluster, namespace, pod'}) (
  sum by (cluster, namespace, pod) (
    rate(container_fs_reads_bytes_total{${scopedMatchers(baseScope)}, pod!="", device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+"}[$__rate_interval])
  )
  ${
    scope.workload || scope.workloadType
      ? `* on (cluster, namespace, pod) group_left(workload, workload_type)
  group by (cluster, namespace, pod, workload, workload_type) (
    namespace_workload_pod:kube_pod_owner:relabel{${scopedMatchers({
      cluster: scope.cluster,
      namespace: scope.namespace,
      workload,
      workloadType,
    })}, pod!=""}
  )`
      : ''
  }
)
`;
}

export function filesystemWriteBytes(scope: EntityScope = {}) {
  const { workload, workloadType, ...baseScope } = scope;

  return `
sum by (${scope.workload || scope.workloadType ? 'cluster, namespace, workload, workload_type, pod' : 'cluster, namespace, pod'}) (
  sum by (cluster, namespace, pod) (
    rate(container_fs_writes_bytes_total{${scopedMatchers(baseScope)}, pod!="", device=~"(/dev.+)|mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|dasd.+"}[$__rate_interval])
  )
  ${
    scope.workload || scope.workloadType
      ? `* on (cluster, namespace, pod) group_left(workload, workload_type)
  group by (cluster, namespace, pod, workload, workload_type) (
    namespace_workload_pod:kube_pod_owner:relabel{${scopedMatchers({
      cluster: scope.cluster,
      namespace: scope.namespace,
      workload,
      workloadType,
    })}, pod!=""}
  )`
      : ''
  }
)
`;
}

export function persistentVolumeAvailableBytes(scope: EntityScope = {}) {
  return `
max by (cluster, namespace, persistentvolumeclaim) (
  kubelet_volume_stats_available_bytes{${scopedMatchers(scope)}, namespace!="", persistentvolumeclaim!=""}
)
`;
}

export function persistentVolumeInodeUsage(scope: EntityScope = {}) {
  return `
1 -
(
  max by (cluster, namespace, persistentvolumeclaim) (
    kubelet_volume_stats_inodes_free{${scopedMatchers(scope)}, namespace!="", persistentvolumeclaim!=""}
  )
  /
  max by (cluster, namespace, persistentvolumeclaim) (
    kubelet_volume_stats_inodes{${scopedMatchers(scope)}, namespace!="", persistentvolumeclaim!=""} > 0
  )
)
`;
}

export function scopedPersistentVolumeRiskQuery(scope: EntityScope = {}) {
  return `
(
  ${scopedPersistentVolumeUsageQuery(scope).trim()}
) > 0.85
or
(
  ${persistentVolumeInodeUsage(scope).trim()}
) > 0.85
or
max by (cluster, namespace, persistentvolumeclaim, phase) (
  kube_persistentvolumeclaim_status_phase{${scopedMatchers(scope)}, namespace!="", persistentvolumeclaim!="", phase=~"Pending|Lost"} == 1
)
`;
}

export function filesystemReadIops(scope: EntityScope = {}) {
  return filesystemReadBytes(scope).replace(/container_fs_reads_bytes_total/g, 'container_fs_reads_total');
}

export function filesystemWriteIops(scope: EntityScope = {}) {
  return filesystemWriteBytes(scope).replace(/container_fs_writes_bytes_total/g, 'container_fs_writes_total');
}
