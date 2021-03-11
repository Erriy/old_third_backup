const webdav = require('webdav-server').v2;
const neofs = require('./neofs');
const fs = require('fs');

let obj = {
    server: null,
};

async function stop() {
    if(obj.server) {
        obj.server.stop();
        obj.server = null;
    }
    await neofs.cleanup();
}

async function start({
    host='localhost',
    port=63389,
    uri='neo4j://127.0.0.1:7687',
    username='neo4j',
    password='neo4j',
    fpath='/tmp/third/files',
}={}) {
    await stop();
    await neofs.prepare(uri, username, password, fpath);

    obj.server = new webdav.WebDAVServer({
        hostname: host,
        port: port,
        rootFileSystem: new neofs.filesystem(),
    });
    obj.server.start();
}

if (typeof require !== 'undefined' && require.main === module) {
    let fpath = '/tmp/third/files';
    fs.mkdirSync(fpath, {recursive: true});
    start({
        uri: 'neo4j://127.0.0.1:7687',
        password:  'ub1JOnQcuV^rfBsr5%Ek',
        fpath
    }).then();
}

module.exports = {
    start,
    stop,
};
