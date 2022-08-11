import type { Resolver, Resolvers } from './types'
import Graph, { GraphNode } from './Graph'
import { createNamespace, isNamespace, Namespace, NamespaceMode } from './namespace'
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

  private getModeForNamespace() {
    return this.status === ContainerStatus.ResolvingDependencies
      ? NamespaceMode.Dependencies
      : NamespaceMode.Scopes
  }

  public namespace(getResolvers: () => Resolvers) {
    return createNamespace(getResolvers, () => this.getModeForNamespace())
  }

  public singleton<TArgs extends any[], TResolvedDependency>(
    resolver: Resolver<TArgs, TResolvedDependency>
  ) {
    let container = this
    let resolved = false
    let result: ReturnType<Resolver>

    return function singletonDependency(...args: TArgs) {
      let boundResolver = container.bindCallback(() => {
        if (!resolved) {
          result = resolver(...args)
          resolved = true
        }
        return result
      }, ContainerStatus.ResolvingDependencies)
      let node = container.dependencyGraph.addNode(resolver, boundResolver)
      return node.value
    }
  }

  public factory<TArgs extends any[], TResolvedDependency>(
    resolver: Resolver<TArgs, TResolvedDependency>
  ) {
    let container = this

    return function factoryDependency(...args: TArgs) {
      let boundResolver = container.bindCallback(
        () => resolver(...args),
        ContainerStatus.ResolvingDependencies
      )
      let node = container.dependencyGraph.addNode(Symbol(), boundResolver)
      return node.value
    }
  }

  public scope<
    TExports extends Resolvers,
    TDependencies extends Resolvers | void = void
  >(resolver: ScopeResolver<TExports, TDependencies>) {
    return (dependencyResolvers) => {
      let builder = this.bindCallback(() => {
        let namespace: Namespace<any, any>

        if (isNamespace(dependencyResolvers)) {
          namespace = dependencyResolvers
        } else if (typeof dependencyResolvers === 'function') {
          namespace = this.namespace(
            this.bindCallback(dependencyResolvers, ContainerStatus.ResolvingScopes)
          )
        } else {
          namespace = this.namespace(() => dependencyResolvers)
        }

        return resolver(namespace)
      }, ContainerStatus.ResolvingScopes)
      let node = this.scopeGraph.addNode(Symbol(), builder)
      return this.namespace(() => node.value)
    }
  }

  public traverseScopesFromLeaves(visitor: (node: GraphNode<any>) => unknown) {
    return this.dependencyGraph.traverseFromLeaves(visitor)
  }

  public traverseDependenciesFromLeaves(visitor: (node: GraphNode<any>) => unknown) {
    return this.dependencyGraph.traverseFromLeaves(visitor)
  }
}

export default Container
