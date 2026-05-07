import React from 'react';
import { AppRootProps } from '@grafana/data';
import { SceneApp, useSceneApp } from '@grafana/scenes';
import { PluginPropsContext } from '../../utils/utils.plugin';
import { alertsPage } from '../../pages/Alerts/alertsPage';
import { clustersPage } from '../../pages/Clusters/clustersPage';
import { configurationPage } from '../../pages/Configuration/configurationPage';
import { healthPage } from '../../pages/Health/healthPage';
import { jobsPage } from '../../pages/Jobs/jobsPage';
import { namespacesPage } from '../../pages/Namespaces/namespacesPage';
import { nodesPage } from '../../pages/Nodes/nodesPage';
import { overviewPage } from '../../pages/Overview/overviewPage';
import { persistentVolumesPage } from '../../pages/PersistentVolumes/persistentVolumesPage';
import { podsPage } from '../../pages/Pods/podsPage';
import { platformPage } from '../../pages/Platform/platformPage';
import { searchPage } from '../../pages/Search/searchPage';
import { workloadsPage } from '../../pages/Workloads/workloadsPage';

function getSceneApp() {
  return new SceneApp({
    pages: [
      overviewPage,
      searchPage,
      healthPage,
      clustersPage,
      namespacesPage,
      workloadsPage,
      podsPage,
      nodesPage,
      persistentVolumesPage,
      jobsPage,
      alertsPage,
      platformPage,
      configurationPage,
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

function App(props: AppRootProps) {
  return (
    <PluginPropsContext.Provider value={props}>
      <AppWithScenes />
    </PluginPropsContext.Provider>
  );
}

export default App;
