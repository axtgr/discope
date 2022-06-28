interface GraphNode<TValue = any> {
  children: GraphNode[]
  parent?: GraphNode
  value?: TValue
}

class GraphBuilder {
  isBuilding = false
  nodeMap?: Map<any, GraphNode>
  root?: GraphNode
  currentNode?: GraphNode

  start() {
    if (this.isBuilding) {
      throw new Error('Cannot start building a graph that is already being built')
    }

    this.nodeMap = new Map()
    this.root = { children: [] }
    this.currentNode = this.root
    this.isBuilding = true
    return this.root!
  }

  addNode(key: unknown, valueInitializer: () => unknown) {
    if (!this.isBuilding) {
      throw new Error('Cannot create a node when not building a graph')
    }

    if (!this.nodeMap!.has(key)) {
      this.nodeMap!.set(key, { parent: this.currentNode, children: [] })
    }

    let node = this.nodeMap!.get(key) as GraphNode
    this.currentNode!.children.push(node)
    this.currentNode = node
    node.value = valueInitializer()
    this.currentNode = node.parent
    return node
  }

  finish() {
    if (!this.isBuilding) {
      throw new Error("Cannot finish building a graph that isn't being built")
    }

    let result = this.root!
    this.nodeMap = undefined
    this.root = undefined
    this.currentNode = undefined
    this.isBuilding = false
    return result
  }
}

function traverseFromLeaves(
  node: GraphNode,
  visitor: (node: GraphNode) => unknown,
  visits: Map<GraphNode, unknown> = new Map()
) {
  let visit = visits.get(node)
  if (!visit) {
    visit = Promise.resolve()
      .then(() => {
        let childVisits = node.children.map((child) => {
          return traverseFromLeaves(child, visitor, visits)
        })
        return Promise.all(childVisits)
      })
      .then(() => visitor(node))
    visits.set(node, visit)
  }
  return visit
}

export type { GraphNode }
export { GraphBuilder, traverseFromLeaves }
