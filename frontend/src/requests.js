const apiBaseURL = 'http://127.0.0.1:8000';

function polygonCoordsToWKT(coords) {
  return `POLYGON((${
    coords.map(
      (lonLat) => `${lonLat[0]} ${lonLat[1]}`,
    ).join(', ')
  }))`;
}

export async function createSession() {
  return (
    window.fetch(`${apiBaseURL}/users`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}

export async function getScenarios(sessionID) {
  return (
    window.fetch(`${apiBaseURL}/scenarios/${sessionID}`, {
      method: 'get',
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}

export async function getScenario(id) {
  return (
    window.fetch(`${apiBaseURL}/scenario/${id}`, {
      method: 'get',
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}

export async function makeScenario(sessionID, name, description) {
  return (
    window.fetch(`${apiBaseURL}/scenario/${sessionID}`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, description: description }),
    })
      .then((response) => response.json())
      .then((json) => json.scenario_id)
      .catch((error) => console.log(error))
  );
}

export async function getJobStatus(jobID) {
  return (
    window.fetch(`${apiBaseURL}/job/${jobID}`, {
      method: 'get',
    })
      .then((response) => response.json())
      .then((json) => json.status)
      .catch((error) => console.log(error))
  );
}

export async function getJobResults(jobID, scenarioID) {
  return (
    window.fetch(`${apiBaseURL}/scenario/result/${jobID}/${scenarioID}`, {
      method: 'get',
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}

export async function doWallpaper(targetCoords, patternID, scenarioID) {
  return (
    window.fetch(`${apiBaseURL}/wallpaper`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: scenarioID,
        target_parcel_wkt: polygonCoordsToWKT(targetCoords),
        pattern_id: patternID,
      }),
    })
      .then((response) => response.json())
      .then((json) => json.job_id)
      .catch((error) => console.log(error))
  );
}

export async function convertToSingleLULC(targetCoords, lulcCode, scenarioID) {
  return (
    window.fetch(`${apiBaseURL}/parcel_fill`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: scenarioID,
        target_parcel_wkt: polygonCoordsToWKT(targetCoords),
        lulc_class: lulcCode,
      }),
    })
      .then((response) => response.json())
      .then((json) => json.job_id)
      .catch((error) => console.log(error))
  );
}

export async function getLulcTableForParcel(parcelCoords) {
  // In general, this table will be built as part of a
  // wallpapering action, but there is the case where we
  // want to see this table for a parcel we select, before
  // doing any wallpapering. The values will come from the
  // baseline LULC.

  // TODO: re-instate this real fetch once the endpoint is ready,
  // https://github.com/natcap/urban-online-workflow/issues/42

  return (
    window.fetch(`${apiBaseURL}/stats_under_parcel`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_parcel_wkt: polygonCoordsToWKT(parcelCoords),
        // stats_id: ?
      }),
    })
      .then((response) => response.json())
      .then((json) => console.log(json))
      .catch((error) => console.log(error))
  );
  // const lulcTable = {
  //   'Developed, Open Space': 24,
  //   'Developed, Low Intensity': 8,
  //   'Shrub/Scrub': 4,
  // };
  // return Promise.resolve(lulcTable);
}

export async function getPatterns() {
  return (
    window.fetch(`${apiBaseURL}/pattern`, {
      method: 'get',
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}

// Return a globally unique ID for the pattern
export async function createPattern(wkt, label, sessionID) {
  return (
    window.fetch(`${apiBaseURL}/pattern/${sessionID}`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: label,
        wkt: wkt,
      }),
    })
      .then((response) => response.json())
      .then((json) => json.pattern_id)
      .catch((error) => console.log(error))
  );
}
