import type { NextRequest } from "next/server";

export type RouteParams = Record<string, string>;

export type NextRouteContext<TParams extends RouteParams> = {
  params: Promise<TParams>;
};

export type RouteContext<
  TParams extends RouteParams,
  TState extends object = object,
> = {
  request: NextRequest;
  params: TParams;
} & TState;

type MaybePromise<T> = T | Promise<T>;
type GuardResult<TState extends object> = Response | TState | void;

export type RouteGuard<
  TParams extends RouteParams,
  TInputState extends object,
  TOutputState extends object = object,
> = (
  context: RouteContext<TParams, TInputState>,
) => MaybePromise<GuardResult<TOutputState>>;

export type RouteHandler<
  TParams extends RouteParams,
  TState extends object = object,
> = (context: RouteContext<TParams, TState>) => MaybePromise<Response>;

export type NextRouteHandler<TParams extends RouteParams> = (
  request: NextRequest,
  context: NextRouteContext<TParams>,
) => Promise<Response>;

export function composeRoute<TParams extends RouteParams>(
  handler: RouteHandler<TParams>,
): NextRouteHandler<TParams>;

export function composeRoute<
  TParams extends RouteParams,
  TStateA extends object,
>(
  guardA: RouteGuard<TParams, object, TStateA>,
  handler: RouteHandler<TParams, TStateA>,
): NextRouteHandler<TParams>;

export function composeRoute<
  TParams extends RouteParams,
  TStateA extends object,
  TStateB extends object,
>(
  guardA: RouteGuard<TParams, object, TStateA>,
  guardB: RouteGuard<TParams, TStateA, TStateB>,
  handler: RouteHandler<TParams, TStateA & TStateB>,
): NextRouteHandler<TParams>;

export function composeRoute<
  TParams extends RouteParams,
  TStateA extends object,
  TStateB extends object,
  TStateC extends object,
>(
  guardA: RouteGuard<TParams, object, TStateA>,
  guardB: RouteGuard<TParams, TStateA, TStateB>,
  guardC: RouteGuard<TParams, TStateA & TStateB, TStateC>,
  handler: RouteHandler<TParams, TStateA & TStateB & TStateC>,
): NextRouteHandler<TParams>;

export function composeRoute<
  TParams extends RouteParams,
  TStateA extends object,
  TStateB extends object,
  TStateC extends object,
  TStateD extends object,
>(
  guardA: RouteGuard<TParams, object, TStateA>,
  guardB: RouteGuard<TParams, TStateA, TStateB>,
  guardC: RouteGuard<TParams, TStateA & TStateB, TStateC>,
  guardD: RouteGuard<TParams, TStateA & TStateB & TStateC, TStateD>,
  handler: RouteHandler<TParams, TStateA & TStateB & TStateC & TStateD>,
): NextRouteHandler<TParams>;

export function composeRoute<TParams extends RouteParams>(
  ...parts: [
    ...RouteGuard<TParams, object, object>[],
    RouteHandler<TParams, object>,
  ]
): NextRouteHandler<TParams> {
  return async (request, { params }) => {
    const resolvedParams = await params;
    const context: RouteContext<TParams> = {
      request,
      params: resolvedParams,
    };

    const handler = parts[parts.length - 1] as RouteHandler<TParams>;
    const guards = parts.slice(0, -1) as RouteGuard<TParams, object>[];

    for (const guard of guards) {
      const result = await guard(context);

      if (result instanceof Response) {
        return result;
      }

      if (result) {
        Object.assign(context, result);
      }
    }

    return handler(context);
  };
}
export { composeRoute as composeRouter };
