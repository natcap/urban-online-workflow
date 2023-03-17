import React, { useState } from 'react';

import {
  FocusStyleManager,
  Tab,
  Tabs,
} from '@blueprintjs/core';

import ScenarioBuilder from './scenarioBuilder';
import ScenarioTable from './scenarioTable';
import SelectStudyArea from './selectStudyArea';
import StudyAreaForm from './studyAreaForm';
import landuseCodes from '../landuseCodes';


FocusStyleManager.onlyShowFocusOnTabs();

export default function EditMenu(props) {
  const {
    createStudyArea,
    parcelSet,
    selectedParcel,
    removeParcel,
    refreshSavedStudyAreas,
    patternSamplingMode,
    togglePatternSamplingMode,
    patternSampleWKT,
    sessionID,
    activeStudyAreaID,
    switchStudyArea,
    savedStudyAreas,
  } = props;

  const [activeTab, setActiveTab] = useState('create');
  const [scenarioTable, setScenarioTable] = useState(null);

  const addScenarioLULCTable = (table) => {
    setScenarioTable((prev) => {
      const newTable = { ...prev, ...table };
      return newTable;
    });
  };

  const submitStudyArea = async (name) => {
    // Instantiate the 'baseline' scenario now.
    // const baseLulcTable = {};
    // Object.keys(landuseCodes).forEach((code) => {
    //   baseLulcTable[code] = 0;
    //   Object.values(parcelSet).forEach((parcel) => {
    //     baseLulcTable[code] += parcel.table[code] || 0;
    //   });
    // });
    // addScenarioLULCTable({ baseline: baseLulcTable });
    // setStudyAreaName(name);
    createStudyArea(name);
    // const id = await createStudyArea(sessionID, name, parcelSet);
    // setActiveStudyAreaID(id);
    // refreshSavedStudyAreas();
  };

  return (
    <div className="menu-container">
      <Tabs
        id="Tabs"
        onChange={(tabID) => setActiveTab(tabID)}
        selectedTabId={activeTab}
      >
        <Tab
          id="create"
          title="Create"
          panel={(
            <div>
              <SelectStudyArea
                switchStudyArea={switchStudyArea}
                savedStudyAreas={savedStudyAreas}
              />
              <StudyAreaForm
                submitStudyArea={submitStudyArea}
                parcelSet={parcelSet}
                removeParcel={removeParcel}
                // immutableStudyArea={Boolean(activeStudyAreaID)}
                // activeStudyAreaID={activeStudyAreaID}
              />
              <ScenarioBuilder
                createStudyArea={createStudyArea}
                sessionID={sessionID}
                parcelSet={parcelSet}
                removeParcel={removeParcel}
                patternSamplingMode={patternSamplingMode}
                patternSampleWKT={patternSampleWKT}
                togglePatternSamplingMode={togglePatternSamplingMode}
                refreshSavedStudyAreas={refreshSavedStudyAreas}
                activeStudyAreaID={activeStudyAreaID}
                // setActiveStudyAreaID={setActiveStudyAreaID}
                addScenarioLULCTable={addScenarioLULCTable}
              />
            </div>
          )}
        />
        {
          (scenarioTable)
            ? (
              <Tab
                id="explore"
                title="Analyze"
                panel={<ScenarioTable scenarioTable={scenarioTable} />}
              />
            )
            : <div />
        }
      </Tabs>
    </div>
  );
}
