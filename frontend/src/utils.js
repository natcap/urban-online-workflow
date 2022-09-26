/**
 * The vite dev server serves `/opt/appdata/` at the root `/` path.
 * So filenames beginning with that path need to be adjusted.
 * 
 * @param  {string} filepath 
 * @return {string}
 */
export function publicUrl(filepath) {
	if (filepath.startsWith('/opt/appdata/')) {
    return filepath.replace('/opt/appdata/', 'http://localhost:9000/')
  }
  return filepath;
}
