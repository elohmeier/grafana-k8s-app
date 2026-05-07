function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

export function namespaceOwnershipQuery(namespace: string) {
  const namespaceValue = sqlString(namespace);

  return `
SELECT
  r.infra_key AS "Namespace",
  r.application AS "Application",
  r.area AS "Area",
  r.tenant AS "Tenant",
  r.substage AS "Substage",
  COALESCE(i.name, '') AS "Service",
  COALESCE(i.support_group, '') AS "Support Group",
  COALESCE(i.category, '') AS "Category",
  COALESCE(i.subtype, '') AS "Subtype",
  COALESCE(i.ciid, '') AS "CI ID"
FROM resource r
JOIN coordinates c
  ON r.application = c.application
 AND r.substage = c.substage
 AND r.area = c.area
 AND r.tenant = c.tenant
LEFT JOIN itsm_service i ON c.itsm_service_name = i.name
WHERE r.infra_type = 'ocp_namespace'
  AND r.state = 'present'
  AND r.infra_key = ${namespaceValue}
ORDER BY r.infra_key
`;
}

export function namespaceEgressIpQuery(namespace: string) {
  const namespaceValue = sqlString(namespace);

  return `
SELECT
  r.infra_key AS "Namespace",
  json_extract(r.result, '$.egressip') AS "Egress IP",
  json_extract(r.result, '$.cluster') AS "Cluster",
  r.updated_at AS "Updated"
FROM resource r
WHERE r.infra_type = 'ocp_namespace'
  AND r.state = 'present'
  AND r.infra_key = ${namespaceValue}
  AND json_extract(r.result, '$.egressip') IS NOT NULL
  AND json_extract(r.result, '$.egressip') != ''
ORDER BY r.infra_key
`;
}

export function namespaceInfrastructureQuery(namespace: string) {
  const namespaceValue = sqlString(namespace);

  return `
WITH namespace_coordinates AS (
  SELECT DISTINCT application, area, tenant, substage
  FROM resource
  WHERE infra_type = 'ocp_namespace'
    AND state = 'present'
    AND infra_key = ${namespaceValue}
)
SELECT
  CASE r.infra_type
    WHEN 'virtual_machine' THEN 'VMs'
    WHEN 'dbaas_instance' THEN 'DBaaS'
    WHEN 'ocp_namespace' THEN 'OCP'
    WHEN 'nfs_export' THEN 'NFS'
    WHEN 'rbac_group' THEN 'RBAC'
    WHEN 's3_tenant' THEN 'S3'
    WHEN 'cname_record' THEN 'CNAMEs'
    WHEN 'deployment' THEN 'Deployments'
    WHEN 'host_record' THEN 'Host Records'
    WHEN 'lun' THEN 'LUNs'
    WHEN 'netrules' THEN 'Netrules'
    ELSE r.infra_type
  END AS "Type",
  COUNT(*) AS "Count"
FROM resource r
JOIN namespace_coordinates n
  ON r.application = n.application
 AND r.area = n.area
 AND r.tenant = n.tenant
 AND r.substage = n.substage
WHERE r.state = 'present'
GROUP BY r.infra_type
ORDER BY 1
`;
}
