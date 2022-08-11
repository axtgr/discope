import type Container from './Container'

const CURRENT_CONTAINER = '__SCOPULA_CURRENT_CONTAINER__'

declare global {
  interface Window {
    [CURRENT_CONTAINER]: Container | undefined
  }
}

function getCurrentContainer() {
  return globalThis[CURRENT_CONTAINER]
}

function setCurrentContainer(container: Container) {
  globalThis[CURRENT_CONTAINER] = container
  return container
}

export { getCurrentContainer, setCurrentContainer }
