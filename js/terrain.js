/**
 * 战棋推演沙盘 - 地形系统（简化版）
 */

const Terrain = {
    // 地形样式配置
    TERRAIN_STYLES: {
        'water': { label: '水', bg: '#4a86c8', color: '#fff' },
        'wall': { label: '墙', bg: '#8d6e63', color: '#fff' },
        'trap': { label: '陷', bg: '#d32f2f', color: '#fff' },
        'box': { label: '箱', bg: '#ff8f00', color: '#fff' },
        'flag': { label: '旗', bg: '#c62828', color: '#fff' },
        'fire': { label: '火', bg: '#e65100', color: '#fff' },
        'ice': { label: '冰', bg: '#00bcd4', color: '#fff' }
    },
    
    // 获取地形完整配置（含样式）
    getTerrainConfig(type) {
        if (typeof type === 'object' && type !== null) {
            if (!type.type && type.label) {
                type.type = type.label;
            }
            return type;
        }
        const base = this.TERRAIN_STYLES[type] || { label: type, bg: '#666', color: '#fff' };
        return { type: type, ...base };
    },
    
    // 设置布局地形
    set(row, col, type) {
        if (row < 0 || row >= State.rows || col < 0 || col >= State.cols) return;
        
        const config = this.getTerrainConfig(type);
        
        if ((config.type === 'wall' || config.type === 'water' || type === 'wall' || type === 'water') && State.getPieceAt(row, col)) {
            State.removePieceAt(row, col);
        }
        
        if (type === 'clear') {
            State.gridTerrain[row][col] = null;
        } else {
            State.gridTerrain[row][col] = config;
        }
        
        Renderer.drawBoard();
    },
    
    // 设置推演地形标记
    setPlayTerrain(row, col, type) {
        if (row < 0 || row >= State.rows || col < 0 || col >= State.cols) return;
        
        const layoutTerrain = State.gridTerrain[row][col];
        let layoutType = null;
        if (layoutTerrain !== null) {
            layoutType = typeof layoutTerrain === 'object' ? layoutTerrain.type : layoutTerrain;
        }
        if (layoutType === 'wall' || layoutType === 'water') return;
        if (State.getPieceAt(row, col)) return;
        
        State.playTerrain = State.playTerrain.filter(m => !(m.row === row && m.col === col));
        
        if (type !== null && type !== 'clear') {
            let config = this.getTerrainConfig(type);
            if (!config.type) config.type = typeof type === 'string' ? type : (config.label || 'custom');
            const mark = { row, col, ...config };
            State.playTerrain.push(mark);
            console.log('存储的标记:', mark);
        }
        Renderer.drawBoard();
    },
    
    // 处理地形点击（统一入口）
    handleTerrainClick(row, col) {
        if (State.currentMode === 'layout') {
            if (!State.activeTerrain) return false;
            if (State.holdingState) return false;
            
            // 先绘制地形
            this.set(row, col, State.activeTerrain);
            
            // 清空激活的地形类型
            State.activeTerrain = null;
            
            // 使用多个延迟确保高亮被移除（避免重绘或事件冒泡重新添加）
            const clearActive = () => {
                const activeBtns = document.querySelectorAll('.terrain-btn.active');
                activeBtns.forEach(btn => btn.classList.remove('active'));
                if (activeBtns.length > 0) console.log('清除高亮', activeBtns.length);
            };
            setTimeout(clearActive, 0);
            setTimeout(clearActive, 50);
            setTimeout(clearActive, 100);
            
            return true;
            
        } else if (State.currentMode === 'play') {
            if (!State.activePlayTerrain) return false;
            if (State.getPieceAt(row, col)) return false;
            
            this.setPlayTerrain(row, col, State.activePlayTerrain);
            
            State.activePlayTerrain = null;
            document.querySelectorAll('.terrain-btn[data-play-terrain]').forEach(btn => btn.classList.remove('active'));
            
            return true;
        }
        
        return false;
    },
    
    // 添加布局自定义地形按钮（支持自定义颜色）
    addCustomButton(label, bgColor, textColor) {
        const terrainTools = document.getElementById('terrainTools');
        const addCustomBtn = document.getElementById('addCustomBtn');
        
        const btn = document.createElement('button');
        btn.className = 'terrain-btn';
        btn.setAttribute('data-custom', 'true');
        btn.innerHTML = `📌 ${label}`;
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // 清除所有布局地形按钮的高亮
            document.querySelectorAll('.terrain-btn.active').forEach(b => b.classList.remove('active'));
            State.activeTerrain = { 
                type: 'custom', 
                label: label,
                bg: bgColor || '#9c27b0',
                color: textColor || '#fff'
            };
            btn.classList.add('active');
            console.log('自定义地形已激活:', State.activeTerrain);
        });
        
        terrainTools.insertBefore(btn, addCustomBtn);
        
        State.customTerrains.push({ 
            label, 
            bg: bgColor || '#9c27b0', 
            color: textColor || '#fff',
            btnElement: btn 
        });
    },
    
    // 添加推演自定义地形按钮（支持自定义颜色）
    addPlayCustomButton(label, bgColor, textColor) {
        const playTerrainTools = document.getElementById('playTerrainTools');
        const addPlayCustomBtn = document.getElementById('addPlayCustomBtn');
        if (!playTerrainTools || !addPlayCustomBtn) return;
        
        const btn = document.createElement('button');
        btn.className = 'terrain-btn';
        btn.setAttribute('data-play-terrain', 'custom');
        btn.setAttribute('data-label', label);
        btn.innerHTML = `📌 ${label}`;
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.terrain-btn[data-play-terrain]').forEach(b => b.classList.remove('active'));
            State.activePlayTerrain = { 
                type: 'custom', 
                label: label,
                bg: bgColor || '#9c27b0',
                color: textColor || '#fff'
            };
            btn.classList.add('active');
            console.log('推演自定义标记已激活:', State.activePlayTerrain);
        });
        
        playTerrainTools.insertBefore(btn, addPlayCustomBtn);
        
        if (!State.customPlayTerrains) State.customPlayTerrains = [];
        State.customPlayTerrains.push({ 
            label, 
            bg: bgColor || '#9c27b0', 
            color: textColor || '#fff',
            btnElement: btn 
        });
    }
};