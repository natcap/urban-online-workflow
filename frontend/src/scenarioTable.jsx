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
  doWallpaper,
  makeScenario,
  getJobResults,
  getJobStatus,
  convertToSingleLULC,
  mulitPolygonCoordsToWKT,
  polygonCoordsToWKT,
} from './requests';

export default function ScenarioTable(props) {
  const {
    parcelSet,
    sessionID,
    removeParcel,
    patternSamplingMode,
    togglePatternSamplingMode,
    refreshSavedScenarios,
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
      // setParcelTable(results);
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
    // if it is, maybe give option to overwrite the scenario? though that
    // is only okay if the new scenario fits in the same portfolio as the one
    // being overwritten. Also, maybe okay to have scenarios with the same name,
    // if they are in different portfolios. Need user to create a portfolio?
    currentScenarioID = await makeScenario(sessionID, scenarioName, 'description');
    setScenarioID(currentScenarioID);
    let jid;
    const parcelWkt = (Object.keys(parcelSet).length > 1)
      ? mulitPolygonCoordsToWKT(
        Object.values(parcelSet).map((parcel) => parcel.coords),
      )
      : polygonCoordsToWKT(Object.values(parcelSet)[0].coords);
    if (conversionOption === 'wallpaper' && selectedPattern) {
      jid = await doWallpaper(
        parcelWkt,
        selectedPattern.pattern_id,
        currentScenarioID
      );
    }
    if (conversionOption === 'paint' && singleLULC) {
      jid = await convertToSingleLULC(
        parcelWkt,
        singleLULC,
        currentScenarioID
      );
    }
    setJobID(jid);
    refreshSavedScenarios();
  };

  const submitStudyArea = (name) => {
    setStudyArea(name);
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
                      />
                    )
                }
              </div>
              <p className="sidebar-subheading">
                {`Save as a new scenario for study area ${studyArea}`}
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

{/*<datalist id="scenariolist">
  {Object.values(savedScenarios).map(
    (scenario) => (
      <option
        key={scenario.scenario_id}
        value={scenario.name} />
      ),
    )
  }
</datalist>*/}