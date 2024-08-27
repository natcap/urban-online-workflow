import patternsTable from './edit/patternsTable'; // TODO: this is temp

const apiBaseURL = 'http://127.0.0.1:8000';


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
 * Get all scenarios for a study area.
 *
 * @param  {integer} studyAreaID - id of the study area
 * @return {array} of scenario objects
 */
export async function getScenarios(studyAreaID) {
  return (
    window.fetch(`${apiBaseURL}/scenario/${studyAreaID}`, {
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
export async function createScenario(studyAreaID, name, operation) {
  const payload = JSON.stringify({
    name: name,
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
 * Apply a wallpaper pattern to a given polygon.
 *
 * @param  {integer} patternID - id of the pattern to apply to the area
 * @param  {integer} scenarioID - id of the scenario to associate with this
 *  lulc modification
 * @return {integer} id of the job that will create the modified LULC raster
 */
export async function lulcWallpaper(patternID, scenarioID) {
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
export async function lulcFill(lulcCode, scenarioID) {
  return (
    window.fetch(`${apiBaseURL}/lulc_fill`, {
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
 * Crop the LULC to create a 'baseline' scenario
 *
 * @param  {integer} scenarioID - id of the scenario to associate with this
 *  lulc modification
 * @return {integer} id of the job that will create the modified LULC raster
 */
export async function lulcCrop(scenarioID) {
  return (
    window.fetch(`${apiBaseURL}/lulc_crop/${scenarioID}`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => response.json())
      .then((json) => json.job_id)
      .catch((error) => console.log(error))
  );
}

/**
 * Add parcel to a study area.
 */
export async function addParcel(sessionID, studyAreaID, parcelID, address, wkt) {
  return (
    window.fetch(`${apiBaseURL}/add_parcel`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionID,
        study_area_id: studyAreaID,
        parcel_id: parcelID,
        address: address,
        wkt: wkt,
      }),
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}

/**
 * Remove parcel from a study area.
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

export async function runInvest(scenarioID) {
  return (
    window.fetch(`${apiBaseURL}/invest/${scenarioID}`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}

export async function getInvestResults(scenarioID) {
  return (
    window.fetch(`${apiBaseURL}/invest/result/${scenarioID}`, {
      method: 'get',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}

export async function getNLUDTier2() {
  return (
    window.fetch(`${apiBaseURL}/lucodes/nlud_tier_2`, {
      method: 'get',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}

export async function getNLUDTier3(tier2) {
  return (
    window.fetch(`${apiBaseURL}/lucodes/nlud_tier_3`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nlud_tier_2: tier2,
      }),
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}

export async function getNLCD(tier2, tier3) {
  return (
    window.fetch(`${apiBaseURL}/lucodes/nlcd`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nlud_tier_2: tier2,
        nlud_tier_3: tier3,
      }),
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}

export async function getTreeCover(tier2, tier3, nlcd) {
  return (
    window.fetch(`${apiBaseURL}/lucodes/tree`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nlud_tier_2: tier2,
        nlud_tier_3: tier3,
        nlcd: nlcd,
      }),
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}

export async function getLucode(tier2, tier3, nlcd, tree) {
  return (
    window.fetch(`${apiBaseURL}/lucodes/lucode`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nlud_tier_2: tier2,
        nlud_tier_3: tier3,
        nlcd: nlcd,
        tree: tree,
      }),
    })
      .then((response) => response.json())
      .catch((error) => console.log(error))
  );
}
