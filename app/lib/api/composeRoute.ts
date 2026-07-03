import type { NextRequest } from "next/server";

export type RouteParams = Record<string, string>;

export type NextRouteContext<TParams extends RouteParams> = {
  params: Promise<TParams>;
};

export type BaseContext<TParams extends RouteParams = RouteParams> = {
  params: TParams;
};

type MaybePromise<T> = T | Promise<T>;
type MiddlewareResult<TAdds extends object> = Response | TAdds | void;

export type Middleware<TContext extends BaseContext, TAdds extends object> = (
  request: NextRequest,
  context: TContext,
) => MaybePromise<MiddlewareResult<TAdds>>;

export type Handler<TContext extends BaseContext> = (
  request: NextRequest,
  context: TContext,
) => MaybePromise<Response>;

export type RouteHandler<TParams extends RouteParams> = (
  request: NextRequest,
  context: NextRouteContext<TParams>,
) => Promise<Response>;

export class Chain<TContext extends BaseContext> {
  private constructor(
    private readonly middlewares: Middleware<BaseContext, object>[],
  ) {}

  static create<TParams extends RouteParams = RouteParams>() {
    return new Chain<BaseContext<TParams>>([]);
  }

  use<TAdds extends object>(
    middleware: Middleware<TContext, TAdds>,
  ): Chain<TContext & TAdds> {
    return new Chain<TContext & TAdds>([
      ...this.middlewares,
      middleware as unknown as Middleware<BaseContext, object>,
    ]);
  }

  handler(handler: Handler<TContext>): RouteHandler<TContext["params"]> {
    const middlewares = this.middlewares;

    return async (request, routeContext) => {
      let context: BaseContext = {
        params: await routeContext.params,
      };

      for (const middleware of middlewares) {
        const result = await middleware(request, context);

        if (result instanceof Response) {
          return result;
        }

        if (result) {
          context = {
            ...context,
            ...result,
          };
        }
      }

      return handler(request, context as TContext);
    };
  }
}

export function chain<TParams extends RouteParams = RouteParams>() {
  return Chain.create<TParams>();
}
