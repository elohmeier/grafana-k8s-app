import React from 'react';
import { AppRootProps } from '@grafana/data';
import { SceneApp, useSceneApp } from '@grafana/scenes';
import { PluginPropsContext } from '../../utils/utils.plugin';
import { setAppJsonData, type AppJsonData } from '../../utils/appJsonData';
import { getAlertsPage } from '../../pages/Alerts/alertsPage';
import { getClustersPage } from '../../pages/Clusters/clustersPage';
import { getConfigurationPage } from '../../pages/Configuration/configurationPage';
import { getCostCapacityPage } from '../../pages/CostCapacity/costCapacityPage';
import { getHealthPage } from '../../pages/Health/healthPage';
import { getJobsPage } from '../../pages/Jobs/jobsPage';
import { getNamespacesPage } from '../../pages/Namespaces/namespacesPage';
import { getNodesPage } from '../../pages/Nodes/nodesPage';
import { getOverviewPage } from '../../pages/Overview/overviewPage';
import { getPersistentVolumesPage } from '../../pages/PersistentVolumes/persistentVolumesPage';
import { getPlatformPage } from '../../pages/Platform/platformPage';
import { getPodsPage } from '../../pages/Pods/podsPage';
import { getSearchPage } from '../../pages/Search/searchPage';
import { getWorkloadsPage } from '../../pages/Workloads/workloadsPage';

function getSceneApp() {
  return new SceneApp({
    pages: [
      getOverviewPage(),
      getSearchPage(),
      getHealthPage(),
      getClustersPage(),
      getNamespacesPage(),
      getWorkloadsPage(),
      getPodsPage(),
      getNodesPage(),
      getPersistentVolumesPage(),
      getJobsPage(),
      getAlertsPage(),
      getCostCapacityPage(),
      getPlatformPage(),
      getConfigurationPage(),
    ],
    urlSyncOptions: {
      updateUrlOnInit: true,
      createBrowserHistorySteps: true,
    },
  });
}

function AppWithScenes() {
  const scene = useSceneApp(getSceneApp);

  return <scene.Component model={scene} />;
}

function App(props: AppRootProps<AppJsonData>) {
  setAppJsonData(props.meta.jsonData);
  return (
    <PluginPropsContext.Provider value={props}>
      <AppWithScenes />
    </PluginPropsContext.Provider>
  );
}

export default App;
