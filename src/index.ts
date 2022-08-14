import type {
  Namespace,
  Scope,
  ScopeInitializer,
  DependencyResolver,
  DependencyResolvers,
  Dependency,
  Dependencies,
  DependencyInitializer,
} from './types.js'
import { getCurrentContainer, setCurrentContainer } from './global.js'
import { scope as _scope, singleton, factory } from './helpers.js'
import Container from './Container.js'
import Graph, { GraphNode } from './Graph.js'
import { NamespaceToResolvers, ResolversToNamespace } from './namespace.js'

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
  DependencyResolvers,
  Dependency,
  Dependencies,
  DependencyInitializer,
  Graph,
  GraphNode,
}
