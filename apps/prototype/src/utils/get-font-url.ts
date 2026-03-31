export function getFontUrl(fileName: 'Roboto') {
  return new URL(`../assets/fonts/${fileName}.json`, import.meta.url).href;
}
