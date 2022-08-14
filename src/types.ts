import type { Namespace } from './namespace.js'

type Dependency = unknown

type Dependencies = Record<string, Dependency>

type DependencyInitializer<
  TArgs extends unknown[] = [],
  TDependency extends Dependency = unknown
> = (...args: TArgs) => TDependency

type DependencyResolver<
  TArgs extends unknown[] = [],
  TDependency extends Dependency = unknown
> = (...args: TArgs) => TDependency

type DependencyResolvers = Record<string, DependencyResolver>

type DependenciesOrResolvers<TDependencies extends Dependencies> = {
  [K in keyof TDependencies]:
    | TDependencies[K]
    | DependencyResolver<any[], TDependencies[K]>
}

type ScopeInitializer<
  TExports,
  TDependencies extends Namespace<any, any> | undefined = undefined
> = (deps: TDependencies) => TExports

type Scope<
  TExports extends Namespace<any, any> | unknown,
  TDependencies extends Dependencies | undefined
> = (
  deps: TDependencies extends Dependencies
    ?
        | DependenciesOrResolvers<TDependencies>
        | (() => DependenciesOrResolvers<TDependencies>)
    : undefined
) => TExports

type Resolve<TResolvers extends DependencyResolvers> = {
  [K in keyof TResolvers]: TResolvers[K] extends DependencyResolver<any, infer R>
    ? R
    : never
}

export type {
  Dependency,
  Dependencies,
  DependencyInitializer,
  DependencyResolver,
  DependencyResolvers,
  Scope,
  ScopeInitializer,
  Namespace,
  Resolve,
}
