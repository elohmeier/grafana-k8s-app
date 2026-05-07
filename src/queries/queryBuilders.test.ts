import { alertInventoryQuery } from './alerts';
import { namespaceInfrastructureQuery, namespaceOwnershipQuery } from './infra';
import { kubernetesEventsQuery, kubernetesLogsQuery, kubernetesWarningsAndErrorsQuery } from './logs';
import { networkErrors, networkReceive, networkReceivePackets, networkTransmit } from './network';
import { kubeletPodStartDurationP95, nodeFilesystemUtilization } from './node';
import { coreDnsErrorRate, ovnCniRequestLatencyP95, ovnDaemonSetAvailability } from './platformNetworking';
import { cpuRequests, cpuRequestsToCapacity, cpuUsage, cpuUsageP95, cpuUsageToRequests, memoryWorkingSet, topCpuConsumers } from './resources';
import { deploymentReadiness, podWaitingReasons } from './scheduling';
import {
  searchClustersQuery,
  searchContainersQuery,
  searchNamespacesQuery,
  searchNodesQuery,
  searchPodsQuery,
  searchWorkloadsQuery,
} from './search';
import { filesystemReadBytes, scopedPersistentVolumeUsageQuery } from './storage';

function compact(query: string) {
  return query.replace(/\s+/g, ' ').trim();
}

describe('log query builders', () => {
  it('scopes Kubernetes logs by cluster, namespace, and workload prefix', () => {
    const query = kubernetesLogsQuery({
      cluster: 'prod-cluster',
      namespace: 'payments"prod',
      workload: 'api-gateway',
    });

    expect(query).toContain('NOT logmgmt.category:event');
    expect(query).toContain('orchestrator.cluster.name:"prod-cluster"');
    expect(query).toContain('service.environment:"PROD-CLUSTER"');
    expect(query).toContain('orchestrator.namespace:("payments\\"prod")');
    expect(query).toContain('orchestrator.resource.name:(api\\-gateway*)');
  });

  it('keeps logs and events on separate Elasticsearch queries', () => {
    expect(kubernetesWarningsAndErrorsQuery({ namespace: 'demo' })).toContain('NOT logmgmt.category:event');
    expect(kubernetesWarningsAndErrorsQuery({ namespace: 'demo' })).toContain('(log.level:error OR log.level:warn)');
    expect(kubernetesEventsQuery({ namespace: 'demo' })).toContain('logmgmt.category:event');
  });
});

describe('network query builders', () => {
  it('scopes workload network traffic through the pod owner relabel join', () => {
    const query = compact(
      networkReceive({ cluster: 'c1', namespace: 'ns1', workload: 'checkout', workloadType: 'deployment' })
    );

    expect(query).toContain('sum by (cluster, namespace, workload, workload_type, pod)');
    expect(query).toContain('namespace_workload_pod:kube_pod_owner:relabel');
    expect(query).toContain('workload=~"checkout"');
    expect(query).toContain('workload_type=~"deployment"');
    expect(query).not.toMatch(/container_network_receive_bytes_total\{[^}]*workload=/);
  });

  it('scopes node network traffic through kube_pod_info instead of raw network labels', () => {
    const query = compact(networkTransmit({ cluster: 'c1', namespace: 'ns1', node: 'node-a' }));

    expect(query).toContain('sum by (cluster, namespace, node, pod)');
    expect(query).toContain('kube_pod_info');
    expect(query).toContain('node=~"node-a"');
    expect(query).not.toMatch(/container_network_transmit_bytes_total\{[^}]*node=/);
  });

  it('adds packet and error panels with the same pod metadata joins', () => {
    const packetsQuery = compact(networkReceivePackets({ cluster: 'c1', namespace: 'ns1', workload: 'checkout' }));
    const errorsQuery = compact(networkErrors({ cluster: 'c1', namespace: 'ns1', node: 'node-a' }));

    expect(packetsQuery).toContain('container_network_receive_packets_total');
    expect(packetsQuery).toContain('namespace_workload_pod:kube_pod_owner:relabel');
    expect(errorsQuery).toContain('container_network_receive_errors_total');
    expect(errorsQuery).toContain('container_network_transmit_errors_total');
    expect(errorsQuery).toContain('kube_pod_info');
  });
});

describe('resource query builders', () => {
  it('scopes workload resource and usage queries through owner relabel joins', () => {
    const requestsQuery = compact(
      cpuRequests({ cluster: 'c1', namespace: 'ns1', workload: 'checkout', workloadType: 'deployment' })
    );
    const usageQuery = compact(
      cpuUsage({ cluster: 'c1', namespace: 'ns1', workload: 'checkout', workloadType: 'deployment' })
    );

    expect(requestsQuery).toContain('sum by (cluster, namespace, workload, workload_type)');
    expect(requestsQuery).toContain('namespace_workload_pod:kube_pod_owner:relabel');
    expect(requestsQuery).toContain('workload=~"checkout"');
    expect(requestsQuery).not.toMatch(/kube_pod_container_resource_requests\{[^}]*workload=/);
    expect(usageQuery).toContain('namespace_workload_pod:kube_pod_owner:relabel');
    expect(usageQuery).not.toMatch(/container_cpu_usage_seconds_total\{[^}]*workload=/);
  });

  it('scopes node usage queries through kube_pod_info and includes OTel label fallback', () => {
    const query = compact(memoryWorkingSet({ cluster: 'c1', namespace: 'ns1', node: 'node-a' }));

    expect(query).toContain('sum by (cluster, namespace, node)');
    expect(query).toContain('kube_pod_info');
    expect(query).toContain('node=~"node-a"');
    expect(query).toContain('k8s_cluster_name');
    expect(query).toContain('k8s_namespace_name');
    expect(query).toContain('container_name!=""');
    expect(query).toContain('k8s_pod_name!=""');
    expect(query).not.toMatch(/container_memory_working_set_bytes\{[^}]*node=/);
  });

  it('uses matching group labels for usage-to-request ratios', () => {
    const query = compact(cpuUsageToRequests({ cluster: 'c1', namespace: 'ns1', pod: 'pod-a' }));

    expect(query).toContain('sum by (cluster, namespace, pod)');
    expect(query).toContain('container_cpu_usage_seconds_total');
    expect(query).toContain('kube_pod_container_resource_requests');
  });

  it('adds capacity, p95, and top-consumer query helpers', () => {
    const capacityQuery = compact(cpuRequestsToCapacity({ cluster: 'c1', namespace: 'ns1' }));
    const p95Query = compact(cpuUsageP95({ cluster: 'c1', namespace: 'ns1' }));
    const topQuery = compact(topCpuConsumers({ cluster: 'c1', namespace: 'ns1' }));

    expect(capacityQuery).toContain('kube_node_status_allocatable');
    expect(capacityQuery).toContain('on (cluster) group_left()');
    expect(p95Query).toContain('quantile_over_time(0.95');
    expect(topQuery).toContain('topk(10');
  });
});

describe('alert query builders', () => {
  it('uses generic alert filters and ALERTS_FOR_STATE fallback', () => {
    const query = compact(alertInventoryQuery({ cluster: 'c1', namespace: 'ns1' }));

    expect(query).toContain('ALERTS_FOR_STATE');
    expect(query).toContain('ALERTS');
    expect(query).toContain('severity=~"${severity:regex}"');
    expect(query).toContain('alertname=~"${alertname:regex}"');
    expect(query).toContain('category=~"${alertCategory:regex}"');
  });
});

describe('search query builders', () => {
  it('uses PromQL raw string literals for regex-interpolated text searches', () => {
    const queries = [
      searchClustersQuery(),
      searchNamespacesQuery(),
      searchWorkloadsQuery(),
      searchPodsQuery(),
      searchNodesQuery(),
      searchContainersQuery(),
    ];

    expect(queries.join(' ')).not.toContain('=~".*${search:regex}.*"');
    for (const query of queries) {
      expect(query).toContain('=~`.*${search:regex}.*`');
    }
  });
});

describe('storage query builders', () => {
  it('scopes pod PVC usage through pod volume metadata', () => {
    const query = compact(scopedPersistentVolumeUsageQuery({ cluster: 'c1', namespace: 'ns1', pod: 'pod-a' }));

    expect(query).toContain('kube_pod_spec_volumes_persistentvolumeclaims_info');
    expect(query).toContain('pod=~"pod-a"');
    expect(query).toContain('kubelet_volume_stats_used_bytes');
    expect(query).not.toMatch(/kubelet_volume_stats_used_bytes\{[^}]*pod=/);
    expect(query).not.toMatch(/kubelet_volume_stats_capacity_bytes\{[^}]*pod=/);
  });

  it('scopes workload PVC and filesystem metrics through owner joins', () => {
    const pvcQuery = compact(
      scopedPersistentVolumeUsageQuery({
        cluster: 'c1',
        namespace: 'ns1',
        workload: 'checkout',
        workloadType: 'deployment',
      })
    );
    const filesystemQuery = compact(
      filesystemReadBytes({ cluster: 'c1', namespace: 'ns1', workload: 'checkout', workloadType: 'deployment' })
    );

    expect(pvcQuery).toContain('sum by (cluster, namespace, workload, workload_type, pod, persistentvolumeclaim)');
    expect(pvcQuery).toContain('namespace_workload_pod:kube_pod_owner:relabel');
    expect(filesystemQuery).toContain('namespace_workload_pod:kube_pod_owner:relabel');
    expect(filesystemQuery).not.toMatch(/container_fs_reads_bytes_total\{[^}]*workload=/);
    expect(filesystemQuery).not.toMatch(/container_fs_reads_bytes_total\{[^}]*workload_type=/);
  });
});

describe('scheduling query builders', () => {
  it('normalizes deployment readiness to workload labels and exposes pod waiting reasons', () => {
    const readinessQuery = compact(deploymentReadiness({ cluster: 'c1', namespace: 'ns1' }));
    const waitingQuery = compact(podWaitingReasons({ cluster: 'c1', namespace: 'ns1' }));

    expect(readinessQuery).toContain('kube_deployment_status_replicas_ready');
    expect(readinessQuery).toContain('"workload_type", "deployment"');
    expect(waitingQuery).toContain('kube_pod_container_status_waiting_reason');
    expect(waitingQuery).toContain('reason!=""');
  });
});

describe('node query builders', () => {
  it('adds kubelet and filesystem specialist panels scoped by node', () => {
    const filesystemQuery = compact(nodeFilesystemUtilization({ cluster: 'c1', node: 'node-a' }));
    const kubeletQuery = compact(kubeletPodStartDurationP95({ cluster: 'c1', node: 'node-a' }));

    expect(filesystemQuery).toContain('node_filesystem_avail_bytes');
    expect(filesystemQuery).toContain('node=~"node-a"');
    expect(kubeletQuery).toContain('kubelet_pod_start_duration_seconds_bucket');
    expect(kubeletQuery).toContain('histogram_quantile');
  });
});

describe('platform networking query builders', () => {
  it('covers OVN and CoreDNS without Loki or Influx dependencies', () => {
    const ovnAvailabilityQuery = compact(ovnDaemonSetAvailability({ cluster: 'c1' }));
    const ovnLatencyQuery = compact(ovnCniRequestLatencyP95({ cluster: 'c1' }));
    const dnsQuery = compact(coreDnsErrorRate({ cluster: 'c1' }));

    expect(ovnAvailabilityQuery).toContain('openshift-ovn-kubernetes|ovn-kubernetes');
    expect(ovnLatencyQuery).toContain('ovnkube_node_cni_request_duration_seconds_bucket');
    expect(dnsQuery).toContain('coredns_dns_responses_total');
    expect(`${ovnAvailabilityQuery} ${ovnLatencyQuery} ${dnsQuery}`).not.toMatch(/loki|influx/i);
  });
});

describe('rqlite query builders', () => {
  it('escapes namespace values in infrastructure SQL', () => {
    const query = namespaceOwnershipQuery("team's-namespace");

    expect(query).toContain("r.infra_key = 'team''s-namespace'");
    expect(query).toContain("r.infra_type = 'ocp_namespace'");
  });

  it('finds related infrastructure by namespace coordinates', () => {
    const query = compact(namespaceInfrastructureQuery('payments-prod'));

    expect(query).toContain('WITH namespace_coordinates AS');
    expect(query).toContain('r.application = n.application');
    expect(query).toContain('r.area = n.area');
    expect(query).toContain('r.tenant = n.tenant');
    expect(query).toContain('r.substage = n.substage');
    expect(query).not.toMatch(/infra_key\s+LIKE/i);
  });
});
