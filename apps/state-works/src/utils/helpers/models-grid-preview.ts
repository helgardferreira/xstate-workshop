import { Group, Object3D, type Vector3Like } from 'three';
import { type GLTF } from 'three/addons';

import { LabelPlane, type LabelPlaneOptions } from './label-plane';

type ModelsGridPreviewOptions = {
  cellSize?: number;
  labelPlane?: LabelPlaneOptions & { offset?: Vector3Like };
};

export class ModelsGridPreview extends Object3D {
  private readonly gridSize: number;
  private columnIdx = 0;
  private rowIdx = 0;

  constructor(
    private models: GLTF[],
    private options: ModelsGridPreviewOptions = {}
  ) {
    super();

    this.gridSize = Math.ceil(Math.sqrt(this.models.length));

    this.models.forEach((model) => this.addModelToGrid(model));
  }

  private addModelToGrid(model: GLTF) {
    const { cellSize = 1 } = this.options;
    const {
      offset: labelPlaneOffset = { x: 0, y: 1, z: 0 },
      size: labelPlaneSize = 0.25,
      ...labelPlaneOptions
    } = this.options.labelPlane ?? {};

    const preview = new Group();
    this.add(preview);

    // Calculate local position vector
    const xzOffset = (this.gridSize - 1) / 2;
    const x = (this.columnIdx - xzOffset) * cellSize;
    const z = (this.rowIdx - xzOffset) * cellSize;
    preview.position.set(x, 0, z);

    // Create model preview label
    const labelPlane = new LabelPlane(model.scene.name, {
      size: labelPlaneSize,
      ...labelPlaneOptions,
    });
    labelPlane.position.copy(labelPlaneOffset);

    preview.add(model.scene, labelPlane);

    // Update column and row indexes for next model preview position in grid
    if (this.columnIdx + 1 > this.gridSize - 1) {
      this.columnIdx = 0;
      this.rowIdx += 1;
    } else {
      this.columnIdx += 1;
    }
  }
}
