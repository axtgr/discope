import { GraphNode, GraphBuilder, traverseFromLeaves } from './graph.js'

type ResolvedDependencies = Record<string, unknown>

type DependencyResolver<TArgs extends any[] = unknown[], TDependency = unknown> = (
  ...args: TArgs
) => TDependency

type Dependency<
  TArgs extends any[] = unknown[],
  TDependency = unknown
> = DependencyResolver<TArgs, TDependency>

type DependencyMap = Record<string, Dependency>

type UnresolveDependencies<TResolvedDependencies extends ResolvedDependencies> = {
  [K in keyof TResolvedDependencies]: Dependency<unknown[], TResolvedDependencies[K]>
}

type ResolveDependencies<TResolvers extends DependencyMap> = {
  [K in keyof TResolvers]: TResolvers[K] extends Dependency<any, infer R> ? R : never
}

type Dependencies<TResolvedDependencies extends ResolvedDependencies> =
  UnresolveDependencies<TResolvedDependencies> & (() => TResolvedDependencies)

type ScopeResolver<
  TExports extends DependencyMap,
  TResolvedDependencies extends ResolvedDependencies | void = void
> = TResolvedDependencies extends ResolvedDependencies
  ? (deps: Dependencies<TResolvedDependencies>) => TExports
  : () => TExports

type Scope<
  TExports extends DependencyMap | unknown = unknown,
  TResolvedDependencies extends ResolvedDependencies | void = void
> = TResolvedDependencies extends ResolvedDependencies
  ? (deps: UnresolveDependencies<TResolvedDependencies>) => TExports
  : () => TExports

const graphBuilder = new GraphBuilder()

function single<TArgs extends any[], TResolvedDependency>(
  resolver: DependencyResolver<TArgs, TResolvedDependency>
) {
  let executed = false
  let result: ReturnType<DependencyResolver>
  return ((...args) => {
    let node = graphBuilder.addNode(resolver, () => {
      if (!executed) {
        result = resolver(...args)
        executed = true
      }
      return result
    })
    return node.value
  }) as Dependency<TArgs, TResolvedDependency>
}

function factory<TArgs extends any[], TResolvedDependency>(
  resolver: DependencyResolver<TArgs, TResolvedDependency>
) {
  return ((...args) => {
    let node = graphBuilder.addNode(Symbol(), () => resolver(...args))
    return node.value
  }) as Dependency<TArgs, TResolvedDependency>
}

function resolveDependencies(dependencies: DependencyMap | Dependency) {
  if (typeof dependencies === 'function') {
    return dependencies()
  }

  return Object.keys(dependencies).reduce((result, key) => {
    result[key] = resolveDependencies(dependencies[key])
    return result
  }, {} as ResolvedDependencies)
}

function createDepsFn<TResolvedDependencies extends ResolvedDependencies>(
  deps: UnresolveDependencies<TResolvedDependencies>
): Dependencies<TResolvedDependencies> {
  let fn = (() => resolveDependencies(deps)) as Dependencies<TResolvedDependencies>
  Object.assign(fn, deps)
  return fn
}

function scope<
  TExports extends DependencyMap,
  TResolvedDependencies extends ResolvedDependencies | void = void
>(resolver: ScopeResolver<TExports, TResolvedDependencies>) {
  return ((deps) => {
    let node = graphBuilder.addNode(Symbol(), () => {
      return resolver((deps && createDepsFn(deps)) as any)
    })
    return node.value
  }) as Scope<TExports, TResolvedDependencies>
}

/**
 * Given a root scope, builds a graph of the scopes and returns its root node.
 */
function buildScopes<TExports extends DependencyMap>(rootScope: Scope<TExports, any>) {
  graphBuilder.start()
  rootScope({})
  return graphBuilder.finish().children[0] as GraphNode<ResolveDependencies<TExports>>
}

/**
 * Given the root node of a scope graph (returned by buildScopes()),
 * resolves the dependencies and returns the root node of the graph.
 */
function buildDependencies(rootScopeNode: GraphNode<any>) {
  graphBuilder.start()
  resolveDependencies(rootScopeNode.value)
  return graphBuilder.finish()
}

function build<TExports extends DependencyMap>(rootScope: Scope<any, TExports>) {
  let rootScopesNode = buildScopes(rootScope)
  let rootDependenciesNode = buildDependencies(rootScopesNode)
  return rootDependenciesNode.value
}

function resolve<TExports extends DependencyMap>(rootScope: Scope<any, TExports>) {
  return build(rootScope).value
}

export {
  scope,
  single,
  factory,
  build,
  resolve,
  buildScopes,
  buildDependencies,
  traverseFromLeaves,
}
export type { Scope, Dependency, Dependencies, GraphNode }
