import { fromEvent, map } from 'rxjs';
import { type ActorRefFrom, fromEventObservable } from 'xstate';

import type { EventObservableCreator } from '../../types/observable.js';
import type { ToastsActorEvent } from '../types.js';

const documentVisibility: EventObservableCreator<ToastsActorEvent> = () =>
  fromEvent(document, 'visibilitychange').pipe(
    map(() =>
      document.visibilityState === 'hidden'
        ? { type: 'DOCUMENT_HIDDEN' }
        : { type: 'DOCUMENT_VISIBLE' }
    )
  );

export const documentVisibilityLogic = fromEventObservable(documentVisibility);

export type DocumentVisibilityActorRef = ActorRefFrom<
  typeof documentVisibilityLogic
>;
