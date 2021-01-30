const webdav = require('webdav-server').v2;
const neofs = require('./neofs');

const server = new webdav.WebDAVServer({
    rootFileSystem: new neofs.filesystem()
    // rootFileSystem: new webdav.PhysicalFileSystem('/home/erriy/Downloads/')
});

server.start(() => console.log('READY'));


/**
 * windows 挂载webdav
 *      - net use z: http://localhost:1900/
 *
 */