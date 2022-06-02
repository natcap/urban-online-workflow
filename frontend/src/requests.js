/**
 * Get underlying LULC counts from parcel.
 *
 * @param {array} geom - the geometry of the parcel
 * @param {string} scenarioID - a unique ID for the LULC
 * scenario from which to query.
 * @returns {Promise} resolves object
 */
// TODO: not sure if we will make this request using the
// parcelID or with the parcel's geometry. Depends if we have
// a complete parcel DB on the backend.
export async function getLULCTableForParcel(geom, scene) {
  console.log(`Request LULC data for parcel`);
  // TODO: fetch with parcel geometry and scene, which contains
  // a reference to the LULC raster to build table from.
  const lulcTable = {
    forest: 30,
    'medium density': 120,
    grass: 60,
    orchard: '60',
  };
  return Promise.resolve(lulcTable);
}

export async function wallpaper(geom, pattern, scenarioID) {
  console.log(`Wallpaper parcel with ${pattern}`);
  // await requestWallpapering(geom, pattern, scenarioID);
  return getLULCInParcel(geom, scenarioID);
}
