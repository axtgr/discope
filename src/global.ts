import type Container from './Container.js'

const CURRENT_CONTAINER = '__DISCOPE_CURRENT_CONTAINER__'

interface GlobalObject {
  [CURRENT_CONTAINER]: Container | undefined
}

let globalObject: GlobalObject

// @ts-expect-error
if (typeof self !== 'undefined') {
  // @ts-expect-error
  globalObject = self as any
  // @ts-expect-error
} else if (typeof window !== 'undefined') {
  // @ts-expect-error
  globalObject = window as any
  // @ts-expect-error
} else if (typeof global !== 'undefined') {
  // @ts-expect-error
  globalObject = global as any
} else {
  globalObject = Function('return this')()
}

function getCurrentContainer() {
  return globalObject[CURRENT_CONTAINER]
}

function setCurrentContainer(container: Container | undefined) {
  globalObject[CURRENT_CONTAINER] = container
  return container
}

export { getCurrentContainer, setCurrentContainer }
