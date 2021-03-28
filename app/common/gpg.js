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
    key='',
}={}) {
    let options = ['--detach-sign', '--armor', '--local-user', key];
    let d = await gpg_call(data, options);
    return d.toString();
}

async function verify({
    data='',
    sign='',
}={}) {
    let clearsign_data = `-----BEGIN PGP SIGNED MESSAGE-----\r\nHash: SHA256\r\n\r\n${data}\r\n${sign}`;
    return (await gpg_verify(clearsign_data, ['--with-fingerprint'])).toString();
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

if (typeof require !== 'undefined' && require.main === module) {
    (async ()=>{
        let pbkey = `-----BEGIN PGP PUBLIC KEY BLOCK-----
        Comment: Hostname:
        Version: Hockeypuck ~unreleased

        xsBNBEsjYRQBCACuDXJKyP8sDnH8TCHpBgKyuB/SScXJGbPuF8XcQUv0qs4HRjX6
        kjlD+s6Ju3CJgMFIvwpLqO0wbYvuMHDemamMNa+oT4JNaszjB8OgbkN9jy/JU7hb
        Fa7GQbhyPousfEJouTHc66t4sXsIcrshnCT1zNTbE44cnq9aQgqct9hJmLmg7+Qh
        Ioc6TdwpuS0vZVeOP/o/KAO6VcVFrzAJ1Dh6s6zmhoAVpHlqUa4VNUddbwB2ymxh
        1nwa+073Fs0n67n3Iz1Gyy76h9u6j0Nta5Ax1i8Sbx/uWTPe/JejG7Ydztas6ePK
        blnvA/nIXUwG8rgCVZudWE8tAYCAamlJ0X5/ABEBAAHNGnRlc3QgcGMgPHRlc3RA
        cm90aGxpbi5jb20+wsB4BBMBAgAiBQJLI2EUAhsPBgsJCAcDAgYVCAIJCgsEFgID
        AQIeAQIXgAAKCRCj0xSfydfMQF3/B/49KL6DRY4jhZWTGVwpD1mQmlByQbW7j5rz
        VfjTGwOH3f//CJRgvCEvRuV3jC/NKRtXoQkP4xE3i+j+Gvi/i4BQlwbvvleONtIo
        /2Jh0blWpV8u4cLxCmp5YZNyNPjbLiEe8J3aYJeDEcVdfIzFDLRd+hiLiMcEPVrG
        M7P3mSlN7aNzsX+4Lbni0HcpJ9MGcSo5JAHAvXVPPfvTHNwZJEELYUPXWgBFjfUV
        yzmCTkyouuPdCETSQAEIweoSCiCt1//zA6f00ZnZyosDawlxYERnIMTP64nDMkSr
        bkDDoKbaI/T+xcNSgROsvuEm3GkLT2cqscJMLFV8eVoovG3bgDJN
        =lNYM
        -----END PGP PUBLIC KEY BLOCK-----
        `;
        // let l = await list_secret_key();
        // console.log(await _sign({data:'hello', key: l[0].fingerprint}));
        await _import({armored_key: pbkey});
    })();
}

module.exports = {
    list_secret_key,
    sign:_sign,
    verify,
    decrypt,
    encrypt,
    import:_import,
};
