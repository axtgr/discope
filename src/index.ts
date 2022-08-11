import { getCurrentContainer, setCurrentContainer } from './global'
import { scope as _scope, singleton, factory } from './helpers'
import Container from './Container'

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
