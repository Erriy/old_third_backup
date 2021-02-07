const webdav = require('webdav-server').v2;
const os = require('os');
const open = require('open');
const cmd_exists = require('command-exists');

let obj = {
    server: null,
    options: {
        host: undefined,
        port: undefined,
    },
};

function stop() {
    if(obj.server) {
        obj.server.stop();
        obj.server = null;
    }
}

const open_handler = {
    linux: async ()=>{
        let app = undefined;
        for(let a of ['thunar', 'nautilus']) {
            try {
                await cmd_exists(a);
                app = a;
                break;
            }
            catch(e) {}
        }
        await open('dav://localhost:1900/', {wait: false, app:app});
    },
    win32: async()=>{
        // todo win32 open handler
    },
    mac: async()=>{
        // todo mac open handler
    },
};

const mount_handler = {
    linux: async ()=>{
        return open_handler.linux;
    },
    win32: async()=>{
        // todo win32 mount handler
    },
    mac: async()=>{
        // todo mac mount handler
    },
};

const wabdav_open = open_handler[os.platform()];
const mount = mount_handler[os.platform()];

function start({
    host='localhost',
    port=63389,
}={}) {
    stop();
    obj.server = new webdav.WebDAVServer({
        hostname: host,
        port: port,
        // rootFileSystem: new neofs.filesystem(),
    });
    obj.server.start();
    mount();
}

module.exports = {
    start,
    stop,
    open: wabdav_open,
};
