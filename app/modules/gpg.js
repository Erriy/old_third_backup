const gpg = require('../common/gpg');

module.exports = {
    list_secret_key: gpg.list_secret_key,
    sign: gpg.sign,
    verify: gpg.verify,
    decrypt: gpg.decrypt,
    encrypt: gpg.encrypt,
};
