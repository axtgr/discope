import type {
  Namespace,
  Scope,
  ScopeInitializer,
  DependencyResolver,
  Dependency,
} from './types'
import { getCurrentContainer, setCurrentContainer } from './global'
import { scope as _scope, singleton, factory } from './helpers'
import Container from './Container'
import Graph, { GraphNode } from './Graph'
import { NamespaceToResolvers, ResolversToNamespace } from './namespace'

/**
 * Defines a scope
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
  // This is the difference from helpers/scope(). If there is no current container,
  // we create one.
  if (!getCurrentContainer()) {
    setCurrentContainer(new Container())
  }

  return _scope(initializer) as Scope<
    ResolversToNamespace<TExports>,
    TDependencies extends Namespace<any, any>
      ? NamespaceToResolvers<TDependencies>
      : undefined
  >
}

export {
  scope,
  singleton,
  factory,
  Container,
  getCurrentContainer,
  setCurrentContainer,
}
export type {
  Namespace,
  Scope,
  ScopeInitializer,
  DependencyResolver,
  Dependency,
  Graph,
  GraphNode,
}
