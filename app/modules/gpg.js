const gpg = require('gpg');
const util = require('util');

const async_gpg_call = util.promisify(gpg.call);
const async_gpg_verify = util.promisify(gpg.verifySignature);
const async_gpg_encrypt = util.promisify(gpg.encrypt);
const async_gpg_decrypt = util.promisify(gpg.decrypt);

async function list_secret_key() {
    let data = await async_gpg_call('', ['--list-secret-keys','--with-colons', '--fixed-list-mode']);
    let strdata = data.toString();
    let reg = /sec.*\r?\n?(?<fpr>fpr.*)\r?\n?grp.*\r?\n(?<uid>uid.*)\r?\n?/mg;
    let i = null;
    let list = [];
    while((i=reg.exec(strdata))) {
        list.push({
            fingerprint: i.groups.fpr.split(':')[9],
            uid: i.groups.uid.split(':')[9],
        });
    }
    return list;
}

async function _sign({
    data='',
    key='',
}={}) {
    let options = ['--detach-sign', '--armor', '--local-user', key];
    let d = await async_gpg_call(data, options);
    return d.toString();
}

async function verify({
    data='',
    sign='',
}={}) {
    let clearsign_data = `-----BEGIN PGP SIGNED MESSAGE-----\r\nHash: SHA256\r\n\r\n${data}\r\n${sign}`;
    return (await async_gpg_verify(clearsign_data, ['--with-fingerprint'])).toString();
}

async function encrypt({
    data='',
    key='',
}={}){
    let options = ['--armor', '--recipient', key];
    let d = await async_gpg_encrypt(data, options);
    return d.toString();
}

async function decrypt({
    data='',
}={}) {
    let d = await async_gpg_decrypt(data);
    return d.toString();
}

if (typeof require !== 'undefined' && require.main === module) {
    (async ()=>{
        let l = await list_secret_key();
        console.log(await _sign({data:'hello', key: l[0].fingerprint}));
    })();
}

module.exports = {
    list_secret_key,
    sign:_sign,
    verify,
    decrypt,
    encrypt,
};
