import type { Dependency, Dependencies, Resolver, Resolvers } from './types'

const IS_NAMESPACE = Symbol('IS_NAMESPACE')

enum NamespaceMode {
  Scopes = 'scopes',
  Dependencies = 'dependencies',
}

type DependencyOrNever<
  TArgs extends unknown[] | undefined,
  TDependency extends Dependency
> = undefined extends TArgs
  ? TDependency
  : [] extends TArgs
  ? TDependency
  : [undefined] extends TArgs
  ? TDependency
  : [undefined, undefined] extends TArgs
  ? TDependency
  : [undefined, undefined, undefined] extends TArgs
  ? TDependency
  : [undefined, undefined, undefined, undefined] extends TArgs
  ? TDependency
  : [undefined, undefined, undefined, undefined, undefined] extends TArgs
  ? TDependency
  : [undefined, undefined, undefined, undefined, undefined, undefined] extends TArgs
  ? TDependency
  : never

type DependenciesWithNoArgs<
  TDependencies extends Dependencies,
  TArgs extends Partial<{
    [K in keyof TDependencies]: unknown[]
  }>
> = {
  [K in keyof TDependencies]: DependencyOrNever<TArgs[K], TDependencies[K]>
}

type Namespace<
  TDependencies extends Dependencies,
  TArgs extends Partial<{
    [K in keyof TDependencies]: unknown[]
  }>
> = DependenciesWithNoArgs<TDependencies, TArgs> & {
  <TKey extends keyof TDependencies>(key: TKey): Resolver<
    TArgs[TKey] extends unknown[] ? TArgs[TKey] : [],
    TDependencies[TKey]
  >
} & {
  [IS_NAMESPACE]: boolean
}

function isNamespace(value: any): value is Namespace<any, any> {
  return Boolean(value?.[IS_NAMESPACE])
}

function createNamespace(
  getResolvers: () => Resolvers,
  getMode: () => NamespaceMode
): Namespace<any, any> {
  let resolvers: Resolvers
  let resolvedValues = Object.create(null)
  let namespace = new Proxy(function namespace() {}, {
    apply(_, __, [key]) {
      if (!key) {
        resolvers ??= getResolvers()
        return Object.keys(resolvers).reduce((result, key) => {
          result[key] = namespace[key]()
          return result
        }, {})
      }

      resolvers ??= getResolvers()

      if (!Object.getOwnPropertyDescriptor(resolvers, key)) {
        throw new Error(`Unable to resolve "${key}"`)
      }

      return resolvers[key]
    },

    has(_, key) {
      resolvers ??= getResolvers()
      return Reflect.has(resolvers, key)
    },

    get(_, key) {
      if (key === IS_NAMESPACE) {
        return true
      }

      resolvers ??= getResolvers()

      if (!Object.getOwnPropertyDescriptor(resolvers, key)) {
        throw new Error(`Unable to resolve "${String(key)}"`)
      }

      if (getMode() === NamespaceMode.Dependencies) {
        if (!Object.getOwnPropertyDescriptor(resolvedValues, key)) {
          resolvedValues[key] = resolvers[key]()
        }
        return resolvedValues[key]
      }

      return resolvers[key]
    },

    set() {
      throw new Error('Manually adding dependencies to a namespace is forbidden')
    },

    ownKeys() {
      resolvers ??= getResolvers()
      return Object.keys(resolvers).concat(['prototype', 'caller', 'arguments'])
    },

    getOwnPropertyDescriptor(target, key) {
      if (key === IS_NAMESPACE) {
        return undefined
      }

      if (['prototype', 'caller', 'arguments'].includes(key as string)) {
        return Object.getOwnPropertyDescriptor(target, key)
      }

      return {
        configurable: true,
        enumerable: true,
        writable: false,
        value: namespace[key],
      }
    },
  }) as Namespace<any, any>
  return namespace
}

export { createNamespace, isNamespace, NamespaceMode }
export type { Namespace }
