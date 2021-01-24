const {
    Menu,
    BrowserWindow,
    dialog,
} = require('electron');
const {check:check_update} = require('./update');
const service = require('./service');


function isenabled(i) {
    if(i && typeof(i) === 'string') {
        return -1 === i.indexOf('disable');
    }
    else {
        return true;
    }
}


function isvisible(i) {
    if(i && typeof(i) === 'string') {
        return -1 !== i.indexOf('show');
    }
    else {
        return false;
    }
}


function ischecked(i, value) {
    if(i && typeof(i) === 'string') {
        return -1 !== i.indexOf(value);
    }
    else {
        return false;
    }
}


function update({
    seed=true,
    file=false,
}={}) {
    // fixme 动态刷新菜单栏，不重建，创建window时自动创建菜单并绑定到win上，根据菜单id进行状态切换实现动态刷新
    let e = arguments[arguments.length - 1];
    let win = BrowserWindow.fromWebContents(e.sender);
    let config = [];
    let menu = null;

    // 种子菜单栏
    if(seed) {
        config.push({
            label: '种子(&S)',
            submenu: [
                {
                    label: '新建',
                    accelerator: 'CmdOrCtrl+n',
                    click() {
                        e.sender.send('seed', {new: true})
                    }
                },
                {
                    label: '列表',
                    accelerator: 'CmdOrCtrl+l',
                    enabled: isenabled(seed.list),
                    click() {
                        e.sender.send('seed', {list: true})
                    }
                },
                {
                    label: '保存',
                    accelerator: 'CmdOrCtrl+s',
                    click() {
                        e.sender.send('seed', {save: true})
                    }
                },
                {
                    label: '删除',
                    accelerator: 'CmdOrCtrl+d',
                    visible: isvisible(seed.delete),
                    click() {
                        e.sender.send('seed', {delete: true})
                    }
                }
            ]
        });
    }

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

    // 服务器菜单栏
    config.push({
        label: '服务器(&E)',
        submenu: [
            {
                id: 'service.start',
                label: '启动',
                enabled: !service.running(),
                click() {
                    service.start();
                    menu.getMenuItemById('service.restart').enabled = true;
                    menu.getMenuItemById('service.start').enabled = false;
                    menu.getMenuItemById('service.stop').enabled = true;
                }
            },
            {
                id: 'service.restart',
                label: '重启',
                enabled: service.running(),
                click() {
                    service.start();
                    menu.getMenuItemById('service.restart').enabled = true;
                    menu.getMenuItemById('service.start').enabled = false;
                    menu.getMenuItemById('service.stop').enabled = true;
                }
            },
            {
                id: 'service.stop',
                label: '关闭',
                enabled: service.running(),
                async click() {
                    await service.stop();
                    menu.getMenuItemById('service.restart').enabled = false;
                    menu.getMenuItemById('service.start').enabled = true;
                    menu.getMenuItemById('service.stop').enabled = false;
                }
            },
            {
                label: '配置',
                click() {
                    e.sender.send('config', {config: "service"});
                }
            }
            // {
            //     label: '本地服务配置',
            //     click() {
            //         e.sender.send('config', {config: "local_service"})
            //     }
            // }
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

