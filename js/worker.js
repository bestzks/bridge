/**
 * 工人类 - 表示玩家的工人单位
 */
class Worker {
  constructor(id, playerId, island) {
    this.id = id
    this.playerId = playerId
    this.x = island.x
    this.y = island.y
    this.hasActed = false // 本回合是否已行动
    this.actionType = null // 'move' 或 'build'
  }

  /**
   * 获取工人位置
   */
  getPosition() {
    return { x: this.x, y: this.y }
  }

  /**
   * 设置工人位置
   */
  setPosition(x, y) {
    this.x = x
    this.y = y
  }

  /**
   * 标记已行动
   */
  markActed(actionType) {
    this.hasActed = true
    this.actionType = actionType
  }

  /**
   * 重置行动状态（新回合开始时调用）
   */
  reset() {
    this.hasActed = false
    this.actionType = null
  }

  /**
   * 获取有效的移动范围
   */
  getValidMoves(board, maxSteps = 2) {
    const moves = []
    const visited = new Map() // 记录到达每个位置的最小步数
    const queue = [{ x: this.x, y: this.y, steps: 0 }]
    visited.set(`${this.x},${this.y}`, 0)

    while (queue.length > 0) {
      const { x, y, steps } = queue.shift()

      if (steps > 0 && steps <= maxSteps) {
        moves.push({ x, y, steps })
      }

      if (steps >= maxSteps) continue

      // 获取相邻格子
      const neighbors = board.getNeighbors(x, y)
      for (const neighbor of neighbors) {
        // 只能移动到岛屿或浮桥上
        if (neighbor.type !== "island" && neighbor.type !== "bridge") {
          continue
        }

        const key = `${neighbor.x},${neighbor.y}`
        const newSteps = steps + 1

        if (!visited.has(key) || visited.get(key) > newSteps) {
          visited.set(key, newSteps)
          queue.push({ x: neighbor.x, y: neighbor.y, steps: newSteps })
        }
      }
    }

    return moves
  }

  /**
   * 获取有效的搭建位置
   */
  getValidBuilds(board, bridgeManager) {
    const builds = []
    const directions = [
      { name: "up", dx: 0, dy: -1 },
      { name: "down", dx: 0, dy: 1 },
      { name: "left", dx: -1, dy: 0 },
      { name: "right", dx: 1, dy: 0 },
    ]

    for (const dir of directions) {
      const targetX = this.x + dir.dx
      const targetY = this.y + dir.dy

      if (
        bridgeManager.canBuildBridge(
          this.x,
          this.y,
          targetX,
          targetY,
          this.playerId
        )
      ) {
        builds.push({
          direction: dir.name,
          x: targetX,
          y: targetY,
        })
      }
    }

    return builds
  }

  /**
   * 移动工人
   */
  move(board, targetX, targetY) {
    const validMoves = this.getValidMoves(board)
    const isValid = validMoves.some(
      (move) => move.x === targetX && move.y === targetY
    )

    if (!isValid) {
      return false
    }

    // 执行移动
    board.moveWorker(this, this.x, this.y, targetX, targetY)
    this.markActed("move")
    return true
  }

  /**
   * 搭建浮桥
   */
  buildBridge(board, bridgeManager, direction) {
    const validBuilds = this.getValidBuilds(board, bridgeManager)
    const isValid = validBuilds.some((build) => build.direction === direction)

    if (!isValid) {
      return null
    }

    const bridge = bridgeManager.createBridge(
      this.playerId,
      this.x,
      this.y,
      direction
    )
    if (bridge) {
      // 移动工人到新搭建的浮桥上
      let targetX = this.x
      let targetY = this.y

      switch (direction) {
        case "up":
          targetY--
          break
        case "down":
          targetY++
          break
        case "left":
          targetX--
          break
        case "right":
          targetX++
          break
      }

      board.moveWorker(this, this.x, this.y, targetX, targetY)
      this.markActed("build")
    }

    return bridge
  }
}

/**
 * 工人管理器 - 管理玩家的工人
 */
class WorkerManager {
  constructor(playerId) {
    this.playerId = playerId
    this.workers = []
  }

  /**
   * 创建工人
   */
  createWorker(id, startIsland) {
    const worker = new Worker(id, this.playerId, startIsland)
    this.workers.push(worker)
    return worker
  }

  /**
   * 获取所有工人
   */
  getWorkers() {
    return this.workers
  }

  /**
   * 获取指定ID的工人
   */
  getWorker(id) {
    return this.workers.find((worker) => worker.id === id)
  }

  /**
   * 检查是否所有工人都已行动
   */
  allWorkersActed() {
    return this.workers.every((worker) => worker.hasActed)
  }

  /**
   * 重置所有工人的行动状态
   */
  resetAll() {
    for (const worker of this.workers) {
      worker.reset()
    }
  }

  /**
   * 获取指定位置的工人
   */
  getWorkerAt(x, y) {
    return this.workers.find((worker) => worker.x === x && worker.y === y)
  }
}
