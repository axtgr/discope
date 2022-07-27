import { GraphNode, GraphBuilder, traverseFromLeaves } from './graph.js'

type Dependencies = Record<string, unknown>

type DependencyResolver<TArgs extends any[] = unknown[], TDependency = unknown> = (
  ...args: TArgs
) => TDependency

type DependencyResolvers = Record<string, DependencyResolver<any, any>>

type ResolveDependencies<TResolvers extends DependencyResolvers> = {
  [K in keyof TResolvers]: TResolvers[K] extends DependencyResolver<any, infer R>
    ? R
    : never
}

type UnresolveDependencies<TDependencies extends Dependencies> = {
  [K in keyof TDependencies]: DependencyResolver<unknown[], TDependencies[K]>
}

type Unresolved<TDependencies extends Dependencies> =
  UnresolveDependencies<TDependencies> & (() => TDependencies)

type ScopeResolver<
  TExports extends DependencyResolvers,
  TResolvedDependencies extends Dependencies | void = void
> = TResolvedDependencies extends Dependencies
  ? (deps: Unresolved<TResolvedDependencies>) => TExports
  : () => TExports

type Scope<
  TExports extends DependencyResolvers | unknown = unknown,
  TResolvedDependencies extends Dependencies | void = void
> = TResolvedDependencies extends Dependencies
  ? (deps: UnresolveDependencies<TResolvedDependencies>) => TExports
  : () => TExports

const graphBuilder = new GraphBuilder()

/**
 * Defines a dependency that is instantiated only the first time it is resolved
 *
 * @example
 *
 * ```
 * const httpClient = single(() => new HttpClient())
 * ```
 */
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
  }) as DependencyResolver<TArgs, TResolvedDependency>
}

/**
 * Defines a dependency that is instantiated each time it is resolved
 *
 * @example
 *
 * ```
 * const logger = factory((prefix) => new Logger({ prefix }))
 * ```
 */
function factory<TArgs extends any[], TResolvedDependency>(
  resolver: DependencyResolver<TArgs, TResolvedDependency>
) {
  return ((...args) => {
    let node = graphBuilder.addNode(Symbol(), () => resolver(...args))
    return node.value
  }) as DependencyResolver<TArgs, TResolvedDependency>
}

function resolveDependencies(dependencies: DependencyResolvers | DependencyResolver) {
  if (typeof dependencies === 'function') {
    return dependencies()
  }

  return Object.keys(dependencies).reduce((result, key) => {
    result[key] = resolveDependencies(dependencies[key])
    return result
  }, {} as Dependencies)
}

function createDepsFn<TResolvedDependencies extends Dependencies>(
  deps: UnresolveDependencies<TResolvedDependencies>
): Unresolved<TResolvedDependencies> {
  let fn = (() => resolveDependencies(deps)) as Unresolved<TResolvedDependencies>
  Object.assign(fn, deps)
  return fn
}

/**
 * Defines a scope
 *
 * @example
 *
 * ```
 * export default scope((deps) => {
 *   return {
 *     apiClient: single(() => new ApiClient(deps()))
 *   }
 * })
 * ```
 */
function scope<
  TExports extends DependencyResolvers,
  TResolvedDependencies extends Dependencies | void = void
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
function buildScopes<TExports extends DependencyResolvers>(
  rootScope: Scope<TExports, any>
) {
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

/**
 * Builds the given root scope and dependencies. Returns the root node of the resulting
 * graph.
 */
function build<TExports extends DependencyResolvers>(rootScope: Scope<any, TExports>) {
  let rootScopesNode = buildScopes(rootScope)
  return buildDependencies(rootScopesNode)
}

/**
 * Builds the given root scope and dependencies. Returns the resolved exports of the
 * root scope.
 */
function resolve<TExports extends DependencyResolvers>(
  rootScope: Scope<any, TExports>
) {
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
export type {
  Scope,
  DependencyResolver as Dependency,
  Unresolved as Dependencies,
  GraphNode,
}
