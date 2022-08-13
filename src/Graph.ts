interface GraphNode<TValue = any> {
  children: GraphNode[]
  value?: TValue
}

class Graph {
  nodeMap = new Map<any, GraphNode>()
  root: GraphNode = { children: [] }
  currentNode = this.root

  /**
   * Creates a child node for the current node
   */
  public addNode<TValue>(initializer: () => TValue): GraphNode
  public addNode<TValue>(key: unknown, initializer: () => TValue): GraphNode
  public addNode<TValue>(key: unknown, initializer?: () => TValue): GraphNode {
    if (arguments.length === 1) {
      initializer = key as () => TValue
      key = Symbol()
    }

    let node: GraphNode

    if (!this.nodeMap!.has(key)) {
      let currentNode = this.currentNode
      node = { children: [] }
      this.nodeMap!.set(key, node)
      this.currentNode = node
      node.value = initializer!()
      this.currentNode = currentNode
    }

    node ??= this.nodeMap.get(key) as GraphNode
    this.currentNode.children.push(node)
    return node
  }

  /**
   * The recursive implementation of traverseFromLeaves()
   */
  private _traverseFromLeaves(
    visitor: (node: GraphNode) => unknown,
    node: GraphNode,
    visits: Map<GraphNode, Promise<unknown>>
  ): Promise<unknown> {
    let visit = visits.get(node)
    if (!visit) {
      visit = Promise.resolve()
        .then(() => {
          let childVisits = node.children.map((child) => {
            return this._traverseFromLeaves(visitor, child, visits)
          })
          return Promise.all(childVisits)
        })
        .then(() => visitor(node))
      visits.set(node, visit)
    }
    return visit
  }

  /**
   * Visits each node of the graph starting from leaves and finishing at the root.
   */
  public traverseFromLeaves(visitor: (node: GraphNode) => unknown) {
    return this._traverseFromLeaves(visitor, this.root!, new Map())
  }
}

export default Graph
export type { GraphNode }
