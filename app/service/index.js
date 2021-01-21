const express = require('express');
const body_parser = require('body-parser');
const neo4j_driver = require('neo4j-driver');
const log = require('electron-log');
const {router: seed_router} = require('./seed');


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
    app.use(body_parser.json());

    let neo4j_session = njdrv.session();
    app.use('/api/seed', seed_router(neo4j_session));
    neo4j_session.close();

    app.use((err, req, res, next)=>{
        log.error(err.stack);
        res.status(500).send("server error");
        next(err);
    });

    obj.server = app.listen(service.port||6952, service.host||"127.0.0.1");
}


module.exports = {
    restart,
};

