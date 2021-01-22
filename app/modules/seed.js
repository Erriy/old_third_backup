const axios = require('axios').default;


async function _request({
    method='',
    service='',
    path='',
    data=null,
}={}) {
    let headers = {'Content-Type': 'application/json'};
    method = method.toUpperCase();
    let url = `${service}/api` + path;
    return new Promise((resolve, reject)=>{
        axios({
            method: method,
            url: url,
            headers: headers,
            data: data
        }).then(r=>resolve(r.data))
        .catch(e=>reject(e.response?e.response.data.message:e.message));
    });
}


async function save({
    id='',
    service='',
    data="",
}={}) {
    let ts = new Date().getTime()/1000;
    let object_seed = {
        meta: {
            id:id,
            time: {
                update: {
                    timestamp: ts,
                }
            }
        },
        data: data,
    };

    return _request({
        method: 'PUT',
        service,
        path: `/seed`,
        data: object_seed,
    });
}


function search({
    service='',
    key='',
    page=1,
    page_size=20,
    from_ts='',
    to_ts='',
}={}) {
    return _request({
        method: 'GET',
        service,
        path: `/seed?page=${page}&page_size=${page_size}&key=${encodeURIComponent(key)}&from=${from_ts}&to=${to_ts}`,
    });
}


function _delete({
    service='',
    id=''
}={}) {
    return _request({
        method: 'delete',
        service,
        path: `/seed/${id}`,
    });
}


module.exports = {
    save,
    search,
    delete:_delete,
};

