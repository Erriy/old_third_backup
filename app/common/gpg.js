const gpg = require('gpg');
const util = require('util');

const gpg_call = util.promisify(gpg.call);
const gpg_verify = util.promisify(gpg.verifySignature);
const gpg_encrypt = util.promisify(gpg.encrypt);
const gpg_decrypt = util.promisify(gpg.decrypt);

async function list_secret_key() {
    let data = await gpg_call('', ['--list-secret-keys','--with-colons', '--fixed-list-mode']);
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
    type='detach',
    key='',
}={}) {
    let stype = type == 'detach' ? '--detach-sign': '--clear-sign';
    let options = [stype, '--armor', '--local-user', key];
    let d = await gpg_call(data, options);
    return d.toString();
}

async function verify({
    data='',
    sign=undefined,
}={}) {
    /**
     * 验证失败会报异常
     * todo 提取签名时间（utc）
     */
    let clearsign_data = data;
    if(sign) {
        clearsign_data = `-----BEGIN PGP SIGNED MESSAGE-----\r\nHash: SHA256\r\n\r\n${data}\r\n${sign}`;
    }
    let r = (await gpg_verify(clearsign_data, ['--with-fingerprint'])).toString();
    // 这种提取时间的方式时间差了14个小时
    // let time = new Date(/^gpg: Signature made (?<time>.*)$/mg.exec(r).groups.time).getTime();
    let fpr = /^Primary key fingerprint: (?<fpr>.*)$/mg.exec(r).groups.fpr.replace(/ /g, '');
    return fpr;
}

async function encrypt({
    data='',
    key='',
}={}){
    let options = ['--armor', '--recipient', key];
    let d = await gpg_encrypt(data, options);
    return d.toString();
}

async function decrypt({
    data='',
}={}) {
    let d = await gpg_decrypt(data);
    return d.toString();
}

async function _import({
    armored_key='',
}){
    await gpg_call(armored_key, ['--import'/*, '--import-options', 'import-show', '--with-colons'*/]);
}

async function _export({
    keyid=null,
}) {
    let r = await gpg_call('', ['--armor', '--export', keyid]);
    return r.toString();
}

if (typeof require !== 'undefined' && require.main === module) {
    (async ()=>{
        let l = await list_secret_key();
        let data = await _sign({data:'hello', key: l[0].fingerprint, type: 'detach'});
        console.log(await verify({data: 'hello', sign: data}));
    })();
}

module.exports = {
    list_secret_key,
    sign: _sign,
    verify,
    decrypt,
    encrypt,
    import: _import,
    export: _export,
};
