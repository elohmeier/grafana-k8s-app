import { CLUSTER_FILTER, NAMESPACE_FILTER } from './compat';

export function jobsInventoryQuery() {
  return `
max by (cluster, namespace, job_name, owner_name, owner_kind) (
  kube_job_owner{cluster=~"${CLUSTER_FILTER}", namespace=~"${NAMESPACE_FILTER}"}
)
or
max by (cluster, namespace, job_name) (
  kube_job_status_active{cluster=~"${CLUSTER_FILTER}", namespace=~"${NAMESPACE_FILTER}"}
)
or
max by (cluster, namespace, job_name) (
  kube_job_status_failed{cluster=~"${CLUSTER_FILTER}", namespace=~"${NAMESPACE_FILTER}"}
)
`;
}

export function cronJobsInventoryQuery() {
  return `
max by (cluster, namespace, cronjob) (
  kube_cronjob_info{cluster=~"${CLUSTER_FILTER}", namespace=~"${NAMESPACE_FILTER}"}
)
or
max by (cluster, namespace, cronjob) (
  kube_cronjob_status_active{cluster=~"${CLUSTER_FILTER}", namespace=~"${NAMESPACE_FILTER}"}
)
`;
}
