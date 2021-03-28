const express = require('express');
const router = express.Router();

/**
 * token认证相关
 * todo 创建token
 * todo 删除token
 * todo 获取token列表
 */

module.exports = {
    async router(neo4j_session) {
        return router;
    }
};
