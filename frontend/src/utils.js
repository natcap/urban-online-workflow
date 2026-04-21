/**
 * The vite dev server serves `/opt/appdata/` at the root `/` path.
 * So filenames beginning with that path need to be adjusted.
 *
 * @param  {string} filepath
 * @return {string}
 */
export function publicUrl(filepath) {
  let apiBaseURL;
  if (import.meta.env.VITE_URBANONLINE_DEVMODE === 'true') {
    apiBaseURL = 'http://localhost/9000/';
  } else {
    apiBaseURL = 'https://urbanonline.naturalcapitalproject.org/9000/';
  }
  if (filepath.startsWith('/opt/appdata/')) {
    return filepath.replace('/opt/appdata/', apiBaseURL)
  }
  return filepath;
}

/**
 * convert counts of pixels to acres
 */
export function toAcres(count) {
  if (!parseInt(count)) {
    return '';
  }
  const acres = (count * 30 * 30) / 4047; // square-meters to acres
  return acres.toFixed(1);
}
