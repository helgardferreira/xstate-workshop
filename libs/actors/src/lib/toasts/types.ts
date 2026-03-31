import type { ToastGroupActorRef } from './actors/toast-group/toast-group.machine.js';

enum ToastPlacement {
  Bottom = 'bottom',
  BottomEnd = 'bottom-end',
  BottomStart = 'bottom-start',
  Top = 'top',
  TopEnd = 'top-end',
  TopStart = 'top-start',
}

type ToastType =
  | 'error'
  | 'info'
  | 'loading'
  | 'success'
  | 'warning'
  | (string & {});

type CreateEvent = {
  type: 'CREATE';
  options: {
    closable?: boolean;
    description?: string;
    duration?: number;
    id: string;
    placement?: `${ToastPlacement}`;
    removeDelay?: number;
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

type DisposeEvent = {
  type: 'DISPOSE';
};

type DocumentHiddenEvent = {
  type: 'DOCUMENT_HIDDEN';
};

type DocumentVisibleEvent = {
  type: 'DOCUMENT_VISIBLE';
};

type PauseAllEvent = {
  type: 'PAUSE_ALL';
};

type PauseEvent = {
  type: 'PAUSE';
  id: string;
};

type RemoveAllEvent = {
  type: 'REMOVE_ALL';
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

type ToastCountEvent = {
  type: 'TOAST_COUNT';
  count: number;
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

type ToastsActorEvent =
  | CreateEvent
  | DismissAllEvent
  | DismissEvent
  | DisposeEvent
  | DocumentHiddenEvent
  | DocumentVisibleEvent
  | PauseAllEvent
  | PauseEvent
  | RemoveAllEvent
  | RemoveEvent
  | ResumeAllEvent
  | ResumeEvent
  | ToastCountEvent
  | UpdateEvent;

type ToastsActorContext = {
  duration: number | undefined;
  max: number | undefined;
  pauseOnPageIdle: boolean;
  placement: `${ToastPlacement}`;
  removeDelay: number;
  toastCount: number;
  toastGroups: Record<`${ToastPlacement}`, ToastGroupActorRef>;
};

type ToastsActorInput = {
  duration?: number;
  max?: number;
  pauseOnPageIdle?: boolean;
  placement?: `${ToastPlacement}`;
  removeDelay?: number;
};

export { ToastPlacement };

export type {
  CreateEvent,
  DismissAllEvent,
  DismissEvent,
  DisposeEvent,
  DocumentHiddenEvent,
  DocumentVisibleEvent,
  PauseAllEvent,
  PauseEvent,
  RemoveAllEvent,
  RemoveEvent,
  ResumeAllEvent,
  ResumeEvent,
  ToastType,
  ToastsActorContext,
  ToastsActorEvent,
  ToastsActorInput,
  UpdateEvent,
};
