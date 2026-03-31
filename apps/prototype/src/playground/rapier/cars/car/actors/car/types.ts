// TODO: create separate state machines for `steeringKnuckle` / `steering` and `wheelHub` / `spinning`
type CarActorContext = {
  spinning: {
    accelerationRate: number;
    decelerationRate: number;
    factor: number;
    maxVelocity: number;
    velocity: number;
  };
  steering: {
    angle: number;
    damping: number;
    maxAngle: number;
    rate: number;
    stiffness: number;
  };
};

type CarActorInput = {
  spinning?: {
    accelerationRate?: number;
    decelerationRate?: number;
    factor?: number;
    maxVelocity?: number;
    velocity?: number;
  };
  steering?: {
    angle?: number;
    damping?: number;
    maxAngle?: number;
    rate?: number;
    stiffness?: number;
  };
};

type SetSpinningAccelerationRateEvent = {
  type: 'SET_SPINNING_ACCELERATION_RATE';
  value: number;
};
type SetSpinningDecelerationRateEvent = {
  type: 'SET_SPINNING_DECELERATION_RATE';
  value: number;
};
type SetSpinningFactorEvent = {
  type: 'SET_SPINNING_FACTOR';
  value: number;
};
type SetSpinningMaxVelocityEvent = {
  type: 'SET_SPINNING_MAX_VELOCITY';
  value: number;
};
type SetSpinningVelocityEvent = {
  type: 'SET_SPINNING_VELOCITY';
  value: number;
};

type SetSteeringAngleEvent = {
  type: 'SET_STEERING_ANGLE';
  value: number;
};
type SetSteeringDampingEvent = {
  type: 'SET_STEERING_DAMPING';
  value: number;
};
type SetSteeringMaxAngleEvent = {
  type: 'SET_STEERING_MAX_ANGLE';
  value: number;
};
type SetSteeringRateEvent = {
  type: 'SET_STEERING_RATE';
  value: number;
};
type SetSteeringStiffnessEvent = {
  type: 'SET_STEERING_STIFFNESS';
  value: number;
};

type DriveReleaseEvent = {
  type: 'DRIVE_RELEASE';
};
type ReverseEvent = {
  type: 'REVERSE';
};
type ThrottleEvent = {
  type: 'THROTTLE';
};

type SteerLeftEvent = {
  type: 'STEER_LEFT';
};
type SteerReleaseEvent = {
  type: 'STEER_RELEASE';
};
type SteerRightEvent = {
  type: 'STEER_RIGHT';
};

type CarEvent =
  | DriveReleaseEvent
  | ReverseEvent
  | SetSpinningAccelerationRateEvent
  | SetSpinningDecelerationRateEvent
  | SetSpinningFactorEvent
  | SetSpinningMaxVelocityEvent
  | SetSpinningVelocityEvent
  | SetSteeringAngleEvent
  | SetSteeringDampingEvent
  | SetSteeringMaxAngleEvent
  | SetSteeringRateEvent
  | SetSteeringStiffnessEvent
  | SteerLeftEvent
  | SteerReleaseEvent
  | SteerRightEvent
  | ThrottleEvent;

export type {
  CarActorContext,
  CarActorInput,
  CarEvent,
  DriveReleaseEvent,
  ReverseEvent,
  SetSpinningAccelerationRateEvent,
  SetSpinningDecelerationRateEvent,
  SetSpinningFactorEvent,
  SetSpinningMaxVelocityEvent,
  SetSpinningVelocityEvent,
  SetSteeringAngleEvent,
  SetSteeringDampingEvent,
  SetSteeringMaxAngleEvent,
  SetSteeringRateEvent,
  SetSteeringStiffnessEvent,
  SteerLeftEvent,
  SteerReleaseEvent,
  SteerRightEvent,
  ThrottleEvent,
};
