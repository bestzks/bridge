/**
 * 岛屿类 - 表示游戏中的岛屿
 */
class Island {
  constructor(id, x, y, type = "normal") {
    this.id = id
    this.x = x
    this.y = y
    this.type = type // 'start', 'normal', 'resource'
    this.owner = null // 拥有该岛屿的玩家ID
  }

  /**
   * 获取岛屿位置
   */
  getPosition() {
    return { x: this.x, y: this.y }
  }

  /**
   * 获取岛屿类型
   */
  getType() {
    return this.type
  }

  /**
   * 设置岛屿拥有者
   */
  setOwner(playerId) {
    this.owner = playerId
    console.log(`[Island] 岛屿 ${this.id} 分配给玩家 ${playerId + 1}`)
  }

  /**
   * 获取岛屿拥有者
   */
  getOwner() {
    return this.owner
  }

  /**
   * 检查岛屿是否被占领
   */
  isOwned() {
    return this.owner !== null
  }
}

/**
 * 岛屿生成器 - 负责生成岛屿布局
 */
class IslandGenerator {
  constructor(board) {
    this.board = board
  }

  /**
   * 根据玩家人数计算岛屿数量
   */
  static getIslandCount(playerCount) {
    const counts = { 2: 6, 3: 9, 4: 12 }
    return counts[playerCount] || 6
  }

  /**
   * 生成岛屿
   */
  generate(count, playerCount, minDistance = 5) {
    console.log(
      `[IslandGenerator] 开始生成 ${count} 个岛屿，玩家数: ${playerCount}，最小间距: ${minDistance}`
    )
    const islands = []
    let attempts = 0
    const maxAttempts = 2000

    while (islands.length < count && attempts < maxAttempts) {
      attempts++

      const x = Math.floor(Math.random() * this.board.size)
      const y = Math.floor(Math.random() * this.board.size)

      // 检查距离其他岛屿是否足够远
      if (this.isValidPosition(islands, x, y, minDistance)) {
        const type = this.determineType(islands.length, count, playerCount)
        const island = new Island(islands.length, x, y, type)
        islands.push(island)
        this.board.placeIsland(island)
        console.log(
          `[IslandGenerator] 生成岛屿 ${island.id}: 类型=${type}, 位置=(${x},${y})`
        )
      }
    }

    if (attempts >= maxAttempts) {
      console.warn(
        `[IslandGenerator] 警告: 达到最大尝试次数，仅生成 ${islands.length}/${count} 个岛屿`
      )
    } else {
      console.log(`[IslandGenerator] 岛屿生成完成，共 ${islands.length} 个岛屿`)
    }

    return islands
  }

  /**
   * 检查位置是否有效
   */
  isValidPosition(islands, x, y, minDistance) {
    // 检查边界（留出足够空间）
    const margin = 2
    if (
      x < margin ||
      x >= this.board.size - margin ||
      y < margin ||
      y >= this.board.size - margin
    ) {
      return false
    }

    // 检查与其他岛屿的距离（曼哈顿距离）
    for (const island of islands) {
      const distance = Math.abs(x - island.x) + Math.abs(y - island.y)
      if (distance < minDistance) {
        return false
      }
    }

    return true
  }

  /**
   * 确定岛屿类型
   */
  determineType(index, total, playerCount) {
    // 前 N 个岛屿（N=玩家数）都设为 start 类型，确保每个玩家都有一个起点岛
    if (index < playerCount) return "start"
    if (index === total - 1) return "resource"
    return "normal"
  }

  /**
   * 分配岛屿给玩家
   */
  assignToPlayers(islands, playerCount) {
    console.log(`[IslandGenerator] 开始分配岛屿给 ${playerCount} 个玩家`)
    const islandsPerPlayer = Math.floor(islands.length / playerCount)
    const assignments = []

    for (let i = 0; i < playerCount; i++) {
      const playerIslands = []

      // 每个玩家分配一个起点岛
      const startIsland = islands.find(
        (island) => island.type === "start" && !island.isOwned()
      )
      if (startIsland) {
        startIsland.setOwner(i)
        playerIslands.push(startIsland)
      }

      // 分配其他岛屿
      const remainingNeeded = islandsPerPlayer - playerIslands.length
      for (let j = 0; j < remainingNeeded; j++) {
        const availableIsland = islands.find((island) => !island.isOwned())
        if (availableIsland) {
          availableIsland.setOwner(i)
          playerIslands.push(availableIsland)
        }
      }

      // 输出玩家获得的岛屿信息
      const islandIds = playerIslands.map((island) => island.id).join(", ")
      console.log(
        `[IslandGenerator] 玩家 ${i + 1} 获得 ${
          playerIslands.length
        } 个岛屿: [${islandIds}]`
      )

      assignments.push(playerIslands)
    }

    console.log("[IslandGenerator] 岛屿分配完成", assignments)
    return assignments
  }
}
