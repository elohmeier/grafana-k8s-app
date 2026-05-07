import { CLUSTER_CONTROLS, full, pageScene } from '../../scenes/common';
import { tablePanel, textPanel } from '../../scenes/panels';

export function platformScene() {
  return pageScene(
    [
      full(
        textPanel(
          'Platform Operations backlog',
          [
            'Specialist pages will consolidate control plane/API performance, etcd, OVN, ingress, CoreDNS, Prometheus, remote-write, Alertmanager, Vector/logging, ArgoCD, Kyverno, cert-manager, KEDA, Trident, install plans, managed upgrades, compliance, and security views.',
            '',
            'This page starts with Prometheus-backed health summaries and keeps deep panels out of the default application-team flow.',
          ].join('\n')
        ),
        200
      ),
      full(
        tablePanel(
          'ArgoCD applications by health and sync status',
          'count by (cluster, namespace, health_status, sync_status) (argocd_app_info{cluster=~"${cluster:regex}"})'
        ),
        300
      ),
      full(
        tablePanel(
          'Cert-manager certificate readiness',
          'count by (cluster, namespace, condition, status) (certmanager_certificate_ready_status{cluster=~"${cluster:regex}"})'
        ),
        300
      ),
    ],
    'now-1h',
    [],
    CLUSTER_CONTROLS
  );
}
