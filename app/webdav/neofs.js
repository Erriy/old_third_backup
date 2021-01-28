const webdav = require('webdav-server').v2;


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
                arg1: fs.arg1,
                arg2: fs.arg2,
                resources: fs.resources
            });
        },
        unserialize(serializedData, callback)
        {
            const fs = new filesystem(serializedData.arg1, serializedData.arg2);
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
function filesystem(arg1, arg2)
{
    const r = new webdav.FileSystem(new fs_serializer());
    r.constructor = filesystem;
    r.resources = {
        '/': new fs_resource()
    };

    r.arg1 = arg1;
    r.arg2 = arg2;

    // r._fastExistCheck = function(ctx /* : RequestContext*/, path /* : Path*/, callback /* : (exists : boolean*/) => void) {}
    // r._create = function(path /* : Path*/, ctx /* : CreateInfo*/, callback /* : SimpleCallback*/) {}
    // r._etag = function(path /* : Path*/, ctx /* : ETagInfo*/, callback /* : ReturnCallback<string>*/) {}
    // r._delete = function(path /* : Path*/, ctx /* : DeleteInfo*/, callback /* : SimpleCallback*/) {}
    // r._openWriteStream = function(path /* : Path*/, ctx /* : OpenWriteStreamInfo*/, callback /* : ReturnCallback<Writable>*/) {}
    // r._openReadStream = function(path /* : Path*/, ctx /* : OpenReadStreamInfo*/, callback /* : ReturnCallback<Readable>*/) {}
    // r._move = function(pathFrom /* : Path*/, pathTo /* : Path*/, ctx /* : MoveInfo*/, callback /* : ReturnCallback<boolean>*/) {}
    // r._copy = function(pathFrom /* : Path*/, pathTo /* : Path*/, ctx /* : CopyInfo*/, callback /* : ReturnCallback<boolean>*/) {}
    // r._rename = function(pathFrom /* : Path*/, newName /* : string*/, ctx /* : RenameInfo*/, callback /* : ReturnCallback<boolean>*/) {}
    // r._mimeType = function(path /* : Path*/, ctx /* : MimeTypeInfo*/, callback /* : ReturnCallback<string>*/) {}
    // r._size = function(path /* : Path*/, ctx /* : SizeInfo*/, callback /* : ReturnCallback<number>*/) {}
    // r._availableLocks = function(path /* : Path*/, ctx /* : AvailableLocksInfo*/, callback /* : ReturnCallback<LockKind[]>*/) {}
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
    // r._readDir = function(path /* : Path*/, ctx /* : ReadDirInfo*/, callback /* : ReturnCallback<string[] | Path[]>*/) {}
    // r._creationDate = function(path /* : Path*/, ctx /* : CreationDateInfo*/, callback /* : ReturnCallback<number>*/) {}
    // r._lastModifiedDate = function(path /* : Path*/, ctx /* : LastModifiedDateInfo*/, callback /* : ReturnCallback<number>*/) {}
    // r._displayName = function(path /* : Path*/, ctx /* : DisplayNameInfo*/, callback /* : ReturnCallback<string>*/) {}
    r._type = function(path /* : Path*/, ctx /* : TypeInfo*/, callback /* : ReturnCallback<ResourceType>*/) {
        // TODO
        callback(null, webdav.ResourceType.Directory);
    }
    // r._privilegeManager = function(path /* : Path*/, info /* : PrivilegeManagerInfo*/, callback /* : ReturnCallback<PrivilegeManager>*/) {}

    return r;
}


module.exports = {filesystem};

