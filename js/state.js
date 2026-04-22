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
    holdingState: null,  // { type: 'self'|'custom'|'enemy', character: {...} }
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
        isActive: false,        // 是否处于推演中
        initialSnapshot: null,  // 推演开始时的快照
        shouldPreserve: false   // 是否保留推演步骤
    },
    
    // 推演地形（仅视觉标记，不影响移动）
    playTerrain: [],
    activePlayTerrain: null,  // null表示没有选择地形
    
    // 调速系统
    speedAdjustMode: false,       // 是否处于调速选棋子模式
    speedAdjustValue: 0,          // 调速值（如+50、-100）
    speedAdjustTurns: 2,          // 调速生效次数
    speedAdjustSourcePiece: null, // 调速发起方棋子（用于日志）
    speedAdjustHintTimer: null,   // 调速提示闪烁定时器
    speedAdjustHintVisible: false, // 调速提示当前是否可见
    
    // 当前回合行动棋子（调速等副操作不改变它，只有移动/待机后才清除）
    currentTurnActor: null,  // { row, col }
    
    // 移除棋子模式
    removePieceMode: false,       // 推演阶段是否处于移除棋子模式
    removePieceModeLayout: false, // 布局阶段是否处于移除棋子模式
    
    // 地形绘制状态
    isTerrainPainting: false,
    terrainPaintMode: 'layout', // 'layout' 或 'play'
    
    // 鼠标位置追踪
    lastMouseX: 0,
    lastMouseY: 0,
    
    // ========== 新增：击退和换位相关状态 ==========
    knockbackMode: false,          // 是否处于击退模式
    swapMode: false,               // 是否处于换位模式
    knockbackTargetPiece: null,    // 击退模式选中的目标棋子
    isKnockbackDragging: false,    // 击退模式是否正在拖拽方向
    knockbackDragStart: null,      // 击退拖拽起点（目标棋子坐标）
    knockbackDragCurrent: null,    // 击退拖拽当前点（方向指示）
    swapFirstPiece: null,          // 换位模式第一个选中的棋子
    // 视觉反馈
    toastMessage: '',              // 临时提示文字
    toastTimeout: null,            // 提示消失定时器
    highlightedPiece: null,        // 当前高亮的棋子（用于换位/击退）
    knockbackPreviewPath: [],      // 击退预览路径点数组
    
    // ========== 新增：保存推演状态（用于切换模式时保留） ==========
    savedPlayState: null,          // 存储从推演切换到布局时保存的推演状态
    
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
        
        // 初始化击退和换位状态
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
        
        // 初始化保存推演状态
        this.savedPlayState = null;
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