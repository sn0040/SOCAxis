/**
 * 战棋推演沙盘 - 输入处理系统
 */

const Input = {
    // 初始化画布事件绑定
    init() {
        const canvas = document.getElementById('boardCanvas');
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('click', (e) => this.onCanvasClick(e));
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    },
    
    // 从像素坐标获取格子坐标
    getGridFromPixel(clientX, clientY) {
        const canvas = document.getElementById('boardCanvas');
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = (clientX - rect.left) * scaleX;
        const canvasY = (clientY - rect.top) * scaleY;
        
        State.lastMouseX = clientX;
        State.lastMouseY = clientY;
        
        if (canvasX < 0 || canvasY < 0) return null;
        
        const col = Math.floor(canvasX / State.cellW);
        const row = Math.floor(canvasY / State.cellH);
        
        if (row >= 0 && row < State.rows && col >= 0 && col < State.cols) {
            return { row, col };
        }
        return null;
    },
    
    // 鼠标按下
    onMouseDown(e) {
        if (State.isViewingStep) {
            UI.showToast('请先点击「返回当前步」退出查看模式');
            return;
        }
        if (State.currentMode !== 'layout' && State.currentMode !== 'play') return;
        
        const clientX = e.clientX;
        const clientY = e.clientY;
        const pos = Input.getGridFromPixel(clientX, clientY);
        
        // ========== 击退模式 ==========
        if (State.knockbackMode) {
            if (pos && State.getPieceAt(pos.row, pos.col)) {
                State.knockbackTargetPiece = State.getPieceAt(pos.row, pos.col);
                State.knockbackDragStart = { row: pos.row, col: pos.col };
                State.isKnockbackDragging = true;
                State.highlightedPiece = State.knockbackTargetPiece;
                State.knockbackPreviewPath = [];
                e.preventDefault();
                const canvas = document.getElementById('boardCanvas');
                canvas.addEventListener('mousemove', Input.onMouseMove);
                canvas.addEventListener('mouseup', Input.onMouseUp);
            } else {
                State.knockbackMode = false;
                State.highlightedPiece = null;
                UI.clearKnockbackMode();
            }
            return;
        }
        
        // ========== 换位模式 ==========
        if (State.swapMode) {
            if (pos && State.getPieceAt(pos.row, pos.col)) {
                if (!State.swapFirstPiece) {
                    State.swapFirstPiece = State.getPieceAt(pos.row, pos.col);
                    State.highlightedPiece = State.swapFirstPiece;
                    Renderer.drawBoard();
                } else {
                    const secondPiece = State.getPieceAt(pos.row, pos.col);
                    if (secondPiece && secondPiece !== State.swapFirstPiece) {
                        Game.doSwap(
                            State.swapFirstPiece.row, State.swapFirstPiece.col,
                            pos.row, pos.col
                        );
                    } else {
                        UI.showToast('无效的换位目标');
                    }
                    State.swapMode = false;
                    State.swapFirstPiece = null;
                    State.highlightedPiece = null;
                    UI.clearSwapMode();
                }
            } else {
                State.swapMode = false;
                State.swapFirstPiece = null;
                State.highlightedPiece = null;
                UI.clearSwapMode();
            }
            return;
        }
        
        // 调速模式下点击棋子触发调速，点击空白处取消
        if (State.speedAdjustMode) {
            if (pos && State.getPieceAt(pos.row, pos.col)) {
                e.preventDefault();
                Game.doSpeedAdjust(pos.row, pos.col);
            } else if (pos) {
                Game.cancelSpeedAdjust();
            }
            return;
        }
        
        // 布局移除棋子模式
        if (State.removePieceModeLayout && State.currentMode === 'layout' && pos && State.getPieceAt(pos.row, pos.col)) {
            e.preventDefault();
            Game.removePiece(pos.row, pos.col);
            return;
        }
        
        // 推演移除棋子模式
        if (State.removePieceMode && State.currentMode === 'play' && pos && State.getPieceAt(pos.row, pos.col)) {
            e.preventDefault();
            Game.removePiece(pos.row, pos.col);
            return;
        }
        
        if (pos && State.getPieceAt(pos.row, pos.col)) {
            const piece = State.getPieceAt(pos.row, pos.col);
            
            if (State.currentMode === 'play') {
                const currentActor = Movement.getCurrentActor();
                if (!currentActor || piece.row !== currentActor.row || piece.col !== currentActor.col) {
                    UI.showToast('只能拖拽当前行动的棋子');
                    return;
                }
            }
            
            State.mouseDownPos = { x: clientX, y: clientY };
            State.mouseDownTime = Date.now();
            State.dragPiece = piece;
            State.dragStartRow = pos.row;
            State.dragStartCol = pos.col;
            State.dragCurrentRow = pos.row;
            State.dragCurrentCol = pos.col;
            State.mouseIsDragging = false;
            State.freehandPathPoints = [];
            State.lastFreehandPoint = null;
            
            e.preventDefault();
            const canvas = document.getElementById('boardCanvas');
            canvas.addEventListener('mousemove', Input.onMouseMove);
            canvas.addEventListener('mouseup', Input.onMouseUp);
        } else if (pos) {
            if (State.currentMode === 'layout' && State.activeTerrain && State.activeTerrain !== 'clear' && !State.holdingState) {
                State.isTerrainPainting = true;
                State.terrainPaintMode = 'layout';
                State.lastPaintedRow = pos.row;
                State.lastPaintedCol = pos.col;
                Terrain.set(pos.row, pos.col, State.activeTerrain);
                e.preventDefault();
                const canvas = document.getElementById('boardCanvas');
                canvas.addEventListener('mousemove', Input.onMouseMove);
                canvas.addEventListener('mouseup', Input.onMouseUp);
            } else if (State.currentMode === 'play' && State.activePlayTerrain && !State.getPieceAt(pos.row, pos.col)) {
                State.isTerrainPainting = true;
                State.terrainPaintMode = 'play';
                State.lastPaintedRow = pos.row;
                State.lastPaintedCol = pos.col;
                Terrain.setPlayTerrain(pos.row, pos.col, State.activePlayTerrain);
                e.preventDefault();
                const canvas = document.getElementById('boardCanvas');
                canvas.addEventListener('mousemove', Input.onMouseMove);
                canvas.addEventListener('mouseup', Input.onMouseUp);
            }
        }
    },
    
    // 鼠标移动
    onMouseMove(e) {
        const clientX = e.clientX;
        const clientY = e.clientY;
        
        if (State.isTerrainPainting) {
            const pos = Input.getGridFromPixel(clientX, clientY);
            if (pos && (pos.row !== State.lastPaintedRow || pos.col !== State.lastPaintedCol)) {
                if (State.terrainPaintMode === 'layout') {
                    Terrain.set(pos.row, pos.col, State.activeTerrain);
                } else if (State.terrainPaintMode === 'play' && !State.getPieceAt(pos.row, pos.col)) {
                    Terrain.setPlayTerrain(pos.row, pos.col, State.activePlayTerrain);
                }
                State.lastPaintedRow = pos.row;
                State.lastPaintedCol = pos.col;
            }
            return;
        }
        
        // 击退模式拖拽方向预览
        if (State.knockbackMode && State.isKnockbackDragging && State.knockbackTargetPiece) {
            const pos = Input.getGridFromPixel(clientX, clientY);
            if (pos) {
                State.knockbackDragCurrent = { row: pos.row, col: pos.col };
                const start = State.knockbackDragStart;
                const end = State.knockbackDragCurrent;
                const dr = Math.sign(end.row - start.row);
                const dc = Math.sign(end.col - start.col);
                const rowDiff = Math.abs(end.row - start.row);
                const colDiff = Math.abs(end.col - start.col);
                const isStraight = (dr === 0 && dc !== 0) || (dr !== 0 && dc === 0);
                const isDiagonal = (dr !== 0 && dc !== 0) && (rowDiff === colDiff);
                if ((dr === 0 && dc === 0) || (!isStraight && !isDiagonal)) {
                    State.knockbackPreviewPath = [];
                } else {
                    const path = [];
                    let curR = start.row, curC = start.col;
                    let steps = 0;
                    const maxSteps = Math.max(State.rows, State.cols);
                    while ((curR !== end.row || curC !== end.col) && steps < maxSteps) {
                        path.push({ row: curR, col: curC });
                        curR += dr;
                        curC += dc;
                        steps++;
                    }
                    if (steps < maxSteps) {
                        path.push({ row: end.row, col: end.col });
                        State.knockbackPreviewPath = path;
                    } else {
                        State.knockbackPreviewPath = [];
                    }
                }
                Renderer.drawBoard();
            }
            return;
        }
        
        if (!State.dragPiece) return;
        
        const dx = clientX - State.mouseDownPos.x;
        const dy = clientY - State.mouseDownPos.y;
        const distance = Math.hypot(dx, dy);
        
        if (!State.mouseIsDragging && distance > CONFIG.DRAG_THRESHOLD) {
            State.mouseIsDragging = true;
            State.isDragging = true;
        }
        
        if (State.mouseIsDragging) {
            const pos = Input.getGridFromPixel(clientX, clientY);
            if (pos) {
                State.dragCurrentRow = pos.row;
                State.dragCurrentCol = pos.col;
                
                if (State.currentMode === 'play' && State.freehandMode) {
                    const curr = { row: pos.row, col: pos.col };
                    if (!State.lastFreehandPoint || State.lastFreehandPoint.row !== curr.row || State.lastFreehandPoint.col !== curr.col) {
                        State.freehandPathPoints.push(curr);
                        State.lastFreehandPoint = curr;
                    }
                }
            } else {
                State.dragCurrentRow = null;
                State.dragCurrentCol = null;
            }
            Renderer.drawBoard();
        }
    },
    
    // 鼠标松开
    onMouseUp(e) {
        if (State.isTerrainPainting) {
            Input.cleanTerrainPaint();
            return;
        }
        
        if (State.knockbackMode && State.isKnockbackDragging && State.knockbackTargetPiece && State.knockbackDragCurrent) {
            const currentActor = Movement.getCurrentActor();
            if (!currentActor) {
                UI.showToast('没有当前行动的棋子，无法击退');
            } else {
                Game.doKnockback(
                    currentActor.row, currentActor.col,
                    State.knockbackDragStart.row, State.knockbackDragStart.col,
                    State.knockbackDragCurrent.row, State.knockbackDragCurrent.col
                );
            }
            State.knockbackMode = false;
            State.knockbackTargetPiece = null;
            State.isKnockbackDragging = false;
            State.knockbackDragStart = null;
            State.knockbackDragCurrent = null;
            State.highlightedPiece = null;
            State.knockbackPreviewPath = [];
            UI.clearKnockbackMode();
            Input.cleanDragMouse();
            Renderer.drawBoard();
            return;
        }
        
        if (!State.dragPiece) {
            Input.cleanDragMouse();
            return;
        }
        
        const elapsed = Date.now() - State.mouseDownTime;
        
        if (!State.mouseIsDragging && elapsed < 300) {
            // 单击 - 不处理
        } else if (State.mouseIsDragging) {
            if (State.currentMode === 'layout') {
                if (State.dragCurrentRow !== null && State.dragCurrentCol !== null && 
                    (State.dragCurrentRow !== State.dragStartRow || State.dragCurrentCol !== State.dragStartCol)) {
                    State.dragPiece.row = State.dragCurrentRow;
                    State.dragPiece.col = State.dragCurrentCol;
                    Movement.calculateActionOrders();
                }
            } else if (State.currentMode === 'play') {
                if (State.freehandMode && State.freehandPathPoints.length > 0) {
                    const lastPoint = State.freehandPathPoints[State.freehandPathPoints.length - 1];
                    if (lastPoint && (lastPoint.row !== State.dragCurrentRow || lastPoint.col !== State.dragCurrentCol)) {
                        State.freehandPathPoints.push({ row: State.dragCurrentRow, col: State.dragCurrentCol });
                    }
                    Game.playMovePiece(State.dragStartRow, State.dragStartCol, State.dragCurrentRow, State.dragCurrentCol, State.freehandPathPoints);
                } else {
                    Game.playMovePiece(State.dragStartRow, State.dragStartCol, State.dragCurrentRow, State.dragCurrentCol);
                }
            }
        }
        
        Input.cleanDragMouse();
        Renderer.drawBoard();
    },
    
    cleanDragMouse() {
        State.dragPiece = null;
        State.dragStartRow = null;
        State.dragStartCol = null;
        State.dragCurrentRow = null;
        State.dragCurrentCol = null;
        State.mouseIsDragging = false;
        State.isDragging = false;
        State.freehandPathPoints = [];
        State.lastFreehandPoint = null;
        
        State.knockbackMode = false;
        State.knockbackTargetPiece = null;
        State.isKnockbackDragging = false;
        State.knockbackDragStart = null;
        State.knockbackDragCurrent = null;
        State.knockbackPreviewPath = [];
        State.swapMode = false;
        State.swapFirstPiece = null;
        State.highlightedPiece = null;
        
        const canvas = document.getElementById('boardCanvas');
        canvas.removeEventListener('mousemove', Input.onMouseMove);
        canvas.removeEventListener('mouseup', Input.onMouseUp);
    },
    
    cleanTerrainPaint() {
        State.isTerrainPainting = false;
        State.lastPaintedRow = -1;
        State.lastPaintedCol = -1;
        
        const canvas = document.getElementById('boardCanvas');
        canvas.removeEventListener('mousemove', Input.onMouseMove);
        canvas.removeEventListener('mouseup', Input.onMouseUp);
        
        if (State.terrainPaintMode === 'layout') {
            State.activeTerrain = null;
            document.querySelectorAll('.terrain-btn[data-terrain]').forEach(b => b.classList.remove('active'));
        } else if (State.terrainPaintMode === 'play') {
            State.activePlayTerrain = null;
            document.querySelectorAll('.terrain-btn[data-play-terrain]').forEach(b => b.classList.remove('active'));
        }
    },
    
    // ========== 触摸事件 ==========
    onTouchStart(e) {
        if (State.isViewingStep) {
            UI.showToast('请先点击「返回当前步」退出查看模式');
            return;
        }
        if (State.currentMode !== 'layout' && State.currentMode !== 'play') return;
        
        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;
        const pos = Input.getGridFromPixel(clientX, clientY);
        
        if (State.knockbackMode) {
            if (pos && State.getPieceAt(pos.row, pos.col)) {
                State.knockbackTargetPiece = State.getPieceAt(pos.row, pos.col);
                State.knockbackDragStart = { row: pos.row, col: pos.col };
                State.isKnockbackDragging = true;
                State.highlightedPiece = State.knockbackTargetPiece;
                State.knockbackPreviewPath = [];
                e.preventDefault();
                const canvas = document.getElementById('boardCanvas');
                canvas.addEventListener('touchmove', Input.onTouchMove);
                canvas.addEventListener('touchend', Input.onTouchEnd);
                canvas.addEventListener('touchcancel', Input.onTouchCancel);
            } else {
                State.knockbackMode = false;
                State.highlightedPiece = null;
                UI.clearKnockbackMode();
            }
            return;
        }
        
        if (State.swapMode) {
            if (pos && State.getPieceAt(pos.row, pos.col)) {
                if (!State.swapFirstPiece) {
                    State.swapFirstPiece = State.getPieceAt(pos.row, pos.col);
                    State.highlightedPiece = State.swapFirstPiece;
                    Renderer.drawBoard();
                } else {
                    const secondPiece = State.getPieceAt(pos.row, pos.col);
                    if (secondPiece && secondPiece !== State.swapFirstPiece) {
                        Game.doSwap(State.swapFirstPiece.row, State.swapFirstPiece.col, pos.row, pos.col);
                    } else {
                        UI.showToast('无效的换位目标');
                    }
                    State.swapMode = false;
                    State.swapFirstPiece = null;
                    State.highlightedPiece = null;
                    UI.clearSwapMode();
                }
            } else {
                State.swapMode = false;
                State.swapFirstPiece = null;
                State.highlightedPiece = null;
                UI.clearSwapMode();
            }
            return;
        }
        
        if (State.speedAdjustMode) {
            if (pos && State.getPieceAt(pos.row, pos.col)) {
                e.preventDefault();
                Game.doSpeedAdjust(pos.row, pos.col);
            } else if (pos) {
                Game.cancelSpeedAdjust();
            }
            return;
        }
        
        if (State.removePieceModeLayout && State.currentMode === 'layout' && pos && State.getPieceAt(pos.row, pos.col)) {
            e.preventDefault();
            Game.removePiece(pos.row, pos.col);
            return;
        }
        if (State.removePieceMode && State.currentMode === 'play' && pos && State.getPieceAt(pos.row, pos.col)) {
            e.preventDefault();
            Game.removePiece(pos.row, pos.col);
            return;
        }
        
        if (pos && State.getPieceAt(pos.row, pos.col)) {
            const piece = State.getPieceAt(pos.row, pos.col);
            if (State.currentMode === 'play') {
                const currentActor = Movement.getCurrentActor();
                if (!currentActor || piece.row !== currentActor.row || piece.col !== currentActor.col) {
                    UI.showToast('只能拖拽当前行动的棋子');
                    return;
                }
            }
            State.touchStartTime = Date.now();
            State.touchStartPos = { x: clientX, y: clientY };
            State.dragPiece = piece;
            State.dragStartRow = pos.row;
            State.dragStartCol = pos.col;
            State.dragCurrentRow = pos.row;
            State.dragCurrentCol = pos.col;
            State.isDragging = false;
            State.freehandPathPoints = [];
            State.lastFreehandPoint = null;
            e.preventDefault();
            const canvas = document.getElementById('boardCanvas');
            canvas.addEventListener('touchmove', Input.onTouchMove);
            canvas.addEventListener('touchend', Input.onTouchEnd);
            canvas.addEventListener('touchcancel', Input.onTouchCancel);
        } else if (pos) {
            if (State.currentMode === 'layout' && State.activeTerrain && State.activeTerrain !== 'clear' && !State.holdingState) {
                State.isTerrainPainting = true;
                State.terrainPaintMode = 'layout';
                State.lastPaintedRow = pos.row;
                State.lastPaintedCol = pos.col;
                Terrain.set(pos.row, pos.col, State.activeTerrain);
                e.preventDefault();
                const canvas = document.getElementById('boardCanvas');
                canvas.addEventListener('touchmove', Input.onTouchMove);
                canvas.addEventListener('touchend', Input.onTouchEnd);
                canvas.addEventListener('touchcancel', Input.onTouchCancel);
            } else if (State.currentMode === 'play' && State.activePlayTerrain && !State.getPieceAt(pos.row, pos.col)) {
                State.isTerrainPainting = true;
                State.terrainPaintMode = 'play';
                State.lastPaintedRow = pos.row;
                State.lastPaintedCol = pos.col;
                Terrain.setPlayTerrain(pos.row, pos.col, State.activePlayTerrain);
                e.preventDefault();
                const canvas = document.getElementById('boardCanvas');
                canvas.addEventListener('touchmove', Input.onTouchMove);
                canvas.addEventListener('touchend', Input.onTouchEnd);
                canvas.addEventListener('touchcancel', Input.onTouchCancel);
            }
        }
    },
    
    onTouchMove(e) {
        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;
        
        if (State.isTerrainPainting) {
            const pos = Input.getGridFromPixel(clientX, clientY);
            if (pos && (pos.row !== State.lastPaintedRow || pos.col !== State.lastPaintedCol)) {
                if (State.terrainPaintMode === 'layout') {
                    Terrain.set(pos.row, pos.col, State.activeTerrain);
                } else if (State.terrainPaintMode === 'play' && !State.getPieceAt(pos.row, pos.col)) {
                    Terrain.setPlayTerrain(pos.row, pos.col, State.activePlayTerrain);
                }
                State.lastPaintedRow = pos.row;
                State.lastPaintedCol = pos.col;
            }
            e.preventDefault();
            return;
        }
        
        if (State.knockbackMode && State.isKnockbackDragging && State.knockbackTargetPiece) {
            const pos = Input.getGridFromPixel(clientX, clientY);
            if (pos) {
                State.knockbackDragCurrent = { row: pos.row, col: pos.col };
                const start = State.knockbackDragStart;
                const end = State.knockbackDragCurrent;
                const dr = Math.sign(end.row - start.row);
                const dc = Math.sign(end.col - start.col);
                const rowDiff = Math.abs(end.row - start.row);
                const colDiff = Math.abs(end.col - start.col);
                const isStraight = (dr === 0 && dc !== 0) || (dr !== 0 && dc === 0);
                const isDiagonal = (dr !== 0 && dc !== 0) && (rowDiff === colDiff);
                if ((dr === 0 && dc === 0) || (!isStraight && !isDiagonal)) {
                    State.knockbackPreviewPath = [];
                } else {
                    const path = [];
                    let curR = start.row, curC = start.col;
                    let steps = 0;
                    const maxSteps = Math.max(State.rows, State.cols);
                    while ((curR !== end.row || curC !== end.col) && steps < maxSteps) {
                        path.push({ row: curR, col: curC });
                        curR += dr;
                        curC += dc;
                        steps++;
                    }
                    if (steps < maxSteps) {
                        path.push({ row: end.row, col: end.col });
                        State.knockbackPreviewPath = path;
                    } else {
                        State.knockbackPreviewPath = [];
                    }
                }
                Renderer.drawBoard();
            }
            return;
        }
        
        if (!State.dragPiece) return;
        
        const dx = clientX - State.touchStartPos.x;
        const dy = clientY - State.touchStartPos.y;
        const distance = Math.hypot(dx, dy);
        if (!State.isDragging && distance > CONFIG.DRAG_THRESHOLD) {
            State.isDragging = true;
        }
        if (State.isDragging) {
            const pos = Input.getGridFromPixel(clientX, clientY);
            if (pos) {
                State.dragCurrentRow = pos.row;
                State.dragCurrentCol = pos.col;
                if (State.currentMode === 'play' && State.freehandMode) {
                    const curr = { row: pos.row, col: pos.col };
                    if (!State.lastFreehandPoint || State.lastFreehandPoint.row !== curr.row || State.lastFreehandPoint.col !== curr.col) {
                        State.freehandPathPoints.push(curr);
                        State.lastFreehandPoint = curr;
                    }
                }
            } else {
                State.dragCurrentRow = null;
                State.dragCurrentCol = null;
            }
            Renderer.drawBoard();
            e.preventDefault();
        }
    },
    
    onTouchEnd(e) {
        if (State.isTerrainPainting) {
            Input.cleanTerrainPaintTouch();
            return;
        }
        
        if (State.knockbackMode && State.isKnockbackDragging && State.knockbackTargetPiece && State.knockbackDragCurrent) {
            const currentActor = Movement.getCurrentActor();
            if (!currentActor) {
                UI.showToast('没有当前行动的棋子，无法击退');
            } else {
                Game.doKnockback(
                    currentActor.row, currentActor.col,
                    State.knockbackDragStart.row, State.knockbackDragStart.col,
                    State.knockbackDragCurrent.row, State.knockbackDragCurrent.col
                );
            }
            State.knockbackMode = false;
            State.knockbackTargetPiece = null;
            State.isKnockbackDragging = false;
            State.knockbackDragStart = null;
            State.knockbackDragCurrent = null;
            State.highlightedPiece = null;
            State.knockbackPreviewPath = [];
            UI.clearKnockbackMode();
            Input.cleanDrag();
            Renderer.drawBoard();
            return;
        }
        
        if (!State.dragPiece) {
            Input.cleanDrag();
            return;
        }
        
        const elapsed = Date.now() - State.touchStartTime;
        if (!State.isDragging && elapsed < 300) {
            // 单击 - 不处理
        } else if (State.isDragging) {
            if (State.currentMode === 'layout') {
                if (State.dragCurrentRow !== null && State.dragCurrentCol !== null && 
                    (State.dragCurrentRow !== State.dragStartRow || State.dragCurrentCol !== State.dragStartCol)) {
                    State.dragPiece.row = State.dragCurrentRow;
                    State.dragPiece.col = State.dragCurrentCol;
                    Movement.calculateActionOrders();
                }
            } else if (State.currentMode === 'play') {
                if (State.freehandMode && State.freehandPathPoints.length > 0) {
                    const lastPoint = State.freehandPathPoints[State.freehandPathPoints.length - 1];
                    if (lastPoint && (lastPoint.row !== State.dragCurrentRow || lastPoint.col !== State.dragCurrentCol)) {
                        State.freehandPathPoints.push({ row: State.dragCurrentRow, col: State.dragCurrentCol });
                    }
                    Game.playMovePiece(State.dragStartRow, State.dragStartCol, State.dragCurrentRow, State.dragCurrentCol, State.freehandPathPoints);
                } else {
                    Game.playMovePiece(State.dragStartRow, State.dragStartCol, State.dragCurrentRow, State.dragCurrentCol);
                }
            }
        }
        Input.cleanDrag();
        Renderer.drawBoard();
    },
    
    onTouchCancel(e) {
        if (State.isTerrainPainting) {
            Input.cleanTerrainPaintTouch();
            return;
        }
        Input.cleanDrag();
    },
    
    cleanTerrainPaintTouch() {
        State.isTerrainPainting = false;
        State.lastPaintedRow = -1;
        State.lastPaintedCol = -1;
        const canvas = document.getElementById('boardCanvas');
        canvas.removeEventListener('touchmove', Input.onTouchMove);
        canvas.removeEventListener('touchend', Input.onTouchEnd);
        canvas.removeEventListener('touchcancel', Input.onTouchCancel);
        if (State.terrainPaintMode === 'layout') {
            State.activeTerrain = null;
            document.querySelectorAll('.terrain-btn[data-terrain]').forEach(b => b.classList.remove('active'));
        } else if (State.terrainPaintMode === 'play') {
            State.activePlayTerrain = null;
            document.querySelectorAll('.terrain-btn[data-play-terrain]').forEach(b => b.classList.remove('active'));
        }
    },
    
    cleanDrag() {
        State.dragPiece = null;
        State.dragStartRow = null;
        State.dragStartCol = null;
        State.dragCurrentRow = null;
        State.dragCurrentCol = null;
        State.isDragging = false;
        State.freehandPathPoints = [];
        State.lastFreehandPoint = null;
        
        State.knockbackMode = false;
        State.knockbackTargetPiece = null;
        State.isKnockbackDragging = false;
        State.knockbackDragStart = null;
        State.knockbackDragCurrent = null;
        State.knockbackPreviewPath = [];
        State.swapMode = false;
        State.swapFirstPiece = null;
        State.highlightedPiece = null;
        
        const canvas = document.getElementById('boardCanvas');
        canvas.removeEventListener('touchmove', Input.onTouchMove);
        canvas.removeEventListener('touchend', Input.onTouchEnd);
        canvas.removeEventListener('touchcancel', Input.onTouchCancel);
    },
    
    onCanvasClick(e) {
    if (State.isViewingStep) {
        UI.showToast('请先点击「返回当前步」退出查看模式');
        return;
    }
    e.stopPropagation();
    
    const clientX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches ? e.touches[0].clientY : 0);
    const pos = Input.getGridFromPixel(clientX, clientY);
    if (!pos) return;
    const { row, col } = pos;
    
    if (State.currentMode === 'layout') {
        const clickedPiece = State.getPieceAt(row, col);
        if (clickedPiece) {
            return;
        } else if (State.holdingState) {
            PiecePlacement.place(row, col);
        } else {
            Terrain.handleTerrainClick(row, col);
            // 强制清除所有地形按钮的高亮（解决自定义按钮弹起问题）
            document.querySelectorAll('.terrain-btn.active').forEach(btn => btn.classList.remove('active'));
        }
    } else if (State.currentMode === 'play') {
        const clickedPiece = State.getPieceAt(row, col);
        if (clickedPiece) {
            return;
        } else {
            Terrain.handleTerrainClick(row, col);
        }
    }
}
};