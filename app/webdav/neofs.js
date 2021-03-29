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
const file_type = require('file-type');

const fs_stat = util.promisify(fs.stat);
const fs_open = util.promisify(fs.open);
const fs_close = util.promisify(fs.close);
const fs_exists = util.promisify(fs.exists);
const fs_read = util.promisify(fs.read);

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

// ext 映射为type
let ext_type_map = {};
const ext_category = {
    'webdav.audio': ['mp3', 'ogg', 'ogv', 'spx', 'ogx', 'flac', 'wav',],
    'webdav.video': ['avi', 'mp4', 'mkv', 'webm', 'mov', 'flv'],
};
for(let c of Object.keys(ext_category)) {
    for(let e of ext_category[c]) {
        ext_type_map[e] = c;
    }
}

function find_entry_cql(owner, path, name='entry') {
    let entrys = [];
    while(path!='/') {
        entrys.push(basename(path));
        path = dirname(path);
    }
    entrys.push('/');
    entrys = entrys.reverse();
    entrys = entrys.map((e, i)=>(`(_n${i}:seed{name:'${e}', owner: '${owner}'})`));
    entrys[0] = '(_n0:seed{name: "/"})';
    return `match ${entrys.join('<-[:in]-')} with _n${entrys.length-1} as ${name}`;
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
    // todo 根据ctx.context.user.username判断用户并返回不同数据
    // todo 处理返回时间接口
    const r = new webdav.FileSystem(new fs_serializer());
    r.constructor = filesystem;
    r.resources = {
        '/': new fs_resource()
    };

    // 初始化根目录节点
    obj.neo.run(`
        merge (s:seed{name: "/", type: "webdav.directory"})
        on create set s.id='${uuidv1()}'
    `).then();

    r._create = async (path /* : Path*/, ctx /* : CreateInfo*/, callback /* : SimpleCallback*/)=>{

        let result = await obj.neo.run(`${find_entry_cql(ctx.context.user.username, path.toString())} return entry`);
        if(result.records.length > 0) {
            return callback(webdav.Errors.ResourceAlreadyExists);
        }

        let name = basename(path.toString());
        let typeinfo = ', type: "webdav.directory"';
        if (!ctx.type.isDirectory) {
            let uri = uuidv1();
            typeinfo = `, type:"webdav.empty", uri: '${uri}'`;
        }
        await obj.neo.run(`
            ${find_entry_cql(ctx.context.user.username, dirname(path.toString()))}
            create (s:seed{name: $name ${typeinfo}, id: '${uuidv1()}', owner: '${ctx.context.user.username}'})-[:in]->(entry)
        `, {name});
        r.resources[path.toString()] = new fs_resource();
        return callback(null);
    };

    r._delete = (path /* : Path*/, ctx /* : DeleteInfo*/, callback /* : SimpleCallback*/)=>{
        // todo 延迟删除
        obj.neo.run(`
            ${find_entry_cql(ctx.context.user.username, path.toString())}
            match (s:seed)-[:in*0..]->(entry)
            with s, s.uri as uri
            detach delete s
            return uri
        `).then(result=>{
            if (0 < result.records.length) {
                result.records.forEach(record=>{
                    let uri = record.get('uri');
                    if(null == uri) {
                        return;
                    }
                    fs.unlink(sys_path.join(obj.fpath, uri), ()=>{});
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
            ${find_entry_cql(ctx.context.user.username, path.toString())} return entry.uri as uri
        `);
        if (0 === result.records.length ) {
            return callback(webdav.Errors.ResourceNotFound);
        }
        let uri = result.records[0].get('uri');
        let filepath = sys_path.join(obj.fpath, uri);
        if (await fs_exists(filepath)) {
            return callback(null, fs.createReadStream(filepath));
        }
        else {
            return callback(null, Readable.from(['']));
        }
    };

    r._openWriteStream = async (path /* : Path*/, ctx /* : OpenWriteStreamInfo*/, callback /* : ReturnCallback<Writable>*/)=>{
        let result = await obj.neo.run(`
            ${find_entry_cql(ctx.context.user.username, path.toString())} return entry.uri as uri
        `);
        if (0 === result.records.length ) {
            return callback(webdav.Errors.ResourceNotFound);
        }
        let uri = result.records[0].get('uri');
        let filepath = sys_path.join(obj.fpath, uri);
        if (!await fs_exists(filepath)) {
            await fs_close(await fs_open(filepath, 'w'));
        }
        let wstream = fs.createWriteStream(filepath);
        wstream.on('finish', async()=>{
            // todo 其他格式文本分析
            // todo 做成后台异步任务处理
            let fsize = (await fs_stat(filepath)).size;
            let ftype = await file_type.fromFile(filepath);
            let stype = 'webdav.other';
            let content = '';
            if(0 === fsize) {
                stype = 'webdav.empty';
            }
            else if (undefined === ftype) {
                stype = 'webdav.text';
                // 按照文本内容处理
                let fd = null;
                let buffer = Buffer.alloc(128*1024);
                try{
                    fd = await fs_open(filepath);
                    await fs_read(fd, buffer, 0, 128*1024, 0);
                    content = buffer.toString();
                }
                finally{
                    if(fd) {
                        await fs_close(fd);
                    }
                }
            }
            await obj.neo.run(`
                ${find_entry_cql(ctx.context.user.username, path.toString())} set entry.type=$type, entry.fulltext=$content
            `, {type: stype, content: content});
        });

        callback(null, wstream);
    };

    r._move = (pathFrom /* : Path*/, pathTo /* : Path*/, ctx /* : MoveInfo*/, callback /* : ReturnCallback<boolean>*/)=>{
        obj.neo.run(`
            ${find_entry_cql(ctx.context.user.username, pathTo.toString())} return entry
        `).then(r=>{
            if (0!==r.records.length) {
                return callback(webdav.Errors.ResourceAlreadyExists, false);
            }
            obj.neo.run(`
                ${find_entry_cql(ctx.context.user.username, pathFrom.toString())} set entry.name=$name
            `, {name: basename(pathTo.toString())} ).then(()=>{
                callback(null, true);
            });
        });
    };

    r._readDir = (path /* : Path*/, ctx /* : ReadDirInfo*/, callback /* : ReturnCallback<string[] | Path[]>*/)=>{
        obj.neo.run(`
            ${find_entry_cql(ctx.context.user.username, path.toString())}
            match (n:seed{owner: '${ctx.context.user.username}'})-[:in]->(entry) return n.name
        `).then(n=>{
            return callback(null, n.records.map(x=>(x._fields[0])));
        });
    };

    r._size = async (path /* : Path*/, ctx /* : SizeInfo*/, callback /* : ReturnCallback<number>*/)=>{
        let result = await obj.neo.run(`
            ${find_entry_cql(ctx.context.user.username, path.toString())} return entry.uri as uri
        `);
        let size = 0;
        if (result.records.length > 0) {
            let uri = result.records[0].get('uri');
            try {
                size = (await fs_stat(sys_path.join(obj.fpath, uri))).size;
            }
            catch(e) {
                size = 0;
            }
        }

        return callback(null, size);
    };

    r._type = (path /* : Path*/, ctx /* : TypeInfo*/, callback /* : ReturnCallback<ResourceType>*/)=>{
        obj.neo.run(
            `${find_entry_cql(ctx.context.user.username, path.toString())} return entry.type`
        ).then(t=>{
            if (0 === t.records.length) {
                return callback(webdav.Errors.ResourceNotFound);
            }
            callback(null, t.records[0]._fields[0]==='webdav.directory' ? webdav.ResourceType.Directory : webdav.ResourceType.File);
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

function authentication() {
    const um = new webdav.SimpleUserManager();

    um.getUserByName = async (name, callback)=>{
        let results = await obj.neo.run(
            'match (n:pubkey{fingerprint: $fpr}) return n.token as token',
            {fpr: name}
        );
        if(results.records.length > 0) {
            return callback(null, new webdav.SimpleUser(name, results.records[0].get('token'), false,false));
        }
        return callback(webdav.Errors.UserNotFound);
    };

    um.getUserByNamePassword = async (name, password, callback)=>{
        let results = await obj.neo.run(
            'match (n:pubkey{fingerprint: $fpr, token: $token}) return n.token as token',
            {fpr: name, token: password}
        );
        if(results.records.length > 0) {
            return callback(null, new webdav.SimpleUser(name, password, false,false));
        }
        return callback(webdav.Errors.UserNotFound);
    };

    return new webdav.HTTPBasicAuthentication(um, 'third webdav service');
    // return new webdav.HTTPDigestAuthentication(um, 'third webdav service');
}

function cleanup() {
    obj.neo.close();
    obj.fpath = null;
}

module.exports = {
    prepare,
    filesystem,
    authentication,
    cleanup
};
