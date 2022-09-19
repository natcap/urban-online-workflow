import React, { useState } from 'react';

import {
  Button,
  InputGroup,
  HTMLSelect,
  Radio,
  RadioGroup,
} from '@blueprintjs/core';

import useInterval from './hooks/useInterval';
import landuseCodes from './landuseCodes';
import StudyAreaForm from './studyAreaForm';
import WallpaperingMenu from './wallpaperingMenu';
import {
  createStudyArea,
  doWallpaper,
  createScenario,
  getJobResults,
  getJobStatus,
  convertToSingleLULC,
  mulitPolygonCoordsToWKT,
  polygonCoordsToWKT,
} from './requests';

export default function ScenarioBuilder(props) {
  const {
    activeStudyAreaID,
    setActiveStudyAreaID,
    parcelSet,
    sessionID,
    removeParcel,
    patternSamplingMode,
    togglePatternSamplingMode,
    patternSampleWKT,
    refreshSavedStudyAreas,
    addScenarioLULCTable,
  } = props;

  const [singleLULC, setSingleLULC] = useState(Object.keys(landuseCodes)[0]);
  const [conversionOption, setConversionOption] = useState('paint');
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioID, setScenarioID] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [jobID, setJobID] = useState(null);
  const [studyArea, setStudyArea] = useState('');

  useInterval(async () => {
    console.log('checking status for job', jobID);
    const status = await getJobStatus(jobID);
    if (status === 'success') {
      const results = await getJobResults(jobID, scenarioID);
      console.log(results)
      addScenarioLULCTable({ [scenarioName]: results.lulc_stats.result });
      refreshSavedStudyAreas();
      setJobID(null);
    }
  }, (jobID && scenarioID) ? 1000 : null);

  const submitScenario = async (event) => {
    // event.preventDefault();
    if (!scenarioName) {
      alert('no scenario was selected');
      return;
    }
    let currentScenarioID = scenarioID;
    // TODO: add validation to check that scenarioName is not already taken
    // for this study area. If it is, maybe give option to overwrite?
    // TODO: It might be more orthogonal to have the wallpapering/parcel_fill
    // endpoint create the scenario on the backend, rather than creating it up-front.
    currentScenarioID = await createScenario(
      activeStudyAreaID, scenarioName, 'description', conversionOption
    );
    setScenarioID(currentScenarioID);
    let jid;
    if (conversionOption === 'wallpaper' && selectedPattern) {
      console.log('pattern_id', selectedPattern.pattern_id)
      jid = await doWallpaper(
        selectedPattern.pattern_id,
        currentScenarioID
      );
    }
    if (conversionOption === 'paint' && singleLULC) {
      console.log(singleLULC)
      jid = await convertToSingleLULC(
        singleLULC,
        currentScenarioID
      );
    }
    setJobID(jid);
  };

  const submitStudyArea = async (name) => {
    // Instantiate the 'baseline' scenario now.
    const baseLulcTable = {};
    Object.keys(landuseCodes).forEach((code) => {
      baseLulcTable[code] = 0;
      Object.values(parcelSet).forEach((parcel) => {
        baseLulcTable[code] += parcel.table[code] || 0;
      });
    });
    addScenarioLULCTable({ 'baseline': baseLulcTable });

    setStudyArea(name);
    const id = await createStudyArea(sessionID, name, parcelSet);
    setActiveStudyAreaID(id);
    refreshSavedStudyAreas();
  };

  if (!Object.keys(parcelSet).length) {
    return <div />;
  }

  return (
    <>
      <StudyAreaForm
        submitStudyArea={submitStudyArea}
        parcelSet={parcelSet}
        removeParcel={removeParcel}
        studyArea={studyArea}
      />
      {
        (studyArea)
          ? (
            <form>
              <RadioGroup
                className="sidebar-subheading"
                inline
                label="Modify the landuse in this study area:"
                onChange={(event) => setConversionOption(event.target.value)}
                selectedValue={conversionOption}
              >
                <Radio key="wallpaper" value="wallpaper" label="wallpaper" />
                <Radio key="paint" value="paint" label="paint" />
              </RadioGroup>
              <div className="conversion-panel">
                {
                  (conversionOption === 'paint')
                    ? (
                      <HTMLSelect
                        onChange={(event) => setSingleLULC(event.target.value)}
                      >
                        {Object.entries(landuseCodes)
                          .map(([code, data]) => <option key={code} value={code}>{data.name}</option>)}
                      </HTMLSelect>
                    )
                    : (
                      <WallpaperingMenu
                        sessionID={sessionID}
                        selectedPattern={selectedPattern}
                        setSelectedPattern={setSelectedPattern}
                        patternSamplingMode={patternSamplingMode}
                        togglePatternSamplingMode={togglePatternSamplingMode}
                        patternSampleWKT={patternSampleWKT}
                      />
                    )
                }
              </div>
              <p className="sidebar-subheading">
                <span>Save as a new scenario for study area </span>
                <em>{studyArea}</em>
              </p>
              <InputGroup
                placeholder="name this scenario"
                value={scenarioName}
                onChange={(event) => setScenarioName(event.currentTarget.value)}
                rightElement={(
                  <Button
                    onClick={submitScenario}
                  >
                    Save
                  </Button>
                )}
              />
            </form>
          )
          : <div />
      }
    </>
  );
}
