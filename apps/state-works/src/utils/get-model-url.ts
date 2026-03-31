type ModelDirectoryFilenameMap = {
  'ceiling-fan': 'gltf';
};

export function getModelUrl<TDirectory extends keyof ModelDirectoryFilenameMap>(
  directory: TDirectory,
  fileName: ModelDirectoryFilenameMap[TDirectory]
): string {
  return new URL(
    `../assets/models/${directory}/${fileName}/${directory}.gltf`,
    import.meta.url
  ).href;
}
