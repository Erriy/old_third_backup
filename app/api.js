const {
    ipcMain,
} = require('electron');
const log = require('electron-log');
const fs = require('fs');
const path=require('path');


function regist_api_modules(modules_path) {
    fs.readdirSync(modules_path).forEach((file)=>{
        if(file.endsWith('.js')) {
            const module_name = file.slice(0, file.length-3);
            const md = require(path.join(modules_path, module_name));
            Object.keys(md)
            .filter(name=>!name.startsWith('_'))
            .map(name=>ipcMain.handle(
                `${module_name}.${name}`,
                (e, ... args)=>(md[name](...args, e))
            ));
        }
    })
}


function initialize() {
    let __start = new Date();
    regist_api_modules(path.join(__dirname, 'modules'));
    let __end = new Date();
    log.info(`app api 注册完成, 耗时 ${(__end - __start)/1000} s`);
}


module.exports = {
    initialize,
};

