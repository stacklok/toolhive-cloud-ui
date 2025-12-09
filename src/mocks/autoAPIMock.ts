import type { HttpResponseResolver, JsonBodyType } from "msw";
import { HttpResponse } from "msw";

type ResponseResolverInfo = Parameters<HttpResponseResolver>[0];

type OverrideFn<T> = (data: T, info: ResponseResolverInfo) => Response;
type OverrideResponseFn<T> = (data: T, info: ResponseResolverInfo) => T;

export interface AutoAPIMockInstance<T> {
  generatedHandler: HttpResponseResolver;
  override: (fn: OverrideFn<T>) => AutoAPIMockInstance<T>;
  overrideResponse: (fn: OverrideResponseFn<T>) => AutoAPIMockInstance<T>;
  reset: () => AutoAPIMockInstance<T>;
  defaultValue: T;
}

// Registry to track all instances for bulk reset
const registry: Set<AutoAPIMockInstance<unknown>> = new Set();

export function AutoAPIMock<T>(defaultValue: T): AutoAPIMockInstance<T> {
  let overrideFn: OverrideFn<T> | null = null;

  const instance: AutoAPIMockInstance<T> = {
    defaultValue,

    generatedHandler(info: ResponseResolverInfo) {
      if (overrideFn) {
        return overrideFn(defaultValue, info);
      }
      return HttpResponse.json(defaultValue as JsonBodyType);
    },

    override(fn: OverrideFn<T>) {
      overrideFn = fn;
      return instance;
    },

    overrideResponse(fn: OverrideResponseFn<T>) {
      return instance.override((data, info) =>
        HttpResponse.json(fn(data, info) as JsonBodyType),
      );
    },

    reset() {
      overrideFn = null;
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
