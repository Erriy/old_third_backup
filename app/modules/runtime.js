const gpg = require('../common/gpg');
const electron_store = require('electron-store');
const store = new electron_store();

async function _get_config(key, default_value_func) {
    let c = store.get(key);
    if (!c) {
        c = default_value_func();
        if(c instanceof Promise) {
            c = await c;
        }
        store.set(key, c);
    }
    return c;
}

async function fingerprint() {
    return _get_config('fingerprint', async ()=>{
        let keys = await gpg.list_secret_key();
        if(keys.length === 0) {
            throw new Error('请使用gpg创建证书后再使用');
        }
        return keys[0].fingerprint;
    });
}

async function service() {
    return _get_config('service', ()=>{
        return 'http://localhost:6952/';
    });
}

module.exports = {
    fingerprint,
    service,
};
