const webdav = require('webdav-server').v2;
const neo4j_driver = require('neo4j-driver');
const {dirname, basename} = require('path');
const tempfile = require('tempfile');
const fs = require('fs');
const {Readable} = require('stream');


let neo4j = neo4j_driver.driver(
    'neo4j://127.0.0.1:7687',
    neo4j_driver.auth.basic('neo4j', 'ub1JOnQcuV^rfBsr5%Ek')
);


async function neo4j_run(...args) {
    let s = neo4j.session();
    let result = undefined;
    try{
        result = await s.run(...args);
    }
    finally {
        s.close();
    }
    return result;
}


function find_entry_cql(path, name='entry') {
    let entrys = [];
    while(path!='/') {
        entrys.push(basename(path))
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
            return "fs_serializer_1.0.0";
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
    }
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
    const r = new webdav.FileSystem(new fs_serializer());
    r.constructor = filesystem;
    r.resources = {
        '/': new fs_resource()
    };

    // 初始化根目录节点
    neo4j_run(`merge (:seed{fs_name: '/'})`).then();

    r._create = (path /* : Path*/, ctx /* : CreateInfo*/, callback /* : SimpleCallback*/)=>{
        let name = basename(path.toString());
        let typeinfo = ctx.type.isDirectory ? '' : ', fs_type:"file"';

        neo4j_run(`
            ${find_entry_cql(dirname(path.toString()))}
            create (s:seed{fs_name: $fs_name ${typeinfo}})-[:in]->(entry)
        `, {fs_name: name}).then(seeds=>{
            r.resources[path.toString()] = new fs_resource();
            return callback(null);
        });
    };

    r._openWriteStream = (path /* : Path*/, ctx /* : OpenWriteStreamInfo*/, callback /* : ReturnCallback<Writable>*/)=>{
        let filepath = tempfile();
        let wstream = fs.createWriteStream(filepath);
        wstream.on('finish', ()=>{
            // fixme: 判断文件大小和文件类型
            // fixme 处理编码问题
            fs.readFile(filepath, 'utf8', (e, data)=>{
                    neo4j_run(`
                    ${find_entry_cql(path.toString())} set entry.seed_block=$seed_block
                `, {
                    seed_block: data = data ? data: '',
                }).finally(()=>{fs.unlink(filepath, ()=>{})});
            });
        });
        callback(null, wstream);
    };

    r._openReadStream = (path /* : Path*/, ctx /* : OpenReadStreamInfo*/, callback /* : ReturnCallback<Readable>*/)=>{
        neo4j_run(`
            ${find_entry_cql(path.toString())} return entry.seed_block
        `).then(seeds=>{
            // fixme: 如果是文件数据，返回文件流
            let block = seeds.records[0]._fields[0];
            callback(null, Readable.from(block));
        });
    };

    r._move = (pathFrom /* : Path*/, pathTo /* : Path*/, ctx /* : MoveInfo*/, callback /* : ReturnCallback<boolean>*/)=>{
        neo4j_run(`
            ${find_entry_cql(pathTo.toString())} return entry
        `).then(r=>{
            if (0!==r.records.length) {
                return callback(null, false);
            }
            neo4j_run(`
                ${find_entry_cql(pathFrom.toString())} set entry.fs_name=$fs_name
            `, {fs_name: basename(pathTo.toString())} ).then(r=>{
                callback(null, true);
            });
        });
    };

    r._readDir = (path /* : Path*/, ctx /* : ReadDirInfo*/, callback /* : ReturnCallback<string[] | Path[]>*/)=>{
        neo4j_run(`
            ${find_entry_cql(path.toString())}
            match (n:seed)-[:in]->(entry) return n.fs_name
        `).then(seeds=>{
            return callback(null, seeds.records.map(s=>(s._fields[0])));
        });
    };

    r._size = (path /* : Path*/, ctx /* : SizeInfo*/, callback /* : ReturnCallback<number>*/)=>{
        // todo 如果是文件的话，则返回文件大小
        neo4j_run(`
            ${find_entry_cql(path.toString())} return size(entry.seed_block)
        `).then(r=>{
            return callback(null, Number(r.records[0]._fields[0]));
        });
    };

    r._type = (path /* : Path*/, ctx /* : TypeInfo*/, callback /* : ReturnCallback<ResourceType>*/)=>{
        neo4j_run(`${find_entry_cql(path.toString())} return entry.fs_type`).then(seeds=>{
            if(0 === seeds.records.length) {
                return callback(webdav.Errors.ResourceNotFound);
            }
            let type = seeds.records[0]._fields[0];
            callback(null, type ? webdav.ResourceType.File : webdav.ResourceType.Directory);
        });
    };

    function get_prop_from_resource(path, ctx, propname, callback) {
        let resource = r.resource[path.toString()];
        if (!resource) {
            resource = new fs_resource();
            r.resources[path.toString()] = resource;
        }
        callback(null, resource[propname])
    }

    r._lockManager = (path /* : Path*/, ctx /* : LockManagerInfo*/, callback /* : ReturnCallback<ILockManager>*/)=>{
        get_prop_from_resource(path, ctx, 'locks', callback);
    }

    r._propertyManager = (path /* : Path*/, ctx /* : PropertyManagerInfo*/, callback /* : ReturnCallback<IPropertyManager>*/)=>{
        get_prop_from_resource(path, ctx, 'props', callback);
    }

    return r;
}


module.exports = {filesystem};

