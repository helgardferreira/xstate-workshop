import type { ActorRef, Snapshot } from 'xstate';

import type { ToastPlacement, ToastType } from '../../../../types.js';

type ParentActor = ActorRef<
  Snapshot<unknown>,
  { type: 'REMOVE_CHILD'; placement: `${ToastPlacement}`; id: string }
>;

type ToastActorContext = {
  closable: boolean;
  closeTimerStartTime: number;
  createdAt: number;
  description: string | undefined;
  duration: number;
  id: string;
  parentActor: ParentActor;
  placement: `${ToastPlacement}`;
  progress: number;
  remainingTime: number;
  removeDelay: number;
  title: string | undefined;
  type: ToastType;
};

type ToastActorInput = {
  closable?: boolean;
  description?: string;
  duration?: number;
  id: string;
  parentActor: ParentActor;
  placement: `${ToastPlacement}`;
  removeDelay: number;
  title?: string;
  type: ToastType;
};

type ToastActorTag = 'paused' | 'updating' | 'visible';

type ToastActorEmittedStatusEvent = {
  type: 'status';
  status: 'dismissing' | 'removed' | 'visible';
};

type ToastActorEmittedEvent = ToastActorEmittedStatusEvent;

type DismissEvent = {
  type: 'DISMISS';
};

type PauseEvent = {
  type: 'PAUSE';
};

type ProgressEvent = {
  type: 'PROGRESS';
  progress: number;
};

type RemoveEvent = {
  type: 'REMOVE';
};

type ResumeEvent = {
  type: 'RESUME';
};

type ShowEvent = {
  type: 'SHOW';
};

type UpdateEvent = {
  type: 'UPDATE';
  options: {
    closable?: boolean;
    description?: string;
    duration?: number;
    removeDelay?: number;
    title?: string;
    type?: ToastType;
  };
};

type ToastEvent =
  | DismissEvent
  | PauseEvent
  | ProgressEvent
  | RemoveEvent
  | ResumeEvent
  | ShowEvent
  | UpdateEvent;

export type {
  DismissEvent,
  PauseEvent,
  ProgressEvent,
  RemoveEvent,
  ResumeEvent,
  ShowEvent,
  ToastActorContext,
  ToastActorEmittedEvent,
  ToastActorEmittedStatusEvent,
  ToastActorInput,
  ToastActorTag,
  ToastEvent,
  UpdateEvent,
};
