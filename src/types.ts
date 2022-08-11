type Dependency = unknown

type Dependencies = Record<string, Dependency>

type Resolver<
  TArgs extends unknown[] = [],
  TDependency extends Dependency = unknown
> = (...args: TArgs) => TDependency

type Resolvers = Record<string, Resolver>

export type { Dependency, Dependencies, Resolver, Resolvers }
