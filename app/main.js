const {
    app,
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
    update.check();
    schedule.scheduleJob('0 0 */3 * * *', ()=>{
        update.check();
    });
}

function tray_init() {
    obj.tray = new Tray(nativeImage.createFromPath(path.join(__dirname, '../dist/favicon.ico')));
    obj.tray.setContextMenu(Menu.buildFromTemplate([
        {
            label: '打开主页',
            click() {
                window.create('/');
            }
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
    // todo 注册全局快捷键
}

if(!app.requestSingleInstanceLock()) {
    // 已经有进程启动了，则退出
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
        auto_check_update();
        tray_init();
        log.info(`app初始化完成, 相对启动耗时 ${(new Date() - __start)/1000} s`);
    });
    // 窗口全部关闭也不退出
    app.on('window-all-closed', e => e.preventDefault() );
}
