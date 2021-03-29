const express = require('express');
const router = express.Router();
const auth = require('./auth');
require('express-async-errors');

/**
 * 接口设计
 * todo 权限控制，用户检查
 */
// 接口要求验证
router.use(auth.http_basic_auth);

// 查找节点
router.get('', async(req, res) => {
    let page = Number(req.query.page) || 1;
    let page_size = Number(req.query.page_size) || 20;
    let key = req.query.key || '';
    let type = (req.query.type || '').split(',').filter(w=>w.length > 0);
    let tag = (req.query.tag || '').split(',').filter(w=>w.length > 0);
    let owner = req.user.name;

    page = page>0?page:1;
    page_size = page_size>0?page_size:20;

    let full_text_search = 'match (s:seed{owner: $owner})';
    // 全文索引过滤
    if(key.length > 0) {
        full_text_search = 'CALL db.index.fulltext.queryNodes("seed.fulltext", $key) YIELD node as s, score';
    }
    let swhere = [];
    // 类型过滤
    if(type.length > 0) {
        swhere.push('s.type in $type');
        // full_text_search += ' where s.type in $type ';
    }
    // 标签过滤
    if(tag.length > 0) {
        for(let t of tag) {
            swhere.push(`'${t}' in s.tag`);
        }
    }
    // where条件整合
    if(swhere.length > 0) {
        full_text_search += ' where ' + swhere.join(' and ');
    }

    let cql = `
        ${full_text_search}
        with count(s) as total
        ${full_text_search}
        return distinct s, total order by s.update_ts desc skip ${(page - 1)*page_size} limit ${page_size}
    `;
    let result = await res.neo.run(cql, {key, type, owner});

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
                    tag: _.properties.tag ? _.properties.tag : []
                };
            })
        }
    });
});

// 删除节点
router.delete('/:seedid', async(req, res)=>{
    // todo 延迟删除，函数与webdav抽象为同一套
    await res.neo.run('match (s:seed)-[:in*0..]->(n:seed) where n.id=$seedid and n.owner=$owner detach delete s,n', {seedid:req.params.seedid, owner:req.user.name});
    return res.build();
});

// 创建节点
router.put('', async(req, res)=>{
    // todo 创建连接
});

// 创建标签
router.put('/:seedid/tag/:tag', async (req, res)=>{
    // todo 标签去重
    let result = await res.neo.run(
        `
            match (s:seed{id:$seedid, owner: $owner})
            call {
                with s with s where exists(s.tag) return s.tag as old_tags
                union
                with s with s where not exists(s.tag) return [] as old_tags
            }
            set s.tag = old_tags + $tag
            return s.tag as tag
        `,
        {seedid: req.params.seedid, tag: req.params.tag, owner: req.user.name}
    );
    let data = result.records.length > 0 ? result.records[0].get('tag') : [];
    return res.build({data});
});

// 删除标签
router.delete('/:seedid/tag/:tag', async (req, res)=>{
    let result = await res.neo.run(
        `
            match (s:seed{id: $seedid, owner: $owner})
            set s.tag = [t in s.tag where t<>$tag]
            return s.tag as tag
        `,
        {seedid: req.params.seedid, tag: req.params.tag, owner: req.user.name}
    );
    let data = result.records.length > 0 ? result.records[0].get('tag') : [];
    return res.build({data});
});

// 在所有标签中查找
router.get('/tag', async (req, res) => {
    // todo 在标签中查找
});

// 获取单个节点信息
router.get('/:seedid', async (req, res) => {
    // todo 获取资源信息
});

// 获取节点的webdav路径
router.get('/:seedid/path', async (req, res) => {
    let result = await res.neo.run(
        'match (:seed{id: $seedid, owner: $owner})-[:in*0..]->(s) return s.name as name',
        {seedid: req.params.seedid, owner: req.user.name}
    );
    let path = result.records.map(r=>(r.get('name'))).reverse().join('/');
    return res.build({data: {path: path}});
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
