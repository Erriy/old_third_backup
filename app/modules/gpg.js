const gpg = require('../common/gpg');
const axios = require('axios').default;

async function _token({refresh=false}={}) {
    // todo 获取服务器地址，keyid
    let path =  `/api/token?refresh=${refresh}&timestamp=${new Date().getTime()/1000}`;
    let sign = await gpg.sign({data: path, key: 'DA2C290E40EB67AC8BD4C31364E251FB0BB538A8', type: 'detach'});
    let resp = await axios({
        method: 'GET',
        url: `http://localhost:6952${path}`,
        headers: {
            sign: JSON.stringify(sign)
        }
    });
    console.log(resp.data.data.token);
}

if (typeof require !== 'undefined' && require.main === module) {
    (async ()=>{
        await _token({refresh: false});
    })();
}

module.exports = {
    list_secret_key: gpg.list_secret_key,
    sign: gpg.sign,
    verify: gpg.verify,
    decrypt: gpg.decrypt,
    encrypt: gpg.encrypt,
};
