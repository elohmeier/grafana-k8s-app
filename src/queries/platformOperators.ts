import { EntityScope, scopedMatchers } from './prometheus';

export function argocdApplicationsByStatus(scope: EntityScope = {}) {
  return `
count by (cluster, namespace, health_status, sync_status) (
  argocd_app_info{${scopedMatchers(scope)}}
)
`;
}

export function argocdSyncFailures(scope: EntityScope = {}) {
  return `
sum by (cluster, namespace, project) (
  rate(argocd_app_sync_total{${scopedMatchers(scope)}, phase!="Succeeded"}[$__rate_interval])
)
`;
}

export function certificatesNotReady(scope: EntityScope = {}) {
  return `
max by (cluster, namespace, name, condition, status) (
  certmanager_certificate_ready_status{${scopedMatchers(scope)}, condition="Ready", status!="True"}
)
`;
}

export function certificatesExpiringSoon(scope: EntityScope = {}) {
  return `
max by (cluster, namespace, name) (
  certmanager_certificate_expiration_timestamp_seconds{${scopedMatchers(scope)}} - time()
) < 1209600
`;
}

export function kedaScaledObjectErrors(scope: EntityScope = {}) {
  return `
sum by (cluster, namespace, scaledObject, scaler) (
  rate(keda_scaled_object_errors_total{${scopedMatchers(scope)}}[$__rate_interval])
  or
  rate(keda_scaler_detail_errors_total{${scopedMatchers(scope)}}[$__rate_interval])
)
`;
}

export function kyvernoPolicyFailures(scope: EntityScope = {}) {
  return `
sum by (cluster, namespace, policy, rule, result) (
  increase(kyverno_policy_results_total{${scopedMatchers(scope)}, result=~"fail|error"}[$__range])
)
`;
}

export function tridentVolumeRisks(scope: EntityScope = {}) {
  return `
max by (cluster, namespace, persistentvolumeclaim) (
  kubelet_volume_stats_used_bytes{${scopedMatchers(scope)}, persistentvolumeclaim!=""}
  /
  (kubelet_volume_stats_capacity_bytes{${scopedMatchers(scope)}, persistentvolumeclaim!=""} > 0)
) > 0.85
`;
}
