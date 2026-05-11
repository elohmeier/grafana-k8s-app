export const BYTES_PER_GIB = 1024 ** 3;

export type WorkloadType = 'deployment' | 'statefulset';

export type WorkloadContainerValues = {
  name: string;
  cpuRequestCores: number;
  cpuLimitCores: number;
  memoryRequestGiB: number;
  memoryLimitGiB: number;
};

export type WorkloadEditableValues = {
  simulatedReplicas: number;
  containers: WorkloadContainerValues[];
  pvcCount: number;
  pvcStorageGiB: number;
};

export type WorkloadScenarioRow = WorkloadEditableValues & {
  id: string;
  name: string;
  type: WorkloadType;
};

export type WorkloadScenarioState = {
  overrides: Record<string, WorkloadEditableValues>;
  tempRows: WorkloadScenarioRow[];
};

export const DEFAULT_WORKLOAD_SCENARIO: WorkloadScenarioState = {
  overrides: {},
  tempRows: [],
};

export const DEFAULT_WORKLOAD_CONTAINER_VALUES: WorkloadContainerValues = {
  name: 'app',
  cpuRequestCores: 0.5,
  cpuLimitCores: 1,
  memoryRequestGiB: 1,
  memoryLimitGiB: 2,
};

export const DEFAULT_WORKLOAD_VALUES: WorkloadEditableValues = {
  simulatedReplicas: 1,
  containers: [{ ...DEFAULT_WORKLOAD_CONTAINER_VALUES }],
  pvcCount: 0,
  pvcStorageGiB: 0,
};

export type MetricSample = {
  refId: string;
  labels: Record<string, string>;
  value: number;
};

export type ResourceQuotaPair = {
  used?: number;
  hard?: number;
};

export type WorkloadContainerBaseline = {
  name: string;
  currentInstances: number;
  currentCpuRequests: number;
  currentCpuLimits: number;
  currentMemoryRequests: number;
  currentMemoryLimits: number;
};

export type WorkloadBaseline = {
  id: string;
  name: string;
  type: WorkloadType;
  currentReplicas: number;
  currentPods: number;
  currentContainers: number;
  containerBaselines: WorkloadContainerBaseline[];
  currentCpuRequests: number;
  currentCpuLimits: number;
  currentMemoryRequests: number;
  currentMemoryLimits: number;
  currentPvcCount: number;
  currentPvcStorageBytes: number;
};

export type SimulatorBaseline = {
  quotas: Record<string, ResourceQuotaPair>;
  workloads: WorkloadBaseline[];
  clusterAllocatable: Record<string, number>;
};

export type WorkloadSimulationRow = WorkloadBaseline &
  WorkloadEditableValues & {
    isTemporary: boolean;
    changed: boolean;
    isScaledToZero: boolean;
    missingResourceBaseline: boolean;
  };

export type SimulatorRowStatus = 'ok' | 'warning' | 'exceeded' | 'unlimited' | 'unknown';
export type SimulatorRowUnit = 'count' | 'cores' | 'bytes';
export type SimulatorRowSource = 'quota' | 'capacity';

export type SimulatorResultRow = {
  key: string;
  label: string;
  unit: SimulatorRowUnit;
  source: SimulatorRowSource;
  baseline: number;
  delta: number;
  projected: number;
  hard?: number;
  remaining?: number;
  ratio?: number;
  status: SimulatorRowStatus;
};

export type WorkloadDelta = {
  rowId: string;
  pods: number;
  cpuRequests: number;
  cpuLimits: number;
  memoryRequests: number;
  memoryLimits: number;
  pvcCount: number;
  pvcStorage: number;
  deploymentObjects: number;
  statefulSetObjects: number;
};

export type SimulatorResults = {
  rows: SimulatorResultRow[];
  workloadRows: WorkloadSimulationRow[];
  workloadDeltas: Record<string, WorkloadDelta>;
  warnings: string[];
  deltas: Omit<WorkloadDelta, 'rowId'>;
};

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function workloadId(type: WorkloadType, name: string) {
  return `${type}/${name}`;
}

function workloadTypeFromLabel(value?: string): WorkloadType | undefined {
  return value === 'deployment' || value === 'statefulset' ? value : undefined;
}

function ensureWorkload(map: Map<string, WorkloadBaseline>, labels: Record<string, string>) {
  const name = labels.workload;
  const type = workloadTypeFromLabel(labels.workload_type);

  if (!name || !type) {
    return undefined;
  }

  const id = workloadId(type, name);
  let workload = map.get(id);

  if (!workload) {
    workload = {
      id,
      name,
      type,
      currentReplicas: 0,
      currentPods: 0,
      currentContainers: 0,
      containerBaselines: [],
      currentCpuRequests: 0,
      currentCpuLimits: 0,
      currentMemoryRequests: 0,
      currentMemoryLimits: 0,
      currentPvcCount: 0,
      currentPvcStorageBytes: 0,
    };
    map.set(id, workload);
  }

  return workload;
}

function ensureContainer(workload: WorkloadBaseline, name: string) {
  const containerName = name.trim();

  if (!containerName) {
    return undefined;
  }

  let container = workload.containerBaselines.find((candidate) => candidate.name === containerName);

  if (!container) {
    container = {
      name: containerName,
      currentInstances: 0,
      currentCpuRequests: 0,
      currentCpuLimits: 0,
      currentMemoryRequests: 0,
      currentMemoryLimits: 0,
    };
    workload.containerBaselines.push(container);
  }

  return container;
}

export function buildBaseline(samples: MetricSample[]): SimulatorBaseline {
  const quotas: Record<string, ResourceQuotaPair> = {};
  const workloads = new Map<string, WorkloadBaseline>();
  const clusterAllocatable: Record<string, number> = {};

  for (const sample of samples) {
    if (!finite(sample.value)) {
      continue;
    }

    if (sample.refId === 'quota') {
      const resource = sample.labels.resource;
      const type = sample.labels.type;

      if (!resource || (type !== 'used' && type !== 'hard')) {
        continue;
      }

      quotas[resource] = {
        ...quotas[resource],
        [type]: (quotas[resource]?.[type] ?? 0) + sample.value,
      };
      continue;
    }

    if (sample.refId === 'allocatable') {
      const resource = sample.labels.resource;

      if (resource) {
        clusterAllocatable[resource] = (clusterAllocatable[resource] ?? 0) + sample.value;
      }
      continue;
    }

    const workload = ensureWorkload(workloads, sample.labels);

    if (!workload) {
      continue;
    }

    const container = sample.labels.container ? ensureContainer(workload, sample.labels.container) : undefined;

    if (sample.refId === 'workloadReplicas') {
      workload.currentReplicas += sample.value;
    } else if (sample.refId === 'workloadPods') {
      workload.currentPods += sample.value;
    } else if (sample.refId === 'workloadContainers') {
      workload.currentContainers += sample.value;
      if (container) {
        container.currentInstances += sample.value;
      }
    } else if (sample.refId === 'workloadRequests' && sample.labels.resource === 'cpu') {
      workload.currentCpuRequests += sample.value;
      if (container) {
        container.currentCpuRequests += sample.value;
      }
    } else if (sample.refId === 'workloadRequests' && sample.labels.resource === 'memory') {
      workload.currentMemoryRequests += sample.value;
      if (container) {
        container.currentMemoryRequests += sample.value;
      }
    } else if (sample.refId === 'workloadLimits' && sample.labels.resource === 'cpu') {
      workload.currentCpuLimits += sample.value;
      if (container) {
        container.currentCpuLimits += sample.value;
      }
    } else if (sample.refId === 'workloadLimits' && sample.labels.resource === 'memory') {
      workload.currentMemoryLimits += sample.value;
      if (container) {
        container.currentMemoryLimits += sample.value;
      }
    } else if (sample.refId === 'workloadPvcCount') {
      workload.currentPvcCount += sample.value;
    } else if (sample.refId === 'workloadPvcStorage') {
      workload.currentPvcStorageBytes += sample.value;
    }
  }

  const workloadRows = Array.from(workloads.values()).sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));

  for (const workload of workloadRows) {
    workload.containerBaselines.sort((a, b) => a.name.localeCompare(b.name));
  }

  return {
    quotas,
    workloads: workloadRows,
    clusterAllocatable,
  };
}

export function parseScenario(value?: string): WorkloadScenarioState {
  if (!value) {
    return DEFAULT_WORKLOAD_SCENARIO;
  }

  try {
    const parsed = JSON.parse(value) as Partial<WorkloadScenarioState>;
    return normalizeScenario(parsed);
  } catch {
    return DEFAULT_WORKLOAD_SCENARIO;
  }
}

export function serializeScenario(scenario: WorkloadScenarioState) {
  return JSON.stringify(normalizeScenario(scenario));
}

export function normalizeScenario(scenario: Partial<WorkloadScenarioState> = {}): WorkloadScenarioState {
  const overrides: Record<string, WorkloadEditableValues> = {};
  const tempRows: WorkloadScenarioRow[] = [];

  for (const [id, values] of Object.entries(scenario.overrides ?? {})) {
    const normalized = normalizeEditableValues(values);

    if (normalized) {
      overrides[id] = normalized;
    }
  }

  for (const row of scenario.tempRows ?? []) {
    const normalized = normalizeEditableValues(row);
    const type = workloadTypeFromLabel(row.type);

    if (!normalized || !type || !row.id) {
      continue;
    }

    tempRows.push({
      ...normalized,
      id: String(row.id),
      name: String(row.name || row.id),
      type,
    });
  }

  return { overrides, tempRows };
}

function normalizeEditableValues(values?: Partial<WorkloadEditableValues>) {
  if (!values) {
    return undefined;
  }

  return {
    simulatedReplicas: Math.max(0, numberOrDefault(values.simulatedReplicas, 0)),
    containers: normalizeContainers(values.containers),
    pvcCount: Math.max(0, numberOrDefault(values.pvcCount, 0)),
    pvcStorageGiB: Math.max(0, numberOrDefault(values.pvcStorageGiB, 0)),
  };
}

function normalizeContainers(containers: WorkloadEditableValues['containers'] | undefined) {
  if (!Array.isArray(containers)) {
    return defaultContainers();
  }

  const normalized = containers.flatMap((container, index) => {
    if (!container || typeof container !== 'object') {
      return [];
    }

    return [
      {
        name: normalizeContainerName(container.name, index),
        cpuRequestCores: Math.max(0, numberOrDefault(container.cpuRequestCores, 0)),
        cpuLimitCores: Math.max(0, numberOrDefault(container.cpuLimitCores, 0)),
        memoryRequestGiB: Math.max(0, numberOrDefault(container.memoryRequestGiB, 0)),
        memoryLimitGiB: Math.max(0, numberOrDefault(container.memoryLimitGiB, 0)),
      },
    ];
  });

  return normalized.length > 0 ? normalized : defaultContainers();
}

function normalizeContainerName(value: unknown, index: number) {
  const name = typeof value === 'string' ? value.trim() : '';
  return name || `container-${index + 1}`;
}

function numberOrDefault(value: unknown, fallback: number) {
  return finite(value) ? value : fallback;
}

function defaultContainers() {
  return [{ ...DEFAULT_WORKLOAD_CONTAINER_VALUES }];
}

function editableDefaults(workload: WorkloadBaseline): WorkloadEditableValues {
  const replicaBasis = workload.currentReplicas > 0 ? workload.currentReplicas : workload.currentPods;
  const containers =
    workload.containerBaselines.length > 0
      ? workload.containerBaselines.map((container) => ({
          name: container.name,
          cpuRequestCores: replicaBasis > 0 ? container.currentCpuRequests / replicaBasis : 0,
          cpuLimitCores: replicaBasis > 0 ? container.currentCpuLimits / replicaBasis : 0,
          memoryRequestGiB: replicaBasis > 0 ? container.currentMemoryRequests / replicaBasis / BYTES_PER_GIB : 0,
          memoryLimitGiB: replicaBasis > 0 ? container.currentMemoryLimits / replicaBasis / BYTES_PER_GIB : 0,
        }))
      : [
          {
            name: 'container',
            cpuRequestCores: replicaBasis > 0 ? workload.currentCpuRequests / replicaBasis : 0,
            cpuLimitCores: replicaBasis > 0 ? workload.currentCpuLimits / replicaBasis : 0,
            memoryRequestGiB: replicaBasis > 0 ? workload.currentMemoryRequests / replicaBasis / BYTES_PER_GIB : 0,
            memoryLimitGiB: replicaBasis > 0 ? workload.currentMemoryLimits / replicaBasis / BYTES_PER_GIB : 0,
          },
        ];

  return {
    simulatedReplicas: Math.max(0, workload.currentReplicas > 0 ? workload.currentReplicas : workload.currentPods),
    containers,
    pvcCount: workload.currentPvcCount,
    pvcStorageGiB: workload.currentPvcStorageBytes / BYTES_PER_GIB,
  };
}

export function buildWorkloadRows(baseline: SimulatorBaseline, scenario: WorkloadScenarioState): WorkloadSimulationRow[] {
  const rows = baseline.workloads.map((workload) => {
    const defaults = editableDefaults(workload);
    const override = scenario.overrides[workload.id];
    const values = override ?? defaults;
    const isScaledToZero = workload.currentReplicas === 0 && workload.currentPods === 0 && workload.currentContainers === 0;
    const hasResourceBaseline =
      workload.currentCpuRequests > 0 || workload.currentMemoryRequests > 0 || workload.currentCpuLimits > 0 || workload.currentMemoryLimits > 0;

    return {
      ...workload,
      ...values,
      isTemporary: false,
      changed: Boolean(override),
      isScaledToZero,
      missingResourceBaseline: !isScaledToZero && (workload.currentContainers === 0 || !hasResourceBaseline),
    };
  });

  for (const temp of scenario.tempRows) {
    rows.push({
      ...temp,
      currentReplicas: 0,
      currentPods: 0,
      currentContainers: 0,
      containerBaselines: [],
      currentCpuRequests: 0,
      currentCpuLimits: 0,
      currentMemoryRequests: 0,
      currentMemoryLimits: 0,
      currentPvcCount: 0,
      currentPvcStorageBytes: 0,
      isTemporary: true,
      changed: true,
      isScaledToZero: false,
      missingResourceBaseline: false,
    });
  }

  return rows;
}

export function containerResourceTotals(containers: WorkloadContainerValues[]) {
  return containers.reduce(
    (totals, container) => ({
      cpuRequests: totals.cpuRequests + Math.max(0, numberOrDefault(container.cpuRequestCores, 0)),
      cpuLimits: totals.cpuLimits + Math.max(0, numberOrDefault(container.cpuLimitCores, 0)),
      memoryRequests: totals.memoryRequests + Math.max(0, numberOrDefault(container.memoryRequestGiB, 0)),
      memoryLimits: totals.memoryLimits + Math.max(0, numberOrDefault(container.memoryLimitGiB, 0)),
    }),
    {
      cpuRequests: 0,
      cpuLimits: 0,
      memoryRequests: 0,
      memoryLimits: 0,
    }
  );
}

function workloadDelta(row: WorkloadSimulationRow): WorkloadDelta {
  const podTotals = containerResourceTotals(row.containers);
  const currentReplicaBasis = row.currentReplicas > 0 ? row.currentReplicas : row.currentPods;
  const simulatedCpuRequests = row.simulatedReplicas * podTotals.cpuRequests;
  const simulatedCpuLimits = row.simulatedReplicas * podTotals.cpuLimits;
  const simulatedMemoryRequests = row.simulatedReplicas * podTotals.memoryRequests * BYTES_PER_GIB;
  const simulatedMemoryLimits = row.simulatedReplicas * podTotals.memoryLimits * BYTES_PER_GIB;
  const simulatedPvcStorage = row.pvcStorageGiB * BYTES_PER_GIB;

  return {
    rowId: row.id,
    pods: row.simulatedReplicas - currentReplicaBasis,
    cpuRequests: simulatedCpuRequests - row.currentCpuRequests,
    cpuLimits: simulatedCpuLimits - row.currentCpuLimits,
    memoryRequests: simulatedMemoryRequests - row.currentMemoryRequests,
    memoryLimits: simulatedMemoryLimits - row.currentMemoryLimits,
    pvcCount: row.pvcCount - row.currentPvcCount,
    pvcStorage: simulatedPvcStorage - row.currentPvcStorageBytes,
    deploymentObjects: row.isTemporary && row.type === 'deployment' ? 1 : 0,
    statefulSetObjects: row.isTemporary && row.type === 'statefulset' ? 1 : 0,
  };
}

function fallbackTotals(workloads: WorkloadBaseline[]) {
  return workloads.reduce(
    (totals, workload) => ({
      pods: totals.pods + workload.currentReplicas,
      cpuRequests: totals.cpuRequests + workload.currentCpuRequests,
      cpuLimits: totals.cpuLimits + workload.currentCpuLimits,
      memoryRequests: totals.memoryRequests + workload.currentMemoryRequests,
      memoryLimits: totals.memoryLimits + workload.currentMemoryLimits,
      pvcCount: totals.pvcCount + workload.currentPvcCount,
      pvcStorage: totals.pvcStorage + workload.currentPvcStorageBytes,
      deploymentObjects: totals.deploymentObjects + (workload.type === 'deployment' ? 1 : 0),
      statefulSetObjects: totals.statefulSetObjects + (workload.type === 'statefulset' ? 1 : 0),
    }),
    {
      pods: 0,
      cpuRequests: 0,
      cpuLimits: 0,
      memoryRequests: 0,
      memoryLimits: 0,
      pvcCount: 0,
      pvcStorage: 0,
      deploymentObjects: 0,
      statefulSetObjects: 0,
    }
  );
}

function quotaValue(baseline: SimulatorBaseline, resource: string, type: keyof ResourceQuotaPair) {
  const value = baseline.quotas[resource]?.[type];
  return finite(value) ? value : undefined;
}

function quotaBaseline(baseline: SimulatorBaseline, resource: string, fallback: number, secondaryResource?: string) {
  return quotaValue(baseline, resource, 'used') ?? (secondaryResource ? quotaValue(baseline, secondaryResource, 'used') : undefined) ?? fallback;
}

function hardValue(baseline: SimulatorBaseline, ...resources: string[]) {
  for (const resource of resources) {
    const hard = quotaValue(baseline, resource, 'hard');

    if (hard !== undefined) {
      return hard;
    }
  }

  return undefined;
}

function statusFor(projected: number, hard: number | undefined, source: SimulatorRowSource): SimulatorRowStatus {
  if (!finite(hard)) {
    return source === 'quota' ? 'unlimited' : 'unknown';
  }

  if (projected > hard) {
    return 'exceeded';
  }

  if (hard > 0 && projected / hard >= 0.8) {
    return 'warning';
  }

  return 'ok';
}

function resultRow(
  key: string,
  label: string,
  unit: SimulatorRowUnit,
  source: SimulatorRowSource,
  baseline: number,
  delta: number,
  hard?: number
): SimulatorResultRow {
  const projected = Math.max(0, baseline + delta);
  const remaining = finite(hard) ? hard - projected : undefined;
  const ratio = finite(hard) && hard > 0 ? projected / hard : undefined;

  return {
    key,
    label,
    unit,
    source,
    baseline,
    delta,
    projected,
    hard,
    remaining,
    ratio,
    status: statusFor(projected, hard, source),
  };
}

export function calculateSimulatorResults(
  baseline: SimulatorBaseline,
  scenario: WorkloadScenarioState
): SimulatorResults {
  const workloadRows = buildWorkloadRows(baseline, scenario);
  const workloadDeltas = Object.fromEntries(workloadRows.map((row) => [row.id, workloadDelta(row)]));
  const fallback = fallbackTotals(baseline.workloads);
  const deltas = Object.values(workloadDeltas).reduce(
    (totals, delta) => ({
      pods: totals.pods + delta.pods,
      cpuRequests: totals.cpuRequests + delta.cpuRequests,
      cpuLimits: totals.cpuLimits + delta.cpuLimits,
      memoryRequests: totals.memoryRequests + delta.memoryRequests,
      memoryLimits: totals.memoryLimits + delta.memoryLimits,
      pvcCount: totals.pvcCount + delta.pvcCount,
      pvcStorage: totals.pvcStorage + delta.pvcStorage,
      deploymentObjects: totals.deploymentObjects + delta.deploymentObjects,
      statefulSetObjects: totals.statefulSetObjects + delta.statefulSetObjects,
    }),
    {
      pods: 0,
      cpuRequests: 0,
      cpuLimits: 0,
      memoryRequests: 0,
      memoryLimits: 0,
      pvcCount: 0,
      pvcStorage: 0,
      deploymentObjects: 0,
      statefulSetObjects: 0,
    }
  );

  const rows: SimulatorResultRow[] = [
    resultRow(
      'requests.cpu',
      'CPU requests quota',
      'cores',
      'quota',
      quotaBaseline(baseline, 'requests.cpu', fallback.cpuRequests),
      deltas.cpuRequests,
      hardValue(baseline, 'requests.cpu')
    ),
    resultRow(
      'requests.memory',
      'Memory requests quota',
      'bytes',
      'quota',
      quotaBaseline(baseline, 'requests.memory', fallback.memoryRequests),
      deltas.memoryRequests,
      hardValue(baseline, 'requests.memory')
    ),
    resultRow(
      'limits.cpu',
      'CPU limits quota',
      'cores',
      'quota',
      quotaBaseline(baseline, 'limits.cpu', fallback.cpuLimits),
      deltas.cpuLimits,
      hardValue(baseline, 'limits.cpu')
    ),
    resultRow(
      'limits.memory',
      'Memory limits quota',
      'bytes',
      'quota',
      quotaBaseline(baseline, 'limits.memory', fallback.memoryLimits),
      deltas.memoryLimits,
      hardValue(baseline, 'limits.memory')
    ),
    resultRow(
      'requests.storage',
      'Storage requests quota',
      'bytes',
      'quota',
      quotaBaseline(baseline, 'requests.storage', fallback.pvcStorage),
      deltas.pvcStorage,
      hardValue(baseline, 'requests.storage')
    ),
    resultRow(
      'pods',
      'Pods quota',
      'count',
      'quota',
      quotaBaseline(baseline, 'pods', fallback.pods, 'count/pods'),
      deltas.pods,
      hardValue(baseline, 'pods', 'count/pods')
    ),
    resultRow(
      'count/deployments.apps',
      'Deployment objects',
      'count',
      'quota',
      quotaBaseline(baseline, 'count/deployments.apps', fallback.deploymentObjects),
      deltas.deploymentObjects,
      hardValue(baseline, 'count/deployments.apps')
    ),
    resultRow(
      'count/statefulsets.apps',
      'StatefulSet objects',
      'count',
      'quota',
      quotaBaseline(baseline, 'count/statefulsets.apps', fallback.statefulSetObjects),
      deltas.statefulSetObjects,
      hardValue(baseline, 'count/statefulsets.apps')
    ),
    resultRow(
      'count/persistentvolumeclaims',
      'PersistentVolumeClaims',
      'count',
      'quota',
      quotaBaseline(baseline, 'count/persistentvolumeclaims', fallback.pvcCount, 'persistentvolumeclaims'),
      deltas.pvcCount,
      hardValue(baseline, 'count/persistentvolumeclaims', 'persistentvolumeclaims')
    ),
    resultRow(
      'count/configmaps',
      'ConfigMap objects',
      'count',
      'quota',
      quotaBaseline(baseline, 'count/configmaps', 0),
      0,
      hardValue(baseline, 'count/configmaps')
    ),
    resultRow(
      'count/secrets',
      'Secret objects',
      'count',
      'quota',
      quotaBaseline(baseline, 'count/secrets', 0),
      0,
      hardValue(baseline, 'count/secrets')
    ),
    resultRow(
      'cluster.requests.cpu',
      'CPU request cluster share',
      'cores',
      'capacity',
      quotaBaseline(baseline, 'requests.cpu', fallback.cpuRequests),
      deltas.cpuRequests,
      baseline.clusterAllocatable.cpu
    ),
    resultRow(
      'cluster.requests.memory',
      'Memory request cluster share',
      'bytes',
      'capacity',
      quotaBaseline(baseline, 'requests.memory', fallback.memoryRequests),
      deltas.memoryRequests,
      baseline.clusterAllocatable.memory
    ),
    resultRow(
      'cluster.pods',
      'Pod cluster share',
      'count',
      'capacity',
      quotaBaseline(baseline, 'pods', fallback.pods, 'count/pods'),
      deltas.pods,
      baseline.clusterAllocatable.pods
    ),
  ];

  return {
    rows,
    workloadRows,
    workloadDeltas,
    warnings: buildWarnings(rows, workloadRows, baseline),
    deltas,
  };
}

function buildWarnings(rows: SimulatorResultRow[], workloadRows: WorkloadSimulationRow[], baseline: SimulatorBaseline) {
  const warnings: string[] = [];
  const exceeded = rows.filter((row) => row.status === 'exceeded');
  const missingBaselineRows = workloadRows.filter((row) => !row.isTemporary && row.missingResourceBaseline);

  if (exceeded.length > 0) {
    warnings.push(`${exceeded.length} projected resource ${exceeded.length === 1 ? 'limit is' : 'limits are'} exceeded.`);
  }

  if (baseline.quotas.pods?.used === undefined && baseline.quotas['count/pods']?.used === undefined && baseline.workloads.length > 0) {
    warnings.push('Pod baseline is using workload replica metrics because pod quota usage is not available.');
  }

  if (missingBaselineRows.length > 0) {
    warnings.push(`${missingBaselineRows.length} workload ${missingBaselineRows.length === 1 ? 'row has' : 'rows have'} missing resource baselines.`);
  }

  return warnings;
}
