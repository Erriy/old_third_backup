const webdav = require('webdav-server').v2;
// const neofs = require('./neofs');
const open = require('open');
const cmd_exists = require('command-exists');

const server = new webdav.WebDAVServer({
    // rootFileSystem: new neofs.filesystem()
    rootFileSystem: new webdav.PhysicalFileSystem('/home/erriy/Downloads/')
});

server.start(async () => {
    // let app = undefined;
    // for(let a of ['nautilus', 'thunar']) {
    //     try {
    //         await cmd_exists(a);
    //         app = a;
    //         break;
    //     }
    //     catch(e) {}
    // }
    // await open('dav://localhost:1900/', {wait: false, app:app});
});

console.log('test');

// todo 网络资源映射，比如网站视频资源等

/**
 * windows 挂载webdav
 *      - net use z: http://localhost:1900/
 *
 */