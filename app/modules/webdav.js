const url = require('url');
const {spawn} = require('child_process');
const runtime = require('./runtime');
const os = require('os');
const gpg = require('./gpg');
const open = require('open');
const sys_path = require('path');

let obj = {
    webdav: null
};

const mount_handler = {
    linux: async ()=>{
        let service = await runtime.service();
        let user = await runtime.fingerprint();
        let sopt = url.parse(service);
        obj.webdav = `dav://${user}@${sopt.hostname}:63389`;
        let command = `gio mount ${obj.webdav} <<< ${await gpg.token()}`;
        spawn(command, {shell: true});
    },
    win32: async()=>{
        // fixme 动态生成挂载卷名
        let service = await runtime.service();
        let user = await runtime.fingerprint();
        let sopt = url.parse(service);
        obj.webdav = 'Z:';

        let command = `net use ${obj.webdav} http://${sopt.hostname}:63389 ${await gpg.token()} /user:${user}`;
        spawn(command, {shell: true});
    }
};

const umount_handler = {
    linux: async()=>{
        if(obj.webdav) {
            spawn(`gio mount --unmount ${obj.webdav}`, {shell: true});
        }
        obj.webdav = null;
    }
};

const open_handler =  {
    linux: async({path=null}={})=>{
        let service = await runtime.service();
        let user = await runtime.fingerprint();
        let sopt = url.parse(service);
        path = sys_path.join(`/var/run/user/${process.getuid()}/gvfs/dav:host=${sopt.hostname},port=63389,ssl=false,user=${user}/`, path);
        await open(path);
    },
    win32: async({path=null}={})=>{
        await open(sys_path.join(obj.webdav, path));
    }
};

module.exports = {
    mount: mount_handler[os.platform()],
    umount: umount_handler[os.platform()],
    open: open_handler[os.platform()],
};
