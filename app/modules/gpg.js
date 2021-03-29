const gpg = require('../common/gpg');
const axios = require('axios').default;

async function _token({
    refresh=false,
    keyid='DA2C290E40EB67AC8BD4C31364E251FB0BB538A8', // fixme 修改为空
}={}) {
    // fixme 获取服务器地址，keyid
    let path =  `/api/token?refresh=${refresh}&timestamp=${new Date().getTime()/1000}`;
    let sign = await gpg.sign({data: path, key: keyid, type: 'detach'});
    let resp = await axios({
        method: 'GET',
        url: `http://localhost:6952${path}`,
        headers: {
            sign: JSON.stringify(sign)
        }
    });
    return resp.data.data.token;
}

async function upload_pubkey({
    keyid='DA2C290E40EB67AC8BD4C31364E251FB0BB538A8', // fixme 修改为空
}={}) {
    // fixme 获取服务器地址，keyid
    let pubkey = await gpg.export({keyid});
    let resp = await axios({
        method: 'PUT',
        url: 'http://localhost:6952/api/pubkey',
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
