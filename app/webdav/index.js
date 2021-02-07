const webdav = require('webdav-server').v2;

let obj = {
    server: null,
};

function stop() {
    if(obj.server) {
        obj.server.stop();
        obj.server = null;
    }
}

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
}

module.exports = {
    start,
    stop,
};
