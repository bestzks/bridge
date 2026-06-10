/**
 * 浮桥类 - 表示玩家搭建的浮桥
 */
class Bridge {
    constructor(playerId) {
        this.playerId = playerId;
        this.cells = []; // 浮桥占据的格子坐标数组
    }

    /**
     * 添加浮桥格子
     */
    addCell(x, y) {
        this.cells.push({ x, y });
    }

    /**
     * 检查浮桥是否包含指定格子
     */
    contains(x, y) {
        return this.cells.some(cell => cell.x === x && cell.y === y);
    }

    /**
     * 获取浮桥长度
     */
    getLength() {
        return this.cells.length;
    }

    /**
     * 检查浮桥是否连接两个岛屿
     */
    connects(island1, island2) {
        const hasIsland1 = this.cells.some(cell => 
            cell.x === island1.x && cell.y === island1.y
        );
        const hasIsland2 = this.cells.some(cell => 
            cell.x === island2.x && cell.y === island2.y
        );
        return hasIsland1 && hasIsland2;
    }

    /**
     * 获取浮桥的端点
     */
    getEndpoints() {
        if (this.cells.length === 0) return [];
        if (this.cells.length === 1) return this.cells;
        
        // 返回第一个和最后一个格子作为端点
        return [this.cells[0], this.cells[this.cells.length - 1]];
    }

    /**
     * 检查浮桥是否与指定位置相邻
     */
    isAdjacentTo(x, y) {
        for (const cell of this.cells) {
            const distance = Math.abs(cell.x - x) + Math.abs(cell.y - y);
            if (distance === 1) {
                return true;
            }
        }
        return false;
    }
}

/**
 * 浮桥管理器 - 管理所有浮桥的创建和验证
 */
class BridgeManager {
    constructor(board) {
        this.board = board;
        this.bridges = [];
    }

    /**
     * 创建新的浮桥
     */
    createBridge(playerId, startX, startY, direction) {
        const bridge = new Bridge(playerId);
        
        // 计算目标位置
        let targetX = startX;
        let targetY = startY;
        
        switch (direction) {
            case 'up': targetY--; break;
            case 'down': targetY++; break;
            case 'left': targetX--; break;
            case 'right': targetX++; break;
        }

        // 验证是否可以搭建
        if (!this.canBuildBridge(startX, startY, targetX, targetY, playerId)) {
            return null;
        }

        // 添加起点和终点
        bridge.addCell(startX, startY);
        bridge.addCell(targetX, targetY);
        
        // 在棋盘上放置浮桥
        this.board.placeBridge(bridge, targetX, targetY);
        
        this.bridges.push(bridge);
        return bridge;
    }

    /**
     * 检查是否可以搭建浮桥
     */
    canBuildBridge(fromX, fromY, toX, toY, playerId) {
        // 检查目标位置是否在棋盘内
        if (!this.board.isValidPosition(toX, toY)) {
            return false;
        }

        // 检查目标位置是否为空
        const targetCell = this.board.getCell(toX, toY);
        if (!targetCell || targetCell.type !== 'empty') {
            return false;
        }

        // 检查是否相邻
        const distance = Math.abs(fromX - toX) + Math.abs(fromY - toY);
        if (distance !== 1) {
            return false;
        }

        // 检查是否与其他玩家的浮桥相邻（保持1格距离）
        const neighbors = this.board.getNeighbors(toX, toY);
        for (const neighbor of neighbors) {
            if (neighbor.type === 'bridge') {
                // 检查是否是自己的浮桥
                const isOwnBridge = this.bridges.some(bridge => 
                    bridge.playerId === playerId && bridge.contains(neighbor.x, neighbor.y)
                );
                if (!isOwnBridge) {
                    return false; // 与其他玩家的浮桥相邻
                }
            }
        }

        return true;
    }

    /**
     * 获取玩家的所有浮桥
     */
    getPlayerBridges(playerId) {
        return this.bridges.filter(bridge => bridge.playerId === playerId);
    }

    /**
     * 检查两个岛屿之间是否有路径
     */
    hasPathBetween(island1, island2, playerId) {
        const playerBridges = this.getPlayerBridges(playerId);
        
        // 使用 BFS 查找路径
        const visited = new Set();
        const queue = [{ x: island1.x, y: island1.y }];
        visited.add(`${island1.x},${island1.y}`);

        while (queue.length > 0) {
            const { x, y } = queue.shift();

            if (x === island2.x && y === island2.y) {
                return true;
            }

            const neighbors = this.board.getNeighbors(x, y);
            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;
                if (visited.has(key)) continue;

                // 可以通过岛屿或该玩家的浮桥
                if (neighbor.type === 'island') {
                    visited.add(key);
                    queue.push({ x: neighbor.x, y: neighbor.y });
                } else if (neighbor.type === 'bridge') {
                    const isOwnBridge = playerBridges.some(bridge => 
                        bridge.contains(neighbor.x, neighbor.y)
                    );
                    if (isOwnBridge) {
                        visited.add(key);
                        queue.push({ x: neighbor.x, y: neighbor.y });
                    }
                }
            }
        }

        return false;
    }

    /**
     * 检查玩家是否连通所有目标岛屿
     */
    checkPlayerConnectivity(player) {
        const targetIslands = player.islands;
        
        if (targetIslands.length <= 1) {
            return true;
        }

        // 检查每对岛屿是否连通
        for (let i = 0; i < targetIslands.length; i++) {
            for (let j = i + 1; j < targetIslands.length; j++) {
                if (!this.hasPathBetween(targetIslands[i], targetIslands[j], player.id)) {
                    return false;
                }
            }
        }

        return true;
    }
}
