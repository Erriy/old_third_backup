const express = require('express');
const router = express.Router();
const gpg = require('../common/gpg');

/**
 * token认证相关
 * todo 创建token
 * todo 获取token列表
 */
// todo 每个设备独立证书，通过主证书信任证书的形式控制权限

// 创建token
router.put('', (req, res) => {
    let body = req.body;
});

// 获取token
router.get('', (req, res) => {

});

module.exports = {
    async router(neo4j_session) {
        return router;
    }
};
