const express = require('express');
const router = express.Router();
const gpg = require('../common/gpg');

/**
 * 公钥控制相关
 * todo 获取公钥
 */

// 上传公钥
router.put('', (req, res)=>{
    let armored_key = req.body;
    gpg.import({armored_key});
    return res.build();
});

// 下载公钥
router.put('/:keyid', (res, req)=>{

});

module.exports = {
    async router(neo4j_session) {
        return router;
    }
};
