const axios = require('axios').default;

async function _request({
    method='',
    service='http://127.0.0.1:6952',
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

async function search({
    key='',
    page=1,
    page_size=20,
    type=''
}={}) {
    return _request({
        method: 'GET',
        path: `/seed?page=${page}&page_size=${page_size}&key=${encodeURIComponent(key)}&type=${type}`
    });
}

async function add_tag({
    seedid='',
    tag='',
}={}) {
    return _request({
        method: 'PUT',
        path: `/seed/${seedid}/tag/${tag}`,
    });
}

async function del_tag({
    seedid='',
    tag='',
}={}) {
    return _request({
        method: 'DELETE',
        path: `/seed/${seedid}/tag/${tag}`,
    });
}

module.exports = {
    search,
    add_tag,
    del_tag,
};
