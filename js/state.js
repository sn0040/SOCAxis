/**
 * 战棋推演沙盘 - 全局状态管理
 */

const State = {
    // 棋盘尺寸
    rows: 15,
    cols: 15,
    cellW: 0,
    cellH: 0,
    
    // 游戏数据
    gridTerrain: [],
    pieces: [],
    pathLines: [],
    ghosts: [],
    
    // 当前状态
    holdingState: null,
    currentMode: 'layout',
    activeTerrain: 'clear',
    
    // 移动记录
    moveLogs: [],
    stepCounter: 0,
    moveSnapshots: [],
    initialSnapshot: null,
    
    // 查看模式
    isViewingStep: false,
    viewingStepNumber: null,
    savedCurrentSnapshot: null,
    
    // 地形绘制
    isTerrainPainting: false,
    lastPaintedRow: -1,
    lastPaintedCol: -1,
    
    // 自定义地形
    customTerrains: [],
    customPlayTerrains: [],   // 推演模式自定义标记列表
    
    // 拖拽状态
    isDragging: false,
    dragPiece: null,
    dragStartRow: null,
    dragStartCol: null,
    dragCurrentRow: null,
    dragCurrentCol: null,
    
    // 触摸/鼠标拖拽
    touchStartTime: 0,
    touchStartPos: null,
    mouseDownPos: null,
    mouseDownTime: 0,
    mouseIsDragging: false,
    
    // 手绘模式
    freehandMode: false,
    freehandPathPoints: [],
    lastFreehandPoint: null,
    
    // 弹窗状态
    modalJustClosed: false,
    currentModalType: null,
    
    // 推演状态
    battleState: {
        isActive: false,
        initialSnapshot: null,
        shouldPreserve: false
    },
    
    // 推演地形
    playTerrain: [],
    activePlayTerrain: null,
    
    // 调速系统
    speedAdjustMode: false,
    speedAdjustValue: 0,
    speedAdjustTurns: 2,
    speedAdjustSourcePiece: null,
    speedAdjustHintTimer: null,
    speedAdjustHintVisible: false,
    
    // 当前回合行动棋子
    currentTurnActor: null,
    
    // 移除棋子模式
    removePieceMode: false,
    removePieceModeLayout: false,
    
    // 地形绘制状态
    isTerrainPainting: false,
    terrainPaintMode: 'layout',
    
    // 鼠标位置追踪
    lastMouseX: 0,
    lastMouseY: 0,
    
    // 击退和换位相关状态
    knockbackMode: false,
    swapMode: false,
    knockbackTargetPiece: null,
    isKnockbackDragging: false,
    knockbackDragStart: null,
    knockbackDragCurrent: null,
    swapFirstPiece: null,
    toastMessage: '',
    toastTimeout: null,
    highlightedPiece: null,
    knockbackPreviewPath: [],
    
    // 保存推演状态（用于切换模式）
    savedPlayState: null,
    
    // 初始化
    init() {
        this.gridTerrain = this.createEmptyTerrain(this.rows, this.cols);
        this.playTerrain = [];
        this.pieces = [];
        this.pathLines = [];
        this.ghosts = [];
        this.moveLogs = [];
        this.stepCounter = 0;
        this.moveSnapshots = [];
        this.initialSnapshot = this.saveSnapshot();
        this.moveSnapshots.push(this.initialSnapshot);
        this.battleState = {
            isActive: false,
            initialSnapshot: null,
            shouldPreserve: false
        };
        this.speedAdjustMode = false;
        this.speedAdjustValue = 0;
        this.speedAdjustTurns = 2;
        this.speedAdjustSourcePiece = null;
        if (this.speedAdjustHintTimer) {
            clearInterval(this.speedAdjustHintTimer);
            this.speedAdjustHintTimer = null;
        }
        this.speedAdjustHintVisible = false;
        this.currentTurnActor = null;
        this.removePieceMode = false;
        this.removePieceModeLayout = false;
        
        this.knockbackMode = false;
        this.swapMode = false;
        this.knockbackTargetPiece = null;
        this.isKnockbackDragging = false;
        this.knockbackDragStart = null;
        this.knockbackDragCurrent = null;
        this.swapFirstPiece = null;
        this.toastMessage = '';
        this.toastTimeout = null;
        this.highlightedPiece = null;
        this.knockbackPreviewPath = [];
        this.savedPlayState = null;
        this.customPlayTerrains = [];
    },
    
    createEmptyTerrain(r, c) {
        return Array(r).fill().map(() => Array(c).fill(null));
    },
    
    saveSnapshot() {
        return {
            terrain: this.gridTerrain.map(row => {
                if (row === null) return null;
                return row.map(cell => {
                    if (cell === null) return null;
                    if (typeof cell === 'object') return { ...cell };
                    return cell;
                });
            }),
            playTerrain: this.playTerrain.map(m => {
                if (typeof m === 'object' && m !== null) return { ...m };
                return m;
            }),
            pieces: this.pieces.map(p => ({ 
                ...p, 
                speedBuffs: p.speedBuffs ? p.speedBuffs.map(b => ({ ...b })) : [] 
            })),
            paths: this.pathLines.map(p => ({ ...p })),
            ghosts: this.ghosts.map(g => ({ ...g })),
            customTerrains: this.customTerrains.map(t => ({ label: t.label }))
        };
    },
    
    restoreSnapshot(snapshot) {
        this.gridTerrain = snapshot.terrain.map(row => {
            if (!row) return null;
            return row.map(cell => {
                if (cell === null) return null;
                if (typeof cell === 'object') return { ...cell };
                return cell;
            });
        });
        if (snapshot.playTerrain) {
            this.playTerrain = snapshot.playTerrain.map(m => {
                if (typeof m === 'object' && m !== null) return { ...m };
                return m;
            });
        }
        this.pieces = snapshot.pieces.map(p => ({ 
            ...p,
            speedBuffs: p.speedBuffs ? p.speedBuffs.map(b => ({ ...b })) : []
        }));
        this.pathLines = snapshot.paths.map(p => ({ ...p }));
        this.ghosts = snapshot.ghosts.map(g => ({ ...g }));
        if (snapshot.customTerrains) {
            this.customTerrains = snapshot.customTerrains.map(c => ({ ...c }));
        }
    },
    
    getPieceAt(row, col) {
        return this.pieces.find(p => p.row === row && p.col === col);
    },
    
    removePieceAt(row, col) {
        this.pieces = this.pieces.filter(p => !(p.row === row && p.col === col));
    },
    
    calcCellSize(canvasWidth) {
        this.cellW = canvasWidth / this.cols;
        this.cellH = canvasWidth / this.rows;
    }
};