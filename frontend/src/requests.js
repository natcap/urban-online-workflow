import patternsTable from './edit/patternsTable'; // TODO: this is temp

const apiBaseURL = 'http://127.0.0.1:8000';

/**
 * Convert an array of coordinate pairs to WKT representation.
 *
 * @param  {array[array[number]]} coords - an array of two-element arrays
 *  representing [lon, lat] coordinate pairs that outline a polygon
 * @return {string} Well-Known Text representation of the polygon
 */
export function polygonCoordsToWKT(coords) {
  return `POLYGON((${
    coords.map(
      (lonLat) => `${lonLat[0]} ${lonLat[1]}`,
    ).join(', ')
  }))`;
}

/**
 * Convert an array of polygons to WKT representation.
 *
 * @param  {array[array[array[number]]]} polygons - an array of arrays
 *  of two-element arrays representing [lon, lat] coordinate pairs
 *  that outline a polygon
 * @return {string} Well-Known Text representation of the polygon
 */
export function mulitPolygonCoordsToWKT(polygons) {
  return `MULTIPOLYGON(${
    polygons.map(
      (polygon) => `((${polygon.map(
        (lonLat) => `${lonLat[0]} ${lonLat[1]}`,
      ).join(', ')}))`,
    )
  })`;
}

/**
 * Create a new session and return its id.
 *
 * @return {integer} id for the new session
 */
export async function createSession() {
  return (
    window.fetch(`${apiBaseURL}/sessions`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => response.json())
      .then((json) => json.session_id)
      .catch((error) => console.log(error))
  );
}

/**
 * Get an existing session.
 *
 * @return {object}
 */
export async function getSession(sessionID) {
  return (
    window.fetch(`${apiBaseURL}/session/${sessionID}`, {
      method: 'get',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}

/**
 * Get all study areas associated with a given session.
 *
 * @param  {integer} sessionID - id of the session to get study areas for
 * @return {array[object]} array of study area objects
 */
export async function getStudyAreas(sessionID) {
  return (
    window.fetch(`${apiBaseURL}/study_areas/${sessionID}`, {
      method: 'get',
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}

/**
 * Get a study area.
 *
 * @param  {integer} sessionID - id of the session to get study areas for
 * @return {array[object]} array of study area objects
 */
export async function getStudyArea(sessionID, studyAreaID) {
  return (
    window.fetch(`${apiBaseURL}/study_area/${sessionID}/${studyAreaID}`, {
      method: 'get',
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}

/**
 * Create a new study area
 *
 * @return {object} schemas.StudyArea
 */
export async function createStudyArea(sessionID, name) {
  return (
    window.fetch(`${apiBaseURL}/study_area/${sessionID}`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name }),
    })
      .then((response) => response.json())
      .then((json) => json)
      .catch((error) => console.log(error))
  );
}

/**
 * Update a study area.
 *
 * @param {integer} sessionID - id of the session to get study areas for
 * @param {object} studyArea - as defined by schemas.StudyArea
 * @return {array[object]} array of study area objects
 */
export async function updateStudyArea(sessionID, studyArea) {
  return (
    window.fetch(`${apiBaseURL}/study_area/${sessionID}`, {
      method: 'put',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studyArea),
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}

/**
 * Get a scenario from its id.
 *
 * @param  {integer} id - id of the scenario to retrieve
 * @return {object} scenario object
 */
export async function getScenario(id) {
  return (
    window.fetch(`${apiBaseURL}/scenario/${id}`, {
      method: 'get',
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}

/**
 * Create a new scenario.
 *
 * @param  {integer} studyAreaID - id of the active study area
 * @param  {string} name - name to give the new scenario
 * @param  {string} description - description of the new scenario
 * @param  {string} operation - 'wallpaper' or 'parcel_fill'
 * @return {integer} scenario id
 */
export async function createScenario(studyAreaID, name, description, operation) {
  const payload = JSON.stringify({
    name: name,
    description: description,
    operation: operation,
  });
  return (
    window.fetch(`${apiBaseURL}/scenario/${studyAreaID}`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    })
      .then((response) => response.json())
      .then((json) => json.scenario_id)
      .catch((error) => console.log(error))
  );
}

/**
 * Get the status of a job.
 *
 * @param  {integer} jobID - id of the job to check status on
 * @return {string} status (one of 'pending', 'running', success', 'failed')
 */
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

/**
 * Get results of a job if it's succeeded, or its status otherwise.
 *
 * @param  {integer} jobID - id of the job to check
 * @param  {integer} scenarioID - id of the scenario associated with the job
 * @return {object} results object if job has succeeded, otherwise an object
 *  with a 'status' attribute (one of 'pending', 'running', 'failed')
 */
export async function getScenarioResult(jobID, scenarioID) {
  return (
    window.fetch(`${apiBaseURL}/scenario/result/${jobID}/${scenarioID}`, {
      method: 'get',
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}

/**
 * Apply a wallpaper pattern to a given polygon.
 *
 * @param  {integer} patternID - id of the pattern to apply to the area
 * @param  {integer} scenarioID - id of the scenario to associate with this
 *  lulc modification
 * @return {integer} id of the job that will create the modified LULC raster
 */
export async function doWallpaper(patternID, scenarioID) {
  return (
    window.fetch(`${apiBaseURL}/wallpaper`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: scenarioID,
        pattern_id: patternID,
      }),
    })
      .then((response) => response.json())
      .then((json) => json.job_id)
      .catch((error) => console.log(error))
  );
}

/**
 * Fill a given polygon with one LULC class.
 *
 * @param  {integer} lulcCode - code of the LULC class to fill the polygon with
 * @param  {integer} scenarioID - id of the scenario to associate with this
 *  lulc modification
 * @return {integer} id of the job that will create the modified LULC raster
 */
export async function convertToSingleLULC(lulcCode, scenarioID) {
  return (
    window.fetch(`${apiBaseURL}/parcel_fill`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: scenarioID,
        lulc_class: lulcCode,
      }),
    })
      .then((response) => response.json())
      .then((json) => json.job_id)
      .catch((error) => console.log(error))
  );
}

/**
 * Add parcel to a study area.
 *
 * @param  {array[array[number]]} targetCoords - an array of two-element arrays
 *  representing [lon, lat] coordinate pairs outlining the parcel to query
 * @return {[object]} ? - fill in when this endpoint is working
 */
export async function addParcel(sessionID, studyAreaID, parcelID, parcelCoords) {
  console.log(polygonCoordsToWKT(parcelCoords))
  return (
    window.fetch(`${apiBaseURL}/add_parcel`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionID,
        study_area_id: studyAreaID,
        parcel_id: parcelID,
        wkt: polygonCoordsToWKT(parcelCoords),
      }),
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}

/**
 * Remove parcel from a study area.
 *
 * @param  {array[array[number]]} targetCoords - an array of two-element arrays
 *  representing [lon, lat] coordinate pairs outlining the parcel to query
 * @return {[object]} ? - fill in when this endpoint is working
 */
export async function removeParcel(parcelID, studyAreaID) {
  return (
    window.fetch(`${apiBaseURL}/remove_parcel`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parcel_id: parcelID,
        study_area_id: studyAreaID
      }),
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}

/**
 * Get all the available wallpaper patterns.
 *
 * @return {array[object]} array of pattern objects
 */
export async function getPatterns() {
  return (
    window.fetch(`${apiBaseURL}/pattern`, {
      method: 'get',
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
  // return Promise.resolve(patternsTable);
}

/**
 * Create a new pattern from the LULC in a given area.
 *
 * @param  {string} wkt - well known text representation of the polygon
 *  to sample a pattern from
 * @param  {string} label - name to give the pattern
 * @param  {integer} sessionID - id of the session to associate with the
 *  pattern
 * @return {integer} id of the pattern that was created
 */
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
      .catch((error) => console.log(error))
  );
}
