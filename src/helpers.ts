import type { Resolver } from './types'
import { getCurrentContainer } from './global'

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
  resolver: Resolver<TArgs, TResolvedDependency>
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
  resolver: Resolver<TArgs, TResolvedDependency>
) {
  let container = getCurrentContainer()

  if (!container) {
    throw new Error('Attempting to create a dependency in an undefined container')
  }

  return container.factory(resolver)
}

/**
 * Defines a scope
 *
 * @example
 *
 * ```
 * export default scope(({ httpClient }) => {
 *   return {
 *     apiClient: single(() => new ApiClient({ httpClient }))
 *   }
 * })
 * ```
 */
function scope<
  TExports extends Resolvers,
  TDependencies extends Resolvers | void = void
>(resolver: ScopeResolver<TExports, TDependencies>) {
  return (deps) => {
    let container = getCurrentContainer()

    if (!container) {
      throw new Error('Attempting to create a scope in an undefined container')
    }

    return container.scope(resolver)(deps)
  }
}

export { scope, singleton, factory }
