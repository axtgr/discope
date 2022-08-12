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
import { ResolversToNamespace } from './namespace'

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
  TExports extends Record<string, unknown>,
  TDependencies extends Namespace<any, any> | undefined
>(initializer: ScopeInitializer<TExports, TDependencies>) {
  if (!getCurrentContainer()) {
    setCurrentContainer(new Container())
  }
  return _scope(initializer) as Scope<ResolversToNamespace<TExports>, TDependencies>
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
