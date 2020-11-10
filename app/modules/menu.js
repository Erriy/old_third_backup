const {
    Menu, BrowserWindow
} = require('electron');


function update({
    file=false,
}={}) {
    let e = arguments[arguments.length - 1];
    let win = BrowserWindow.fromWebContents(e.sender);
    let config = [];

    // 文件菜单栏
    if(file){
        config.push({
            label: '文件(&F)',
            submenu: [
                {
                    label: '保存',
                    accelerator: 'CmdOrCtrl+s',
                    click() {
                        e.sender.send('file', {save: true})
                    }
                },
                {
                    label: '关闭',
                    accelerator: 'CmdOrCtrl+w',
                    click() {
                        e.sender.send('file', {close: true})
                    }
                }
            ]
        });
    }

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

    config.push({
        label: '配置(&C)',
        submenu: [
            {
                label: '本地服务配置',
                click() {
                    e.sender.send('config', {config: "local_service"})
                }
            }
        ]
    });

    win.setMenu(Menu.buildFromTemplate(config));
}


module.exports = {
    update,
};

