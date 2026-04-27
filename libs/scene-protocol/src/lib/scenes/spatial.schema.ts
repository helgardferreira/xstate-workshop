import { z } from 'zod';

const EulerOrderSchema = z.union([
  z.literal('XYZ'),
  z.literal('YXZ'),
  z.literal('ZXY'),
  z.literal('ZYX'),
  z.literal('YZX'),
  z.literal('XZY'),
]);

const EulerPrimitiveSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
  order: EulerOrderSchema.prefault('XYZ'),
});

const Vector3PrimitiveSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

const TransformSchema = z.object({
  position: Vector3PrimitiveSchema.prefault({ x: 0, y: 0, z: 0 }),
  rotation: EulerPrimitiveSchema.prefault({
    x: 0,
    y: 0,
    z: 0,
  }),
  scale: Vector3PrimitiveSchema.prefault({ x: 1, y: 1, z: 1 }),
});

type EulerPrimitive = z.output<typeof EulerPrimitiveSchema>;
type Transform = z.output<typeof TransformSchema>;
type Vector3Primitive = z.output<typeof Vector3PrimitiveSchema>;

export { EulerPrimitiveSchema, TransformSchema, Vector3PrimitiveSchema };

export type { EulerPrimitive, Transform, Vector3Primitive };
