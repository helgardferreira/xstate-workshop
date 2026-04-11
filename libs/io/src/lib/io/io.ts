import {
  type Observable,
  catchError,
  concatMap,
  from,
  of,
  switchMap,
} from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { z } from 'zod';

import { toParsed, unwrapResult } from '../operators/index.js';
import { type Result, err, ok } from '../utils/index.js';

import { toJSONResult } from './to-json-result.js';

type IoOptions = Omit<RequestInit, 'body' | 'method'>;

export function io<
  ResponseSchema extends z.ZodType,
  RequestSchema extends z.ZodType,
  ResponseOutput extends z.output<ResponseSchema> = z.output<ResponseSchema>,
  RequestOutput extends z.output<RequestSchema> = z.output<RequestSchema>,
>(responseSchema?: ResponseSchema, requestSchema?: RequestSchema) {
  const deleteImpl = (
    path: string,
    options: IoOptions = {}
  ): Observable<Result<{ message: string }, { message: string }>> => {
    const { headers: headersOverride, ...restOptions } = options;
    const headers = { ...headersOverride };

    return fromFetch(path, {
      headers: headers,
      method: 'DELETE',
      ...restOptions,
    }).pipe(
      switchMap((response) =>
        response.ok
          ? of(ok({ message: 'Success' }))
          : of(err({ message: `Error ${response.status}` }))
      )
    );
  };

  const getImpl = (
    path: `/${string}`,
    options: IoOptions = {}
  ): Observable<Result<ResponseOutput, z.ZodError<ResponseOutput>>> => {
    if (responseSchema === undefined) {
      throw new Error(`Missing response schema in io GET request`);
    }

    const { headers: headersOverride, ...restOptions } = options;
    const headers = { Accept: 'application/json', ...headersOverride };

    return fromFetch(path, {
      headers: headers,
      method: 'GET',
      ...restOptions,
    }).pipe(
      toJSONResult(),
      unwrapResult(),
      toParsed(responseSchema as z.ZodType<ResponseOutput, unknown>)
    );
  };

  const mutateImpl = (method: 'PATCH' | 'POST' | 'PUT') => {
    return (
      path: `/${string}`,
      body: RequestOutput,
      options: IoOptions = {}
    ): Observable<
      Result<
        ResponseOutput,
        z.ZodError<ResponseOutput> | z.ZodError<RequestOutput>
      >
    > => {
      if (requestSchema === undefined) {
        throw new Error(`Missing request schema in io ${method} request`);
      }
      if (responseSchema === undefined) {
        throw new Error(`Missing response schema in io ${method} request`);
      }

      const { headers: headersOverride, ...restOptions } = options;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...headersOverride,
      };

      return from(requestSchema.encodeAsync(body)).pipe(
        concatMap((encoded) =>
          fromFetch(path, {
            body: JSON.stringify(encoded),
            headers: headers,
            method,
            ...restOptions,
          })
        ),
        toJSONResult(),
        unwrapResult(),
        toParsed(responseSchema as z.ZodType<ResponseOutput, unknown>),
        catchError((error) => {
          if (error instanceof z.ZodError) {
            return of(err(error as z.ZodError<RequestOutput>));
          }

          throw error;
        })
      );
    };
  };

  return {
    delete: deleteImpl,
    get: getImpl,
    patch: mutateImpl('PATCH'),
    post: mutateImpl('POST'),
    put: mutateImpl('PUT'),
  };
}
