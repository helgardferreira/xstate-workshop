type TextureDirectoryFilenameMap = {
  'environment-map': ['1', '2k' | 'nx' | 'ny' | 'nz' | 'px' | 'py' | 'pz'];
};

export function getTextureUrl<
  TDirectory extends keyof TextureDirectoryFilenameMap,
>(
  directory: TDirectory,
  fileName: TextureDirectoryFilenameMap[TDirectory]
): string {
  if (fileName[1] === '2k') {
    return new URL(
      `../assets/textures/${directory}/${fileName[0]}/${fileName[1]}.hdr`,
      import.meta.url
    ).href;
  }

  return new URL(
    `../assets/textures/${directory}/${fileName[0]}/${fileName[1]}.png`,
    import.meta.url
  ).href;
}
