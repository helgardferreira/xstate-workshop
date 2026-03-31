import { noop } from 'rxjs';
import { type Observer, type Subscription, createActor } from 'xstate';

import type { ToastActorRef } from './actors/toast-group/actors/toast/toast.machine.js';
import {
  type ToastsActorRef,
  type ToastsActorSnapshot,
  toastsMachine,
} from './toasts.machine.js';
import type {
  CreateEvent,
  ToastPlacement,
  ToastType,
  UpdateEvent,
} from './types.js';
import { getToastDuration } from './utils/get-toast-duration.js';

type ToastOptions = Omit<CreateEvent['options'], 'id'> & { id?: string };

type MaybeFunction<Value, Args> = Value | ((arg: Args) => Value);

type PromiseOptions<T> = {
  error?:
    | MaybeFunction<Omit<ToastOptions, 'id' | 'placement' | 'type'>, unknown>
    | undefined;
  loading: Omit<ToastOptions, 'duration' | 'id' | 'placement' | 'type'>;
  success?:
    | MaybeFunction<Omit<ToastOptions, 'id' | 'placement' | 'type'>, T>
    | undefined;
};

type UpdateToastOptions = UpdateEvent['options'];

export type Toast = {
  closable: boolean;
  createdAt: number;
  description: string | undefined;
  duration: number;
  id: string;
  matches: ReturnType<ToastActorRef['getSnapshot']>['matches'];
  on: ToastActorRef['on'];
  placement: `${ToastPlacement}`;
  progress: number;
  subscribe: ToastActorRef['subscribe'];
  title: string | undefined;
  type: ToastType;
  value: ReturnType<ToastActorRef['getSnapshot']>['value'];
};

type ToasterStoreOptions = {
  duration?: number;
  max?: number;
  pauseOnPageIdle?: boolean;
  placement?: `${ToastPlacement}`;
  removeDelay?: number;
};

export class ToasterStore {
  public toastsActor: ToastsActorRef;

  constructor(options: ToasterStoreOptions = {}) {
    this.toastsActor = createActor(toastsMachine, { input: options }).start();
  }

  public create = (options: ToastOptions): string => {
    const { id = crypto.randomUUID(), ...rest } = options;

    this.toastsActor.send({ type: 'CREATE', options: { ...rest, id } });

    return id;
  };

  public dismiss = (id: string): void => {
    this.toastsActor.send({ type: 'DISMISS', id });
  };

  public dismissAll = (): void => {
    this.toastsActor.send({ type: 'DISMISS_ALL' });
  };

  public dispose = (): void => {
    this.toastsActor.send({ type: 'DISPOSE' });
  };

  public error = (options: Omit<ToastOptions, 'type'>): string => {
    const { id = crypto.randomUUID(), ...rest } = options;

    this.toastsActor.send({
      type: 'CREATE',
      options: { ...rest, id, type: 'error' },
    });

    return id;
  };

  public getCount = (): number => {
    return this.toastsActor.getSnapshot().context.toastCount;
  };

  public getToast = (id: string): Toast | undefined => {
    const toastGroups = this.toastsActor.getSnapshot().context.toastGroups;

    for (const toastGroup of Object.values(toastGroups)) {
      const toast = toastGroup
        .getSnapshot()
        .context.toasts.find((toast) => toast.id === id);

      if (toast !== undefined) {
        const {
          closable,
          createdAt,
          description,
          duration,
          id,
          placement,
          progress,
          title,
          type,
        } = toast.getSnapshot().context;

        return {
          closable,
          createdAt,
          description,
          duration,
          id,
          matches: toast.getSnapshot().matches,
          on: toast.on,
          placement,
          progress,
          subscribe: toast.subscribe,
          title,
          type,
          value: toast.getSnapshot().value,
        };
      }
    }

    return undefined;
  };

  public getToasts = (): Toast[] => {
    const toastGroups = this.toastsActor.getSnapshot().context.toastGroups;

    return Object.values(toastGroups).flatMap((toastGroup) => {
      return toastGroup.getSnapshot().context.toasts.map((toast) => {
        const {
          closable,
          createdAt,
          description,
          duration,
          id,
          placement,
          progress,
          title,
          type,
        } = toast.getSnapshot().context;

        return {
          closable,
          createdAt,
          description,
          duration,
          id,
          matches: toast.getSnapshot().matches,
          on: toast.on,
          placement,
          progress,
          subscribe: toast.subscribe,
          title,
          type,
          value: toast.getSnapshot().value,
        };
      });
    });
  };

  public info = (options: Omit<ToastOptions, 'type'>): string => {
    const { id = crypto.randomUUID(), ...rest } = options;

    this.toastsActor.send({
      type: 'CREATE',
      options: { ...rest, id, type: 'info' },
    });

    return id;
  };

  public loading = (
    options: Omit<ToastOptions, 'duration' | 'type'>
  ): string => {
    const { id = crypto.randomUUID(), ...rest } = options;

    this.toastsActor.send({
      type: 'CREATE',
      options: { ...rest, id, type: 'loading' },
    });

    return id;
  };

  public pause = (id: string): void => {
    this.toastsActor.send({ type: 'PAUSE', id });
  };

  public pauseAll = (): void => {
    this.toastsActor.send({ type: 'PAUSE_ALL' });
  };

  public promise = <T>(
    promise: Promise<T> | (() => Promise<T>),
    options: PromiseOptions<T>,
    shared: Omit<ToastOptions, 'type'> = {}
  ): {
    id: string;
    unwrap: () => Promise<void>;
  } => {
    const { id = crypto.randomUUID(), placement, ...sharedOptions } = shared;

    const toastExists = this.getToast(id) !== undefined;

    if (toastExists) {
      const wrapped = (
        typeof promise === 'function' ? promise() : promise
      ).then(noop);

      return { id, unwrap: () => wrapped };
    }

    this.toastsActor.send({
      type: 'CREATE',
      options: {
        ...sharedOptions,
        ...options.loading,
        id,
        placement,
        type: 'loading',
      },
    });

    const wrapped = (typeof promise === 'function' ? promise() : promise)
      .then((response) => {
        if (isHttpResponse(response) && !response.ok) {
          if (options.error === undefined) return;

          const errorOptions =
            typeof options.error === 'function'
              ? options.error(
                  new Error(`HTTP Error! status: ${response.status}`)
                )
              : options.error;

          const duration = getToastDuration(
            errorOptions.duration ?? sharedOptions.duration,
            'error'
          );

          this.toastsActor.send({
            type: 'UPDATE',
            id,
            options: {
              ...sharedOptions,
              ...errorOptions,
              duration,
              type: 'error',
            },
          });
        } else if (options.success !== undefined) {
          const successOptions =
            typeof options.success === 'function'
              ? options.success(response)
              : options.success;

          const duration = getToastDuration(
            successOptions.duration ?? sharedOptions.duration,
            'success'
          );

          this.toastsActor.send({
            type: 'UPDATE',
            id,
            options: {
              ...sharedOptions,
              ...successOptions,
              duration,
              type: 'success',
            },
          });
        }
      })
      .catch((error) => {
        if (options.error !== undefined) {
          const errorOptions =
            typeof options.error === 'function'
              ? options.error(error)
              : options.error;

          const duration = getToastDuration(
            errorOptions.duration ?? sharedOptions.duration,
            'error'
          );

          this.toastsActor.send({
            type: 'UPDATE',
            id,
            options: {
              ...sharedOptions,
              ...errorOptions,
              type: 'error',
              duration,
            },
          });
        }
      });

    return { id, unwrap: () => wrapped };
  };

  public remove = (id: string): void => {
    this.toastsActor.send({ type: 'REMOVE', id });
  };

  public removeAll = (): void => {
    this.toastsActor.send({ type: 'REMOVE_ALL' });
  };

  public resume = (id: string): void => {
    this.toastsActor.send({ type: 'RESUME', id });
  };

  public resumeAll = (): void => {
    this.toastsActor.send({ type: 'RESUME_ALL' });
  };

  public subscribe = (
    observer: Observer<ToastsActorSnapshot>
  ): Subscription => {
    return this.toastsActor.subscribe(observer);
  };

  public success = (options: Omit<ToastOptions, 'type'>): string => {
    const { id = crypto.randomUUID(), ...rest } = options;

    this.toastsActor.send({
      type: 'CREATE',
      options: { ...rest, id, type: 'success' },
    });

    return id;
  };

  public update = (id: string, options: UpdateToastOptions): void => {
    this.toastsActor.send({ type: 'UPDATE', id, options });
  };

  public warning = (options: Omit<ToastOptions, 'type'>): string => {
    const { id = crypto.randomUUID(), ...rest } = options;

    this.toastsActor.send({
      type: 'CREATE',
      options: { ...rest, id, type: 'warning' },
    });

    return id;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isHttpResponse = (data: any): data is Response => {
  return (
    data &&
    typeof data === 'object' &&
    'ok' in data &&
    typeof data.ok === 'boolean' &&
    'status' in data &&
    typeof data.status === 'number'
  );
};
