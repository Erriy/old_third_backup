const express = require('express');
const router = express.Router();
require('express-async-errors');


const dumps = d=>(encodeURIComponent(JSON.stringify(d)).replace("'", '%27'));
const loads = s=>(JSON.parse(decodeURIComponent(s.replace('%27', "'"))));


router.put('', async(req, res)=>{
    // fixme: 防注入
    let s = req.body;
    let cql = `
        merge (s:seed{seedid:'${s.meta.id}'})
        set
            s.seedid='${s.meta.id}',
            s.update_ts=${s.meta.time.update.timestamp},
            s.full_text='${s.data.replaceAll(/\p{P}/ug, " ")}',
            s.block='${dumps(s)}'
    `;
    await res.neo.run(cql);
    return res.build();
});


router.get('', async(req, res)=>{
    // todo 支持全文查找
    // todo 增加时间筛选过滤条件
    // fixme: 防注入
    let page = Number(req.query.page) || 1;
    let page_size = Number(req.query.page_size) || 20;
    let key = req.query.key || '';

    page = page>0?page:1;
    page_size = page_size>0?page_size:20;

    let full_text_search = 'match (s:seed)';
    if(key.length > 0) {
        full_text_search = `CALL db.index.fulltext.queryNodes("seed.full_text", "${key}") YIELD node as s, score`;
    }
    let search = `
        ${full_text_search}
    `;

    let cql = `
        ${search}
        with count(s) as total
        ${search}
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
    let cql = `
        match (s:seed) where s.seedid='${req.params.seedid}' detach delete s
    `
    await res.neo.run(cql);
    return res.build();
});


module.exports = {
    router(neo4j_session) {
        neo4j_session.run('create constraint on (n:seed) assert n.`seedid` is unique').then().catch(()=>{});
        neo4j_session.run('call db.index.fulltext.createNodeIndex("seed.full_text", ["seed"], ["full_text"])').then().catch(()=>{});
        return router;
    }
};

