import type { HttpResponseResolver, JsonBodyType } from "msw";
import { HttpResponse } from "msw";

type ResponseResolverInfo = Parameters<HttpResponseResolver>[0];

type OverrideHandlerFn<T> = (data: T, info: ResponseResolverInfo) => Response;
type OverrideFn<T> = (data: T, info: ResponseResolverInfo) => T;

export interface AutoAPIMockInstance<T> {
  generatedHandler: HttpResponseResolver;
  override: (fn: OverrideFn<T>) => AutoAPIMockInstance<T>;
  overrideHandler: (fn: OverrideHandlerFn<T>) => AutoAPIMockInstance<T>;
  reset: () => AutoAPIMockInstance<T>;
  defaultValue: T;
}

// Registry to track all instances for bulk reset
const registry: Set<AutoAPIMockInstance<unknown>> = new Set();

export function AutoAPIMock<T>(defaultValue: T): AutoAPIMockInstance<T> {
  let overrideHandlerFn: OverrideHandlerFn<T> | null = null;

  const instance: AutoAPIMockInstance<T> = {
    defaultValue,

    generatedHandler(info: ResponseResolverInfo) {
      if (overrideHandlerFn) {
        return overrideHandlerFn(defaultValue, info);
      }
      return HttpResponse.json(defaultValue as JsonBodyType);
    },

    override(fn: OverrideFn<T>) {
      return instance.overrideHandler((data, info) =>
        HttpResponse.json(fn(data, info) as JsonBodyType),
      );
    },

    overrideHandler(fn: OverrideHandlerFn<T>) {
      overrideHandlerFn = fn;
      return instance;
    },

    reset() {
      overrideHandlerFn = null;
      return instance;
    },
  };

  registry.add(instance as AutoAPIMockInstance<unknown>);

  return instance;
}

export function resetAllAutoAPIMocks(): void {
  for (const instance of registry) {
    instance.reset();
  }
}
