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
    return res.build();
});


router.get('', async(req, res)=>{
    // todo 分页，排序等高级查询
    let page = Number(req.params.page) || 1;
    let page_size = Number(req.params.page_size) || 20;

    page = page>0?page:1;
    page_size = page_size>0?page_size:20;

    let cql = `
        match (s:seed)
        with count(s) as total
        match (s:seed)
        return distinct s, total order by s.update_ts desc skip ${(page-1)*page_size} limit ${page_size}
    `;
    let result = await res.neo.run(cql);
    let total = 0;
    if(result.records.length > 0) {
        total = Number(result.records[0].get('total'));
    }
    return res.build({
        data: {
            total,
            list: result.records.map(s=>(loads(s.get('s').properties.block)))
        }
    });
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

