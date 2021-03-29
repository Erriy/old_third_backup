const express = require('express');
const router = express.Router();
const gpg = require('../common/gpg');
const randomstring = require('randomstring');

/**
 * token认证相关
 * todo 获取token列表
 */
// todo 每个设备独立证书，通过主证书信任证书的形式控制权限
// 获取token
router.get('', async (req, res) => {
    let sign_data = req.originalUrl;
    let timestamp = req.query.timestamp;
    if(!timestamp || (timestamp - new Date().getTime()/1000 > 20 )) {
        throw new Error('签名超时，拒绝执行');
    }
    let sign = JSON.parse(req.headers.sign);
    let fpr = await gpg.verify({data: sign_data, sign});
    if(!req.query.refresh || req.query.refresh === 'false') {
        let results = await res.neo.run(`
            match (n:pubkey{fingerprint: $fpr}) return n.token as token
        `, {fpr});
        if(results.records.length > 0) {
            return res.build({data: {token: results.records[0].get('token')}});
        }
    }
    let token = randomstring.generate(64);
    await res.neo.run(`
        merge (n:pubkey{fingerprint: $fpr})
        on create set n.fingerprint=$fpr, n.token=$token
        on match set n.token=$token
    `, {fpr, token});

    return res.build({data:{token}});
});

module.exports = {
    async router(neo4j_session) {
        return router;
    }
};
