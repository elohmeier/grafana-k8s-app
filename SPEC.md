# Grafana Kubernetes Monitoring App — Reverse-Engineered Spec

**Source**: [play.grafana.org](https://play.grafana.org/a/grafana-k8s-app/home), captured 2026-05-06
**Target**: Reimplementation as a self-hostable Grafana app for non-Cloud installs
**App ID upstream**: `grafana-k8s-app` (mounted at `/a/grafana-k8s-app/`)

This document captures the screens, panels, queries, and data dependencies of
Grafana Cloud's Kubernetes Monitoring app, reverse-engineered by inspecting
its network traffic against the live demo data source `grafanacloud-play-prom`.

Raw capture artifacts are under `research/`:

- `research/screenshots/` — full-page PNGs of every screen and tab.
- `research/snapshots/` — accessibility-tree dumps (text).
- `research/queries/` — extracted PromQL/LogQL queries per screen, with refIds.
- `research/api/` — full HAR network captures.
- `research/metrics_used.txt` — flat list of every metric name observed in queries.

---

## 1. Architecture overview

### 1.1 Mounting & routing

The app is a Grafana plugin (App plugin type) mounted under
`/a/grafana-k8s-app/`. The frontend is a [Grafana Scenes](https://github.com/grafana/scenes)-based
single-page app with client-side routing. Every page is composed of:

- A standard Grafana page header (breadcrumbs, time picker, refresh, datasource picker).
- A scene tree of variables → queries → panels.
- The Grafana side menu auto-injects the app's nav links under "Observability →
  Kubernetes" once the app is enabled.

### 1.2 Data sources

Required (configurable via `var-datasource`):

| Role | Type | Default UID convention |
|------|------|------------------------|
| Metrics | Prometheus / Mimir | user-selected, persisted in `var-datasource` |
| Logs | Loki | inferred from same stack |
| Profiles (optional) | Pyroscope | for Logs+Profiles drilldown |
| Traces (optional) | Tempo | for Logs+Traces drilldown |
| Alerts | Mimir-alertmanager / Alertmanager | for the Alerts page |

Cloud uses uids like `grafanacloud-play-prom` / `grafanacloud-play-logs`. For a
self-hosted port, expose a dropdown for each role and persist via URL var.

### 1.3 URL & variable conventions

Every page accepts these URL params:

```
?from=now-1h&to=now              # time range
&refresh=1m                       # auto-refresh interval
&timezone=utc                     # tz override
&var-datasource=<prom-uid>        # metrics datasource
&var-cluster=<cluster|$__all>     # repeatable
&var-namespace=<ns|$__all>        # repeatable
```

The app filters every PromQL query by `cluster=~"$cluster"` (or by the resolved
list of clusters when `$__all` is used). Drill-down pages embed the entity in
the path itself rather than a variable — see §2.

### 1.4 Top-level navigation (left side menu)

```
Kubernetes
├─ Search
├─ Health
├─ Clusters       /a/grafana-k8s-app/navigation/cluster
├─ Namespaces     /a/grafana-k8s-app/navigation/namespace
├─ Workloads      /a/grafana-k8s-app/navigation/workload
├─ Nodes          /a/grafana-k8s-app/navigation/nodes
├─ All jobs       /a/grafana-k8s-app/navigation/all-jobs
├─ Cost           /a/grafana-k8s-app/cost
├─ Alerts         /a/grafana-k8s-app/alerts
└─ Configuration  /a/grafana-k8s-app/configuration
```

Plus a `home` route at `/a/grafana-k8s-app/home` with overview tiles.

### 1.5 Drill-down URL patterns

```
Cluster:    /navigation/cluster/<cluster>[/<tab>]
Namespace:  /navigation/namespace/<cluster>/<namespace>[/<tab>]
Workload:   /navigation/namespace/<cluster>/<namespace>/<kind>/<name>[/<tab>]
              kind ∈ {deployment, statefulset, daemonset, replicaset, job, cronjob}
Pod:        /navigation/namespace/<cluster>/<namespace>/<kind>/<workload>/<pod>[/<tab>]
Node:       /navigation/nodes/<cluster>/<node>[/<tab>]
```

Detail pages share the same tab strip:
`Overview | CPU | Memory | GPU | Network | Storage | Energy | Logs | Events | Alerts`
(GPU is only present for entities that report `node_gpu_count`/`DCGM_*`; Energy
needs Kepler; Storage shows PV/PVC for cluster scope, container fs for pod scope.)

### 1.6 Time-range semantics

- Most table queries use `last_over_time(...[$__range:])` so the value reflects
  the most recent sample within the selected window — robust to scrape gaps.
- Aggregations across the window use `avg_over_time` / `max_over_time`.
- "Cost" page uses fixed `[1d:]` step regardless of `$__range`, because cost
  is naturally daily.
- "All jobs" uses `[$__range]` (no `:` step) for cumulative success counts.

---

## 2. Screen-by-screen reference

Each screen below lists: route, panel layout, query refIds, key PromQL/LogQL,
and the metrics it depends on. Run the capture script to refresh:
`research/capture.sh <slug> <path>`.

### 2.1 Home — `/home`

A landing dashboard with a marketing hero + an overview SceneFlexLayout.

**Header tile (always-on, hard-coded probes for "is monitoring deployed?"):**
- `count(last_over_time((kube_node_info{cluster!=""})[$__range:]))` — KSM presence
- `topk(1, group(opencost_build_info) OR vector(0))` — OpenCost presence
- `asserts:node:count` — Asserts (Cloud-only) presence
- `count(namespace_workload_pod:kube_pod_owner:relabel{})` — recording rule presence

These four probes recur on **every** page and gate features (e.g. cost panels,
"workload" filtering). Treat them as global and cache the results in app state.

**Stat tiles (instant queries, single value):**

| RefId | Title | Query |
|-------|-------|-------|
| `clusterCount` | Clusters | `count(group by (cluster) (kube_pod_info{pod!="", cluster=~"$cluster", namespace=~".+"}) or group by (cluster) (...k8s_namespace_phase...))` |
| `nodeCount` | Nodes | `count(group by (cluster, node) (kube_pod_info{...} or label_join(...k8s_pod_phase...)))` |
| `namespaceCount` | Namespaces | `count(group by (cluster, namespace) (kube_namespace_status_phase{...} or ...))` |
| `workloadCount` | Workloads | (long expr; sum of replicaset/deployment/daemonset/statefulset/job/cronjob owners) |
| `podCount` | Pods | `count(...)` analogous |
| `containerCount` | Containers | `count(...)` over `kube_pod_container_info` |

**Time-series panels:**

| RefId | Title | Type |
|-------|-------|------|
| `cpuUsageByCluster` | CPU usage by cluster | timeseries (lines, per-cluster) |
| `memoryUsageByCluster` | Memory usage by cluster | timeseries |
| `firingAlerts` | Firing alerts | bar gauge / table |
| `ContainerAlerts` | Container alerts | table |
| `Pod Alerts` | Pod alerts | table |
| `deployedContainerImages` | Deployed container images | table |

Each query is filtered by `cluster=~"<resolved cluster list>"` — i.e. the app
resolves the multi-select before issuing queries.

### 2.2 Search — `/search`

Empty by default; user types a substring and gets results across:
`Clusters | Namespaces | Workloads | Nodes | Pods | Containers`.

| RefId | Query |
|-------|-------|
| `searchClusters` | `topk(100, last_over_time(group by (cluster) (kube_node_info{cluster!="", cluster=~".*<term>.*"})[$__range:]))` |
| `searchNamespaces` | `topk(100, last_over_time(group by (cluster, namespace) (kube_namespace_status_phase{cluster!="", namespace!="", namespace=~".*<term>.*"})[$__range:]))` |
| `searchWorkloads` | `topk(100, group by (cluster, namespace, workload, workload_type) (namespace_workload_pod:kube_pod_owner:relabel{workload=~".*<term>.*"}))` |
| `searchNodes` | `topk(100, group by (cluster, node) (kube_node_info{node=~".*<term>.*"}))` |
| `searchPods` | `topk(100, topk by (cluster, namespace, pod) (1, last_over_time((group by (cluster, namespace, workload, workload_type, pod) (namespace_workload_pod:kube_pod_owner:relabel{pod=~".*<term>.*"}))[$__range:])))` |
| `searchContainers` | `topk(100, group by (cluster, namespace, pod, container) (kube_pod_container_info{container=~".*<term>.*"}))` |

Implementation note: substitute `<term>` server-side; debounce client-side
typing; render results in 6 collapsible groups with click-through to the
respective entity detail page.

### 2.3 Health — `/health`

A single dashboard with sections of "what's broken right now". Each section
is a table sorted by severity, fed by an instant query.

| RefId | Section | Query (filtered by `$cluster`) |
|-------|---------|-------|
| `nodesNotReady` | Nodes not ready | `max by (cluster, node, status) (kube_node_status_condition{condition="Ready", status=~"false\|unknown"} == 1)` |
| `nodePressure` | Node pressure | `max by (cluster, node, condition) (kube_node_status_condition{condition=~"MemoryPressure\|DiskPressure\|PIDPressure", status="true"} == 1)` |
| `zeroReplicas` | Workloads with 0 replicas | `(kube_deployment_status_replicas_available == 0) and on(...) (kube_deployment_spec_replicas > 0)` |
| `rolloutIssues` | Rollout issues | `kube_deployment_status_condition{condition=~"Progressing\|ReplicaFailure", status="false"\|"true"} == 1` |
| `notReadyPods` | Pods not ready | `kube_pod_status_ready{condition="false"} == 1 AND kube_pod_status_phase{phase=~"Running"}` |
| `crashLoop` | Crash-looping containers | `round(increase(kube_pod_container_status_restarts_total[$__range])) > 2` |
| `oomKilled` | OOM-killed containers | `kube_pod_container_status_last_terminated_reason{reason="OOMKilled"} == 1` |
| `pendingPods` | Pending pods | `kube_pod_status_phase{phase="Pending"} == 1` |
| `imagePullBackOff` | Image pull failures | `kube_pod_container_status_waiting_reason{reason=~"ImagePullBackOff\|ErrImagePull"} == 1` |
| `evictedPods` | Evicted pods | `kube_pod_status_reason{reason="Evicted"} == 1` |
| `unknownPods` | Pods in Unknown phase | `kube_pod_status_phase{phase="Unknown"} == 1` |

All workload-level results are joined back to `namespace_workload_pod:kube_pod_owner:relabel`
to enrich the row with `workload`/`workload_type` labels for click-through links.

### 2.4 Clusters list — `/navigation/cluster`

**UI controls:** Usage / Cost radio toggle • Cluster multi-select • Resource-usage
buckets (low / med / high / unknown) • table.

**Table columns:** CLUSTER, PROVIDER, NODES, CPU AVG, CPU AVG %, CPU MAX, CPU
MAX %, MEM AVG, MEM AVG %, MEM MAX, MEM MAX %, ALERTS.

**Query refIds → columns:**

| RefId | Used for column(s) | Query (abbrev) |
|-------|-----|-------|
| `info` | CLUSTER, PROVIDER, NODES (provider_id parsed) | `sum by (asserts_env, asserts_site, cluster, provider_id) (last_over_time((sum by (...) (label_replace(max by (...) (kube_node_info{cluster=~"$cluster"}), "provider_id", "$1", "provider_id", "([^:]+)://.*")))[$__range:]))` |
| `alerts` | ALERTS badge | `count by (cluster) (ALERTS{alertname=~"(Kube.*\|CPUThrottlingHigh)", alertstate="firing", cluster=~"$cluster"} or GRAFANA_ALERTS{...})` |
| `cpu_usage_avg` | CPU AVG | see "CPU usage formula" below |
| `cpu_usage_max` | CPU MAX | `max_over_time(<cpu usage>[$__range:])` |
| `cpu_usage_avg_percent` | CPU AVG % | `<cpu usage>` ÷ `sum(kube_node_status_capacity{resource="cpu"})` |
| `cpu_usage_max_percent` | CPU MAX % | `max_over_time(...)` ÷ capacity |
| `mem_usage_avg/max[/_percent]` | MEM ... | analogous, see "Memory usage formula" below |

**CPU usage formula (canonical):**

```promql
sum by (cluster) (
  label_join(
    sum by (cluster, instance) (
      max by (cluster, instance, cpu, core) (
        1 - rate(node_cpu_seconds_total{cluster=~"$cluster", mode="idle"}[$__rate_interval]) >= 0
      )
    )
    OR
    max by (cluster, instance) (
      rate(node_cpu_usage_seconds_total{cluster=~"$cluster"}[$__rate_interval]) >= 0
    )
    OR
    label_join(label_join(label_join(
      max by (k8s_cluster_name, k8s_node_name) (
        rate(k8s_node_cpu_time_seconds_total{k8s_cluster_name=~"$cluster"}[$__rate_interval])
      ),
      "cluster", ",", "k8s_cluster_name"),
      "instance", ",", "k8s_node_name"),
      "node", ",", "k8s_node_name"
    ),
    "node", ",", "instance"
  )
)
```

The `OR` chain handles three exporter dialects:
1. **node_exporter** (`node_cpu_seconds_total{mode="idle"}` → busy = 1 − idle).
2. **OpenTelemetry kubeletstatsreceiver** (`node_cpu_usage_seconds_total`).
3. **OpenTelemetry k8s receiver** (`k8s_node_cpu_time_seconds_total`, with
   relabels from `k8s_*` to `cluster/node/instance`).

A reimplementation should ship this triple-fallback as a first-class helper
function, parameterized by the cluster filter.

**Memory usage formula:**

```promql
sum by (cluster) (
  label_join(
    max by (cluster, instance) (node_memory_Active_file_bytes{cluster=~"$cluster"})
    + on (cluster, instance) group_left
    max by (cluster, instance) (node_memory_AnonPages_bytes{cluster=~"$cluster"})
    OR
    max by (cluster, instance) (node_memory_working_set_bytes{cluster=~"$cluster"}),
    "node", ",", "instance"
  )
)
```

(Capacity divisor uses `kube_node_status_capacity{resource="memory"}`.)

The "Cost" toggle replaces every value column with cost-derived fields fed
by OpenCost; see §2.10.

### 2.5 Cluster detail — `/navigation/cluster/<cluster>[/<tab>]`

**Header:** cluster name, time picker, RCA Workbench / Insights buttons,
"Copy name" action.

**Tabs:** Overview | CPU | Memory | GPU | Network | Storage | Energy | Logs | Events | Alerts

#### 2.5.1 Overview tab

| Section / RefId | Description | Query (abbrev) |
|------|-------------|-------|
| `info` | "Cluster information" key/value (provider, node count, k8s version, kernel, OS, runtime) | `kube_node_info` aggregated to one row, with `provider_id` parsed |
| `Cluster CPU` panel | Stacked timeseries: capacity vs sum of limits vs sum of requests vs actual usage | 4 series: `cpuCapacity` `cpuLimits` `cpuRequests` `cpuUsage` |
| `Cluster memory` panel | Same shape, memory | 4 series |
| `cpuRequestsSet` etc. | "X / Y containers have CPU requests set" — uses `kube_pod_container_resource_requests` over `kube_pod_container_info` | 4 ratio stats |
| `cpuLimitsSet` / `memoryRequestsSet` / `memoryLimitsSet` | same | |
| `CPU cost allocation` | Stacked area cost over time | OpenCost: `node_cpu_hourly_cost` × allocation share |
| `Memory cost allocation` | same for RAM | |
| `Total cost (compute)` | stat | sum |
| `CPU idle cost` / `Memory idle cost` / `Total idle cost (compute)` | stat | (capacity − allocation) × hourly rate |
| `alerts` | Firing alerts count badge | `ALERTS{cluster=...}` |
| `Nodes` table | Node list with low/med/high usage filters | reuses cluster-level CPU/MEM formulas, scoped to node |

Capacity / requests / limits expressions:

```promql
# capacity
sum by (cluster) (max by (cluster, node, resource) (kube_node_status_capacity{cluster=~"$cluster", resource="cpu"}))

# requests (recording rule: namespace_cpu:kube_pod_container_resource_requests:sum)
sum(namespace_cpu:kube_pod_container_resource_requests:sum{cluster=~"$cluster"})

# limits  (recording rule: namespace_cpu:kube_pod_container_resource_limits:sum)
sum(namespace_cpu:kube_pod_container_resource_limits:sum{cluster=~"$cluster"})
```

#### 2.5.2 CPU tab

A deep-dive scene with five panel groups, all keyed by the same set of refIds.
Two columns of timeseries plus alignment / efficiency analyses.

Panel refIds (in capture order):

- `usage`, `requests`, `limits`, `capacity`, `agg`, `aggPercent` — primary
  timeseries (usage vs request/limit/capacity, plus aggregate %).
- `timeline` — state timeline of throttling events.
- `overviewUsageByNamespace` — stacked bar by namespace.
- `distributionNamespaceUsageClusterCapacityStacked` — namespace usage as
  fraction of cluster capacity, stacked.
- `distributionNodeUsageClusterCapacityStacked` — same per node.
- `efficiencyUsageRequestsP95`, `efficiencyUsageCapacityP95`,
  `efficiencyRequestsCapacityP95`, `efficiencyNodeUsageNodeCapacity` —
  P95-based efficiency stats (used for "right-sizing" scoring).
- `alignmentNamespaceRequests` — namespace requests vs cluster requests.
- `alerts`, `Anno` — alert overlay annotations.

The Memory tab mirrors this exactly with memory metrics; reuse a single
parameterized scene.

#### 2.5.3 GPU tab — only renders if `node_gpu_count{cluster=~$cluster} > 0`

RefIds: `clusterGpuUtilization`, `gpuPower`, `gpuTemperature`,
`tensorCoreUtilization`, `decoderUtilization`, `encoderUtilization`,
`utilizationGpu`, `utilizationDecoder`, `utilizationEncoder`,
`utilizationTensorCore`. Source: NVIDIA `DCGM_*` metrics (also referenced
as `dcgm_*` in some queries for older versions).

#### 2.5.4 Network tab

RefIds: `rx`, `tx`, `rx_dropped`, `tx_dropped`, plus `Anno` for annotations.

```promql
# rx (per cluster)
sum by (cluster) (rate(node_network_receive_bytes_total{cluster=~"$cluster"}[$__rate_interval]))
# tx
sum by (cluster) (rate(node_network_transmit_bytes_total{cluster=~"$cluster"}[$__rate_interval]))
# rx_dropped / tx_dropped
sum by (cluster) (rate(node_network_receive_drop_total{cluster=~"$cluster"}[$__rate_interval]))
```

For Windows nodes there's a fallback OR over `windows_net_bytes_received_total`
/ `windows_net_bytes_sent_total` / `windows_container_network_*_dropped_total`.

#### 2.5.5 Storage tab

PV/PVC scope:

- `pvStatus` — count by `kube_persistentvolume_status_phase`.
- `pvStatusCritical` — `phase!=Bound` with `critical/warning` severity coloring (`critical`, `warning`, `orange`, `purpleWithOpacity`, `blueWithOpacity`, `blueWithoutOpacity` are panel-style refIds).
- `pvcStatusTimeseries`, `pvcStorageClassTimeseries` — over time.
- IOPS and throughput per direction & per type:
  `read-iops`, `write-iops`, `read-throughput`, `write-throughput`,
  `readByType-iops`, `writeByType-iops`, `readByType-throughput`,
  `writeByType-throughput`.

Source metrics: `container_fs_reads_total`, `container_fs_writes_total`,
`container_fs_reads_bytes_total`, `container_fs_writes_bytes_total`
(cAdvisor); plus `kube_persistentvolume_status_phase`,
`kube_persistentvolumeclaim_status_phase`,
`kube_persistentvolumeclaim_resource_requests_storage_bytes`,
`kube_persistentvolumeclaim_info`.

#### 2.5.6 Energy tab — only renders if Kepler is installed

RefIds: `package`, `dram`, `gpu`, `other`, `total`, `energyUsageByNamespace`,
`energyUsageByNode`. Source: `kepler_container_*_joules_total`.

```promql
sum by (cluster) (rate(kepler_container_package_joules_total{cluster=~"$cluster"}[$__rate_interval]))
```

#### 2.5.7 Logs tab

LogQL via Loki:

```logql
{cluster=~"$cluster", job!~"integrations/kubernetes/eventhandler|infra-monitoring/eventrouter"}
| logfmt | json | drop __error__,__error_details__
```

There's a parallel OTel form using `k8s_cluster_name` and `service_name`
labels (same shape, different label names).

#### 2.5.8 Events tab

Same Loki source filtered to the eventhandler stream:

```logql
{cluster=~"$cluster", job=~"integrations/kubernetes/eventhandler|infra-monitoring/eventrouter"}
| logfmt | json | drop __error__,__error_details__
```

#### 2.5.9 Alerts tab

Tables grouped by scope:

- `ClusterAlerts` — `ALERTS{... namespace="" ...}`
- `NamespaceAlerts` — `ALERTS{... pod="", daemonset="", deployment="", statefulset="", job_name="" ... }`
- `NodeAlerts` — `ALERTS{... node!="" ...}`

All `OR`'d with `GRAFANA_ALERTS` (Grafana-managed alerts source) for hybrid setups.

### 2.6 Namespaces list — `/navigation/namespace`

Same shape as Clusters list, scoped to namespace. Adds an "asserts" health
column when Asserts is detected.

| RefId | Purpose |
|-------|---------|
| `infoNamespace` | namespace + cluster identity |
| `cpu_usage_*` `mem_usage_*` | same 8 metrics as Clusters page |
| `alerts` | alert count per (cluster, namespace) |
| `asserts` | Asserts health rollup (Cloud-only) |

Click → namespace detail.

### 2.7 Namespace detail — `/navigation/namespace/<cluster>/<namespace>[/<tab>]`

Tabs: Overview | CPU | Memory | Network | Storage | Energy | Logs | Events
(no GPU and no Alerts tab at namespace scope).

Overview adds two unique panels not present at cluster scope:

- `WorkloadsDesiredPods` — desired vs `WorkloadsReadyPods` ready pod count
  per workload, fed by `kube_*_spec_replicas` / `kube_*_status_replicas_ready`
  unioned across all controller types.
- `cpuAllocation` / `memAllocation` — uses the recording rules
  `namespace_cpu:kube_pod_container_resource_requests:sum` etc.

### 2.8 Workloads list — `/navigation/workload`

Same column shape as Namespaces, with a `workload_type` column.
Sourced from `namespace_workload_pod:kube_pod_owner:relabel` (a recording
rule that joins all controller types into one normalized series).

### 2.9 Workload detail — `/navigation/namespace/<cluster>/<ns>/<kind>/<name>[/<tab>]`

Adds `Pod count` panel (replicas timeseries from `kube_*_status_replicas_ready`)
and "Pods" table at the bottom for drill-down. Otherwise tab structure mirrors
namespace detail.

### 2.10 Pod detail — `<workload-detail-path>/<pod-name>[/<tab>]`

Same tab strip as workload. Containers section lists per-container CPU/mem
limits/requests vs usage (sourced from `container_cpu_usage_seconds_total`,
`container_memory_working_set_bytes`, `kube_pod_container_resource_requests`,
`kube_pod_container_resource_limits`).

`infoWaiting` panel surfaces `kube_pod_container_status_waiting_reason` to
explain crash-looping pods.

### 2.11 Nodes list — `/navigation/nodes`

Node-equivalent of Clusters list. Same 8 usage refIds, plus `info` (provider,
kernel, kubelet version, OS image) and `alerts` count.

### 2.12 Node detail — `/navigation/nodes/<cluster>/<node>[/<tab>]`

Same tab strip as cluster detail (Overview/CPU/Memory/GPU/Network/Storage/
Energy/Logs/Events/Alerts). Adds:

- "Node labels" key/value section from `kube_node_labels`.
- Pods table at the bottom with `kube_pod_info{node="$node"}`.

### 2.13 All jobs — `/navigation/all-jobs`

Lists CronJobs (and one-shot Jobs) across selected clusters.

| RefId | Column | Query |
|-------|--------|-------|
| `exists` | name + schedule | `max by (cluster, namespace, cronjob, join_name, schedule) (label_join(label_join(kube_cronjob_info{cluster=~"$cluster"}, "workload", "", "cronjob"), "join_name", "-", "cluster", "namespace", "workload"))` |
| `last_success` | Last success | `max by (...) (kube_cronjob_status_last_successful_time{cronjob!=""}) * 1000` |
| `last_schedule` | Last scheduled | `max by (...) (kube_cronjob_status_last_schedule_time{cronjob!=""}) * 1000` |
| `next_schedule` | Next scheduled | `max by (...) (kube_cronjob_next_schedule_time) * 1000` |
| `status` | Suspended? | `max by (...) (kube_cronjob_spec_suspend)` |

`join_name` is constructed via `label_join` so the same row can be
addressed across queries. The `*1000` converts seconds to ms for Grafana's
time-cell renderer.

### 2.14 Cost — `/cost` and `/cost/savings`

Two tabs: **Overview** and **Savings**.

**Overview** panels (require OpenCost):

| RefId | Purpose |
|-------|---------|
| `cost` | Total $ per cluster — `sum by (cluster) (avg_over_time(node_total_hourly_cost[1d:]) * 24)` |
| `cpuCost` | CPU $ — capacity × `node_cpu_hourly_cost` |
| `memoryCost` | RAM $ — capacity × `node_ram_hourly_cost` |
| `storageCost` | Storage $ — `pod_pvc_allocation` × storage rate |
| `gpuCost` | GPU $ — `node_gpu_count` × `node_gpu_hourly_cost` |
| `networkCost` | Network $ |
| `provider` | Group by `provider_id` |
| `totalCostCurrent30d` / `totalCostPrior30d` / `percentChange` | 30-day comparison |
| `avgCostPerPod` | total ÷ avg pod count |
| `avgPodCount` | `count(... kube_pod_info ...)` over range |
| `potentialSavings` | a long expression mixing limits/requests vs actual usage to estimate over-provisioning $ |
| `percentage` | percentage breakdown |

**Savings** panels: cost vs savings opportunity per resource:

- `cpuCost` / `cpuSavings`
- `memoryCost` / `memorySavings`
- `storageCost` / `storageSavings`
- `gpuCost` / `gpuSavings`

Savings = the difference between current cost and what the cost would be at
the P95 actual usage instead of allocated capacity.

Recommended impl: keep the cost page behind an OpenCost-detected feature flag.

### 2.15 Alerts — `/alerts`

Filter row: cluster / namespace / node / severity / alertname multi-selects.

Panels:

- `Firing alerts by cluster` — bar by cluster.
- `Firing alerts by namespace` — bar by namespace.
- `alertsTable` — full alert list:

  ```promql
  ALERTS{namespace="", alertname=~"(Kube.*|CPUThrottlingHigh)", alertstate="firing", cluster=~"$cluster", node=~"$node", severity=~"$severity"}
  OR GRAFANA_ALERTS{...}
  OR ALERTS{pod="", daemonset="", deployment="", statefulset="", job_name="", ... namespace=~"$namespace"}
  OR GRAFANA_ALERTS{...}
  OR <node-scoped>
  OR <pod-scoped>
  ```

  (5 disjuncts to capture cluster/namespace/node/pod/workload-scoped alerts.)

Series labels include `severity` for color, and click-through deep links into
the alertname's matching dashboard.

### 2.16 Configuration — `/configuration`

Five tabs: **Cluster configuration | Metrics status | Integrations | Cardinality | Manage app**.

#### Cluster configuration tab
Wizard with 4 steps (1. Stack and platform → 2. Monitoring type → 3. Backend
and token → 4. Deployment) that generates the `k8s-monitoring` Helm values to
deploy Grafana Alloy + KSM + node-exporter + OpenCost into the user's cluster.
For a self-hosted port, replace this with a static "what you need to install"
panel pointing at upstream Helm charts.

#### Metrics status tab — **most important for porting**

This tab introspects each monitoring component by querying for its build-info
metric. Each panel reports green/red. The reimplementation needs **all** of
these metrics to be emitted by the corresponding exporter.

| Component | Detection query | Required exporter |
|-----------|-----------------|-------------------|
| `k8s-monitoring-helm chart` | `grafana_kubernetes_monitoring_build_info{cluster=~"$cluster"}` | k8s-monitoring Helm chart self-metric |
| `Grafana Alloy` | `agent_build_info OR alloy_build_info` | Alloy/old Agent collector |
| `Node Exporter` | `node_exporter_build_info` | prometheus/node_exporter |
| `Windows Exporter` | `windows_exporter_build_info` | prometheus-community/windows_exporter |
| `Kube State Metrics (KSM)` | `count by (cluster, node) (kube_node_info)` OR `count by (...) (kube_pod_container_info{container!="POD", container!=""})` | kube-state-metrics |
| `KSM Job Label` | `1 - absent(kube_pod_owner{job!=""})` | KSM scraped with a `job` label |
| `Workload Recording Rule` | `1 - absent(namespace_workload_pod:kube_pod_owner:relabel)` | Prometheus rule (see §3.3) |
| `Opencost` | `count by (cluster, version) (opencost_build_info)` | opencost/opencost |
| `Kepler` | `count by (cluster, instance) (kepler_exporter_build_info)` | sustainable-computing-io/kepler |
| `cAdvisor` | `count by (cluster, instance) (machine_memory_bytes)` | kubelet's built-in cAdvisor |
| `Kubelet` | `count by (cluster, instance) (kubernetes_build_info)` | kubelet `/metrics` |
| `Pod Logs` | `sum(count_over_time({cluster=~"$cluster", job!~"integrations/kubernetes/eventhandler|infra-monitoring/eventrouter"} | logfmt | json | drop __error__,__error_details__[$__range]))` | Alloy / Promtail / OTel collector pushing pod logs to Loki |
| `Cluster Events` | `sum(count_over_time({cluster=~"$cluster", job=~"integrations/kubernetes/eventhandler|infra-monitoring/eventrouter"} | logfmt | json | drop __error__,__error_details__[$__range]))` | Event handler component (Alloy `loki.source.kubernetes_events` or eventrouter) |
| OTel variants of the above | same with `k8s_cluster_name` / `service_name` labels | OpenTelemetry collectors as alternatives |

#### Integrations tab
Lists Grafana Cloud integrations relevant to k8s (etcd, coredns, …). Skip
for self-host or replace with links to upstream docs.

#### Cardinality tab
Reports per-metric series count using a Cloud-only datasource
(`grafanacloud-cardinality-management`). For self-host, build it on
Mimir's `/api/v1/cardinality/*` endpoints if you want parity.

#### Manage app tab
Standard Grafana plugin enable/disable controls.

---

## 3. Required telemetry stack

To reproduce the app's data plane on a non-Cloud Grafana, deploy:

### 3.1 Core (mandatory)

1. **kube-state-metrics** — emits `kube_*` series. Required for nearly every
   page. Must be scraped with a `job` label so the `KSM Job Label` check
   passes (the wizard uses `job` to namespace alerts).
2. **node_exporter** (one DaemonSet pod per Linux node) — emits `node_*` series.
3. **cAdvisor** (built into kubelet) — emits `container_*` and `machine_*`.
4. **Kubelet `/metrics`** — emits `kubernetes_build_info` plus the
   `k8s_*` OTel-style metrics if you scrape via the OTel collector.
5. **Prometheus / Mimir** — scrapes everything. Needs the recording rules
   in §3.3 — without them, the workloads list and many cluster-detail panels
   will be empty even though the underlying KSM data is present.
6. **Loki** — pod logs pushed via Promtail or Alloy
   (`loki.source.kubernetes`) for the Logs tabs.
7. **Alertmanager** — for the Alerts page (`ALERTS` series come from
   Prometheus alerts evaluated against KSM rules).

### 3.2 Optional add-ons

| Want this UI feature | Install |
|---------------------|---------|
| Cost tab | OpenCost (`opencost_*`, `node_total_hourly_cost`, etc.) |
| Energy tab | Kepler (`kepler_*`) |
| GPU tab | NVIDIA DCGM exporter (`DCGM_*` / `dcgm_*`) |
| Windows nodes | windows_exporter (`windows_*`) |
| Cluster Events tab | Alloy `loki.source.kubernetes_events` OR k8s eventrouter shipping to Loki |
| OTel-native deployments | Use `k8s_cluster_name`, `k8s_node_name`, `k8s_pod_name`, `k8s_namespace_name`, `service_name` labels — every query has a parallel OTel form |

### 3.3 Recording rules (mandatory for workload pages)

The app depends on these recording rules emitting in Prometheus:

```yaml
- record: namespace_workload_pod:kube_pod_owner:relabel
  # See kube-prometheus or prometheus-community/kube-prometheus-stack for the
  # canonical definition. Joins kube_pod_owner across deployment/statefulset/
  # daemonset/job/cronjob/replicaset to a single per-pod row with stable
  # `workload` and `workload_type` labels.

- record: namespace_cpu:kube_pod_container_resource_requests:sum
- record: namespace_cpu:kube_pod_container_resource_limits:sum
- record: namespace_memory:kube_pod_container_resource_requests:sum
- record: namespace_memory:kube_pod_container_resource_limits:sum
- record: node_namespace_pod_container:container_cpu_usage_seconds_total:sum_rate5m
- record: node_namespace_pod_container:container_memory_working_set_bytes
```

All of these come standard with [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus)
mixin output. Reuse that as-is.

### 3.4 Required label conventions

Every metric **must** carry a `cluster` label (configured at scrape time via
`external_labels` or relabel). The app keys every query off `cluster=~"..."`.

For OpenTelemetry-only setups, the parallel form uses `k8s_cluster_name`,
which is `label_join`'d back to `cluster` inside each query. If you hit one
of these: `k8s_cluster_name`, `k8s_node_name`, `k8s_pod_name`,
`k8s_namespace_name`, `service_name` — make sure they are emitted by your
OTel collector with stable values.

---

## 4. Reimplementation guide

### 4.1 Plugin scaffolding

Use Grafana's [App plugin template](https://github.com/grafana/grafana-plugin-examples/tree/main/examples/app-basic)
with [@grafana/scenes](https://github.com/grafana/scenes) for the page
trees. Plugin ID: pick something like `<org>-k8s-app`.

`plugin.json`:

```jsonc
{
  "type": "app",
  "name": "Kubernetes",
  "id": "<org>-k8s-app",
  "includes": [
    { "type": "page", "name": "Home", "path": "/a/<org>-k8s-app/home", "addToNav": true, "defaultNav": true },
    { "type": "page", "name": "Search", "path": "/a/<org>-k8s-app/search", "addToNav": true },
    { "type": "page", "name": "Health", "path": "/a/<org>-k8s-app/health", "addToNav": true },
    { "type": "page", "name": "Clusters", "path": "/a/<org>-k8s-app/navigation/cluster", "addToNav": true },
    { "type": "page", "name": "Namespaces", "path": "/a/<org>-k8s-app/navigation/namespace", "addToNav": true },
    { "type": "page", "name": "Workloads", "path": "/a/<org>-k8s-app/navigation/workload", "addToNav": true },
    { "type": "page", "name": "Nodes", "path": "/a/<org>-k8s-app/navigation/nodes", "addToNav": true },
    { "type": "page", "name": "All jobs", "path": "/a/<org>-k8s-app/navigation/all-jobs", "addToNav": true },
    { "type": "page", "name": "Cost", "path": "/a/<org>-k8s-app/cost", "addToNav": true },
    { "type": "page", "name": "Alerts", "path": "/a/<org>-k8s-app/alerts", "addToNav": true },
    { "type": "page", "name": "Configuration", "path": "/a/<org>-k8s-app/configuration", "addToNav": true }
  ],
  "dependencies": {
    "grafanaDependency": ">=10.4.0",
    "plugins": []
  }
}
```

### 4.2 Recommended source layout

```
src/
  AppPlugin.tsx
  pages/
    Home/
    Search/
    Health/
    Cluster/{List,Detail/{Overview,CPU,Memory,GPU,Network,Storage,Energy,Logs,Events,Alerts}}
    Namespace/{List,Detail/...}
    Workload/{List,Detail/...}
    Node/{List,Detail/...}
    Pod/Detail/...
    AllJobs/
    Cost/{Overview,Savings}
    Alerts/
    Configuration/{Cluster,MetricsStatus,Integrations,Cardinality,Manage}
  scenes/
    queries/             # PromQL builders, parameterized by cluster/ns/workload
    panels/              # Reusable timeseries / table / stat scenes
    variables/           # cluster, namespace, workload, datasource pickers
    detection/           # The 4 universal "is monitoring deployed" probes
```

### 4.3 Query module recommendations

Build a single `queries.ts` that exports query factories like:

```ts
export const cpuUsageBy = (scope: "cluster" | "node" | "namespace" | "workload" | "pod", filter: string) => `
  sum by (${groupByFor(scope)}) (
    label_join(
      sum by (${groupByFor(scope)}, instance) (
        max by (${groupByFor(scope)}, instance, cpu, core) (
          1 - rate(node_cpu_seconds_total{${filter}, mode="idle"}[$__rate_interval]) >= 0
        )
      )
      OR
      max by (${groupByFor(scope)}, instance) (
        rate(node_cpu_usage_seconds_total{${filter}}[$__rate_interval]) >= 0
      )
      OR
      label_join(label_join(label_join(
        max by (k8s_cluster_name, k8s_node_name) (
          rate(k8s_node_cpu_time_seconds_total{${filterOTel(filter)}}[$__rate_interval])
        ), "cluster", ",", "k8s_cluster_name"),
        "instance", ",", "k8s_node_name"),
        "node", ",", "k8s_node_name"
      ),
      "node", ",", "instance"
    )
  )
`;
```

This way every page can compose `cpuUsageBy("cluster", clusterFilter)` etc.
and you avoid 100+ copies of the same triple-fallback expression.

### 4.4 Universal "feature detection" hook

Move the 4 universal probes from §2.1 into a top-level React provider that
fires once per session:

```ts
type Capabilities = {
  ksmPresent: boolean;
  openCostPresent: boolean;
  assertsPresent: boolean;       // Cloud-only — likely false self-hosted
  workloadRulePresent: boolean;
  keplerPresent: boolean;
  dcgmPresent: boolean;
};
```

Gate Cost / Energy / GPU tabs on these and hide them if absent.

### 4.5 Things to drop or stub for self-host

- **RCA Workbench, Asserts, Insights, Predict CPU/Memory** — Grafana
  Cloud-only ML services. The buttons render disabled in OSS Grafana already;
  just remove them.
- **"Sign up for Grafana Cloud" alert banner** — drop.
- **Grafana Cloud "Cardinality management" datasource** — replace with
  Mimir's cardinality API or remove the tab.
- **`asserts:node:count`, `asserts_env`, `asserts_site`, `GRAFANA_ALERTS`
  series** — these are Grafana-specific. Replace with `up` /
  `count(node_exporter_build_info)` / drop label, and replace
  `GRAFANA_ALERTS` with just `ALERTS`.

### 4.6 Out-of-the-box demo deployment

Ship a Helm chart or Kustomize bundle that installs:

- kube-prometheus-stack (KSM + Prometheus + Grafana + Alertmanager + node-exporter + the recording rules from §3.3)
- Loki + Promtail
- (optional) OpenCost, Kepler, DCGM exporter
- The plugin itself, via Grafana's plugins config

so users can `helm install` and immediately see populated screens.

---

## 5. Open questions / further work

- **Drilldown buttons** ("Logs drilldown", "Events drilldown", "Pred. CPU"):
  these all link to other Grafana apps (Drilldown app, ML app). Decide
  whether to integrate with those upstream apps or stub the buttons.
- **Annotations**: every timeseries panel has `Anno` query refs that overlay
  cluster events / deploys. Map these to Grafana's annotations API or to
  Loki event queries.
- **Column-level table filters** on the lists: Grafana's table viz supports
  per-column filters out of the box; capture the exact filter operators
  (eq, ge, contains) used by the upstream app from screenshots.
- **Mobile/responsive**: not investigated — upstream renders desktop-first.

---

## 6. Capture index

Every screen captured in this analysis:

| Slug | Route |
|------|-------|
| `home_loaded` | `/home` |
| `search` | `/search` |
| `health` | `/health` |
| `03_clusters` | `/navigation/cluster` |
| `cluster_detail` | `/navigation/cluster/<cluster>` (Overview) |
| `cluster_cpu` | `…/cpu` |
| `cluster_memory` | `…/memory` |
| `cluster_gpu` | `…/gpu` |
| `cluster_network` | `…/network` |
| `cluster_storage` | `…/storage` |
| `cluster_energy` | `…/energy` |
| `cluster_logs` | `…/logs` |
| `cluster_events` | `…/events` |
| `cluster_alerts` | `…/alerts` |
| `namespace` | `/navigation/namespace` |
| `namespace_detail` | `/navigation/namespace/<cluster>/<ns>` |
| `workload` | `/navigation/workload` |
| `workload_detail` | `/navigation/namespace/<cluster>/<ns>/<kind>/<name>` |
| `pod_detail` | `…/<pod>` |
| `nodes` | `/navigation/nodes` |
| `node_detail` | `/navigation/nodes/<cluster>/<node>` |
| `all-jobs` | `/navigation/all-jobs` |
| `cost` | `/cost` |
| `cost_savings` | `/cost/savings` |
| `alerts` | `/alerts` |
| `configuration` | `/configuration` |
| `configuration_metrics` | `/configuration/metrics-status` |
