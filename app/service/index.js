const express = require('express');
const body_parser = require('body-parser');
const neo4j_driver = require('neo4j-driver');


let obj = {
    server: null,
    neo: null,
};


async function restart({
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
    if(obj.neo) {
        await obj.neo.close();
    }
    if(obj.server) {
        // todo close server;
        await obj.server.close()
    }

    let njdrv = neo4j_driver.driver(
        neo4j.uri||'neo4j://127.0.0.1:7687',
        neo4j_driver.auth.basic(
            neo4j.user||'neo4j',
            neo4j.password||'neo4j'
        )
    );
    obj.neo = njdrv;
    let app = express();
    app.use(body_parser.json());

    // todo 路由使用单独文件
    app.put('/api/seed', async (req, res)=>{
        // todo 创建seed
        const session = njdrv.session();
        const result = await session.run(
            'match (n) return n'
        );
        res.send(result.records.map(x=>(x.toObject())));
    });

    app.get('/api/seed', async(req, res)=>{
        // todo 查找seed
    });

    app.delete('/api/seed/:seedid', async(req, res)=>{
        // todo 删除seed
        // res.send(req.params.seedid);
    });

    obj.server = app.listen(service.port||6952, service.host||"127.0.0.1");
}


module.exports = {
    restart,
};

