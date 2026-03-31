import {
  BufferGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
} from 'three';
import * as z from 'zod';

const groupSchema = z.instanceof(Group);
const object3dSchema = z.instanceof(Object3D);
const standardMeshSchema = z
  .instanceof(Mesh<BufferGeometry, MeshStandardMaterial>)
  .check(z.property('geometry', z.instanceof(BufferGeometry)))
  .check(z.property('material', z.instanceof(MeshStandardMaterial)));

const carAxleComponentSchema = z.object({ object: standardMeshSchema });

const carBodyComponentSchema = z.object({
  object: groupSchema,
  colliders: z.object({
    cab: object3dSchema,
    hood: object3dSchema,
    trunkBottom: object3dSchema,
    trunkLeft: object3dSchema,
    trunkRear: object3dSchema,
    trunkRight: object3dSchema,
  }),
});

const carLightsRootComponentSchema = z.object({
  object: object3dSchema,
  brakeLights: z.object({ object: standardMeshSchema }),
  fogLights: z.object({ object: standardMeshSchema }),
  headlights: z.object({ object: groupSchema }),
  pipeLights: z.object({ object: standardMeshSchema }),
  reverseLights: z.object({ object: standardMeshSchema }),
  turbineLights: z.object({ object: standardMeshSchema }),
});

const carPipesComponentSchema = z.object({ object: standardMeshSchema });

const carSpoilersComponentSchema = z.object({ object: groupSchema });

const carSteeringWheelComponentSchema = z.object({
  object: standardMeshSchema,
});

const carWheelComponentSchema = z.object({
  object: groupSchema,
  collider: object3dSchema,
});
const carWheelsRootComponentSchema = z.object({
  object: object3dSchema,
  frontLeft: carWheelComponentSchema,
  frontRight: carWheelComponentSchema,
  rearLeft: carWheelComponentSchema,
  rearRight: carWheelComponentSchema,
});

const carWindowComponentSchema = z.object({
  object: standardMeshSchema,
  collider: object3dSchema,
});
const carWindowsRootComponentSchema = z.object({
  object: object3dSchema,
  front: z.object({ object: standardMeshSchema }),
  left: carWindowComponentSchema,
  right: carWindowComponentSchema,
});

const carComponentsSchema = z.object({
  axle: carAxleComponentSchema,
  body: carBodyComponentSchema,
  lights: carLightsRootComponentSchema,
  pipes: carPipesComponentSchema,
  spoilers: carSpoilersComponentSchema,
  steeringWheel: carSteeringWheelComponentSchema,
  wheels: carWheelsRootComponentSchema,
  windows: carWindowsRootComponentSchema,
});

export { carComponentsSchema };

type CarAxleComponent = z.infer<typeof carAxleComponentSchema>;
type CarBodyComponent = z.infer<typeof carBodyComponentSchema>;
type CarComponents = z.infer<typeof carComponentsSchema>;
type CarLightsRootComponent = z.infer<typeof carLightsRootComponentSchema>;
type CarPipesComponent = z.infer<typeof carPipesComponentSchema>;
type CarSpoilersComponent = z.infer<typeof carSpoilersComponentSchema>;
type CarSteeringWheelComponent = z.infer<
  typeof carSteeringWheelComponentSchema
>;
type CarWheelComponent = z.infer<typeof carWheelComponentSchema>;
type CarWheelsRootComponent = z.infer<typeof carWheelsRootComponentSchema>;
type CarWindowComponent = z.infer<typeof carWindowComponentSchema>;
type CarWindowsRootComponent = z.infer<typeof carWindowsRootComponentSchema>;

export type {
  CarAxleComponent,
  CarBodyComponent,
  CarComponents,
  CarLightsRootComponent,
  CarPipesComponent,
  CarSpoilersComponent,
  CarSteeringWheelComponent,
  CarWheelComponent,
  CarWheelsRootComponent,
  CarWindowComponent,
  CarWindowsRootComponent,
};
