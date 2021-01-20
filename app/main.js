const {
    app,
    globalShortcut,
} = require('electron');
const log = require('electron-log');
const schedule = require('node-schedule');
const api = require('./api');
const window = require('./modules/window');
const update = require('./modules/update');


function auto_check_update() {
    schedule.scheduleJob('* * */3 * * *', ()=>{
        update.check();
    });
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
        log.info(`app窗口创建完成, 相对启动耗时 ${(new Date() - __start)/1000} s`);
        api.initialize();
        log.info(`api初始化完成, 相对启动耗时 ${(new Date() - __start)/1000} s`);
        log.info(`app初始化完成, 相对启动耗时 ${(new Date() - __start)/1000} s`);
        update.check();
        auto_check_update();
    });
    // 窗口全部关闭也不退出
    app.on('window-all-closed', e => e.preventDefault() );
}

