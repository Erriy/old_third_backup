const gpg = require('../common/gpg');
const axios = require('axios').default;
const runtime = require('./runtime');
const urljoin = require('url-join');

let obj = {
    token: null
};

async function _token({
    refresh=false,
    keyid=null,
}={}) {
    if(!obj.token || refresh) {
        let path =  `/api/token?refresh=${refresh}&timestamp=${new Date().getTime()/1000}`;
        let sign = await gpg.sign({data: path, key: keyid || await runtime.fingerprint(), type: 'detach'});
        let resp = await axios({
            method: 'GET',
            url: urljoin(await runtime.service(), path),
            headers: {
                sign: JSON.stringify(sign)
            }
        });
        obj.token = resp.data.data.token;
    }
    return obj.token;
}

async function upload_pubkey({
    keyid=null,
}={}) {
    let pubkey = await gpg.export({keyid: keyid||await runtime.fingerprint()});
    let resp = await axios({
        method: 'PUT',
        url: `${await runtime.service()}/api/pubkey`,
        data: {pubkey}
    });
    return resp.data;
}

if (typeof require !== 'undefined' && require.main === module) {
    (async ()=>{
        await upload_pubkey();
    })();
}

module.exports = {
    list_secret_key: gpg.list_secret_key,
    sign: gpg.sign,
    verify: gpg.verify,
    decrypt: gpg.decrypt,
    encrypt: gpg.encrypt,
    token: _token,
    upload_pubkey,
};
