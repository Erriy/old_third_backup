const {
    app,
    globalShortcut,
    Tray,
    Menu,
} = require('electron');
const log = require('electron-log');
const path = require('path');
const schedule = require('node-schedule');
const api = require('./api');
const window = require('./modules/window');
const update = require('./modules/update');
const service = require('./service');


let obj = {
    tray: null,
};


function auto_check_update() {
    schedule.scheduleJob('* * */3 * * *', ()=>{
        update.check();
    });
}


function tray_init() {
    // fixme: tray加载失败
    obj.tray = new Tray(path.join(__dirname, "../dist", "favicon.ico"));
    obj.tray.setContextMenu(Menu.buildFromTemplate([
        { label: 'Item1', type: 'radio' },
        { label: 'Item2', type: 'radio' }
    ]));
}


// function regist_global_shortcut() {
//     // fixme：mac系统上command和super为同一按键，修改默认为option
//     // todo 修改根据配置文件进行绑定
//     globalShortcut.register('CommandOrControl+Super+N', () => {
//         window.create({path: '/seed'});
//     });
//     globalShortcut.register('CommandOrControl+Super+L', () => {
//         window.create({path: '/list'});
//     });
// }


if(!app.requestSingleInstanceLock()) {
    // 已经有启动了，则退出
    app.quit();
}
else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        window.create();
    })
    app.on('ready', async()=>{
        let __start = new Date();
        window.create();
        log.info(`主窗口创建完成, 相对启动耗时 ${(new Date() - __start)/1000} s`);
        api.initialize();
        log.info(`api模组初始化完成, 相对启动耗时 ${(new Date() - __start)/1000} s`);
        service.restart({
            neo4j: {
                password: "ub1JOnQcuV^rfBsr5%Ek"
            }
        });
        update.check();
        auto_check_update();
        tray_init();
        log.info(`app初始化完成, 相对启动耗时 ${(new Date() - __start)/1000} s`);
    });
    // 窗口全部关闭也不退出
    app.on('window-all-closed', e => e.preventDefault() );
}

