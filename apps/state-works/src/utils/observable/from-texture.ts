import { Observable } from 'rxjs';
import { Texture } from 'three';

/**
 * An `Observable` creator function for instantiating, and loading, `three.js`
 * textures without the use of a `TextureLoader` instance.
 */
export const fromTexture = (src: string) =>
  new Observable<Texture<HTMLImageElement>>((subscriber) => {
    const image = new Image();
    const texture = new Texture<HTMLImageElement>();

    const handleError = () => {
      subscriber.error(new Error(`Failed to load ${src} texture`));
    };
    const handleLoad = () => {
      texture.image = image;
      texture.needsUpdate = true;
      subscriber.next(texture);
      subscriber.complete();
    };

    image.addEventListener('error', handleError);
    image.addEventListener('load', handleLoad);

    image.src = src;

    return () => {
      image.removeEventListener('error', handleError);
      image.removeEventListener('load', handleLoad);
    };
  });
