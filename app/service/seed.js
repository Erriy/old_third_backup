const express = require('express');
const router = express.Router();
require('express-async-errors');

/**
 * 接口设计
 * todo 列表接口，包括查询功能
 * todo 对文件添加标签
 * todo 删除标签连接
 */

router.get('', async(req, res) => {
    let page = Number(req.query.page) || 1;
    let page_size = Number(req.query.page_size) || 20;
    let key = req.query.key || '';
    let type = (req.query.type || '').split(',').filter(w=>w.length > 0);

    page = page>0?page:1;
    page_size = page_size>0?page_size:20;

    let full_text_search = 'match (s:seed)';
    if(key.length > 0) {
        full_text_search = 'CALL db.index.fulltext.queryNodes("seed.fulltext", $key) YIELD node as s, score';
    }
    if(type.length > 0) {
        full_text_search += ' where s.type in $type ';
    }

    let cql = `
        ${full_text_search}
        with count(s) as total
        ${full_text_search}
        return distinct s, total order by s.update_ts desc skip ${(page - 1)*page_size} limit ${page_size}
    `;
    let result = await res.neo.run(cql, {key, type});

    let total = 0;
    if(result.records.length > 0) {
        total = Number(result.records[0].get('total'));
    }
    return res.build({
        data: {
            total,
            list: result.records.map(s=>{
                let _ = s.get('s');
                return {
                    name: _.properties.name,
                    id: _.properties.id,
                    type: _.properties.type,
                };
            })
        }
    });
});

router.delete('/:seedid', async(req, res)=>{
    // todo 延迟删除，函数与webdav抽象为同一套
    await res.neo.run('match (s:seed)-[:in*0..]->(n:seed) where n.id=$seedid detach delete s,n', {seedid:req.params.seedid});
    return res.build();
});

router.put('', async(req, res)=>{
    // todo 创建连接
});

router.put('/:seedid/tag/:tag', async (req, res)=>{
    // todo 标签去重
    let result = await res.neo.run(
        `
            match (s:seed{id:$seedid})
            call {
                with s with s where exists(s.tag) return s.tag as old_tags
                union
                with s with s where not exists(s.tag) return [] as old_tags
            }
            set s.tag = old_tags + $tag
            return s.tag as tag
        `,
        {seedid: req.params.seedid, tag: req.params.tag}
    );
    let data = result.records.length > 0 ? result.records[0].get('tag') : [];
    return res.build({data});
});

router.delete('/:seedid/tag/:tag', async (req, res)=>{
    // todo 删除标签
});

module.exports = {
    async router(neo4j_session) {
        try{
            await neo4j_session.run('create constraint on (n:seed) assert n.`id` is unique');
        }catch(err) {}
        try{
            await neo4j_session.run('call db.index.fulltext.createNodeIndex("seed.fulltext", ["seed"], ["fulltext"])');
        }catch(err) {}
        return router;
    }
};
