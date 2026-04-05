import {
  CanvasTexture,
  DoubleSide,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
} from 'three';

export type LabelPlaneOptions = {
  backgroundColor?: string;
  color?: string;
  font?: {
    family?: string;
    size?: number;
  };
  padding?: number;
  size?: number;
};

export class LabelPlane extends Object3D {
  constructor(
    private readonly text: string,
    private readonly options: LabelPlaneOptions = {}
  ) {
    super();

    this.createCanvas().then((canvas) => {
      const plane = this.createMesh(canvas);
      this.add(plane);
    });
  }

  private async createCanvas(): Promise<HTMLCanvasElement> {
    const {
      backgroundColor = 'rgba(0, 0, 0, 0.75)',
      color = '#ffffff',
      font = {},
      size = 1,
    } = this.options;
    const fontFamily = font.family ?? 'sans-serif';
    const fontSize = font.size ?? 96;
    const padding = (this.options.padding ?? 48) * size;

    // First ensure the desired font is loaded in the global `FontFaceSet`
    await document.fonts.load(`${fontSize * size}px ${fontFamily}`);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (ctx === null) {
      throw new Error('Failed to get CanvasRenderingContext2D');
    }

    ctx.font = `${fontSize * size}px ${fontFamily}`;

    const metrics = ctx.measureText(this.text);
    const textWidth = Math.ceil(metrics.width);
    const textHeight = Math.ceil(
      metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
    );
    canvas.height = textHeight + padding * 2;
    canvas.width = textWidth + padding * 2;

    // Must reset font after resizing canvas (resets context state)
    ctx.font = `${fontSize * size}px ${fontFamily}`;

    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.roundRect(0, 0, canvas.width, canvas.height, 8);
    ctx.fill();

    // Draw text
    ctx.fillStyle = color;
    ctx.fillText(
      this.text,
      Math.max(canvas.width / 2 - textWidth / 2, padding),
      canvas.height - Math.max(canvas.height / 2 - textHeight / 2, padding)
    );

    return canvas;
  }

  private createMesh(
    canvas: HTMLCanvasElement
  ): Mesh<PlaneGeometry, MeshBasicMaterial> {
    const { size = 1 } = this.options;

    const texture = new CanvasTexture(canvas);
    texture.minFilter = LinearFilter;

    const aspect = canvas.width / canvas.height;
    const planeHeight = size;
    const planeWidth = size * aspect;

    const geometry = new PlaneGeometry(planeWidth, planeHeight);
    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      side: DoubleSide,
    });

    return new Mesh(geometry, material);
  }
}
