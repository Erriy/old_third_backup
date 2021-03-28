const keyid_or_sha256_allow_char = new Set('1234567890ABCEDF');
function check_keyid_or_sha256({type=null, data=null}) {
    if(typeof data !== 'string') {
        throw new Error(`${type} 必须为string类型 `);
    }
    if(data.length !== {sha256:64, keyid: 40}[type]) {
        throw new Error(`${type} 长度有问题`);
    }
    let diff = [... new Set(data)].filter(x=>!keyid_or_sha256_allow_char.has(x));
    if(diff.length > 0) {
        throw new Error(`${type} 存在非法字符`);
    }
}

module.exports = {
    check_sha256(sha256) {
        return check_keyid_or_sha256({type: 'sha256', data: sha256});
    },
    check_keyid(keyid) {
        return check_keyid_or_sha256({type: 'keyid', data: keyid});
    }
};
