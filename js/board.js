/**
 * 棋盘类 - 管理游戏棋盘的状态和渲染
 */
class Board {
    constructor(size) {
        this.size = size;
        this.cells = [];
        this.islands = [];
        this.bridges = [];
        console.log(`[Board] 创建棋盘: ${size}x${size}`);
        this.init();
    }

    /**
     * 初始化棋盘
     */
    init() {
        for (let y = 0; y < this.size; y++) {
            this.cells[y] = [];
            for (let x = 0; x < this.size; x++) {
                this.cells[y][x] = {
                    x,
                    y,
                    type: 'empty',
                    island: null,
                    bridge: null,
                    workers: []
                };
            }
        }
        console.log(`[Board] 棋盘初始化完成，共 ${this.size * this.size} 个格子`);
    }

    /**
     * 获取指定位置的格子
     */
    getCell(x, y) {
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            return null;
        }
        return this.cells[y][x];
    }

    /**
     * 检查位置是否有效
     */
    isValidPosition(x, y) {
        return x >= 0 && x < this.size && y >= 0 && y < this.size;
    }

    /**
     * 在指定位置放置岛屿
     */
    placeIsland(island) {
        const cell = this.getCell(island.x, island.y);
        if (cell) {
            cell.type = 'island';
            cell.island = island;
            this.islands.push(island);
        }
    }

    /**
     * 在指定位置放置浮桥
     */
    placeBridge(bridge, x, y) {
        const cell = this.getCell(x, y);
        if (cell && cell.type === 'empty') {
            cell.type = 'bridge';
            cell.bridge = bridge;
            return true;
        }
        return false;
    }

    /**
     * 移动工人
     */
    moveWorker(worker, fromX, fromY, toX, toY) {
        const fromCell = this.getCell(fromX, fromY);
        const toCell = this.getCell(toX, toY);

        if (!fromCell || !toCell) return false;

        // 从原位置移除
        const index = fromCell.workers.indexOf(worker);
        if (index > -1) {
            fromCell.workers.splice(index, 1);
        }

        // 添加到新位置
        toCell.workers.push(worker);
        worker.x = toX;
        worker.y = toY;

        return true;
    }

    /**
     * 获取相邻的格子
     */
    getNeighbors(x, y) {
        const directions = [
            { dx: 0, dy: -1 }, // 上
            { dx: 0, dy: 1 },  // 下
            { dx: -1, dy: 0 }, // 左
            { dx: 1, dy: 0 }   // 右
        ];

        const neighbors = [];
        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            const cell = this.getCell(nx, ny);
            if (cell) {
                neighbors.push(cell);
            }
        }
        return neighbors;
    }

    /**
     * 获取指定范围内的所有格子
     */
    getCellsInRange(x, y, range) {
        const cells = [];
        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                if (Math.abs(dx) + Math.abs(dy) <= range) {
                    const cell = this.getCell(x + dx, y + dy);
                    if (cell) {
                        cells.push(cell);
                    }
                }
            }
        }
        return cells;
    }

    /**
     * 检查两个位置是否连通（用于胜利判定）
     */
    isConnected(x1, y1, x2, y2, playerBridges) {
        // 使用 BFS 检查连通性
        const visited = new Set();
        const queue = [{ x: x1, y: y1 }];
        visited.add(`${x1},${y1}`);

        while (queue.length > 0) {
            const { x, y } = queue.shift();

            if (x === x2 && y === y2) {
                return true;
            }

            const neighbors = this.getNeighbors(x, y);
            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;
                if (visited.has(key)) continue;

                // 可以通过岛屿或该玩家的浮桥
                if (neighbor.type === 'island' || 
                    (neighbor.type === 'bridge' && this.isPlayerBridge(neighbor, playerBridges))) {
                    visited.add(key);
                    queue.push({ x: neighbor.x, y: neighbor.y });
                }
            }
        }

        return false;
    }

    /**
     * 检查浮桥是否属于指定玩家
     */
    isPlayerBridge(cell, playerBridges) {
        return playerBridges.some(bridge => 
            bridge.cells.some(c => c.x === cell.x && c.y === cell.y)
        );
    }

    /**
     * 渲染棋盘到 DOM
     * @param {HTMLElement} container - 容器元素
     * @param {Array} players - 玩家数组（可选，用于显示岛屿颜色）
     * @param {BridgeManager} bridgeManager - 浮桥管理器（可选，用于检查连通性）
     */
    render(container, players = null, bridgeManager = null) {
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;

        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const cell = this.cells[y][x];
                const cellEl = document.createElement('div');
                cellEl.className = 'cell';
                cellEl.dataset.x = x;
                cellEl.dataset.y = y;

                if (cell.type === 'island') {
                    cellEl.classList.add('island');
                    cellEl.dataset.id = cell.island.id;
                    
                    // 如果有玩家数据，显示岛屿归属颜色
                    if (players && cell.island.owner !== null && cell.island.owner !== undefined) {
                        const owner = players[cell.island.owner];
                        if (owner) {
                            cellEl.style.backgroundColor = owner.color;
                            cellEl.classList.add(`player-${cell.island.owner + 1}-island`);
                            
                            // 标记起始岛屿
                            if (cell.island.type === 'start') {
                                cellEl.classList.add('start-island');
                            }
                            
                            // 检查是否已连通
                            if (bridgeManager) {
                                const isConnected = this.checkIslandConnected(cell.island, owner, bridgeManager);
                                if (isConnected) {
                                    cellEl.classList.add('connected-island');
                                }
                            }
                        }
                    }
                } else if (cell.type === 'bridge') {
                    cellEl.classList.add('bridge');
                }

                // 渲染工人
                if (cell.workers.length > 0) {
                    for (const worker of cell.workers) {
                        const workerEl = document.createElement('div');
                        workerEl.className = `worker player-${worker.playerId + 1}`;
                        workerEl.dataset.id = worker.id + 1;
                        workerEl.dataset.workerId = worker.id;
                        cellEl.appendChild(workerEl);
                    }
                }

                container.appendChild(cellEl);
            }
        }
    }
    
    /**
     * 检查岛屿是否已连通到起始岛屿
     */
    checkIslandConnected(targetIsland, player, bridgeManager) {
        const startIsland = player.islands.find(island => island.type === 'start');
        if (!startIsland || targetIsland === startIsland) return true;
        
        return bridgeManager.hasPathBetween(startIsland, targetIsland, player.id);
    }

    /**
     * 更新指定格子的显示
     */
    updateCell(x, y, container) {
        const cell = this.getCell(x, y);
        if (!cell) return;

        const index = y * this.size + x;
        const cellEl = container.children[index];
        if (!cellEl) return;

        // 清除现有内容
        cellEl.innerHTML = '';
        cellEl.className = 'cell';

        if (cell.type === 'island') {
            cellEl.classList.add('island');
            cellEl.dataset.id = cell.island.id;
        } else if (cell.type === 'bridge') {
            cellEl.classList.add('bridge');
        }

        // 渲染工人
        if (cell.workers.length > 0) {
            for (const worker of cell.workers) {
                const workerEl = document.createElement('div');
                workerEl.className = `worker player-${worker.playerId + 1}`;
                workerEl.dataset.id = worker.id + 1;
                workerEl.dataset.workerId = worker.id;
                cellEl.appendChild(workerEl);
            }
        }
    }

    /**
     * 输出棋盘状态日志
     */
    logBoardState() {
        console.log("[Board] ========== 棋盘状态 ==========");
        console.log(`[Board] 尺寸: ${this.size}x${this.size}`);
        console.log(`[Board] 岛屿数量: ${this.islands.length}`);
        console.log(`[Board] 浮桥数量: ${this.bridges.length}`);
        
        const islandPositions = this.islands.map(island => 
            `岛屿${island.id}(${island.x},${island.y})`
        ).join(', ');
        console.log(`[Board] 岛屿位置: ${islandPositions}`);
        console.log("[Board] ==============================");
    }
}
