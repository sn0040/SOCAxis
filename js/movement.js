/**
 * 战棋推演沙盘 - 移动系统
 */

const Movement = {
    // 判断格子是否可通行
    isCellPassable(row, col, movingPiece, checkEnemy = true) {
        if (row < 0 || row >= State.rows || col < 0 || col >= State.cols) return false;
        const terrain = State.gridTerrain[row][col];
        if (terrain === 'wall') return false;
        if (terrain === 'water') return false;
        if (terrain && typeof terrain === 'object' && terrain.type === 'custom') return true;
        
        // 推演模式下，旗子不可通行
        if (State.currentMode === 'play' && State.playTerrain[row] && State.playTerrain[row][col] === 'flag') {
            return false;
        }
        
        if (checkEnemy) {
            const other = State.getPieceAt(row, col);
            if (other && other !== movingPiece) {
                if (other.team !== movingPiece.team) return false;
            }
        }
        return true;
    },
    
    // 目标格是否可停留
    isMoveTargetWalkable(row, col, movingPiece) {
        if (row < 0 || row >= State.rows || col < 0 || col >= State.cols) return false;
        if (State.getPieceAt(row, col)) return false;
        const terrain = State.gridTerrain[row][col];
        if (terrain === 'wall') return false;
        if (terrain === 'water') return false;
        if (terrain && typeof terrain === 'object' && terrain.type === 'custom') return true;
        return true;
    },
    
    // BFS 寻路
    findPath(fromRow, fromCol, toRow, toCol, movingPiece) {
        const queue = [{ row: fromRow, col: fromCol, path: [] }];
        const visited = Array(State.rows).fill().map(() => Array(State.cols).fill(false));
        visited[fromRow][fromCol] = true;
        const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
        
        while (queue.length > 0) {
            const { row, col, path } = queue.shift();
            if (row === toRow && col === toCol) return path;
            
            for (let [dr, dc] of dirs) {
                const nr = row + dr, nc = col + dc;
                if (nr >= 0 && nr < State.rows && nc >= 0 && nc < State.cols && !visited[nr][nc]) {
                    if (this.isCellPassable(nr, nc, movingPiece, true)) {
                        visited[nr][nc] = true;
                        queue.push({ row: nr, col: nc, path: [...path, { row: nr, col: nc }] });
                    }
                }
            }
        }
        return [];
    },
    
    // 获取棋子的有效速度（基础速度 + buff）
    getEffectiveSpeed(piece) {
        let speed = piece.speed;
        if (piece.speedBuffs && piece.speedBuffs.length > 0) {
            piece.speedBuffs.forEach(buff => {
                speed += buff.value;
            });
        }
        return speed;
    },
    
    // 计算行动顺序（按有效速度排序，未行动的在前，已行动的在后）
    calculateActionOrders() {
        if (State.pieces.length === 0) return;
        
        // 分离已行动和未行动的棋子
        const actedPieces = State.pieces.filter(p => p.hasActedThisTurn);
        const unactedPieces = State.pieces.filter(p => !p.hasActedThisTurn);
        
        // 未行动的按有效速度降序排，已行动的按有效速度降序排
        unactedPieces.sort((a, b) => this.getEffectiveSpeed(b) - this.getEffectiveSpeed(a));
        actedPieces.sort((a, b) => this.getEffectiveSpeed(b) - this.getEffectiveSpeed(a));
        
        // 合并：未行动的在前，已行动的在后
        const sortedPieces = [...unactedPieces, ...actedPieces];
        
        // 分配行动顺序
        sortedPieces.forEach((piece, index) => {
            const originalPiece = State.pieces.find(p => p.row === piece.row && p.col === piece.col);
            if (originalPiece) {
                originalPiece.actionOrder = index + 1;
            }
        });
    },
    
    // 获取当前可行动的棋子（直接按 actionOrder 查找，不使用缓存）
    getCurrentActor() {
        this.calculateActionOrders();
        // 找到 actionOrder === 1 且未行动的棋子
        const actor = State.pieces.find(p => p.actionOrder === 1 && !p.hasActedThisTurn);
        return actor;
    },
    
    // 棋子行动后更新顺序，同时递减所有棋子的调速 buff 计数器
    pieceActed(piece) {
        piece.hasActedThisTurn = true;
        
        // 递减当前行动棋子的 speedBuffs
        if (piece.speedBuffs && piece.speedBuffs.length > 0) {
            piece.speedBuffs = piece.speedBuffs.map(buff => ({
                ...buff,
                remainingTurns: buff.remainingTurns - 1
            })).filter(buff => buff.remainingTurns > 0);
        }
        
        // 检查是否所有棋子都已行动
        const allActed = State.pieces.every(p => p.hasActedThisTurn);
        if (allActed) {
            // 新回合开始，重置所有棋子的行动状态
            State.pieces.forEach(p => p.hasActedThisTurn = false);
        }
        
        // 重新计算行动顺序
        this.calculateActionOrders();
    }
};