const webdav = require('webdav-server').v2;
const neo4j_driver = require('neo4j-driver');

let obj = {
    neo4j: null
};

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
function filesystem(uri, username, password)
{
    const r = new webdav.FileSystem(new fs_serializer());
    r.neo4j =
    r.constructor = filesystem;
    r.resources = {
        '/': new fs_resource()
    };

    return r;
}

async function prepare(uri, username, password) {
    cleanup();
    let nj = neo4j_driver.driver(uri, neo4j_driver.auth.basic(username, password));
    try {
        await nj.verifyConnectivity();
    }catch(err) {
        throw '无法正常连接数据库，请确认数据库地址与验证信息无误';
    }
}

function cleanup() {
    if(obj.neo4j) {
        obj.neo4j.close();
        obj.neo4j = null;
    }
}

module.exports = {
    prepare,
    filesystem,
    cleanup
};
