/**
 * 战棋推演沙盘 - 配置和常量
 */

const CONFIG = {
    // 棋盘默认设置
    DEFAULT_ROWS: 15,
    DEFAULT_COLS: 15,
    MIN_SIZE: 3,
    MAX_SIZE: 30,
    
    // 拖拽阈值
    DRAG_THRESHOLD: 15,
    
    // 地形类型
    TERRAIN: {
        CLEAR: 'clear',
        WATER: 'water',
        WALL: 'wall',
        TRAP: 'trap',
        BOX: 'box'
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
