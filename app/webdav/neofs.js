/**
 * * webdav-server 文档 https://github.com/OpenMarshal/npm-WebDAV-Server/wiki
 * * neo4j-driver 文档 https://neo4j.com/docs/api/javascript-driver/current/
 *
 * todo 文件以sha256命名，文件引用计数，计数为0时延时删除
 */
const webdav = require('webdav-server').v2;
const neo4j_driver = require('neo4j-driver');
const fs = require('fs');
const {dirname, basename} = require('path');
const util = require('util');
const sys_path = require('path');
const {Readable} = require('stream');
const {v1:uuidv1} = require('uuid');

const fs_stat = util.promisify(fs.stat);
const fs_open = util.promisify(fs.open);
const fs_close = util.promisify(fs.close);
const fs_exists = util.promisify(fs.exists);

let obj = {
    neo: {
        __neo: null,
        close() {
            if(this.__neo) {
                this.__neo.close();
                this.__neo = null;
            }
        },
        async connect(uri, username, password) {
            this.close();
            this.__neo = neo4j_driver.driver(uri, neo4j_driver.auth.basic(username, password));
            try {
                await this.__neo.verifyConnectivity();
            }catch(err) {
                throw '无法正常连接数据库，请确认数据库地址与验证信息无误';
            }
        },
        async run(...args) {
            let s = this.__neo.session();
            let result = undefined;
            try{
                result = await s.run(...args);
            }
            finally {
                s.close();
            }
            return result;
        }
    },
    fpath: null,        // 文件保存路径
    max_text_length: 1024*1024,  // 数据库中保存数据的最大长度限制
};

function find_entry_cql(path, name='entry') {
    let entrys = [];
    while(path!='/') {
        entrys.push(basename(path));
        path = dirname(path);
    }
    entrys.push('/');
    entrys = entrys.reverse();
    return `match ${entrys.map((e, i)=>(`(_n${i}:seed{fs_name:'${e}'})`)).join('<-[:in]-')} with _n${entrys.length-1} as ${name}`;
}

// Serializer
function fs_serializer()
{
    return {
        uid()
        {
            return 'fs_serializer_1.0.0';
        },
        serialize(fs, callback)
        {
            callback(null, {
                resources: fs.resources
            });
        },
        unserialize(serializedData, callback)
        {
            const fs = new filesystem();
            fs.resources = serializedData.resources;
            for(const path in fs.resources)
            {
                fs.resources[path] = new fs_resource(fs.resources[path]);
            }

            callback(null, fs);
        },
        constructor: fs_serializer
    };
}

// Internal resource
function fs_resource(data /* ?: any */)
{
    this.constructor = fs_resource;
    this.props = new webdav.LocalPropertyManager(data ? data.props : undefined);
    this.locks = new webdav.LocalLockManager();
}

// File system
function filesystem()
{
    /**
     * * 文本文件且内容长度在max_text_length以内则数据保存至数据库中并建立全文索引，否则保存为文件
     */
    const r = new webdav.FileSystem(new fs_serializer());
    r.constructor = filesystem;
    r.resources = {
        '/': new fs_resource()
    };

    // 初始化根目录节点
    obj.neo.run('merge (:seed{fs_name: \'/\'})').then();

    r._create = async (path /* : Path*/, ctx /* : CreateInfo*/, callback /* : SimpleCallback*/)=>{
        let name = basename(path.toString());
        let typeinfo = '';
        if (!ctx.type.isDirectory) {
            let fs_fid = uuidv1();
            typeinfo = `, fs_type:"file", fs_fid: '${fs_fid}'`;
        }

        await obj.neo.run(`
            ${find_entry_cql(dirname(path.toString()))}
            create (s:seed{fs_name: $fs_name ${typeinfo}})-[:in]->(entry)
        `, {fs_name: name});
        r.resources[path.toString()] = new fs_resource();
        return callback(null);
    };

    r._delete = (path /* : Path*/, ctx /* : DeleteInfo*/, callback /* : SimpleCallback*/)=>{
        console.log('delete', path);
        obj.neo.run(`
            ${find_entry_cql(path.toString())}
            match (s:seed)-[:in*0..]->(entry)
            with s, s.fs_fid as fs_fid
            detach delete s
            return fs_fid
        `).then(result=>{
            if (0 < result.records.length) {
                result.records.forEach(record=>{
                    let fs_fid = record.get('fs_fid');
                    if(null == fs_fid) {
                        return;
                    }
                    fs.unlink(sys_path.join(obj.fpath, fs_fid), ()=>{});
                });
            }
            if (path.toString() in r.resources) {
                delete r.resources[path.toString()];
            }
            callback(null);
        });
    };

    r._openReadStream = async (path /* : Path*/, ctx /* : OpenReadStreamInfo*/, callback /* : ReturnCallback<Readable>*/)=>{
        let result = await obj.neo.run(`
            ${find_entry_cql(path.toString())} return entry.fs_fid as fs_fid
        `);
        if (0 === result.records.length ) {
            return callback(webdav.Errors.ResourceNotFound);
        }
        let fs_fid = result.records[0].get('fs_fid');
        let filepath = sys_path.join(obj.fpath, fs_fid);
        if (await fs_exists(filepath)) {
            return callback(null, fs.createReadStream(filepath));
        }
        else {
            return callback(null, Readable.from(['']));
        }
    };

    r._openWriteStream = async (path /* : Path*/, ctx /* : OpenWriteStreamInfo*/, callback /* : ReturnCallback<Writable>*/)=>{
        let result = await obj.neo.run(`
            ${find_entry_cql(path.toString())} return entry.fs_fid as fs_fid
        `);
        if (0 === result.records.length ) {
            return callback(webdav.Errors.ResourceNotFound);
        }
        let fs_fid = result.records[0].get('fs_fid');
        let filepath = sys_path.join(obj.fpath, fs_fid);
        if (!await fs_exists(filepath)) {
            await fs_close(await fs_open(filepath, 'w'));
        }
        let wstream = fs.createWriteStream(filepath);
        wstream.on('finish', async()=>{
            // todo 提取内容建立到全文索引字段
        });

        callback(null, wstream);
    };

    r._move = (pathFrom /* : Path*/, pathTo /* : Path*/, ctx /* : MoveInfo*/, callback /* : ReturnCallback<boolean>*/)=>{
        console.log('move', pathFrom, pathTo);
        obj.neo.run(`
            ${find_entry_cql(pathTo.toString())} return entry
        `).then(r=>{
            if (0!==r.records.length) {
                return callback(webdav.Errors.ResourceAlreadyExists, false);
            }
            obj.neo.run(`
                ${find_entry_cql(pathFrom.toString())} set entry.fs_name=$fs_name
            `, {fs_name: basename(pathTo.toString())} ).then(()=>{
                callback(null, true);
            });
        });
    };

    r._readDir = (path /* : Path*/, ctx /* : ReadDirInfo*/, callback /* : ReturnCallback<string[] | Path[]>*/)=>{
        obj.neo.run(`
            ${find_entry_cql(path.toString())}
            match (n:seed)-[:in]->(entry) return n.fs_name
        `).then(n=>{
            return callback(null, n.records.map(x=>(x._fields[0])));
        });
    };

    r._size = async (path /* : Path*/, ctx /* : SizeInfo*/, callback /* : ReturnCallback<number>*/)=>{
        let result = await obj.neo.run(`
            ${find_entry_cql(path.toString())} return entry.fs_fid as fs_fid
        `);
        let size = 0;
        if (result.records.length > 0) {
            let fs_fid = result.records[0].get('fs_fid');
            try {
                size = (await fs_stat(sys_path.join(obj.fpath, fs_fid))).size;
            }
            catch(e) {
                size = 0;
            }
        }

        return callback(null, size);
    };

    r._type = (path /* : Path*/, ctx /* : TypeInfo*/, callback /* : ReturnCallback<ResourceType>*/)=>{
        obj.neo.run(
            `${find_entry_cql(path.toString())} return entry.fs_type`
        ).then(t=>{
            if (0 === t.records.length) {
                return callback(webdav.Errors.ResourceNotFound);
            }
            callback(null, t.records[0]._fields[0] ? webdav.ResourceType.File : webdav.ResourceType.Directory);
        });
    };

    function get_prop_from_resource(path, ctx, propname, callback) {
        let resource = r.resource[path.toString()];
        if (!resource) {
            resource = new fs_resource();
            r.resources[path.toString()] = resource;
        }
        callback(null, resource[propname]);
    }

    r._lockManager = (path /* : Path*/, ctx /* : LockManagerInfo*/, callback /* : ReturnCallback<ILockManager>*/)=>{
        get_prop_from_resource(path, ctx, 'locks', callback);
    };

    r._propertyManager = (path /* : Path*/, ctx /* : PropertyManagerInfo*/, callback /* : ReturnCallback<IPropertyManager>*/)=>{
        get_prop_from_resource(path, ctx, 'props', callback);
    };

    return r;
}

async function prepare(uri, username, password, fpath/* 文件保存路径 */, max_text_length=1024*1024) {
    await obj.neo.connect(uri, username, password);

    obj.fpath = fpath;
    obj.max_text_length = max_text_length;
    let s = null;
    try {
        s = await fs_stat(fpath);
    }
    catch (e) {
        throw `文件夹(${fpath})不存在`;
    }
    if(!s.isDirectory()) {
        throw `${fpath} 是文件，必须指定文件夹路径`;
    }
}

function cleanup() {
    obj.neo.close();
    obj.fpath = null;
}

module.exports = {
    prepare,
    filesystem,
    cleanup
};
