type ModelDirectoryFilenameMap = {
  car: 'gltf';
  'ceiling-fan': 'gltf';
  duck: 'gltf' | 'gltf-binary' | 'gltf-draco' | 'gltf-embedded';
  'flight-helmet': 'gltf';
  fox: 'gltf' | 'gltf-binary' | 'gltf-embedded';
  hamburger: 'gltf-binary';
};

export function getModelUrl<TDirectory extends keyof ModelDirectoryFilenameMap>(
  directory: TDirectory,
  fileName: ModelDirectoryFilenameMap[TDirectory]
): string {
  switch (
    fileName as ModelDirectoryFilenameMap[keyof ModelDirectoryFilenameMap]
  ) {
    case 'gltf':
    case 'gltf-draco':
    case 'gltf-embedded': {
      return new URL(
        `../assets/models/${directory}/${fileName}/${directory}.gltf`,
        import.meta.url
      ).href;
    }
    case 'gltf-binary': {
      return new URL(
        `../assets/models/${directory}/${fileName}/${directory}.glb`,
        import.meta.url
      ).href;
    }
  }
}
