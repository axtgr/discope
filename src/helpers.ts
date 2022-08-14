import type { DependencyResolver, ScopeInitializer, Namespace, Scope } from './types.js'
import { getCurrentContainer } from './global.js'
import { NamespaceToResolvers, ResolversToNamespace } from './namespace.js'

/**
 * Defines a dependency that is instantiated only the first time it is resolved
 *
 * @example
 *
 * ```
 * const httpClient = single(() => new HttpClient())
 * ```
 */
function singleton<TArgs extends any[], TResolvedDependency>(
  resolver: DependencyResolver<TArgs, TResolvedDependency>
) {
  let container = getCurrentContainer()

  if (!container) {
    throw new Error('Attempting to create a dependency in an undefined container')
  }

  return container.singleton(resolver)
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
  let container = getCurrentContainer()

  if (!container) {
    throw new Error('Attempting to create a dependency in an undefined container')
  }

  return container.factory(resolver)
}

/**
 * Defines a scope.
 *
 * Unlike the scope() from the index file, this version doesn't instantiate or even
 * import a container. This is useful if you have multiple scripts with scopes loaded
 * on a single web page. Using the index version of this function in one main script will
 * create a container, and using this version in all the other scripts will prevent
 * the container dependencies from being bundled in them.
 *
 * @example
 *
 * ```
 * export default scope((deps) => {
 *   return {
 *     apiClient: single(() => new ApiClient({ client: deps.httpClient }))
 *   }
 * })
 * ```
 */
function scope<
  TExports extends Record<string, unknown>,
  TDependencies extends Namespace<any, any> | undefined
>(initializer: ScopeInitializer<TExports, TDependencies>) {
  return ((
    deps: TDependencies extends Namespace<any, any>
      ? NamespaceToResolvers<TDependencies>
      : undefined
  ) => {
    let container = getCurrentContainer()

    if (!container) {
      throw new Error('Attempting to create a scope in an undefined container')
    }

    return container.scope(initializer)(deps as any)
  }) as unknown as Scope<
    ResolversToNamespace<TExports>,
    TDependencies extends Namespace<any, any>
      ? NamespaceToResolvers<TDependencies>
      : undefined
  >
}

export { scope, singleton, factory }
