const webdav = require('webdav-server').v2;
const os = require('os');
const open = require('open');
const {spawn} = require('child_process');
const sys_path = require('path');

let obj = {
    server: null,
    options: {
        host: 'localhost',
        port: 63389,
    },
};

function stop() {
    if(obj.server) {
        obj.server.stop();
        obj.server = null;
    }
}

const open_handler = {
    linux: async (path)=>{
        // gio mount dav://localhost:1900/
        // gentoo : gio in dev-libs/glib
        let file = sys_path.join(`/var/run/user/${process.getuid()}/gvfs/dav:host=localhost,port=${obj.options.port},ssl=false/`, path);
        console.log(file);
        await open(file);
    },
    win32: async()=>{
        // todo win32 open handler
    },
    mac: async()=>{
        // todo mac open handler
    },
};

const mount_handler = {
    linux: ()=>{
        spawn('/usr/bin/gio', ['mount', `dav://localhost:${obj.options.port}`]);
    },
    win32: async()=>{
        // todo win32 mount handler
    },
    mac: async()=>{
        // todo mac mount handler
    },
};

const webdav_open = open_handler[os.platform()];
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
    obj.options.host = host;
    obj.options.port = port;
    obj.server.start(()=>mount());
}

if (typeof require !== 'undefined' && require.main === module) {
    start();
    // webdav_open('/test.md');
}

module.exports = {
    start,
    stop,
    open: webdav_open,
};
