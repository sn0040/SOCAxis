/**
 * 战棋推演沙盘 - 游戏逻辑系统
 */

const Game = {
    // 推演阶段移动棋子
    playMovePiece(fromRow, fromCol, toRow, toCol, customPathPoints = null) {
        if (fromRow === toRow && fromCol === toCol) return false;
        
        const piece = State.getPieceAt(fromRow, fromCol);
        if (!piece) return false;
        
        if (State.currentMode === 'play') {
            const currentActor = Movement.getCurrentActor();
            if (!currentActor || piece.row !== currentActor.row || piece.col !== currentActor.col) {
                UI.showToast('只能移动当前行动的棋子');
                return false;
            }
        }
        
        if (!Movement.isMoveTargetWalkable(toRow, toCol, piece)) {
            UI.showToast('目标位置不可通行');
            return false;
        }
        
        let pathPoints;
        if (customPathPoints && customPathPoints.length > 0) {
            pathPoints = customPathPoints;
            const last = pathPoints[pathPoints.length - 1];
            if (last && (last.row !== toRow || last.col !== toCol)) {
                pathPoints.push({ row: toRow, col: toCol });
            }
        } else {
            pathPoints = Movement.findPath(fromRow, fromCol, toRow, toCol, piece);
        }
        
        if (pathPoints.length === 0) {
            UI.showToast('没有可行路径');
            return false;
        }
        
        State.ghosts.push({ row: fromRow, col: fromCol, team: piece.team, name: piece.name });
        piece.row = toRow;
        piece.col = toCol;
        State.pathLines.push({ fromRow, fromCol, toRow, toCol, team: piece.team, customPoints: pathPoints });
        
        State.stepCounter++;
        const pieceDesc = `${piece.team === 'self' ? '己' : '敌'}方-${piece.name}`;
        const fromCoord = `(${fromRow+1},${fromCol+1})`;
        const toCoord = `(${toRow+1},${toCol+1})`;
        const snapshot = State.saveSnapshot();
        const logEntry = { 
            stepNumber: State.stepCounter, 
            pieceDesc, 
            from: fromCoord, 
            to: toCoord, 
            remark: '', 
            snapshot 
        };
        State.moveLogs.push(logEntry);
        State.moveSnapshots.push(snapshot);
        UI.updateLogDisplay();
        Renderer.drawBoard();
        return true;
    },
    
    // 清除路径和痕迹
    clearPathAndGhosts() {
        if (State.isViewingStep) this.clearViewingMode();
        State.pathLines = [];
        State.ghosts = [];
        State.pieces.forEach(p => p.hasActedThisTurn = false);
        Movement.calculateActionOrders();
        Renderer.drawBoard();
    },
    
    // 重置到初始状态
    resetToInitial() {
        if (State.isViewingStep) this.clearViewingMode();
        if (State.initialSnapshot) {
            State.restoreSnapshot(State.initialSnapshot);
        } else {
            State.initialSnapshot = State.saveSnapshot();
            State.restoreSnapshot(State.initialSnapshot);
        }
        State.moveLogs = [];
        State.moveSnapshots = [State.initialSnapshot];
        State.stepCounter = 0;
        UI.updateLogDisplay();
        Renderer.drawBoard();
    },
    
    // 设置初始快照
    setInitialSnapshot() {
        State.initialSnapshot = State.saveSnapshot();
        State.moveLogs = [];
        State.stepCounter = 0;
        State.moveSnapshots = [State.initialSnapshot];
        UI.updateLogDisplay();
    },
    
    // 回退到指定步骤
    rollbackToStep(stepNumber) {
        if (State.isViewingStep) this.clearViewingMode();
        const index = State.moveLogs.findIndex(log => log.stepNumber === stepNumber);
        if (index === -1) return;
        
        const snapshot = State.moveLogs[index].snapshot;
        State.restoreSnapshot(snapshot);
        State.moveLogs = State.moveLogs.slice(0, index + 1);
        State.moveSnapshots = State.moveSnapshots.slice(0, index + 1);
        State.stepCounter = State.moveLogs.length;
        UI.updateLogDisplay();
        Renderer.drawBoard();
    },
    
    // 查看指定步骤
    viewStep(stepNumber) {
        if (State.isViewingStep) this.clearViewingMode();
        
        const log = State.moveLogs.find(l => l.stepNumber === stepNumber);
        if (!log) return;
        
        State.savedCurrentSnapshot = State.saveSnapshot();
        State.isViewingStep = true;
        State.viewingStepNumber = stepNumber;
        State.restoreSnapshot(log.snapshot);
        
        const el = UI.elements;
        el.viewReturnArea.innerHTML = `<button id="returnFromViewBtn" class="return-btn">🔙 返回当前步 (第${State.stepCounter}步)</button>`;
        document.getElementById('returnFromViewBtn').addEventListener('click', () => {
            this.clearViewingMode();
        });
        
        UI.updateLogDisplay();
        Renderer.drawBoard();
    },
    
    // 清除查看模式
    clearViewingMode() {
        if (State.isViewingStep && State.savedCurrentSnapshot) {
            State.restoreSnapshot(State.savedCurrentSnapshot);
            State.savedCurrentSnapshot = null;
            State.isViewingStep = false;
            State.viewingStepNumber = null;
            UI.elements.viewReturnArea.innerHTML = '';
            UI.updateLogDisplay();
            Renderer.drawBoard();
        }
    },
    
    // 行动结束（原待机）
    doStandby() {
        if (State.isViewingStep) {
            UI.showToast('请先点击「返回当前步」退出查看模式');
            return;
        }
        if (State.currentMode !== 'play') return;
        
        const currentActor = Movement.getCurrentActor();
        if (!currentActor) return;
        
        State.stepCounter++;
        const pieceDesc = `${currentActor.team === 'self' ? '己' : '敌'}方-${currentActor.name}`;
        const snapshot = State.saveSnapshot();
        const logEntry = {
            stepNumber: State.stepCounter,
            pieceDesc,
            from: '行动结束',
            to: '',
            remark: '',
            snapshot,
            isStandby: true
        };
        State.moveLogs.push(logEntry);
        State.moveSnapshots.push(snapshot);
        
        Movement.pieceActed(currentActor);
        
        UI.updateLogDisplay();
        Renderer.drawBoard();
    },
    
    // 调速（选择目标棋子后执行）
    doSpeedAdjust(row, col) {
        if (State.isViewingStep) {
            UI.showToast('请先点击「返回当前步」退出查看模式');
            State.speedAdjustMode = false;
            this.clearSpeedAdjustHint();
            return;
        }
        if (State.currentMode !== 'play') {
            State.speedAdjustMode = false;
            this.clearSpeedAdjustHint();
            return;
        }
        
        const targetPiece = State.getPieceAt(row, col);
        if (!targetPiece) return false;
        
        const currentActor = Movement.getCurrentActor();
        if (!currentActor) {
            State.speedAdjustMode = false;
            this.clearSpeedAdjustHint();
            return;
        }
        
        let turns = State.speedAdjustTurns;
        
        targetPiece.speedBuffs.push({
            value: State.speedAdjustValue,
            remainingTurns: turns
        });
        
        State.stepCounter++;
        const sourceDesc = `${currentActor.team === 'self' ? '己' : '敌'}方-${currentActor.name}`;
        const targetDesc = targetPiece === currentActor ? '自身' : `${targetPiece.team === 'self' ? '己' : '敌'}方-${targetPiece.name}`;
        const sign = State.speedAdjustValue >= 0 ? '+' : '';
        const snapshot = State.saveSnapshot();
        const logEntry = {
            stepNumber: State.stepCounter,
            pieceDesc: sourceDesc,
            from: '调速',
            to: `${targetDesc} ${sign}${State.speedAdjustValue}（${turns}次）`,
            remark: '',
            snapshot,
            isSpeedAdjust: true
        };
        State.moveLogs.push(logEntry);
        State.moveSnapshots.push(snapshot);
        
        State.speedAdjustMode = false;
        State.speedAdjustValue = 0;
        State.speedAdjustTurns = 2;
        this.clearSpeedAdjustHint();
        
        Movement.calculateActionOrders();
        
        UI.updateLogDisplay();
        Renderer.drawBoard();
        return true;
    },
    
    // 清除调速提示
    clearSpeedAdjustHint() {
        if (State.speedAdjustHintTimer) {
            clearInterval(State.speedAdjustHintTimer);
            State.speedAdjustHintTimer = null;
        }
        State.speedAdjustHintVisible = false;
    },
    
    // 启动调速左上角闪烁提示
    startSpeedAdjustHint() {
        this.clearSpeedAdjustHint();
        let flashCount = 0;
        const maxFlashes = 6;
        State.speedAdjustHintVisible = true;
        Renderer.drawBoard();
        
        State.speedAdjustHintTimer = setInterval(() => {
            flashCount++;
            State.speedAdjustHintVisible = !State.speedAdjustHintVisible;
            Renderer.drawBoard();
            if (flashCount >= maxFlashes) {
                this.clearSpeedAdjustHint();
                Renderer.drawBoard();
            }
        }, 333);
    },
    
    // 取消调速模式（点击空白处）
    cancelSpeedAdjust() {
        State.speedAdjustMode = false;
        State.speedAdjustValue = 0;
        State.speedAdjustTurns = 2;
        this.clearSpeedAdjustHint();
        Renderer.drawBoard();
    },
    
    // 移除棋子
    removePiece(row, col) {
        const piece = State.getPieceAt(row, col);
        if (!piece) return false;
        
        if (State.currentMode === 'play' && State.pieces.length <= 1) {
            UI.showToast('不能移除最后一个棋子');
            return false;
        }
        
        State.removePieceAt(row, col);
        Movement.calculateActionOrders();
        Renderer.drawBoard();
        return true;
    },
    
    // ========== 换位（任意两个棋子） ==========
    doSwap(firstRow, firstCol, secondRow, secondCol) {
        const firstPiece = State.getPieceAt(firstRow, firstCol);
        const secondPiece = State.getPieceAt(secondRow, secondCol);
        if (!firstPiece || !secondPiece) {
            UI.showToast('棋子不存在');
            return false;
        }
        if (firstPiece === secondPiece) {
            UI.showToast('不能与自身换位');
            return false;
        }
        if (firstPiece.isLarge || secondPiece.isLarge) {
            UI.showToast('无法与大型单位（3x3）换位');
            return false;
        }
        const terrain1 = State.gridTerrain[secondRow][secondCol];
        const terrain2 = State.gridTerrain[firstRow][firstCol];
        if (terrain1 === 'wall' || terrain1 === 'water') {
            UI.showToast('目标位置不可通行');
            return false;
        }
        if (terrain2 === 'wall' || terrain2 === 'water') {
            UI.showToast('源位置不可通行');
            return false;
        }
        
        const firstRowOld = firstPiece.row, firstColOld = firstPiece.col;
        firstPiece.row = secondRow;
        firstPiece.col = secondCol;
        secondPiece.row = firstRowOld;
        secondPiece.col = firstColOld;
        
        State.stepCounter++;
        const firstDesc = `${firstPiece.team === 'self' ? '己' : '敌'}方-${firstPiece.name}`;
        const secondDesc = `${secondPiece.team === 'self' ? '己' : '敌'}方-${secondPiece.name}`;
        const snapshot = State.saveSnapshot();
        const logEntry = {
            stepNumber: State.stepCounter,
            pieceDesc: firstDesc,
            from: `(${firstRowOld+1},${firstColOld+1})`,
            to: `与 ${secondDesc} 换位至 (${secondRow+1},${secondCol+1})`,
            remark: '',
            snapshot,
            isSwap: true
        };
        State.moveLogs.push(logEntry);
        State.moveSnapshots.push(snapshot);
        
        UI.updateLogDisplay();
        Renderer.drawBoard();
        return true;
    },
    
    // ========== 击退（直线/斜线移动，移动到拖拽终点） ==========
    doKnockback(currentRow, currentCol, targetRow, targetCol, destRow, destCol) {
        // 检查当前行动棋子
        const currentActor = Movement.getCurrentActor();
        if (!currentActor || currentActor.row !== currentRow || currentActor.col !== currentCol) {
            UI.showToast('只能由当前行动的棋子发起击退');
            return false;
        }
        const targetPiece = State.getPieceAt(targetRow, targetCol);
        if (!targetPiece) {
            UI.showToast('目标棋子不存在');
            return false;
        }
        
        // 计算方向
        const dr = Math.sign(destRow - targetRow);
        const dc = Math.sign(destCol - targetCol);
        if (dr === 0 && dc === 0) {
            UI.showToast('击退终点与棋子位置相同');
            return false;
        }
        if (Math.abs(dr) > 1 || Math.abs(dc) > 1) {
            UI.showToast('击退方向必须是直线或斜线');
            return false;
        }
        
        // 检查路径（不含起点，含终点）
        let currentR = targetRow;
        let currentC = targetCol;
        while (currentR !== destRow || currentC !== destCol) {
            const nextR = currentR + dr;
            const nextC = currentC + dc;
            if (nextR < 0 || nextR >= State.rows || nextC < 0 || nextC >= State.cols) {
                UI.showToast('击退路径超出棋盘边界');
                return false;
            }
            const terrain = State.gridTerrain[nextR][nextC];
            if (terrain === 'wall' || terrain === 'water') {
                UI.showToast('击退路径上有不可通行的地形');
                return false;
            }
            if (State.getPieceAt(nextR, nextC) && !(nextR === targetRow && nextC === targetCol)) {
                UI.showToast('击退路径上有其他棋子阻挡');
                return false;
            }
            currentR = nextR;
            currentC = nextC;
        }
        
        // 执行移动
        const oldRow = targetPiece.row, oldCol = targetPiece.col;
        targetPiece.row = destRow;
        targetPiece.col = destCol;
        
        State.stepCounter++;
        const pieceDesc = `${targetPiece.team === 'self' ? '己' : '敌'}方-${targetPiece.name}`;
        const fromCoord = `(${oldRow+1},${oldCol+1})`;
        const toCoord = `(${destRow+1},${destCol+1})`;
        const snapshot = State.saveSnapshot();
        const logEntry = {
            stepNumber: State.stepCounter,
            pieceDesc,
            from: fromCoord,
            to: toCoord + ' (击退)',
            remark: '',
            snapshot,
            isKnockback: true
        };
        State.moveLogs.push(logEntry);
        State.moveSnapshots.push(snapshot);
        
        UI.updateLogDisplay();
        Renderer.drawBoard();
        return true;
    },
    
    // ========== 推演状态保存与恢复（用于切换模式时保留步骤） ==========
    // 保存当前推演状态（路径、幽灵、移动记录等）
    savePlayState() {
        State.savedPlayState = {
            snapshot: State.saveSnapshot(),
            moveLogs: [...State.moveLogs],
            stepCounter: State.stepCounter,
            moveSnapshots: [...State.moveSnapshots],
            initialSnapshot: State.initialSnapshot ? JSON.parse(JSON.stringify(State.initialSnapshot)) : null,
            pathLines: [...State.pathLines],
            ghosts: [...State.ghosts]
        };
    },
    
    // 恢复保存的推演状态
    restorePlayState() {
        if (!State.savedPlayState) return false;
        const saved = State.savedPlayState;
        State.restoreSnapshot(saved.snapshot);
        State.moveLogs = saved.moveLogs;
        State.stepCounter = saved.stepCounter;
        State.moveSnapshots = saved.moveSnapshots;
        State.initialSnapshot = saved.initialSnapshot;
        State.pathLines = saved.pathLines;
        State.ghosts = saved.ghosts;
        State.savedPlayState = null;
        UI.updateLogDisplay();
        Renderer.drawBoard();
        return true;
    },
    
    // 清除所有推演痕迹，恢复到当前布局的初始状态（第0步）
    clearPlayTracesAndReset() {
        State.pathLines = [];
        State.ghosts = [];
        State.moveLogs = [];
        State.stepCounter = 0;
        State.moveSnapshots = [State.saveSnapshot()];
        State.initialSnapshot = State.saveSnapshot();
        UI.updateLogDisplay();
        Renderer.drawBoard();
    },
    
    // 调整棋盘大小
    resizeBoard() {
        if (State.isViewingStep) this.clearViewingMode();
        
        let newRows = parseInt(UI.elements.rowsInput.value);
        let newCols = parseInt(UI.elements.colsInput.value);
        
        if (isNaN(newRows)) newRows = CONFIG.DEFAULT_ROWS;
        if (isNaN(newCols)) newCols = CONFIG.DEFAULT_COLS;
        
        newRows = Math.min(CONFIG.MAX_SIZE, Math.max(CONFIG.MIN_SIZE, newRows));
        newCols = Math.min(CONFIG.MAX_SIZE, Math.max(CONFIG.MIN_SIZE, newCols));
        
        State.rows = newRows;
        State.cols = newCols;
        State.init();
        Renderer.resizeCanvas();
        Renderer.drawBoard();
    },
    
    // 扩大棋盘
    expandBoard() {
        if (State.isViewingStep) this.clearViewingMode();
        
        const newRows = State.rows + 2;
        const newCols = State.cols + 2;
        
        if (newRows > CONFIG.MAX_SIZE || newCols > CONFIG.MAX_SIZE) {
            UI.showToast(`棋盘不能超过${CONFIG.MAX_SIZE}x${CONFIG.MAX_SIZE}`);
            return;
        }
        
        const newTerrain = State.createEmptyTerrain(newRows, newCols);
        for (let r = 0; r < State.rows; r++) {
            for (let c = 0; c < State.cols; c++) {
                newTerrain[r + 1][c + 1] = State.gridTerrain[r][c];
            }
        }
        
        State.pieces.forEach(p => { p.row += 1; p.col += 1; });
        State.pathLines.forEach(path => {
            path.fromRow += 1; path.fromCol += 1;
            path.toRow += 1; path.toCol += 1;
            if (path.customPoints) {
                path.customPoints.forEach(pt => { pt.row += 1; pt.col += 1; });
            }
        });
        
        State.rows = newRows;
        State.cols = newCols;
        State.gridTerrain = newTerrain;
        
        Renderer.resizeCanvas();
        State.initialSnapshot = State.saveSnapshot();
        if (State.moveSnapshots.length > 0) State.moveSnapshots[0] = State.initialSnapshot;
        
        Renderer.drawBoard();
        UI.elements.rowsInput.value = State.rows;
        UI.elements.colsInput.value = State.cols;
    },
    
    // 缩小棋盘
    shrinkBoard() {
        if (State.isViewingStep) this.clearViewingMode();
        
        if (State.rows <= CONFIG.MIN_SIZE || State.cols <= CONFIG.MIN_SIZE) {
            UI.showToast(`棋盘已经是最小尺寸（${CONFIG.MIN_SIZE}x${CONFIG.MIN_SIZE}）`);
            return;
        }
        
        const newRows = State.rows - 2;
        const newCols = State.cols - 2;
        
        State.pieces = State.pieces.filter(p => 
            p.row >= 1 && p.row < State.rows - 1 && p.col >= 1 && p.col < State.cols - 1
        );
        State.pathLines = State.pathLines.filter(path =>
            path.fromRow >= 1 && path.fromRow < State.rows - 1 && 
            path.fromCol >= 1 && path.fromCol < State.cols - 1 &&
            path.toRow >= 1 && path.toRow < State.rows - 1 && 
            path.toCol >= 1 && path.toCol < State.cols - 1
        );
        
        State.pieces.forEach(p => { p.row -= 1; p.col -= 1; });
        State.pathLines.forEach(path => {
            path.fromRow -= 1; path.fromCol -= 1;
            path.toRow -= 1; path.toCol -= 1;
            if (path.customPoints) {
                path.customPoints.forEach(pt => { pt.row -= 1; pt.col -= 1; });
            }
        });
        
        const newTerrain = State.createEmptyTerrain(newRows, newCols);
        for (let r = 1; r < State.rows - 1; r++) {
            for (let c = 1; c < State.cols - 1; c++) {
                newTerrain[r - 1][c - 1] = State.gridTerrain[r][c];
            }
        }
        
        State.rows = newRows;
        State.cols = newCols;
        State.gridTerrain = newTerrain;
        
        Renderer.resizeCanvas();
        State.initialSnapshot = State.saveSnapshot();
        if (State.moveSnapshots.length > 0) State.moveSnapshots[0] = State.initialSnapshot;
        
        Renderer.drawBoard();
        UI.elements.rowsInput.value = State.rows;
        UI.elements.colsInput.value = State.cols;
    },
    
    // 保存棋盘
    saveBoard() {
        const state = {
            rows: State.rows,
            cols: State.cols,
            terrain: State.gridTerrain.map(row => {
                if (row === null) return null;
                return row.map(cell => {
                    if (cell === null) return null;
                    if (typeof cell === 'object') return { ...cell };
                    return cell;
                });
            }),
            playTerrain: State.playTerrain.map(row => {
                if (row === null) return null;
                return row.map(cell => {
                    if (cell === null) return null;
                    if (typeof cell === 'object') return { ...cell };
                    return cell;
                });
            }),
            pieces: State.pieces.map(p => ({ 
                ...p, 
                speedBuffs: p.speedBuffs ? p.speedBuffs.map(b => ({ ...b })) : [] 
            })),
            paths: State.pathLines.map(p => ({ ...p })),
            ghosts: State.ghosts.map(g => ({ ...g })),
            moveLogs: State.moveLogs,
            stepCounter: State.stepCounter,
            moveSnapshots: State.moveSnapshots,
            initialSnapshot: State.initialSnapshot,
            customTerrains: State.customTerrains.map(t => ({ label: t.label }))
        };
        
        const dataStr = JSON.stringify(state, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wargame_${new Date().toISOString().slice(0, 19)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    // 加载棋盘
    loadBoard() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    
                    State.rows = data.rows;
                    State.cols = data.cols;
                    State.gridTerrain = data.terrain.map(row => {
                        if (!row) return null;
                        return row.map(cell => {
                            if (cell === null) return null;
                            if (typeof cell === 'object') return { ...cell };
                            return cell;
                        });
                    });
                    if (data.playTerrain) {
                        State.playTerrain = data.playTerrain.map(row => {
                            if (!row) return null;
                            return row.map(cell => {
                                if (cell === null) return null;
                                if (typeof cell === 'object') return { ...cell };
                                return cell;
                            });
                        });
                    } else {
                        State.playTerrain = State.createEmptyTerrain(State.rows, State.cols);
                    }
                    State.pieces = data.pieces.map(p => ({ ...p }));
                    State.pathLines = data.paths.map(p => ({ ...p }));
                    State.ghosts = data.ghosts.map(g => ({ ...g }));
                    State.moveLogs = data.moveLogs;
                    State.stepCounter = data.stepCounter;
                    State.moveSnapshots = data.moveSnapshots;
                    State.initialSnapshot = data.initialSnapshot;
                    
                    if (data.customTerrains) {
                        document.querySelectorAll('.terrain-btn[data-custom]').forEach(btn => btn.remove());
                        State.customTerrains = [];
                        data.customTerrains.forEach(c => {
                            Terrain.addCustomButton(c.label);
                        });
                    }
                    
                    Renderer.resizeCanvas();
                    UI.elements.rowsInput.value = State.rows;
                    UI.elements.colsInput.value = State.cols;
                    UI.updateLogDisplay();
                    Renderer.drawBoard();
                } catch (err) {
                    UI.showToast('文件格式错误！');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
};