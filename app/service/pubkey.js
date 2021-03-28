const express = require('express');
const router = express.Router();

/**
 * 公钥控制相关
 * todo 上传公钥
 * todo 获取公钥
 */

module.exports = {
    async router(neo4j_session) {
        return router;
    }
};
