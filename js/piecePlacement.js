/**
 * 战棋推演沙盘 - 棋子放置系统
 */

const PiecePlacement = {
    // 选择角色（己方）
    selectCharacter(char) {
        // 检查己方角色是否已存在
        if (char.id && this.isSelfCharacterExists(char.id)) {
            alert('该己方角色已在棋盘上！');
            return;
        }
        State.holdingState = { type: 'self', character: char };
        UI.updateCharacterInfo({ name: char.name, speed: char.speed, isLarge: false, actionOrder: 0, hasActedThisTurn: false, team: 'self', speedBuffs: [] });
    },
    
    // 创建自定义角色
    createCustomPiece(name, speed, showFirstChar) {
        const char = {
            name: name,
            speed: parseInt(speed),
            displayChar: showFirstChar ? name.charAt(0) : name.substring(0, 4),
            isLarge: false
        };
        State.holdingState = { type: 'custom', character: char };
        UI.updateCharacterInfo({ name: char.name, speed: char.speed, isLarge: false, actionOrder: 0, hasActedThisTurn: false, team: 'self', speedBuffs: [] });
    },
    
    // 创建敌方角色
    createEnemyPiece(name, speed, isLarge, showFirstChar) {
        const char = {
            name: name,
            speed: parseInt(speed),
            displayChar: showFirstChar ? name.charAt(0) : name.substring(0, 4),
            isLarge: isLarge
        };
        State.holdingState = { type: 'enemy', character: char };
        UI.updateCharacterInfo({ name: char.name, speed: char.speed, isLarge: isLarge, actionOrder: 0, hasActedThisTurn: false, team: 'enemy', speedBuffs: [] });
    },
    
    // 检查己方角色是否已存在
    isSelfCharacterExists(characterId) {
        return State.pieces.some(p => p.characterId === characterId);
    },
    
    // 放置棋子
    place(row, col) {
        if (!State.holdingState) return false;
        if (row < 0 || row >= State.rows || col < 0 || col >= State.cols) return false;
        
        const terrain = State.gridTerrain[row][col];
        if (terrain === 'wall' || terrain === 'water') {
            alert('不能在水或墙上放置棋子！');
            return false;
        }
        
        const char = State.holdingState.character;
        
        // 检查3x3占位
        if (char.isLarge) {
            for (let r = row - 1; r <= row + 1; r++) {
                for (let c = col - 1; c <= col + 1; c++) {
                    if (r < 0 || r >= State.rows || c < 0 || c >= State.cols) {
                        alert('3×3角色放置位置超出棋盘边界！');
                        return false;
                    }
                    if (State.getPieceAt(r, c)) {
                        alert('3×3角色放置位置与其他棋子重叠！');
                        return false;
                    }
                }
            }
        } else {
            if (State.getPieceAt(row, col)) {
                if (!confirm('此处已有棋子，是否覆盖？')) {
                    return false;
                }
                State.removePieceAt(row, col);
            }
        }
        
        // 创建新棋子
        const newPiece = {
            row, col,
            name: char.name,
            displayChar: char.displayChar || char.name.charAt(0),
            speed: char.speed,
            team: State.holdingState.type === 'enemy' ? 'enemy' : 'self',
            isLarge: char.isLarge || false,
            actionOrder: 0,
            hasActedThisTurn: false,
            characterId: char.id || null,  // 己方角色保存ID用于去重
            speedBuffs: []  // 调速buff数组
        };
        
        State.pieces.push(newPiece);
        Movement.calculateActionOrders();
        Renderer.drawBoard();
        
        // 放置后取消拿起状态
        UI.cancelHolding();
        return true;
    },
    
    // 删除棋子
    deleteAt(row, col) {
        const piece = State.getPieceAt(row, col);
        if (piece) {
            State.removePieceAt(row, col);
            Renderer.drawBoard();
            return true;
        }
        return false;
    }
};
