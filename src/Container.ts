import type {
  Scope,
  DependencyResolver,
  DependencyResolvers,
  ScopeInitializer,
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

  private createDependency<TArgs extends any[], TResolvedDependency>(
    getKey: () => unknown,
    initializer: DependencyResolver<TArgs, TResolvedDependency>
  ): DependencyResolver<TArgs, TResolvedDependency> {
    let container = this
    return function dependency(...args: TArgs) {
      let boundInitializer = container.bindCallback(
        () => initializer(...args),
        ContainerStatus.ResolvingDependencies
      )
      let node = container.dependencyGraph.addNode(getKey(), boundInitializer)
      return node.value
    }
  }

  public singleton<TArgs extends any[], TResolvedDependency>(
    initializer: DependencyResolver<TArgs, TResolvedDependency>
  ): DependencyResolver<TArgs, TResolvedDependency> {
    // Here, we use the initializer as the node's key so that it doesn't get
    // initialized each time it is added to the graph.
    return this.createDependency(() => initializer, initializer)
  }

  public factory<TArgs extends any[], TResolvedDependency>(
    initializer: DependencyResolver<TArgs, TResolvedDependency>
  ): DependencyResolver<TArgs, TResolvedDependency> {
    return this.createDependency(() => Symbol(), initializer)
  }

  public scope<
    TExports extends Record<string, unknown>,
    TDependencies extends Namespace<any, any> | undefined
  >(initializer: ScopeInitializer<TExports, TDependencies>) {
    return ((
      deps: TDependencies extends Namespace<any, any>
        ? NamespaceToResolvers<TDependencies>
        : undefined
    ) => {
      let builder = this.bindCallback(() => {
        let namespace: TDependencies

        if (isNamespace(deps)) {
          namespace = deps as TDependencies
        } else if (typeof deps === 'function') {
          namespace = this.namespace(
            this.bindCallback(
              deps as () => DependencyResolvers,
              ContainerStatus.ResolvingScopes
            )
          ) as TDependencies
        } else {
          namespace = this.namespace(() => {
            return deps === undefined ? {} : deps!
          }) as TDependencies
        }

        return initializer(namespace)
      }, ContainerStatus.ResolvingScopes)
      let node = this.scopeGraph.addNode(Symbol(), builder)
      return this.namespace(() => node.value)
    }) as unknown as Scope<
      ResolversToNamespace<TExports>,
      TDependencies extends Namespace<any, any>
        ? NamespaceToResolvers<TDependencies>
        : undefined
    >
  }

  public traverseScopesFromLeaves(visitor: (node: GraphNode<any>) => unknown) {
    return this.dependencyGraph.traverseFromLeaves(visitor)
  }

  public traverseDependenciesFromLeaves(visitor: (node: GraphNode<any>) => unknown) {
    return this.dependencyGraph.traverseFromLeaves(visitor)
  }
}

export default Container
