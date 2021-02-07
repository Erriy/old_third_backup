const webdav = require('webdav-server').v2;
const neofs = require('./neofs');

const server = new webdav.WebDAVServer({
    // rootFileSystem: new neofs.filesystem()
    rootFileSystem: new webdav.PhysicalFileSystem('/home/erriy/Downloads/')
});

server.start(() => server.stop());

console.log('test');

// todo 网络资源映射，比如网站视频资源等

/**
 * windows 挂载webdav
 *      - net use z: http://localhost:1900/
 *
 */