/**
 * 游戏主类 - 管理游戏状态和流程
 */
class Game {
  constructor() {
    this.status = "setup" // 'setup', 'selecting', 'playing', 'ended'
    this.playerCount = 2
    this.players = []
    this.currentPlayerIndex = 0
    this.turn = 1
    this.board = null
    this.bridgeManager = null
    this.islandGenerator = null
    this.winner = null
    this.startTime = null
    this.allIslands = [] // 所有生成的岛屿
    this.islandsPerPlayer = 0 // 每个玩家需要选择的岛屿数
    this.selectionRound = 0 // 当前选择轮次
  }

  /**
   * 设置玩家人数
   */
  setPlayerCount(count) {
    this.playerCount = count
    console.log(`[Game] 玩家人数设置为: ${count}`)
  }

  /**
   * 计算棋盘大小
   */
  calculateBoardSize() {
    const baseSizes = { 2: 15, 3: 18, 4: 21 }
    const baseIslands = { 2: 6, 3: 9, 4: 12 }
    const islandCount = IslandGenerator.getIslandCount(this.playerCount)

    const baseSize = baseSizes[this.playerCount] || 15
    const extra = Math.max(
      0,
      islandCount - (baseIslands[this.playerCount] || 6)
    )
    const size = baseSize + extra

    const finalSize = Math.min(25, Math.max(10, size))
    console.log(
      `[Game] 棋盘大小计算: 基础${baseSize} + 额外${extra} = ${finalSize}x${finalSize}`
    )
    return finalSize
  }

  /**
   * 初始化游戏（生成岛屿，进入选择阶段）
   */
  init() {
    console.log("[Game] ========== 游戏初始化开始 ==========")
    console.log(`[Game] 玩家人数: ${this.playerCount}`)

    const boardSize = this.calculateBoardSize()
    this.board = new Board(boardSize)
    this.bridgeManager = new BridgeManager(this.board)
    this.islandGenerator = new IslandGenerator(this.board)

    // 生成岛屿
    const islandCount = IslandGenerator.getIslandCount(this.playerCount)
    this.islandsPerPlayer = Math.floor(islandCount / this.playerCount)
    console.log(
      `[Game] 生成 ${islandCount} 个岛屿，每个玩家选择 ${this.islandsPerPlayer} 个`
    )

    // 生成普通岛屿（不带类型，玩家自行选择）
    this.allIslands = this.islandGenerator.generate(
      islandCount,
      this.playerCount,
      5
    )

    // 重置岛屿类型为普通（玩家选择后再决定起始岛屿）
    this.allIslands.forEach((island) => {
      island.type = "normal"
      island.owner = null
    })

    // 创建玩家（初始没有岛屿）
    const colors = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B"]
    for (let i = 0; i < this.playerCount; i++) {
      const player = {
        id: i,
        name: `玩家 ${i + 1}`,
        color: colors[i],
        islands: [], // 初始为空，由玩家选择
        workers: [],
        bridges: [],
      }
      this.players.push(player)
      console.log(`[Game] 创建玩家 ${i + 1}`)
    }

    this.status = "selecting"
    this.currentPlayerIndex = 0
    this.selectionRound = 0

    console.log(`[Game] 进入岛屿选择阶段，当前选择玩家: 玩家 1`)
    console.log("[Game] ========== 游戏初始化结束 ==========")
  }

  /**
   * 开始游戏
   */
  start() {
    this.init()
  }

  /**
   * 选择岛屿
   */
  selectIsland(islandId) {
    const island = this.allIslands.find((is) => is.id === islandId)
    if (!island || island.owner !== null) {
      console.log(`[Game] 岛屿 ${islandId} 已被选择或不存在`)
      return false
    }

    const player = this.players[this.currentPlayerIndex]
    island.owner = player.id
    player.islands.push(island)

    console.log(
      `[Game] ${player.name} 选择岛屿 ${islandId}，位置(${island.x},${island.y})`
    )

    return true
  }

  /**
   * 切换到下一个选择玩家
   */
  nextSelectingPlayer() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.playerCount

    // 如果回到第一个玩家，说明一轮选择完成
    if (this.currentPlayerIndex === 0) {
      this.selectionRound++
    }

    const player = this.players[this.currentPlayerIndex]
    console.log(
      `[Game] 轮到 ${player.name} 选择岛屿（第 ${this.selectionRound + 1} 轮）`
    )
  }

  /**
   * 检查选择阶段是否结束
   */
  isSelectionComplete() {
    return this.players.every(
      (player) => player.islands.length >= this.islandsPerPlayer
    )
  }

  /**
   * 设置起始岛屿
   */
  setStartIsland(playerId, islandId) {
    const player = this.players[playerId]
    const island = player.islands.find((is) => is.id === islandId)

    if (!island) {
      console.log(`[Game] 岛屿 ${islandId} 不属于玩家 ${playerId + 1}`)
      return false
    }

    // 重置该玩家所有岛屿类型
    player.islands.forEach((is) => (is.type = "normal"))

    // 设置选中的岛屿为起始岛屿
    island.type = "start"
    console.log(`[Game] ${player.name} 设置岛屿 ${islandId} 为起始岛屿`)

    return true
  }

  /**
   * 开始游戏主阶段（选择完成后调用）
   */
  startGamePhase() {
    console.log("[Game] ========== 岛屿选择完成 ==========")

    // 为每个玩家设置默认起始岛屿（如果没有设置的话）
    this.players.forEach((player) => {
      // 找到该玩家的起始岛屿，或设置第一个岛屿为起始岛屿
      let startIsland = player.islands.find((is) => is.type === "start")
      if (!startIsland && player.islands.length > 0) {
        startIsland = player.islands[0]
        startIsland.type = "start"
        console.log(
          `[Game] ${player.name} 默认设置岛屿 ${startIsland.id} 为起始岛屿`
        )
      }

      // 在起始岛屿上创建工人
      if (startIsland) {
        const worker1 = new Worker(player.id * 2, player.id, startIsland)
        const worker2 = new Worker(player.id * 2 + 1, player.id, startIsland)

        player.workers.push(worker1, worker2)

        // 将工人放置到棋盘上
        this.board
          .getCell(startIsland.x, startIsland.y)
          .workers.push(worker1, worker2)

        console.log(
          `[Game] ${player.name} 的工人初始位置: (${startIsland.x}, ${startIsland.y})`
        )
      }
    })

    this.status = "playing"
    // 操作阶段从最后一个玩家开始（倒序）
    this.currentPlayerIndex = this.playerCount - 1
    this.turn = 1
    this.startTime = Date.now()

    console.log(
      `[Game] 进入游戏主阶段，当前玩家: 玩家 ${
        this.currentPlayerIndex + 1
      }，回合: 1`
    )
    console.log("[Game] ========== 游戏开始 ==========")
  }

  /**
   * 获取当前玩家
   */
  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex]
  }

  /**
   * 切换到下一个玩家（倒序：玩家N -> 玩家N-1 -> ... -> 玩家1 -> 玩家N）
   */
  nextPlayer() {
    const prevPlayer = this.getCurrentPlayer()
    console.log(`[Game] 回合切换: ${prevPlayer.name} 结束回合`)

    // 重置当前玩家的工人状态
    for (const worker of prevPlayer.workers) {
      worker.reset()
    }

    // 倒序切换到下一个玩家
    this.currentPlayerIndex--
    if (this.currentPlayerIndex < 0) {
      this.currentPlayerIndex = this.playerCount - 1
      this.turn++
      console.log(`[Game] 进入第 ${this.turn} 回合`)
    }
    const nextPlayer = this.getCurrentPlayer()

    console.log(`[Game] 当前玩家: ${nextPlayer.name}`)
  }

  /**
   * 检查胜利条件
   */
  checkWin() {
    console.log("[Game] 检查胜利条件...")
    for (const player of this.players) {
      const isConnected = this.bridgeManager.checkPlayerConnectivity(player)
      console.log(
        `[Game] ${player.name} 连通性检查: ${isConnected ? "已连通" : "未连通"}`
      )

      if (isConnected) {
        this.winner = player
        this.status = "ended"
        console.log(`[Game] 🎉 ${player.name} 获胜!`)
        return true
      }
    }
    return false
  }

  /**
   * 获取游戏时长
   */
  getGameDuration() {
    if (!this.startTime) return "00:00"
    const duration = Math.floor((Date.now() - this.startTime) / 1000)
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`
  }

  /**
   * 重置游戏
   */
  reset() {
    console.log("[Game] 游戏重置")
    this.status = "setup"
    this.players = []
    this.currentPlayerIndex = 0
    this.turn = 1
    this.board = null
    this.bridgeManager = null
    this.islandGenerator = null
    this.winner = null
    this.startTime = null
    this.allIslands = []
    this.islandsPerPlayer = 0
    this.selectionRound = 0
  }

  /**
   * 选择工人
   */
  selectWorker(workerId) {
    const player = this.getCurrentPlayer()
    const worker = player.workers.find((w) => w.id === workerId)
    if (worker) {
      console.log(`[Game] 选择工人 ${workerId}: 位置(${worker.x}, ${worker.y})`)
    }
    return worker
  }

  /**
   * 移动工人
   */
  moveWorker(workerId, targetX, targetY) {
    const worker = this.selectWorker(workerId)
    if (!worker || worker.hasActed) {
      return false
    }

    const fromX = worker.x
    const fromY = worker.y
    const success = worker.move(this.board, targetX, targetY)

    if (success) {
      const steps = Math.abs(targetX - fromX) + Math.abs(targetY - fromY)
      console.log(
        `[Game] 工人 ${workerId} 移动: (${fromX},${fromY}) -> (${targetX},${targetY}), 步数: ${steps}`
      )
      // 检查胜利条件
      this.checkWin()
    }
    return success
  }

  /**
   * 搭建浮桥
   */
  buildBridge(workerId, direction) {
    const worker = this.selectWorker(workerId)
    if (!worker || worker.hasActed) {
      return null
    }

    const bridge = worker.buildBridge(this.board, this.bridgeManager, direction)
    if (bridge) {
      // 添加到玩家的浮桥列表
      const player = this.getCurrentPlayer()
      player.bridges.push(bridge)

      console.log(
        `[Game] 工人 ${workerId} 搭建浮桥: 方向=${direction}, 位置=(${
          bridge.cells[bridge.cells.length - 1].x
        },${bridge.cells[bridge.cells.length - 1].y}), 玩家浮桥总数: ${
          player.bridges.length
        }`
      )

      // 检查胜利条件
      this.checkWin()
    }
    return bridge
  }

  /**
   * 结束当前玩家的回合
   */
  endTurn() {
    console.log(`[Game] ${this.getCurrentPlayer().name} 结束回合`)
    this.nextPlayer()
  }

  /**
   * 获取指定位置的内容
   */
  getCellAt(x, y) {
    return this.board.getCell(x, y)
  }

  /**
   * 获取指定位置的工人（当前玩家的）
   */
  getWorkerAt(x, y) {
    const player = this.getCurrentPlayer()
    return player.workers.find((w) => w.x === x && w.y === y)
  }

  /**
   * 检查是否可以结束回合
   */
  canEndTurn() {
    const player = this.getCurrentPlayer()
    return player.workers.every((w) => w.hasActed)
  }

  /**
   * 输出游戏结束日志
   */
  logGameEnd() {
    if (this.winner) {
      console.log("[Game] ========== 游戏结束 ==========")
      console.log(`[Game] 获胜者: ${this.winner.name}`)
      console.log(`[Game] 游戏时长: ${this.getGameDuration()}`)
      console.log(`[Game] 总回合数: ${this.turn}`)
      console.log("[Game] ========== 游戏统计 ==========")
      this.players.forEach((player) => {
        console.log(`[Game] ${player.name}: ${player.bridges.length} 座浮桥`)
      })
    }
  }
}
