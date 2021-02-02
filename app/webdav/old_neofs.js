const webdav = require('webdav-server').v2;
const neo4j_driver = require('neo4j-driver');
const {dirname, basename} = require('path');
const {Writable, Readable} = require('stream');


// todo 判断文件类型(根据文件名和文件大小判断），如果内容特大，则保存为文件内容，而非直接保存在数据库中
// todo 使用neo4j 不实用dumps和loads
const dumps = d=>(encodeURIComponent(JSON.stringify(d)).replace("'", '%27'));
const loads = s=>(JSON.parse(decodeURIComponent(s.replace('%27', "'"))));

// fixme 内容、路径防注入

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

    // r._fastExistCheck = function(ctx /* : RequestContext*/, path /* : Path*/, callback /* : (exists : boolean*/) {
    //     console.log('fast exist check');
    // }
    r._create = function(path /* : Path*/, ctx /* : CreateInfo*/, callback /* : SimpleCallback*/) {
        let set_type_string = ctx.type.isDirectory ? '' : 'set s.type = "file"';
        neo4j_run(`
            merge (s:seed{uri: '${path.toString()}'}) ${set_type_string}
            with s
            merge (f:seed{uri: '${dirname(path.toString())}'}) with s, f
            merge (f)<-[:in]-(s)
        `).then(seeds=>{
            r.resources[path.toString()] = new fs_resource();
            return callback(null);
        });
    }
    // r._etag = function(path /* : Path*/, ctx /* : ETagInfo*/, callback /* : ReturnCallback<string>*/) {
    //     console.log('etag');
    // }
    r._delete = function(path /* : Path*/, ctx /* : DeleteInfo*/, callback /* : SimpleCallback*/) {
        // todo 顺带着删除附属文件
        // console.log(path.toString());
        callback(null);
    }
    r._openWriteStream = function(path /* : Path*/, ctx /* : OpenWriteStreamInfo*/, callback /* : ReturnCallback<Writable>*/) {
        // todo 先缓存数据，然后判断数据类型 ，如果为文本数据，则丢进数据库，否则存放为文件
        let buffers = [];
        const wstream = new Writable({
            // 如果别人调用，我们做什么
            write(chunk, encoding, wcb) {
                buffers.push(chunk);
                wcb();
            },
        })
        wstream.on('finish', ()=>{
            let data = '';
            if(buffers.length > 0) {
                data = buffers.reduce((all, b)=>(all.toString() + b.toString()));
            }
            neo4j_run(`
                merge (s:seed{uri: '${path.toString()}', block: $block, type: 'file'})
                with s
                merge (f:seed{uri: '${dirname(path.toString())}'}) with s, f
                merge (f)<-[:in]-(s)
            `, {block: dumps(data)}).then();
        });

        callback(null, wstream);
    }
    r._openReadStream = function(path /* : Path*/, ctx /* : OpenReadStreamInfo*/, callback /* : ReturnCallback<Readable>*/) {
        neo4j_run(`match (s:seed) where s.uri='${path.toString()}' return s.block`).then(seeds=>{
            let data = loads(seeds.records[0]._fields[0]);
            let rstream = new Readable();
            rstream.push(Buffer.from(data, 'utf-8'));
            rstream.push(null);
            callback(null, rstream);
        })
    }
    r._move = function(pathFrom /* : Path*/, pathTo /* : Path*/, ctx /* : MoveInfo*/, callback /* : ReturnCallback<boolean>*/) {
        // todo 重新建立文件夹关系
        // fixme 不能使用全路径，使用全路径的话则目录名称修改全部都需要修改，使用路径名
        neo4j_run(`
            match (s:seed) where s.uri='${pathFrom.toString()}'
            set s.uri='${pathTo.toString()}'
        `).then(seeds=>{
            callback(null, true);
        });
    }
    // r._copy = function(pathFrom /* : Path*/, pathTo /* : Path*/, ctx /* : CopyInfo*/, callback /* : ReturnCallback<boolean>*/) {
    //     console.log('copy');
    // }
    // r._rename = function(pathFrom /* : Path*/, newName /* : string*/, ctx /* : RenameInfo*/, callback /* : ReturnCallback<boolean>*/) {
    //     console.log('rename');
    // }
    // r._mimeType = function(path /* : Path*/, ctx /* : MimeTypeInfo*/, callback /* : ReturnCallback<string>*/) {
    //     console.log('mime type');
    // }
    // r._size = function(path /* : Path*/, ctx /* : SizeInfo*/, callback /* : ReturnCallback<number>*/) {
    //     console.log('size');
    // }
    // r._availableLocks = function(path /* : Path*/, ctx /* : AvailableLocksInfo*/, callback /* : ReturnCallback<LockKind[]>*/) {
    //     console.log('available locks');
    // }
    function get_prop_from_resource(path, ctx, propname, callback) {
        let resource = r.resource[path.toString()];
        if (!resource) {
            resource = new fs_resource();
            r.resources[path.toString()] = resource;
        }
        callback(null, resource[propname])
    }
    r._lockManager = function(path /* : Path*/, ctx /* : LockManagerInfo*/, callback /* : ReturnCallback<ILockManager>*/) {
        // TODO
        get_prop_from_resource(path, ctx, 'locks', callback);
    }
    r._propertyManager = function(path /* : Path*/, ctx /* : PropertyManagerInfo*/, callback /* : ReturnCallback<IPropertyManager>*/) {
        // TODO
        get_prop_from_resource(path, ctx, 'props', callback);
    }
    r._readDir = function(path /* : Path*/, ctx /* : ReadDirInfo*/, callback /* : ReturnCallback<string[] | Path[]>*/) {
        neo4j_run(`match (s:seed)<-[:in]-(n:seed) where s.uri='${path.toString()}' return n.uri`).then(seeds=>{
            callback(null, seeds.records.map(s=>(basename(s._fields[0]))));
        })
    }
    // r._creationDate = function(path /* : Path*/, ctx /* : CreationDateInfo*/, callback /* : ReturnCallback<number>*/) {
    //     console.log('creation date', path);
    // }
    // r._lastModifiedDate = function(path /* : Path*/, ctx /* : LastModifiedDateInfo*/, callback /* : ReturnCallback<number>*/) {
    //     console.log('last modified date');
    // }
    // r._displayName = function(path /* : Path*/, ctx /* : DisplayNameInfo*/, callback /* : ReturnCallback<string>*/) {
    //     console.log('display name', path);
    // }
    r._type = function(path /* : Path*/, ctx /* : TypeInfo*/, callback /* : ReturnCallback<ResourceType>*/) {
        if('/' == path.toString()) {
            return callback(null, webdav.ResourceType.Directory);
        }
        neo4j_run(`match (s:seed) where s.uri='${path.toString()}' return s.type`).then(seeds=>{
            if(0 === seeds.records.length) {
                return callback(webdav.Errors.ResourceNotFound);
            }
            let type = seeds.records[0]._fields[0];
            callback(null, type ? webdav.ResourceType.File : webdav.ResourceType.Directory);
        });
    }
    // r._privilegeManager = function(path /* : Path*/, info /* : PrivilegeManagerInfo*/, callback /* : ReturnCallback<PrivilegeManager>*/) {
    //     console.log('privilege manager')
    // }

    return r;
}


module.exports = {filesystem};

