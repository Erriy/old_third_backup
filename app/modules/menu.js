const {
    Menu,
    BrowserWindow,
} = require('electron');
const {check:check_update} = require('./update');

function update() {
    // fixme 动态刷新菜单栏，不重建，创建window时自动创建菜单并绑定到win上，根据菜单id进行状态切换实现动态刷新（或维护win-menu object，win on close时删除menu对象）
    let e = arguments[arguments.length - 1];
    let win = BrowserWindow.fromWebContents(e.sender);
    let config = [];
    let menu = null;

    // 视图菜单栏
    config.push({
        label: '视图(&V)',
        submenu: [
            {
                label: '窗口置顶',
                accelerator: 'CommandOrControl+Shift+P',
                type: 'checkbox',
                checked: false,
                click(i) {
                    win.setAlwaysOnTop(i.checked);
                }
            },
            {
                role: 'togglefullscreen',
                label: '全屏'
            },
            {
                type: 'separator',
            },
            {
                label: '开发者工具',
                role: 'toggledevtools',
                accelerator: 'Shift+F12'
            }
        ]
    });

    // 关于菜单栏
    config.push({
        label: '关于(&A)',
        submenu: [
            {
                label: '检查更新',
                click(){
                    check_update();
                }
            }
        ]
    });
    menu = Menu.buildFromTemplate(config);
    win.setMenu(menu);
}

module.exports = {
    update,
};
