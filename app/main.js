const {
    app,
    globalShortcut,
} = require('electron');
const log = require('electron-log');
const api = require('./api');
const window = require('./modules/window');


function regist_global_shortcut() {
    // fixme：mac系统上command和super为同一按键，修改默认为option
    // todo 修改根据配置文件进行绑定
    globalShortcut.register('CommandOrControl+Super+N', () => {
        window.create({path: '/seed'});
    });
    globalShortcut.register('CommandOrControl+Super+L', () => {
        window.create({path: '/list'});
    });
}


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
        api.initialize();
        window.create();
        let __end = new Date();
        log.info(`app初始化完成, 耗时 ${(__end - __start)/1000} s`);
    });
    // 窗口全部关闭也不退出
    app.on('window-all-closed', e => e.preventDefault() );
}

