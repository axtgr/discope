import type { Namespace } from './namespace'

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

type ScopeInitializer<
  TExports extends Dependencies,
  TDependencies extends Namespace<any, any> | void = void
> = (deps: TDependencies) => TExports

type Scope<
  TExports extends Namespace<any, any> | unknown = unknown,
  TDependencies extends Dependencies | void = void
> = (deps: TDependencies) => TExports

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
