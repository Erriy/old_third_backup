const express = require('express');
const body_parser = require('body-parser');
const neo4j_driver = require('neo4j-driver');
const log = require('electron-log');
const {router: seed_router} = require('./seed');


let obj = {
    server: null,
    neo: null,
};

// fixme 所有输入数据格式检查，防止注入

async function stop() {
    if(obj.neo) {
        await obj.neo.close();
        obj.neo = null;
    }
    if(obj.server) {
        await obj.server.close()
        obj.server = null;
    }
}


async function start({
    service={
        host:undefined,
        port:undefined
    },
    neo4j={
        uri:undefined,
        user:undefined,
        password:undefined
    }
}={}) {
    await stop();
    // 重建数据库链接
    let njdrv = neo4j_driver.driver(
        neo4j.uri||'neo4j://127.0.0.1:7687',
        neo4j_driver.auth.basic(
            neo4j.user||'neo4j',
            neo4j.password||'neo4j'
        )
    );
    obj.neo = njdrv;
    // 建立express实例
    let app = express();
    // 使用统一返回内容接口
    app.use((req, res, next)=>{
        res.build = ({
            code=200,
            message="操作成功",
            data=undefined
        }={})=>{
            res.status(code);
            retobj = {code, message};
            if(data) {retobj.data=data;}
            res.send(retobj);
        }
        next();
    });
    // 自动构建session
    app.use((req, res, next)=>{
        res.neo = njdrv.session();
        const cleanup = ()=>{
            if(res.neo) {
                res.neo.close();
                res.neo = null;
            }
        };
        res.on('close', cleanup);
        res.on('finish', cleanup);
        res.on('end', cleanup);
        next();
    });
    // 自动解析body
    app.use(body_parser.json());

    // 构建路由，路由内部自行建立数据库索引
    let neo4j_session = njdrv.session();
    app.use('/api/seed', await seed_router(neo4j_session));
    neo4j_session.close();

    // 错误统一处理
    app.use((err, req, res, next)=>{
        log.error(err.stack);
        res.build({code: 500, message: '服务器错误'});
        next(err);
    });
    // 启动本地服务
    obj.server = app.listen(service.port||6952, service.host||"127.0.0.1");
}



function running() {
    return Boolean(obj.server);
}


module.exports = {
    start,
    stop,
    running,
};

