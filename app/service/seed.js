const express = require('express');
const router = express.Router();
require('express-async-errors');


const dumps = d=>(encodeURIComponent(JSON.stringify(d)).replace("'", '%27'));
const loads = s=>(JSON.parse(decodeURIComponent(s.replace('%27', "'"))));


router.put('', async(req, res)=>{
    let s = req.body;
    let cql = `
        merge (s:seed{seedid:'${s.meta.id}'})
        set
            s.seedid='${s.meta.id}',
            s.update_ts=${s.meta.time.update.timestamp},
            s.data='${s.data.replaceAll(/\p{P}/ug, " ")}',
            s.block='${dumps(s)}'
    `;
    await res.neo.run(cql);
    res.end();
});


router.get('', async(req, res)=>{
    // todo 分页，排序等高级查询
    let cql = `
        match (s:seed) return s
    `;
    let result = await res.neo.run(cql);
    res.send(result.records.map(s=>(loads(s.get('s').properties.block))));
})


router.delete('/:seedid', async(req, res)=>{
    res.send(req.params.seedid);
});


module.exports = {
    router(neo4j_session) {
        neo4j_session.run("create constraint on (n:seed) assert n.`seedid` is unique");
        return router;
    }
};

