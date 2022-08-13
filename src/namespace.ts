import type {
  Dependencies,
  DependencyResolver,
  DependencyResolvers,
  Resolve,
} from './types'

const IS_NAMESPACE = Symbol('IS_NAMESPACE')

enum NamespaceMode {
  Scopes = 'scopes',
  Dependencies = 'dependencies',
}

type Namespace<
  TDependencies extends Dependencies,
  TArgs extends
    | Partial<{
        [K in keyof TDependencies]: unknown[]
      }>
    | Record<keyof TDependencies, []> = Record<keyof TDependencies, []>
> = TDependencies & {
  <TKey extends undefined | keyof TDependencies>(
    key?: TKey
  ): TKey extends keyof TDependencies
    ? DependencyResolver<
        TArgs[TKey] extends unknown[] ? TArgs[TKey] : [],
        TDependencies[TKey]
      >
    : TDependencies
} & {
  [IS_NAMESPACE]: boolean
}

type NamespaceToResolvers<TNamespace extends Namespace<any, any>> = Omit<
  {
    [K in keyof TNamespace]: TNamespace[K]
  },
  typeof IS_NAMESPACE
>

type ResolversToNamespace<TResolvers extends Record<string, unknown>> = Namespace<
  {
    [K in keyof TResolvers]: TResolvers[K] extends DependencyResolver<any, infer R>
      ? R
      : never
  },
  {
    [K in keyof TResolvers]: TResolvers[K] extends DependencyResolver<infer R, any>
      ? R
      : never
  }
>

function isNamespace(value: any): value is Namespace<any, any> {
  return Boolean(value?.[IS_NAMESPACE])
}

function createNamespace<TResolvers extends DependencyResolvers>(
  getResolvers: () => TResolvers,
  getMode: () => NamespaceMode
): ResolversToNamespace<TResolvers> {
  let resolvers: TResolvers

  let namespace = (key?: keyof TResolvers) => {
    key = typeof key === 'number' ? String(key) : key

    if (!key) {
      resolvers ??= getResolvers()
      return Object.keys(resolvers).reduce((result, key: keyof TResolvers) => {
        result[key] = proxy[key as any]()
        return result
      }, {} as Resolve<TResolvers>)
    }

    resolvers ??= getResolvers()

    if (!Object.getOwnPropertyDescriptor(resolvers, key)) {
      throw new Error(`Unable to resolve "${String(key)}"`)
    }

    return resolvers[key as any]
  }

  let proxy = new Proxy(namespace, {
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

      let resolver = resolvers[key as any]
      return getMode() === NamespaceMode.Dependencies ? resolver() : resolver
    },

    set() {
      throw new Error('Adding dependencies to a namespace is forbidden')
    },

    ownKeys() {
      resolvers ??= getResolvers()
      return Object.keys(resolvers).concat(['prototype', 'caller', 'arguments'])
    },

    getOwnPropertyDescriptor(target, key) {
      if (key === IS_NAMESPACE) {
        return undefined
      }

      if (['prototype', 'caller', 'arguments'].indexOf(key as any) !== -1) {
        return Object.getOwnPropertyDescriptor(target, key)
      }

      return {
        configurable: true,
        enumerable: true,
        writable: false,
        value: proxy[key as any],
      }
    },
  }) as Namespace<any, any>
  return proxy
}

export { createNamespace, isNamespace, NamespaceMode }
export type { Namespace, NamespaceToResolvers, ResolversToNamespace }
