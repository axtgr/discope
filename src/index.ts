import { getCurrentContainer, setCurrentContainer } from './global'
import { scope as _scope, singleton, factory } from './helpers'
import Container from './Container'

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
function scope(...args: Parameters<typeof _scope>) {
  if (!getCurrentContainer()) {
    setCurrentContainer(new Container())
  }
  return _scope(...args)
}

export {
  scope,
  singleton,
  factory,
  Container,
  getCurrentContainer,
  setCurrentContainer,
}
