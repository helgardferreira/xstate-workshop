import { z } from 'zod';

// ────────────────────────────────────────────
// Primitives
// ────────────────────────────────────────────

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

// ────────────────────────────────────────────
// Composites
// ────────────────────────────────────────────

const TransformSchema = z.object({
  position: Vector3PrimitiveSchema.prefault({ x: 0, y: 0, z: 0 }),
  rotation: EulerPrimitiveSchema.prefault({
    x: 0,
    y: 0,
    z: 0,
  }),
  scale: Vector3PrimitiveSchema.prefault({ x: 1, y: 1, z: 1 }),
});

// ────────────────────────────────────────────
// Inferred types
// ────────────────────────────────────────────

type EulerPrimitive = z.infer<typeof EulerPrimitiveSchema>;
type Transform = z.infer<typeof TransformSchema>;
type Vector3Primitive = z.infer<typeof Vector3PrimitiveSchema>;

export { EulerPrimitiveSchema, TransformSchema, Vector3PrimitiveSchema };

export type { EulerPrimitive, Transform, Vector3Primitive };
