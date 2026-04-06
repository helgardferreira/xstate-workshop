import type { ActorRef, Snapshot } from 'xstate';

import type { ToastPlacement, ToastType } from '../../types.js';

import type { ToastActorRef } from './actors/toast/toast.machine.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParentActor = ActorRef<Snapshot<unknown>, { type: any }>;

type ToastGroupActorContext = {
  parentActor: ParentActor;
  placement: `${ToastPlacement}`;
  toasts: ToastActorRef[];
};

type CreateEvent = {
  type: 'CREATE';
  options: {
    closable?: boolean;
    description?: string;
    duration?: number;
    id: string;
    placement: `${ToastPlacement}`;
    removeDelay: number;
    title?: string;
    type: ToastType;
  };
};

type DismissAllEvent = {
  type: 'DISMISS_ALL';
};

type DismissEvent = {
  type: 'DISMISS';
  id: string;
};

type PauseAllEvent = {
  type: 'PAUSE_ALL';
};

type PauseEvent = {
  type: 'PAUSE';
  id: string;
};

type PointerEnterEvent = {
  type: 'POINTER_ENTER';
};

type PointerLeaveEvent = {
  type: 'POINTER_LEAVE';
};

type RemoveAllEvent = {
  type: 'REMOVE_ALL';
};

type RemoveChildEvent = {
  type: 'REMOVE_CHILD';
  id: string;
};

type RemoveEvent = {
  type: 'REMOVE';
  id: string;
};

type ResumeAllEvent = {
  type: 'RESUME_ALL';
};

type ResumeEvent = {
  type: 'RESUME';
  id: string;
};

type UpdateEvent = {
  type: 'UPDATE';
  id: string;
  options: {
    closable?: boolean;
    description?: string;
    duration?: number;
    removeDelay?: number;
    title?: string;
    type?: ToastType;
  };
};

type ToastGroupActorEvent =
  | CreateEvent
  | DismissAllEvent
  | DismissEvent
  | PauseAllEvent
  | PauseEvent
  | PointerEnterEvent
  | PointerLeaveEvent
  | RemoveAllEvent
  | RemoveChildEvent
  | RemoveEvent
  | ResumeAllEvent
  | ResumeEvent
  | UpdateEvent;

type ToastGroupActorInput = {
  parentActor: ParentActor;
  placement: `${ToastPlacement}`;
};

export type {
  CreateEvent,
  DismissAllEvent,
  DismissEvent,
  PauseAllEvent,
  PauseEvent,
  PointerEnterEvent,
  PointerLeaveEvent,
  RemoveAllEvent,
  RemoveChildEvent,
  RemoveEvent,
  ResumeAllEvent,
  ResumeEvent,
  ToastGroupActorContext,
  ToastGroupActorEvent,
  ToastGroupActorInput,
  UpdateEvent,
};
