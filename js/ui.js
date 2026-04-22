/**
 * 战棋推演沙盘 - UI交互系统
 */
const UI = {
    // DOM元素缓存
    elements: {},

    // 初始化
    init() {
        this.cacheElements();
        this.bindEvents();
    },

    // 缓存DOM元素
    cacheElements() {
        this.elements = {
            rowsInput: document.getElementById('rowsInput'),
            colsInput: document.getElementById('colsInput'),
            resizeBtn: document.getElementById('resizeBtn'),
            expandBtn: document.getElementById('expandBtn'),
            shrinkBtn: document.getElementById('shrinkBtn'),
            saveBtn: document.getElementById('saveBtn'),
            loadBtn: document.getElementById('loadBtn'),
            clearPathAndGhostsBtn: document.getElementById('clearPathAndGhostsBtn'),
            clearAllRecordsBtn: document.getElementById('clearAllRecordsBtn'),
            modeHint: document.getElementById('modeHint'),
            viewReturnArea: document.getElementById('viewReturnArea'),
            selectedInfo: document.getElementById('selectedInfo'),
            terrainTools: document.getElementById('terrainTools'),
            addCustomBtn: document.getElementById('addCustomBtn'),
            addPlayCustomBtn: document.getElementById('addPlayCustomBtn'),
            freehandModeCheckbox: document.getElementById('freehandModeCheckbox'),
            selfBtn: document.getElementById('selfBtn'),
            customBtn: document.getElementById('customBtn'),
            enemyBtn: document.getElementById('enemyBtn'),
            charDropdown: document.getElementById('charDropdown'),
            charSearch: document.getElementById('charSearch'),
            charList: document.getElementById('charList'),
            closeDropdown: document.getElementById('closeDropdown'),
            customModal: document.getElementById('customModal'),
            modalTitle: document.getElementById('modalTitle'),
            customName: document.getElementById('customName'),
            customSpeed: document.getElementById('customSpeed'),
            sizeOptionGroup: document.getElementById('sizeOptionGroup'),
            isLargeSize: document.getElementById('isLargeSize'),
            enemyShowFirstChar: document.getElementById('enemyShowFirstChar'),
            showCharOptionGroup: document.getElementById('showCharOptionGroup'),
            showFirstChar: document.getElementById('showFirstChar'),
            closeModal: document.getElementById('closeModal'),
            cancelCustom: document.getElementById('cancelCustom'),
            confirmCustom: document.getElementById('confirmCustom'),
            layoutContent: document.getElementById('layoutContent'),
            playContent: document.getElementById('playContent'),
            logList: document.getElementById('logList'),
            modeButtons: document.querySelectorAll('.mode-btn'),
            standbyBtn: document.getElementById('standbyBtn'),
            speedAdjustBtn: document.getElementById('speedAdjustBtn'),
            removePieceLayoutBtn: document.getElementById('removePieceLayoutBtn'),
            removePiecePlayBtn: document.getElementById('removePiecePlayBtn'),
            speedAdjustModal: document.getElementById('speedAdjustModal'),
            closeSpeedAdjustModal: document.getElementById('closeSpeedAdjustModal'),
            cancelSpeedAdjust: document.getElementById('cancelSpeedAdjust'),
            confirmSpeedAdjust: document.getElementById('confirmSpeedAdjust'),
            speedAdjustSelect: document.getElementById('speedAdjustSelect'),
            speedCustomValueGroup: document.getElementById('speedCustomValueGroup'),
            speedCustomValue: document.getElementById('speedCustomValue'),
            speedAdjustTurnsInput: document.getElementById('speedAdjustTurnsInput'),
            // 击退和换位按钮
            knockbackBtn: document.getElementById('knockbackBtn'),
            swapBtn: document.getElementById('swapBtn')
        };
    },

    // 绑定事件
    bindEvents() {
        const el = this.elements;
        // 模式切换按钮
        el.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchMode(btn.dataset.mode);
            });
        });
        // 棋盘控制
        el.resizeBtn.addEventListener('click', () => Game.resizeBoard());
        el.expandBtn.addEventListener('click', () => Game.expandBoard());
        el.shrinkBtn.addEventListener('click', () => Game.shrinkBoard());
        el.saveBtn.addEventListener('click', () => Game.saveBoard());
        el.loadBtn.addEventListener('click', () => Game.loadBoard());
        el.clearPathAndGhostsBtn.addEventListener('click', () => Game.clearPathAndGhosts());
        el.clearAllRecordsBtn.addEventListener('click', () => Game.resetToInitial());
        el.standbyBtn.addEventListener('click', () => Game.doStandby());
        el.speedAdjustBtn.addEventListener('click', () => this.showSpeedAdjustModal());
        el.removePieceLayoutBtn.addEventListener('click', () => this.toggleRemovePieceMode('layout'));
        el.removePiecePlayBtn.addEventListener('click', () => this.toggleRemovePieceMode('play'));

        // 调速对话框事件
        el.closeSpeedAdjustModal.addEventListener('click', () => this.hideSpeedAdjustModal());
        el.cancelSpeedAdjust.addEventListener('click', () => this.hideSpeedAdjustModal());
        el.confirmSpeedAdjust.addEventListener('click', () => this.confirmSpeedAdjust());
        el.speedAdjustSelect.addEventListener('change', (e) => {
            el.speedCustomValueGroup.style.display = e.target.value === 'custom' ? 'flex' : 'none';
        });

        // 角色选择按钮
        el.selfBtn.addEventListener('click', () => {
            this.cancelHolding();
            this.showCharacterDropdown();
        });
        el.customBtn.addEventListener('click', () => {
            this.cancelHolding();
            this.showModal('custom');
        });
        el.enemyBtn.addEventListener('click', () => {
            this.cancelHolding();
            this.showModal('enemy');
        });
        el.closeDropdown.addEventListener('click', () => this.hideCharacterDropdown());

        // 搜索功能
        el.charSearch.addEventListener('input', (e) => {
            this.filterCharacters(e.target.value);
        });

        // 弹窗事件
        el.closeModal.addEventListener('click', () => this.hideModal());
        el.cancelCustom.addEventListener('click', () => this.hideModal());
        el.confirmCustom.addEventListener('click', () => this.confirmCustom());

        // 手绘模式
        el.freehandModeCheckbox.addEventListener('change', (e) => {
            State.freehandMode = e.target.checked;
            Renderer.drawBoard();
        });

        // 添加自定义地形（布局模式）
        if (el.addCustomBtn) {
            el.addCustomBtn.addEventListener('click', () => this.showCustomTerrainModal());
        }
        
        // 添加自定义地形（推演模式）
        if (el.addPlayCustomBtn) {
            el.addPlayCustomBtn.addEventListener('click', () => this.showPlayCustomTerrainModal());
        }
        
        // 布局地形按钮
        document.querySelectorAll('.terrain-btn[data-terrain]').forEach(btn => {
            btn.addEventListener('click', () => {
                const terrain = btn.dataset.terrain;
                if (State.activeTerrain === terrain) {
                    State.activeTerrain = null;
                    btn.classList.remove('active');
                } else {
                    State.activeTerrain = terrain;
                    document.querySelectorAll('.terrain-btn[data-terrain]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    if (State.holdingState) {
                        State.holdingState = null;
                        this.updateCharacterInfo(null);
                    }
                }
            });
        });
        
        // 推演地形按钮（静态HTML中的）
        document.querySelectorAll('.terrain-btn[data-play-terrain]').forEach(btn => {
            btn.addEventListener('click', () => {
                const terrainType = btn.dataset.playTerrain;
                const isSameCustom = State.activePlayTerrain && typeof State.activePlayTerrain === 'object' && State.activePlayTerrain.type === terrainType;
                if (State.activePlayTerrain === terrainType || isSameCustom) {
                    State.activePlayTerrain = null;
                    btn.classList.remove('active');
                } else {
                    State.activePlayTerrain = terrainType;
                    document.querySelectorAll('.terrain-btn[data-play-terrain]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
                Renderer.drawBoard();
            });
        });

        // ========== 击退按钮 ==========
        if (el.knockbackBtn) {
            el.knockbackBtn.addEventListener('click', () => {
                if (State.currentMode !== 'play') {
                    this.showToast('仅在推演模式下可用');
                    return;
                }
                // 退出其他模式
                State.swapMode = false;
                State.swapFirstPiece = null;
                State.knockbackMode = true;
                State.isKnockbackDragging = false;
                State.knockbackTargetPiece = null;
                State.knockbackDragStart = null;
                State.knockbackDragCurrent = null;
                State.knockbackPreviewPath = [];
                State.highlightedPiece = null;
                document.body.style.cursor = 'crosshair';
                this.showToast('点击要击退的棋子，然后拖拽方向');
                Renderer.drawBoard();
            });
        }

        // ========== 换位按钮 ==========
        if (el.swapBtn) {
            el.swapBtn.addEventListener('click', () => {
                if (State.currentMode !== 'play') {
                    this.showToast('仅在推演模式下可用');
                    return;
                }
                State.knockbackMode = false;
                State.swapMode = true;
                State.swapFirstPiece = null;
                State.highlightedPiece = null;
                document.body.style.cursor = 'crosshair';
                this.showToast('依次点击两个棋子进行换位');
                Renderer.drawBoard();
            });
        }
    },
    
    // ========== 切换模式（核心修改） ==========
    switchMode(mode) {
        const previousMode = State.currentMode;
        
        // 从推演切换到布局
        if (previousMode === 'play' && mode === 'layout') {
            // 检查是否有推演痕迹（移动记录或路径/幽灵）
            const hasPlayTraces = State.moveLogs.length > 0 || State.pathLines.length > 0 || State.ghosts.length > 0;
            if (hasPlayTraces) {
                const confirmMsg = '是否保留当前推演步骤？\n选择“确定”保留，切换回推演时可继续；\n选择“取消”将放弃当前推演，恢复到布局初始状态。';
                const keep = confirm(confirmMsg);
                if (keep) {
                    // 保存当前推演状态
                    Game.savePlayState();
                } else {
                    // 不保留：清除推演痕迹并重置到布局初始状态
                    Game.clearPlayTracesAndReset();
                    // 同时清除可能已保存的状态
                    State.savedPlayState = null;
                }
            }
            // 切换到布局模式前，清除当前显示的推演痕迹（路径、幽灵等）
            // 注意：如果保留了状态，痕迹已在保存的 snapshot 中，但布局模式不应显示，所以直接清空显示
            State.pathLines = [];
            State.ghosts = [];
            Renderer.drawBoard();
        }
        
        // 从布局切换到推演
        if (previousMode === 'layout' && mode === 'play') {
            if (State.savedPlayState) {
                const restoreMsg = '检测到之前保存的推演步骤，是否恢复？\n选择“确定”继续上次推演；\n选择“取消”开始新的推演（基于当前布局）。';
                const restore = confirm(restoreMsg);
                if (restore) {
                    Game.restorePlayState();
                    // 恢复后重新计算行动顺序
                    Movement.calculateActionOrders();
                    // 设置模式并完成切换，避免后续重复初始化
                    State.currentMode = mode;
                    this.updateModeUI(mode);
                    this.setModeDisplay(mode);
                    // 清除其他模式状态
                    this.clearModeStates();
                    Renderer.drawBoard();
                    return;
                } else {
                    // 不恢复，清除保存的状态
                    State.savedPlayState = null;
                    // 基于当前布局重置初始快照
                    Game.setInitialSnapshot();
                }
            } else {
                // 没有保存的状态，基于当前布局设置初始快照
                Game.setInitialSnapshot();
            }
        }
        
        // 通用模式切换逻辑（清除模式相关状态、更新UI等）
        State.currentMode = mode;
        
        // 清除所有模式状态（击退、换位、调速、移除棋子等）
        this.clearModeStates();
        
        // 更新按钮状态
        this.elements.modeButtons.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 设置初始地形选择（弹起状态）
        if (mode === 'layout') {
            State.activeTerrain = null;
            document.querySelectorAll('.terrain-btn[data-terrain]').forEach(b => b.classList.remove('active'));
        } else {
            State.activePlayTerrain = null;
            document.querySelectorAll('.terrain-btn[data-play-terrain]').forEach(b => b.classList.remove('active'));
        }
        
        this.setModeDisplay(mode);
        Movement.calculateActionOrders();
        Renderer.drawBoard();
    },

    // ========== 辅助方法：清除所有模式相关状态 ==========
    clearModeStates() {
        State.holdingState = null;
        State.activeTerrain = null;
        State.activePlayTerrain = null;
        State.speedAdjustMode = false;
        State.removePieceMode = false;
        State.removePieceModeLayout = false;
        State.knockbackMode = false;
        State.swapMode = false;
        State.swapFirstPiece = null;
        State.knockbackTargetPiece = null;
        State.isKnockbackDragging = false;
        State.knockbackDragStart = null;
        State.knockbackDragCurrent = null;
        State.knockbackPreviewPath = [];
        State.highlightedPiece = null;
        
        Game.clearSpeedAdjustHint();
        this.clearRemovePieceMode();
        this.clearKnockbackMode();
        this.clearSwapMode();
    },

    // ========== 辅助方法：更新模式按钮UI（供恢复时使用） ==========
    updateModeUI(mode) {
        this.elements.modeButtons.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },
    
    // ========== 原有方法（未修改，保留） ==========
    setModeDisplay(mode) {
        const el = this.elements;
        if (mode === 'layout') {
            el.modeHint.textContent = '布局模式';
            el.layoutContent.style.display = 'block';
            el.playContent.style.display = 'none';
            el.terrainTools.style.display = 'block';
        } else {
            el.modeHint.textContent = '推演模式';
            el.layoutContent.style.display = 'none';
            el.playContent.style.display = 'block';
            el.terrainTools.style.display = 'block';
        }
    },

    showCharacterDropdown() {
        this.elements.charDropdown.style.display = 'block';
        this.elements.charSearch.value = '';
        this.renderCharacterList();
    },

    hideCharacterDropdown() {
        this.elements.charDropdown.style.display = 'none';
    },

    renderCharacterList(filter = '') {
        const list = this.elements.charList;
        list.innerHTML = '';
        const characters = searchCharacters(filter);
        characters.forEach(char => {
            const item = document.createElement('div');
            item.className = 'char-item';
            item.textContent = `${char.name} (速度${char.speed})`;
            item.addEventListener('click', () => {
                PiecePlacement.selectCharacter(char);
                this.hideCharacterDropdown();
            });
            list.appendChild(item);
        });
    },

    filterCharacters(search) {
        this.renderCharacterList(search);
    },

    showModal(type) {
        const el = this.elements;
        el.customModal.style.display = 'flex';
        if (type === 'enemy') {
            el.modalTitle.textContent = '添加敌方角色';
            el.sizeOptionGroup.style.display = 'block';
            el.showCharOptionGroup.style.display = 'none';
            el.isLargeSize.checked = false;
        } else {
            el.modalTitle.textContent = '添加自定义角色';
            el.sizeOptionGroup.style.display = 'none';
            el.showCharOptionGroup.style.display = 'block';
            el.showFirstChar.checked = true;
        }
        el.customName.value = '';
        el.customSpeed.value = '';
        this.currentModalType = type;
    },

    hideModal() {
        this.elements.customModal.style.display = 'none';
    },

    confirmCustom() {
        const el = this.elements;
        const name = el.customName.value.trim();
        const speed = parseInt(el.customSpeed.value);
        if (!name || !speed || speed <= 0) {
            alert('请输入有效的名称和速度');
            return;
        }
        if (this.currentModalType === 'enemy') {
            PiecePlacement.createEnemyPiece(name, speed, el.isLargeSize.checked, el.enemyShowFirstChar.checked);
        } else {
            PiecePlacement.createCustomPiece(name, speed, el.showFirstChar.checked);
        }
        this.hideModal();
    },

    updateCharacterInfo(piece) {
        const el = this.elements;
        if (!piece) {
            el.selectedInfo.style.display = 'none';
            return;
        }
        el.selectedInfo.style.display = 'block';
        let actionText = piece.hasActedThisTurn ? '(本回合已行动)' : '(未行动)';
        let buffText = '';
        if (piece.speedBuffs && piece.speedBuffs.length > 0) {
            const totalBuff = piece.speedBuffs.reduce((sum, b) => sum + b.value, 0);
            const sign = totalBuff >= 0 ? '+' : '';
            buffText = ` <span style="color:#6f6">[${sign}${totalBuff}]</span>`;
        }
        let effectiveSpeed = piece.speed;
        if (piece.speedBuffs && piece.speedBuffs.length > 0) {
            effectiveSpeed += piece.speedBuffs.reduce((sum, b) => sum + b.value, 0);
        }
        el.selectedInfo.innerHTML = `
            <div>选择: ${piece.name}</div>
            <div>速度: ${piece.speed}${buffText} = ${effectiveSpeed}</div>
            <div>顺序: ${piece.actionOrder} ${actionText}</div>
            ${piece.isLarge ? '<div>体型: 3x3</div>' : ''}
        `;
    },

    cancelHolding() {
        State.holdingState = null;
        State.activeTerrain = null;
        State.activePlayTerrain = null;
        this.updateCharacterInfo(null);
        Renderer.drawBoard();
    },
    
    updateTerrainButtons(terrains) {
        const container = document.getElementById('terrainButtons');
        if (!container) return;
        container.innerHTML = '';
        terrains.forEach(terrain => {
            const btn = document.createElement('button');
            btn.className = 'terrain-btn';
            btn.textContent = terrain.label;
            if (terrain.isCustom) {
                btn.dataset.playTerrain = terrain.label;
                btn.style.background = terrain.bg;
                btn.style.color = terrain.color;
            } else {
                btn.dataset.playTerrain = terrain.type;
                btn.style.background = terrain.bg;
                btn.style.color = terrain.color;
            }
            btn.addEventListener('click', () => {
                const terrainType = terrain.isCustom ? terrain.label : terrain.type;
                const isSameCustom = State.activePlayTerrain && typeof State.activePlayTerrain === 'object' && State.activePlayTerrain.type === terrainType;
                if (State.activePlayTerrain === terrainType || isSameCustom) {
                    State.activePlayTerrain = null;
                    btn.classList.remove('active');
                } else {
                    State.activePlayTerrain = terrainType;
                    document.querySelectorAll('.terrain-btn[data-play-terrain]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
                Renderer.drawBoard();
            });
            container.appendChild(btn);
        });
    },

    updateLogDisplay() {
        const el = this.elements;
        let html = '';
        State.moveLogs.forEach(log => {
            let actionText;
            if (log.isStandby) {
                actionText = `${log.pieceDesc} 行动结束`;
            } else if (log.isSpeedAdjust) {
                actionText = `${log.pieceDesc} ${log.from} ${log.to}`;
            } else if (log.isKnockback) {
                actionText = `${log.pieceDesc} 击退 ${log.from} -> ${log.to}`;
            } else if (log.isSwap) {
                actionText = `${log.pieceDesc} ${log.from} ${log.to}`;
            } else {
                actionText = `${log.pieceDesc} ${log.from} -> ${log.to}`;
            }
            html += `
                <div class="log-entry">
                    <div><strong>第${log.stepNumber}步：</strong> ${actionText}
                    <button class="rollback-btn" data-step="${log.stepNumber}">回退至此</button>
                    <button class="view-btn" data-step="${log.stepNumber}">查看此步</button>
                    </div>
                    <div class="remark">
                        <input type="text" placeholder="备注" value="${this.escapeHtml(log.remark)}" data-step="${log.stepNumber}" class="remark-input">
                        <button data-step="${log.stepNumber}" class="save-remark-btn">保存备注</button>
                    </div>
                </div>
            `;
        });
        el.logList.innerHTML = html;
        el.logList.scrollTop = el.logList.scrollHeight;
        el.logList.querySelectorAll('.rollback-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const stepNumber = parseInt(btn.dataset.step);
                Game.rollbackToStep(stepNumber);
            });
        });
        el.logList.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const stepNumber = parseInt(btn.dataset.step);
                Game.viewStep(stepNumber);
            });
        });
        el.logList.querySelectorAll('.save-remark-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const stepNumber = parseInt(btn.dataset.step);
                const input = el.logList.querySelector(`.remark-input[data-step="${stepNumber}"]`);
                if (input) {
                    const log = State.moveLogs.find(l => l.stepNumber === stepNumber);
                    if (log) {
                        log.remark = input.value;
                        this.showToast('备注已保存');
                    }
                }
            });
        });
    },

    showSpeedAdjustModal() {
        const el = this.elements;
        if (State.speedAdjustMode) {
            Game.cancelSpeedAdjust();
            return;
        }
        el.speedAdjustModal.style.display = 'flex';
        el.speedAdjustSelect.value = '50';
        el.speedCustomValue.value = '50';
        el.speedCustomValueGroup.style.display = 'none';
        el.speedAdjustTurnsInput.value = '2';
        const currentActor = Movement.getCurrentActor();
        State.speedAdjustSourcePiece = currentActor ? { name: currentActor.name, team: currentActor.team } : null;
    },

    hideSpeedAdjustModal() {
        this.elements.speedAdjustModal.style.display = 'none';
    },

    confirmSpeedAdjust() {
        const el = this.elements;
        let value;
        if (el.speedAdjustSelect.value === 'custom') {
            value = parseInt(el.speedCustomValue.value);
            if (isNaN(value)) {
                alert('请输入有效的速度值');
                return;
            }
        } else {
            value = parseInt(el.speedAdjustSelect.value);
        }
        const turns = parseInt(el.speedAdjustTurnsInput.value);
        if (isNaN(turns) || turns < 1) {
            alert('生效次数至少为1');
            return;
        }
        State.speedAdjustMode = true;
        State.speedAdjustValue = value;
        State.speedAdjustTurns = turns;
        this.hideSpeedAdjustModal();
        Game.startSpeedAdjustHint();
    },

    toggleRemovePieceMode(mode) {
        if (mode === 'layout') {
            State.removePieceModeLayout = !State.removePieceModeLayout;
            State.removePieceMode = false;
            const btn = this.elements.removePieceLayoutBtn;
            if (State.removePieceModeLayout) {
                btn.classList.add('active');
                btn.style.background = '#b33';
            } else {
                btn.classList.remove('active');
                btn.style.background = '';
            }
        } else {
            State.removePieceMode = !State.removePieceMode;
            State.removePieceModeLayout = false;
            const btn = this.elements.removePiecePlayBtn;
            if (State.removePieceMode) {
                btn.classList.add('active');
                btn.style.background = '#b33';
            } else {
                btn.classList.remove('active');
                btn.style.background = '';
            }
        }
        Renderer.drawBoard();
    },

    clearRemovePieceMode() {
        State.removePieceMode = false;
        State.removePieceModeLayout = false;
        const layoutBtn = this.elements.removePieceLayoutBtn;
        const playBtn = this.elements.removePiecePlayBtn;
        if (layoutBtn) {
            layoutBtn.classList.remove('active');
            layoutBtn.style.background = '';
        }
        if (playBtn) {
            playBtn.classList.remove('active');
            playBtn.style.background = '';
        }
    },

    // ========== 击退和换位模式清除 ==========
    clearKnockbackMode() {
        State.knockbackMode = false;
        State.knockbackTargetPiece = null;
        State.isKnockbackDragging = false;
        State.knockbackDragStart = null;
        State.knockbackDragCurrent = null;
        State.knockbackPreviewPath = [];
        State.highlightedPiece = null;
        document.body.style.cursor = 'default';
        Renderer.drawBoard();
    },

    clearSwapMode() {
        State.swapMode = false;
        State.swapFirstPiece = null;
        State.highlightedPiece = null;
        document.body.style.cursor = 'default';
        Renderer.drawBoard();
    },

    // ========== 提示消息 ==========
    showToast(message, duration = 1500) {
        if (State.toastTimeout) clearTimeout(State.toastTimeout);
        State.toastMessage = message;
        Renderer.drawBoard();
        State.toastTimeout = setTimeout(() => {
            State.toastMessage = '';
            Renderer.drawBoard();
        }, duration);
    },

    // ========== 自定义地形弹窗 ==========
    showCustomTerrainModal() {
        const label = prompt('输入自定义地形名称（1-3字）：');
        if (!label || !label.trim()) return;
        if (label.length > 3) {
            alert('地形名称最多3个字');
            return;
        }
        if (State.customTerrains.find(t => t.label === label.trim())) {
            alert('该地形已存在');
            return;
        }
        const bg = prompt('输入背景颜色（如 #ff0000）：', '#808080');
        if (!bg) return;
        const color = prompt('输入文字颜色（如 #ffffff）：', '#ffffff');
        if (!color) return;
        if (typeof Terrain !== 'undefined' && Terrain.addCustomButton) {
            Terrain.addCustomButton(label.trim(), bg, color);
        } else {
            console.error('Terrain对象未定义或缺少addCustomButton方法');
            this.showToast('系统错误，请刷新页面重试');
        }
    },

    showPlayCustomTerrainModal() {
        const label = prompt('输入自定义标记名称（1-3字）：');
        if (!label || !label.trim()) return;
        if (label.length > 3) {
            alert('标记名称最多3个字');
            return;
        }
        if (State.customPlayTerrains && State.customPlayTerrains.find(t => t.label === label.trim())) {
            alert('该标记已存在');
            return;
        }
        const bg = prompt('输入背景颜色（如 #ff0000）：', '#808080');
        if (!bg) return;
        const color = prompt('输入文字颜色（如 #ffffff）：', '#ffffff');
        if (!color) return;
        if (typeof Terrain !== 'undefined' && typeof Terrain.addPlayCustomButton === 'function') {
            Terrain.addPlayCustomButton(label.trim(), bg, color);
        } else {
            console.error('Terrain对象未定义或缺少addPlayCustomButton方法');
            this.showToast('功能暂不可用，请检查控制台错误');
        }
    },

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m] || m));
    }
};