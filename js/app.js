/**
 * 战棋推演沙盘 - 主应用入口
 * Wargame Sandbox Application
 */

(function(){
    // 初始化应用
    function init() {
        // 初始化状态
        State.init();
        
        // 初始化渲染器
        Renderer.init();
        Renderer.resizeCanvas();
        
        // 初始化UI
        UI.init();
        
        // 初始化输入系统
        Input.init();
        
        // 设置初始模式
        UI.switchMode('layout');
    }
    
    // 启动应用
    init();
})();
