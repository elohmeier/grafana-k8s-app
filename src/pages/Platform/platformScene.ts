import { CLUSTER_CONTROLS, full, item, pageScene, row } from '../../scenes/common';
import { tablePanel, warningStatPanel } from '../../scenes/panels';

export function platformScene() {
  return pageScene(
    [
      row(
        [
          item(
            warningStatPanel(
              'Unhealthy ArgoCD apps',
              'count(argocd_app_info{cluster=~"${cluster:regex}", health_status!~"Healthy|Progressing"})'
            ),
            '33%',
            150
          ),
          item(
            warningStatPanel(
              'Out-of-sync ArgoCD apps',
              'count(argocd_app_info{cluster=~"${cluster:regex}", sync_status!="Synced"})'
            ),
            '33%',
            150
          ),
          item(
            warningStatPanel(
              'Certificates not ready',
              'count(certmanager_certificate_ready_status{cluster=~"${cluster:regex}", condition="Ready", status!="True"})'
            ),
            '34%',
            150
          ),
        ],
        180
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
