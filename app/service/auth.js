const basic_auth = require('basic-auth');

async function http_basic_auth(req, res, next) {
    let user = basic_auth(req);
    if(!user) {
        return res.build({code: 401, message: '要求用户验证'});
    }
    let results = await res.neo.run(
        'match (n:pubkey{fingerprint: $fpr, token: $token}) return n',
        {fpr:user.name, token:user.pass}
    );
    if (results.records.length > 0) {
        req.user = user;
        next();
    }
    else {
        return res.build({code: 401, message: '要求用户验证'});
    }
}

module.exports = {
    http_basic_auth,
};
