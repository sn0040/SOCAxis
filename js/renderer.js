/**
 * 战棋推演沙盘 - 渲染系统
 */

const Renderer = {
    canvas: null,
    ctx: null,
    
    init() {
        this.canvas = document.getElementById('boardCanvas');
        this.ctx = this.canvas.getContext('2d');
    },
    
    // 绘制圆角矩形辅助函数
    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    },
    
    resizeCanvas() {
        const boardArea = document.querySelector('.board-area');
        let maxWidth = boardArea.clientWidth - 24;
        if (maxWidth < 200) maxWidth = 300;
        let size = Math.min(800, maxWidth);
        
        this.canvas.width = size;
        this.canvas.height = size;
        
        State.cellW = size / State.cols;
        State.cellH = size / State.rows;
        
        if (State.gridTerrain && State.gridTerrain.length === State.rows) {
            this.drawBoard();
        } else {
            State.init();
            this.drawBoard();
        }
    },
    
    drawBoard() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!State.gridTerrain || State.gridTerrain.length !== State.rows) {
            State.init();
        }
        
        // 绘制地形
        this.drawTerrain(ctx);
        
        // 绘制路径
        this.drawPaths(ctx);
        
        // 绘制初始位置标记（ghosts）
        this.drawGhosts(ctx);
        
        // 绘制棋子
        this.drawPieces(ctx);
        
        // 绘制拖拽预览
        this.drawDragPreview(ctx);
        
        // 调速模式提示
        if (State.speedAdjustMode) {
            this.drawSpeedAdjustHint(ctx);
        }
        
        // 高亮棋子
        if (State.highlightedPiece) {
            const p = State.highlightedPiece;
            const x = p.col * State.cellW;
            const y = p.row * State.cellH;
            ctx.save();
            ctx.strokeStyle = '#ffaa44';
            ctx.lineWidth = 4;
            ctx.shadowBlur = 0;
            ctx.strokeRect(x + 2, y + 2, State.cellW - 4, State.cellH - 4);
            ctx.restore();
        }
        
        // 击退预览路径
        if (State.knockbackPreviewPath && State.knockbackPreviewPath.length > 0) {
            ctx.save();
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#ffaa44';
            ctx.beginPath();
            const start = State.knockbackPreviewPath[0];
            ctx.moveTo(start.col * State.cellW + State.cellW/2, start.row * State.cellH + State.cellH/2);
            for (let i = 1; i < State.knockbackPreviewPath.length; i++) {
                const pt = State.knockbackPreviewPath[i];
                ctx.lineTo(pt.col * State.cellW + State.cellW/2, pt.row * State.cellH + State.cellH/2);
            }
            ctx.stroke();
            ctx.restore();
        }
        
        // 提示文字
        if (State.toastMessage) {
            ctx.font = '24px "Segoe UI", "Microsoft YaHei", sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowBlur = 0;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const metrics = ctx.measureText(State.toastMessage);
            const textWidth = metrics.width;
            const textHeight = 36;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(this.canvas.width/2 - textWidth/2 - 12, this.canvas.height/2 - textHeight/2 - 8, textWidth + 24, textHeight + 16);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillText(State.toastMessage, this.canvas.width/2, this.canvas.height/2);
        }
    },
    
    drawSpeedAdjustHint(ctx) {
        if (!State.speedAdjustHintVisible) return;
        
        const padding = 10;
        const boxX = padding;
        const boxY = padding;
        const boxW = 240;
        const boxH = 44;
        
        ctx.fillStyle = 'rgba(90, 50, 130, 0.85)';
        this.drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 8);
        ctx.fill();
        ctx.strokeStyle = '#c090f0';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = 'white';
        ctx.font = `bold 14px "Segoe UI", "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const sign = State.speedAdjustValue >= 0 ? '+' : '';
        ctx.fillText(`请点击目标棋子 ${sign}${State.speedAdjustValue}（${State.speedAdjustTurns}次）`, boxX + boxW / 2, boxY + boxH / 2);
    },
    
    drawGhosts(ctx) {
        for (let g of State.ghosts) {
            let x = g.col * State.cellW + State.cellW/2;
            let y = g.row * State.cellH + State.cellH/2;
            let radius = Math.min(State.cellW, State.cellH) * 0.35;
            
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2*Math.PI);
            ctx.fillStyle = (g.team === 'self') ? '#ff6666' : '#6699ff';
            ctx.fill();
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            ctx.fillStyle = 'white';
            ctx.font = `bold ${Math.floor(radius * 1.1)}px "Segoe UI"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(g.displayChar || g.name.charAt(0), x, y);
            ctx.globalAlpha = 1.0;
        }
    },
    
    drawTerrain(ctx) {
        for (let r = 0; r < State.rows; r++) {
            for (let c = 0; c < State.cols; c++) {
                let x = c * State.cellW, y = r * State.cellH;
                let terrain = State.gridTerrain[r][c];
                let bgColor = '#f0e6d0';
                let terrainType = null;
                
                if (typeof terrain === 'string') {
                    terrainType = terrain;
                } else if (terrain && typeof terrain === 'object') {
                    terrainType = terrain.type;
                }
                
                // 优先级：自定义背景 > 固定地形颜色 > 默认
                if (terrain && terrain.bg) {
                    bgColor = terrain.bg;
                } else if (terrainType === 'water') bgColor = '#6ab0de';
                else if (terrainType === 'wall') bgColor = '#555555';
                else if (terrainType === 'trap') bgColor = '#b87333';
                else if (terrainType === 'box') bgColor = '#c9ae74';
                else if (terrainType === 'custom') bgColor = '#9c27b0';
                
                ctx.fillStyle = bgColor;
                ctx.fillRect(x, y, State.cellW, State.cellH);
                ctx.strokeStyle = '#a58e6f';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x, y, State.cellW, State.cellH);
                
                this.drawTerrainIcon(ctx, terrain, x, y);
                
                if (State.currentMode === 'play') {
                    const playMark = State.playTerrain.find(m => m.row === r && m.col === c);
                    if (playMark) {
                        this.drawPlayTerrainIcon(ctx, playMark, x, y);
                    }
                }
            }
        }
    },
    
    drawPlayTerrainIcon(ctx, terrain, x, y) {
        ctx.save();
        // 如果是自定义标记且有背景色且非透明，先绘制整个格子的背景
        if (terrain.type === 'custom' && terrain.bg && terrain.bg !== 'transparent') {
            ctx.fillStyle = terrain.bg;
            ctx.fillRect(x, y, State.cellW, State.cellH);
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let fontSize = Math.min(State.cellW, State.cellH) * 0.45;
        ctx.font = `${fontSize}px "Segoe UI", "Apple Color Emoji"`;
        const centerX = x + State.cellW/2;
        const centerY = y + State.cellH/2;
        
        if (terrain.type === 'trap') {
            ctx.fillText('⚠️', centerX, centerY);
        } else if (terrain.type === 'box') {
            ctx.fillText('📦', centerX, centerY);
        } else if (terrain.type === 'flag') {
            ctx.fillText('🚩', centerX, centerY);
        } else if (terrain.type === 'fire') {
            ctx.fillText('🔥', centerX, centerY);
        } else if (terrain.type === 'ice') {
            ctx.fillText('❄️', centerX, centerY);
        } else if (terrain.type === 'custom') {
            ctx.fillStyle = terrain.color || '#fff';
            ctx.fillText(terrain.label, centerX, centerY);
        } else {
            ctx.fillText(terrain.label || '?', centerX, centerY);
        }
        ctx.restore();
    },
    
    drawTerrainIcon(ctx, terrain, x, y) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let fontSize = Math.min(State.cellW, State.cellH) * 0.5;
        ctx.font = `${fontSize}px "Segoe UI", "Apple Color Emoji"`;
        
        let terrainType = null;
        let terrainLabel = null;
        if (typeof terrain === 'string') {
            terrainType = terrain;
        } else if (terrain && typeof terrain === 'object') {
            terrainType = terrain.type;
            terrainLabel = terrain.label;
        }
        
        if (terrainType === 'water') {
            ctx.fillText('💧', x + State.cellW/2, y + State.cellH/2);
        } else if (terrainType === 'wall') {
            ctx.fillText('🧱', x + State.cellW/2, y + State.cellH/2);
        } else if (terrainType === 'trap') {
            ctx.fillText('⚠️', x + State.cellW/2, y + State.cellH/2);
        } else if (terrainType === 'box') {
            ctx.fillText('📦', x + State.cellW/2, y + State.cellH/2);
        } else if (terrainType === 'custom') {
            ctx.fillStyle = 'white';
            let text = terrainLabel || '?';
            if (text.length === 2) fontSize = Math.min(State.cellW, State.cellH) * 0.4;
            ctx.font = `${fontSize}px "Segoe UI"`;
            ctx.fillText(text, x + State.cellW/2, y + State.cellH/2);
        } else if (terrainLabel) {
            ctx.fillStyle = terrain.color || '#fff';
            let text = terrainLabel;
            if (text.length >= 3) fontSize = Math.min(State.cellW, State.cellH) * 0.35;
            else if (text.length === 2) fontSize = Math.min(State.cellW, State.cellH) * 0.4;
            ctx.font = `${fontSize}px "Segoe UI"`;
            ctx.fillText(text, x + State.cellW/2, y + State.cellH/2);
        }
        ctx.restore();
    },
    
    drawPaths(ctx) {
        for (let path of State.pathLines) {
            let color = (path.team === 'self') ? '#ff5555' : '#55aaff';
            this.drawPathSegment(ctx, path.customPoints, color, true, path.fromRow, path.fromCol);
        }
    },
    
    drawPathSegment(ctx, points, color, withArrow = true, startRow = null, startCol = null) {
        if (points.length === 0) return;
        
        let startX, startY;
        if (startRow !== null && startCol !== null) {
            startX = startCol * State.cellW + State.cellW/2;
            startY = startRow * State.cellH + State.cellH/2;
        } else {
            startX = points[0].col * State.cellW + State.cellW/2;
            startY = points[0].row * State.cellH + State.cellH/2;
        }
        
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);
        ctx.moveTo(startX, startY);
        for (let pt of points) {
            ctx.lineTo(pt.col * State.cellW + State.cellW/2, pt.row * State.cellH + State.cellH/2);
        }
        ctx.strokeStyle = color;
        ctx.stroke();
        
        if (withArrow && points.length > 0) {
            this.drawArrow(ctx, points, startX, startY, color);
        }
        ctx.setLineDash([]);
    },
    
    drawArrow(ctx, points, startX, startY, color) {
        let last = points[points.length-1];
        let endX = last.col * State.cellW + State.cellW/2;
        let endY = last.row * State.cellH + State.cellH/2;
        let prevX, prevY;
        
        if (points.length >= 2) {
            let prev = points[points.length-2];
            prevX = prev.col * State.cellW + State.cellW/2;
            prevY = prev.row * State.cellH + State.cellH/2;
        } else {
            prevX = startX;
            prevY = startY;
        }
        
        let angle = Math.atan2(endY - prevY, endX - prevX);
        let radius = Math.min(State.cellW, State.cellH) * 0.35;
        let tipX = endX - radius * Math.cos(angle);
        let tipY = endY - radius * Math.sin(angle);
        let arrowSize = Math.min(State.cellW, State.cellH) * 0.2;
        let backX = tipX - arrowSize * 0.6 * Math.cos(angle);
        let backY = tipY - arrowSize * 0.6 * Math.sin(angle);
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(backX - arrowSize*0.4*Math.sin(angle), backY + arrowSize*0.4*Math.cos(angle));
        ctx.lineTo(backX + arrowSize*0.4*Math.sin(angle), backY - arrowSize*0.4*Math.cos(angle));
        ctx.fill();
    },
    
    drawPieces(ctx) {
        for (let p of State.pieces) {
            let x = p.col * State.cellW + State.cellW/2;
            let y = p.row * State.cellH + State.cellH/2;
            let radius = Math.min(State.cellW, State.cellH) * 0.35;
            this.drawPiece(ctx, p, x, y, radius);
        }
    },
    
    drawPiece(ctx, p, x, y, radius) {
        let alpha = 1.0;
        if (State.currentMode === 'play' && State.pieces.length > 0) {
            const currentActor = Movement.getCurrentActor();
            if (currentActor && (p.row !== currentActor.row || p.col !== currentActor.col)) {
                alpha = 0.5;
            }
        }
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        if (p.isLarge) {
            this.drawLargePiece(ctx, p, x, y);
        } else {
            this.drawNormalPiece(ctx, p, x, y, radius);
        }
        
        ctx.restore();
    },
    
    drawNormalPiece(ctx, p, x, y, radius) {
        const colors = p.team === 'self' ? {
            highlight: '#ffaaa0',
            main: '#e85a4a',
            shadow: '#a02020',
            border: '#ffcccc',
            darkBorder: '#802020'
        } : {
            highlight: '#a0c0ff',
            main: '#4a6ae8',
            shadow: '#202080',
            border: '#ccccff',
            darkBorder: '#202060'
        };
        
        ctx.beginPath();
        ctx.arc(x + 2, y + 3, radius * 0.95, 0, 2*Math.PI);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2*Math.PI);
        ctx.fillStyle = colors.darkBorder;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, radius - 2, 0, 2*Math.PI);
        const grad = ctx.createRadialGradient(x - radius*0.3, y - radius*0.3, 0, x, y, radius);
        grad.addColorStop(0, colors.highlight);
        grad.addColorStop(0.4, colors.main);
        grad.addColorStop(1, colors.shadow);
        ctx.fillStyle = grad;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x - radius*0.25, y - radius*0.25, radius*0.35, 0, 2*Math.PI);
        const highlightGrad = ctx.createRadialGradient(x - radius*0.25, y - radius*0.25, 0, x - radius*0.25, y - radius*0.25, radius*0.35);
        highlightGrad.addColorStop(0, 'rgba(255,255,255,0.6)');
        highlightGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = highlightGrad;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x, y, radius - 3, 0, 2*Math.PI);
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.font = `bold ${Math.floor(radius * 1.0)}px "Segoe UI"`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fillText(p.displayChar, x, y);
        ctx.shadowColor = 'transparent';
        
        if (p.actionOrder > 0) {
            this.drawActionOrderBadge(ctx, p, x, y, radius);
        }
    },
    
    drawLargePiece(ctx, p, centerX, centerY) {
        const cellSize = Math.min(State.cellW, State.cellH);
        const size = cellSize * 3 - 4;
        const halfSize = size / 2;
        const x = centerX - halfSize;
        const y = centerY - halfSize;
        
        const colors = p.team === 'self' ? {
            highlight: '#ffaaa0',
            main: '#e85a4a',
            shadow: '#a02020',
            border: '#ffcccc',
            darkBorder: '#802020'
        } : {
            highlight: '#a0c0ff',
            main: '#4a6ae8',
            shadow: '#202080',
            border: '#ccccff',
            darkBorder: '#202060'
        };
        
        const radius = 8;
        
        ctx.save();
        ctx.translate(3, 4);
        this.drawRoundedRect(ctx, x, y, size, size, radius);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();
        ctx.restore();
        
        this.drawRoundedRect(ctx, x, y, size, size, radius);
        ctx.fillStyle = colors.darkBorder;
        ctx.fill();
        
        this.drawRoundedRect(ctx, x + 2, y + 2, size - 4, size - 4, radius - 2);
        const grad = ctx.createLinearGradient(x, y, x + size, y + size);
        grad.addColorStop(0, colors.highlight);
        grad.addColorStop(0.5, colors.main);
        grad.addColorStop(1, colors.shadow);
        ctx.fillStyle = grad;
        ctx.fill();
        
        this.drawRoundedRect(ctx, x + 4, y + 4, (size - 8) * 0.6, (size - 8) * 0.4, radius - 4);
        const highlightGrad = ctx.createLinearGradient(x + 4, y + 4, x + 4 + (size - 8) * 0.6, y + 4 + (size - 8) * 0.4);
        highlightGrad.addColorStop(0, 'rgba(255,255,255,0.5)');
        highlightGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = highlightGrad;
        ctx.fill();
        
        this.drawRoundedRect(ctx, x + 3, y + 3, size - 6, size - 6, radius - 2);
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        const displayText = p.displayChar || p.name.substring(0, 4);
        let fontSize;
        if (displayText.length === 1) fontSize = cellSize * 1.0;
        else if (displayText.length === 2) fontSize = cellSize * 0.75;
        else if (displayText.length === 3) fontSize = cellSize * 0.55;
        else fontSize = cellSize * 0.42;
        ctx.font = `bold ${Math.floor(fontSize)}px "Segoe UI", "Microsoft YaHei", sans-serif`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(displayText, centerX, centerY);
        ctx.shadowColor = 'transparent';
        
        if (p.actionOrder > 0) {
            const badgeRadius = cellSize * 0.25;
            const badgeX = x + size - badgeRadius - 5;
            const badgeY = y + size - badgeRadius - 5;
            
            let bgColor, textColor, borderColor;
            if (p.actionOrder === 1 && !p.hasActedThisTurn) {
                bgColor = '#FFD700';
                textColor = '#000';
                borderColor = '#FFA500';
            } else if (p.hasActedThisTurn) {
                bgColor = '#666';
                textColor = '#ccc';
                borderColor = '#444';
            } else {
                bgColor = '#fff';
                textColor = '#333';
                borderColor = '#999';
            }
            
            ctx.beginPath();
            ctx.arc(badgeX, badgeY, badgeRadius, 0, 2*Math.PI);
            ctx.fillStyle = bgColor;
            ctx.fill();
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            ctx.font = `bold ${Math.floor(badgeRadius * 1.2)}px "Segoe UI"`;
            ctx.fillStyle = textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.actionOrder.toString(), badgeX, badgeY);
        }
    },
    
    drawActionOrderBadge(ctx, p, x, y, radius) {
        const badgeRadius = radius * 0.35;
        const badgeX = x + radius * 0.6;
        const badgeY = y + radius * 0.6;
        
        let bgColor, textColor, borderColor;
        if (p.actionOrder === 1 && !p.hasActedThisTurn) {
            bgColor = '#FFD700';
            textColor = '#000';
            borderColor = '#FFA500';
        } else if (p.hasActedThisTurn) {
            bgColor = '#666';
            textColor = '#ccc';
            borderColor = '#444';
        } else {
            bgColor = '#fff';
            textColor = '#333';
            borderColor = '#999';
        }
        
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeRadius, 0, 2*Math.PI);
        ctx.fillStyle = bgColor;
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.save();
        ctx.font = `bold ${Math.floor(badgeRadius * 1.2)}px "Segoe UI"`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.actionOrder.toString(), badgeX, badgeY);
        ctx.restore();
    },
    
    drawDragPreview(ctx) {
        const dragging = State.isDragging || State.mouseIsDragging;
        
        if (State.currentMode === 'play' && dragging && State.dragPiece) {
            if (State.freehandMode && State.freehandPathPoints.length > 0) {
                let color = (State.dragPiece.team === 'self') ? '#ff8888' : '#88aaff';
                this.drawPathSegment(ctx, State.freehandPathPoints, color, false, State.dragStartRow, State.dragStartCol);
            } else if (!State.freehandMode && State.dragCurrentRow !== null && State.dragCurrentCol !== null) {
                let previewPoints = Movement.findPath(State.dragStartRow, State.dragStartCol, State.dragCurrentRow, State.dragCurrentCol, State.dragPiece);
                if (previewPoints.length > 0) {
                    let color = (State.dragPiece.team === 'self') ? '#ff8888' : '#88aaff';
                    this.drawPathSegment(ctx, previewPoints, color, false, State.dragStartRow, State.dragStartCol);
                }
            }
        }
        
        if (dragging && State.dragPiece && State.dragCurrentRow !== null && State.dragCurrentCol !== null) {
            let x = State.dragCurrentCol * State.cellW + State.cellW/2;
            let y = State.dragCurrentRow * State.cellH + State.cellH/2;
            let radius = Math.min(State.cellW, State.cellH) * 0.35;
            ctx.globalAlpha = 0.6;
            
            if (State.dragPiece.isLarge) {
                this.drawLargePiece(ctx, State.dragPiece, x, y);
            } else {
                this.drawNormalPiece(ctx, State.dragPiece, x, y, radius);
            }
            ctx.globalAlpha = 1.0;
        }
    }
};