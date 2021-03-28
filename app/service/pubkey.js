const express = require('express');
const router = express.Router();
const gpg = require('../common/gpg');
const func = require('../common/func');

/**
 * 公钥控制相关
 */

// 上传公钥
router.put('', async (req, res)=>{
    let armored_key = req.body;
    await gpg.import({armored_key});
    return res.build();
});

// 下载公钥
router.get('/:keyid', async (req, res)=>{
    let keyid = req.params.keyid;
    func.check_keyid(keyid);
    let armored_key = await gpg.export({keyid});
    return res.build({data: armored_key});
});

module.exports = {
    async router(neo4j_session) {
        return router;
    }
};
