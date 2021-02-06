const {
    app,
    globalShortcut,
    Tray,
    Menu,
    nativeImage,
} = require('electron');
const log = require('electron-log');
const path = require('path');
const schedule = require('node-schedule');
const api = require('./api');
const window = require('./modules/window');
const update = require('./modules/update');
const service = require('./modules/service');


let obj = {
    tray: null,
};


function auto_check_update() {
    schedule.scheduleJob('0 0 */3 * * *', ()=>{
        update.check();
    });
}


function tray_init() {
    obj.tray = new Tray(nativeImage.createFromPath(path.join(__dirname, '../dist/favicon.ico')));
    obj.tray.setContextMenu(Menu.buildFromTemplate([
        {
            label: '新建窗口',
            submenu: [
                {
                    label: '列表页',
                    click() {
                        window.create('/list');
                    }
                },
                {
                    label: '新信息',
                    click() {
                        window.create('/seed');
                    }
                },
                {
                    label: '粘贴板',
                    click() {
                        window.create('/list?paste=true');
                    }
                },
            ]
        },
        {
            label: '退出',
            click(){
                app.exit();
            }
        },
    ]));
    obj.tray.on('double-click', ()=>{
        let wl = window.list();
        wl.length > 0 ? wl.pop().show() : window.create();
    });
}


function regist_global_shortcut() {
    // fixme：mac系统上command和super为同一按键，修改默认为option
    // todo 修改根据配置文件进行绑定
    globalShortcut.register('CommandOrControl+Super+l', () => {
        window.create('/list');
    });
    globalShortcut.register('CommandOrControl+Super+V', () => {
        window.create('/list?paste=true');
    });
    globalShortcut.register('CommandOrControl+Super+n', () => {
        window.create('/seed');
    });
}


if(!app.requestSingleInstanceLock()) {
    // 已经有启动了，则退出
    app.quit();
}
else {
    app.on('second-instance', () => {
        // todo 根据命令来处理打开窗口
        window.create();
    });
    app.on('ready', async()=>{
        let __start = new Date();
        window.create();
        log.info(`主窗口创建完成, 相对启动耗时 ${(new Date() - __start)/1000} s`);
        api.initialize();
        log.info(`api模组初始化完成, 相对启动耗时 ${(new Date() - __start)/1000} s`);
        regist_global_shortcut();
        service._initialize();
        update.check();
        auto_check_update();
        tray_init();
        log.info(`app初始化完成, 相对启动耗时 ${(new Date() - __start)/1000} s`);
    });
    // 窗口全部关闭也不退出
    app.on('window-all-closed', e => e.preventDefault() );
}

