export function getDracoDecoderPathUrl(): string {
  return (
    new URL(
      '../../node_modules/three/examples/jsm/libs/draco/',
      import.meta.url
    ).href + '/'
  );
}
