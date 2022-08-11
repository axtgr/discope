import type {
  Scope,
  DependencyResolver,
  DependencyResolvers,
  ScopeInitializer,
  Resolve,
} from './types'
import Graph, { GraphNode } from './Graph'
import {
  createNamespace,
  isNamespace,
  Namespace,
  NamespaceMode,
  NamespaceToResolvers,
  ResolversToNamespace,
} from './namespace'
import { getCurrentContainer, setCurrentContainer } from './global'

enum ContainerStatus {
  Idle = 'idle',
  ResolvingScopes = 'resolvingScopes',
  ResolvingDependencies = 'resolvingDependencies',
}

class Container {
  public scopeGraph = new Graph()
  public dependencyGraph = new Graph()
  public status: ContainerStatus = ContainerStatus.Idle

  private bindCallback<TArgs extends unknown[], TReturnValue>(
    cb: (...args: TArgs) => TReturnValue,
    status?: ContainerStatus
  ) {
    return (...args: TArgs) => {
      let prevContainer = getCurrentContainer()
      setCurrentContainer(this)
      let prevStatus = this.status
      this.status = status || this.status
      let result = cb(...args)
      this.status = prevStatus
      setCurrentContainer(prevContainer)
      return result
    }
  }

  private getNamespaceMode() {
    return this.status === ContainerStatus.ResolvingDependencies
      ? NamespaceMode.Dependencies
      : NamespaceMode.Scopes
  }

  public namespace<TResolvers extends DependencyResolvers>(
    getResolvers: () => TResolvers
  ) {
    return createNamespace(getResolvers, () => this.getNamespaceMode())
  }

  public singleton<TArgs extends any[], TResolvedDependency>(
    initializer: DependencyResolver<TArgs, TResolvedDependency>
  ): DependencyResolver<TArgs, TResolvedDependency> {
    let container = this
    let resolved = false
    let result: ReturnType<DependencyResolver>

    return function singletonDependency(...args: TArgs) {
      let boundResolver = container.bindCallback(() => {
        if (!resolved) {
          result = initializer(...args)
          resolved = true
        }
        return result
      }, ContainerStatus.ResolvingDependencies)
      let node = container.dependencyGraph.addNode(initializer, boundResolver)
      return node.value
    }
  }

  public factory<TArgs extends any[], TResolvedDependency>(
    initializer: DependencyResolver<TArgs, TResolvedDependency>
  ): DependencyResolver<TArgs, TResolvedDependency> {
    let container = this

    return function factoryDependency(...args: TArgs) {
      let boundResolver = container.bindCallback(
        () => initializer(...args),
        ContainerStatus.ResolvingDependencies
      )
      let node = container.dependencyGraph.addNode(Symbol(), boundResolver)
      return node.value
    }
  }

  public scope<
    TExports extends DependencyResolvers,
    TDependencies extends Namespace<any, any>
  >(initializer: ScopeInitializer<TExports, TDependencies>) {
    return ((resolvers: NamespaceToResolvers<TDependencies>) => {
      let builder = this.bindCallback(() => {
        let namespace: TDependencies

        if (isNamespace(resolvers)) {
          namespace = resolvers
        } else if (typeof resolvers === 'function') {
          namespace = this.namespace(
            this.bindCallback(resolvers, ContainerStatus.ResolvingScopes)
          ) as TDependencies
        } else {
          namespace = this.namespace(() => resolvers) as TDependencies
        }

        return initializer(namespace)
      }, ContainerStatus.ResolvingScopes)
      let node = this.scopeGraph.addNode(Symbol(), builder)
      return this.namespace(() => node.value)
    }) as unknown as Scope<ResolversToNamespace<TExports>, Resolve<TDependencies>>
  }

  public traverseScopesFromLeaves(visitor: (node: GraphNode<any>) => unknown) {
    return this.dependencyGraph.traverseFromLeaves(visitor)
  }

  public traverseDependenciesFromLeaves(visitor: (node: GraphNode<any>) => unknown) {
    return this.dependencyGraph.traverseFromLeaves(visitor)
  }
}

export default Container
