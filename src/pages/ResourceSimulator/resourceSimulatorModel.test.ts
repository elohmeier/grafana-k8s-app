import {
  buildBaseline,
  BYTES_PER_GIB,
  calculateSimulatorResults,
  containerResourceTotals,
  MetricSample,
  parseScenario,
  serializeScenario,
  WorkloadContainerValues,
  WorkloadEditableValues,
  WorkloadScenarioState,
} from './resourceSimulatorModel';

function sample(refId: string, labels: Record<string, string>, value: number): MetricSample {
  return { refId, labels, value };
}

const deploymentLabels = { workload: 'api', workload_type: 'deployment' };
const statefulSetLabels = { workload: 'db', workload_type: 'statefulset' };

function scenario(overrides: WorkloadScenarioState['overrides'] = {}, tempRows: WorkloadScenarioState['tempRows'] = []) {
  return JSON.parse(serializeScenario({ overrides, tempRows })) as WorkloadScenarioState;
}

function container(name: string, values: Partial<WorkloadContainerValues> = {}): WorkloadContainerValues {
  return {
    name,
    cpuRequestCores: 0,
    cpuLimitCores: 0,
    memoryRequestGiB: 0,
    memoryLimitGiB: 0,
    ...values,
  };
}

function workloadValues(values: Partial<WorkloadEditableValues> = {}): WorkloadEditableValues {
  return {
    simulatedReplicas: 1,
    containers: [container('app')],
    pvcCount: 0,
    pvcStorageGiB: 0,
    ...values,
  };
}

describe('resource simulator model', () => {
  it('builds workload baselines and derives editable per-container resources', () => {
    const baseline = buildBaseline([
      sample('quota', { resource: 'pods', type: 'used' }, 22),
      sample('quota', { resource: 'pods', type: 'hard' }, 50),
      sample('workloadReplicas', deploymentLabels, 3),
      sample('workloadPods', deploymentLabels, 3),
      sample('workloadContainers', { ...deploymentLabels, container: 'app' }, 3),
      sample('workloadContainers', { ...deploymentLabels, container: 'sidecar' }, 3),
      sample('workloadRequests', { ...deploymentLabels, container: 'app', resource: 'cpu' }, 1.5),
      sample('workloadRequests', { ...deploymentLabels, container: 'sidecar', resource: 'cpu' }, 1.5),
      sample('workloadRequests', { ...deploymentLabels, container: 'app', resource: 'memory' }, 3 * BYTES_PER_GIB),
      sample('workloadRequests', { ...deploymentLabels, container: 'sidecar', resource: 'memory' }, 3 * BYTES_PER_GIB),
    ]);
    const results = calculateSimulatorResults(baseline, scenario());
    const workload = results.workloadRows.find((row) => row.id === 'deployment/api');
    const pods = results.rows.find((row) => row.key === 'pods');
    const podTotals = workload ? containerResourceTotals(workload.containers) : undefined;

    expect(workload?.simulatedReplicas).toBe(3);
    expect(workload?.currentContainers).toBe(6);
    expect(workload?.containerBaselines.map((container) => container.name)).toEqual(['app', 'sidecar']);
    expect(workload?.containers).toEqual([
      container('app', { cpuRequestCores: 0.5, memoryRequestGiB: 1 }),
      container('sidecar', { cpuRequestCores: 0.5, memoryRequestGiB: 1 }),
    ]);
    expect(podTotals?.cpuRequests).toBe(1);
    expect(podTotals?.memoryRequests).toBe(2);
    expect(pods?.baseline).toBe(22);
    expect(pods?.hard).toBe(50);
  });

  it('models scaling existing Deployments and StatefulSets up and down', () => {
    const baseline = buildBaseline([
      sample('quota', { resource: 'pods', type: 'used' }, 10),
      sample('quota', { resource: 'pods', type: 'hard' }, 20),
      sample('workloadReplicas', deploymentLabels, 4),
      sample('workloadPods', deploymentLabels, 4),
      sample('workloadContainers', { ...deploymentLabels, container: 'app' }, 4),
      sample('workloadRequests', { ...deploymentLabels, container: 'app', resource: 'cpu' }, 2),
      sample('workloadReplicas', statefulSetLabels, 3),
      sample('workloadPods', statefulSetLabels, 3),
      sample('workloadContainers', { ...statefulSetLabels, container: 'app' }, 3),
      sample('workloadRequests', { ...statefulSetLabels, container: 'app', resource: 'cpu' }, 3),
    ]);
    const results = calculateSimulatorResults(
      baseline,
      scenario({
        'deployment/api': workloadValues({
          simulatedReplicas: 6,
          containers: [container('app', { cpuRequestCores: 0.5 })],
        }),
        'statefulset/db': workloadValues({
          simulatedReplicas: 1,
          containers: [container('app', { cpuRequestCores: 1 })],
        }),
      })
    );

    expect(results.deltas.pods).toBe(0);
    expect(results.deltas.cpuRequests).toBe(-1);
    expect(results.rows.find((row) => row.key === 'pods')?.projected).toBe(10);
  });

  it('sums edited per-container resources into pod totals', () => {
    const baseline = buildBaseline([
      sample('workloadReplicas', deploymentLabels, 2),
      sample('workloadPods', deploymentLabels, 2),
      sample('workloadContainers', { ...deploymentLabels, container: 'app' }, 2),
      sample('workloadRequests', { ...deploymentLabels, container: 'app', resource: 'cpu' }, 1),
      sample('workloadRequests', { ...deploymentLabels, container: 'app', resource: 'memory' }, 2 * BYTES_PER_GIB),
    ]);
    const results = calculateSimulatorResults(
      baseline,
      scenario({
        'deployment/api': workloadValues({
          simulatedReplicas: 3,
          containers: [
            container('app', { cpuRequestCores: 0.5, memoryRequestGiB: 1 }),
            container('sidecar', { cpuRequestCores: 0.25, memoryRequestGiB: 0.5 }),
          ],
        }),
      })
    );

    expect(results.deltas.pods).toBe(1);
    expect(results.deltas.cpuRequests).toBe(1.25);
    expect(results.deltas.memoryRequests).toBe(2.5 * BYTES_PER_GIB);
  });

  it('models PVC expansion on existing workloads', () => {
    const baseline = buildBaseline([
      sample('quota', { resource: 'requests.storage', type: 'used' }, 100 * BYTES_PER_GIB),
      sample('quota', { resource: 'requests.storage', type: 'hard' }, 200 * BYTES_PER_GIB),
      sample('workloadReplicas', statefulSetLabels, 1),
      sample('workloadPvcCount', statefulSetLabels, 2),
      sample('workloadPvcStorage', statefulSetLabels, 80 * BYTES_PER_GIB),
    ]);
    const results = calculateSimulatorResults(
      baseline,
      scenario({
        'statefulset/db': workloadValues({
          simulatedReplicas: 1,
          pvcCount: 2,
          pvcStorageGiB: 120,
        }),
      })
    );

    expect(results.deltas.pvcCount).toBe(0);
    expect(results.deltas.pvcStorage).toBe(40 * BYTES_PER_GIB);
    expect(results.rows.find((row) => row.key === 'requests.storage')?.projected).toBe(140 * BYTES_PER_GIB);
  });

  it('models temporary workload rows as additive objects', () => {
    const baseline = buildBaseline([
      sample('quota', { resource: 'count/statefulsets.apps', type: 'used' }, 1),
      sample('quota', { resource: 'count/statefulsets.apps', type: 'hard' }, 5),
    ]);
    const results = calculateSimulatorResults(
      baseline,
      scenario({}, [
        {
          ...workloadValues({
            simulatedReplicas: 3,
            containers: [container('app', { cpuRequestCores: 1, memoryRequestGiB: 2 })],
            pvcCount: 3,
            pvcStorageGiB: 30,
          }),
          id: 'temp-1',
          name: 'load-test',
          type: 'statefulset',
        },
      ])
    );

    expect(results.deltas.statefulSetObjects).toBe(1);
    expect(results.deltas.pods).toBe(3);
    expect(results.deltas.cpuRequests).toBe(3);
    expect(results.deltas.memoryRequests).toBe(6 * BYTES_PER_GIB);
    expect(results.deltas.pvcCount).toBe(3);
    expect(results.deltas.pvcStorage).toBe(30 * BYTES_PER_GIB);
    expect(results.rows.find((row) => row.key === 'count/statefulsets.apps')?.projected).toBe(2);
  });

  it('marks exceeded and unknown hard limits', () => {
    const baseline = buildBaseline([
      sample('quota', { resource: 'requests.cpu', type: 'used' }, 9),
      sample('quota', { resource: 'requests.cpu', type: 'hard' }, 10),
    ]);
    const results = calculateSimulatorResults(
      baseline,
      scenario({}, [
        {
          ...workloadValues({
            simulatedReplicas: 4,
            containers: [container('app', { cpuRequestCores: 1 })],
          }),
          id: 'temp-1',
          name: 'load-test',
          type: 'deployment',
        },
      ])
    );

    expect(results.rows.find((row) => row.key === 'requests.cpu')?.status).toBe('exceeded');
    expect(results.rows.find((row) => row.key === 'requests.memory')?.status).toBe('unknown');
  });

  it('normalizes malformed URL scenario state', () => {
    expect(parseScenario('not json')).toEqual({ overrides: {}, tempRows: [] });

    const parsed = parseScenario(
      JSON.stringify({
        overrides: {
          'deployment/api': {
            simulatedReplicas: 2,
            containers: [
              {
                name: ' app ',
                cpuRequestCores: -1,
                cpuLimitCores: 2,
                memoryRequestGiB: 1,
                memoryLimitGiB: 3,
              },
            ],
            pvcCount: -2,
            pvcStorageGiB: 10,
          },
        },
        tempRows: [
          {
            id: 'temp-1',
            name: '',
            type: 'deployment',
            simulatedReplicas: 1,
            containers: [
              {
                name: 'worker',
                cpuRequestCores: 0.25,
                cpuLimitCores: 0.5,
                memoryRequestGiB: 1,
                memoryLimitGiB: 2,
              },
            ],
            pvcCount: 0,
            pvcStorageGiB: 0,
          },
          {
            id: 'temp-2',
            type: 'job',
            simulatedReplicas: 1,
          },
        ],
      })
    );

    expect(parsed.overrides['deployment/api']).toMatchObject({
      containers: [container('app', { cpuRequestCores: 0, cpuLimitCores: 2, memoryRequestGiB: 1, memoryLimitGiB: 3 })],
      pvcCount: 0,
    });
    expect(parsed.tempRows).toHaveLength(1);
    expect(parsed.tempRows[0]).toMatchObject({
      id: 'temp-1',
      name: 'temp-1',
      type: 'deployment',
      containers: [container('worker', { cpuRequestCores: 0.25, cpuLimitCores: 0.5, memoryRequestGiB: 1, memoryLimitGiB: 2 })],
    });
  });
});
