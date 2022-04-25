/**
 * Get the list of invest model names that can be passed to getSpec.
 *
 * @returns {Promise} resolves object
 */
export async function getParcelInfo(parcelID) {
  console.log(`Request parcel info for parcel ${parcelID} from the server`);
  return Promise.resolve('foo');
}
