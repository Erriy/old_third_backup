const webdav = require('webdav-server').v2;
const neofs = require('./neofs');

const server = new webdav.WebDAVServer({
    rootFileSystem: neofs.filesystem()
});

server.start(() => console.log('READY'));