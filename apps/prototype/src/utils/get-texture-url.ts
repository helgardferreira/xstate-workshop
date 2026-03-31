type TextureDirectoryFilenameMap = {
  'castle-brick-broken':
    | 'castle-brick-broken-arm'
    | 'castle-brick-broken-diff'
    | 'castle-brick-broken-nor-gl';
  checkerboard: 'checkerboard-1024x1024' | 'checkerboard-8x8';
  'coast-sand-rocks':
    | 'coast-sand-rocks-arm'
    | 'coast-sand-rocks-diff'
    | 'coast-sand-rocks-disp'
    | 'coast-sand-rocks-nor-gl';
  'cobblestone-floor':
    | 'cobblestone-floor-arm'
    | 'cobblestone-floor-diff'
    | 'cobblestone-floor-disp'
    | 'cobblestone-floor-nor-gl';
  door:
    | 'alpha'
    | 'ambient-occlusion'
    | 'color'
    | 'height'
    | 'metalness'
    | 'normal'
    | 'roughness';
  'environment-map':
    | 'nvidia-canvas-4k'
    | ['0', 'nx' | 'ny' | 'nz' | 'px' | 'py' | 'pz']
    | ['1', '2k' | 'nx' | 'ny' | 'nz' | 'px' | 'py' | 'pz']
    | ['2', 'nx' | 'ny' | 'nz' | 'px' | 'py' | 'pz']
    | ['3', 'nx' | 'ny' | 'nz' | 'px' | 'py' | 'pz']
    | ['4', 'nx' | 'ny' | 'nz' | 'px' | 'py' | 'pz']
    | ['5', '2k' | 'nx' | 'ny' | 'nz' | 'px' | 'py' | 'pz']
    | ['6', '2k' | 'nx' | 'ny' | 'nz' | 'px' | 'py' | 'pz']
    | [
        'blockades-labs-skybox',
        (
          | 'anime-art-style-japan-streets-with-cherry-blossom'
          | 'digital-painting-neon-city-night-orange-lights'
          | 'fantasy-lands-castles-at-night'
          | 'interior-views-cozy-wood-cabin-with-cauldron-and-p'
          | 'scifi-white-sky-scrapers-in-clouds-at-day-time'
        ),
      ];
  floor: 'alpha';
  gradients: '3' | '5';
  'leaves-forest-ground':
    | 'leaves-forest-ground-arm'
    | 'leaves-forest-ground-diff'
    | 'leaves-forest-ground-nor-gl';
  'marble-ball':
    | 'ambient-occlusion'
    | 'color'
    | 'height'
    | 'metalness'
    | 'normal'
    | 'roughness';
  matcaps: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
  particles:
    | '1'
    | '2'
    | '3'
    | '4'
    | '5'
    | '6'
    | '7'
    | '8'
    | '9'
    | '10'
    | '11'
    | '12'
    | '13';
  'plastered-stone-wall':
    | 'plastered-stone-wall-arm'
    | 'plastered-stone-wall-diff'
    | 'plastered-stone-wall-nor-gl';
  'roof-slates': 'roof-slates-arm' | 'roof-slates-diff' | 'roof-slates-nor-gl';
  rope: 'color' | 'height' | 'metalness' | 'normal' | 'roughness';
  'rusty-corrugated-iron':
    | 'rusty-corrugated-iron-arm'
    | 'rusty-corrugated-iron-diff'
    | 'rusty-corrugated-iron-nor-gl';
  'rusty-metal': 'rusty-metal-arm' | 'rusty-metal-diff' | 'rusty-metal-nor-gl';
  shadows: 'baked-shadow' | 'simple-shadow';
  'wood-cabinet-worn-long':
    | 'wood-cabinet-worn-long-arm'
    | 'wood-cabinet-worn-long-diff'
    | 'wood-cabinet-worn-long-nor-gl';
};

export function getTextureUrl<
  TDirectory extends keyof TextureDirectoryFilenameMap,
>(
  directory: TDirectory,
  fileName: TextureDirectoryFilenameMap[TDirectory]
): string {
  switch (directory as keyof TextureDirectoryFilenameMap) {
    case 'castle-brick-broken':
    case 'cobblestone-floor':
    case 'rusty-corrugated-iron':
    case 'rusty-metal':
    case 'wood-cabinet-worn-long': {
      if (
        (fileName as string).endsWith('-nor-gl') ||
        (fileName as string).endsWith('-disp')
      ) {
        return new URL(
          `../assets/textures/${directory}/${fileName}.png`,
          import.meta.url
        ).href;
      }

      return new URL(
        `../assets/textures/${directory}/${fileName}.jpg`,
        import.meta.url
      ).href;
    }
    case 'environment-map': {
      if (typeof fileName === 'string') {
        return new URL(
          `../assets/textures/${directory}/${fileName}.exr`,
          import.meta.url
        ).href;
      }

      if (fileName[0] === 'blockades-labs-skybox') {
        return new URL(
          `../assets/textures/${directory}/${fileName[0]}/${fileName[1]}.jpg`,
          import.meta.url
        ).href;
      }

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
    case 'gradients':
    case 'rope':
    case 'shadows': {
      return new URL(
        `../assets/textures/${directory}/${fileName}.jpg`,
        import.meta.url
      ).href;
    }
    case 'checkerboard':
    case 'marble-ball':
    case 'matcaps':
    case 'particles': {
      return new URL(
        `../assets/textures/${directory}/${fileName}.png`,
        import.meta.url
      ).href;
    }
    case 'coast-sand-rocks':
    case 'door':
    case 'floor':
    case 'leaves-forest-ground':
    case 'plastered-stone-wall':
    case 'roof-slates': {
      return new URL(
        `../assets/textures/${directory}/${fileName}.webp`,
        import.meta.url
      ).href;
    }
  }
}
