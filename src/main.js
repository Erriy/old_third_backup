import Vue from 'vue';
import App from './App.vue';
import router from './router';
import api from './api';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';


Vue.config.productionTip = false;
Vue.use(api);
Vue.use(Antd);


Vue.prototype.$common = {
    title: {
        __tmp: {
            change: false,
            filename: null,
            pagename: ''
        },
        update({
            change=undefined,
            filename=undefined,
            pagename=undefined,
        }={}) {
            undefined !== change && (this.__tmp.change = change);
            undefined !== filename && (this.__tmp.filename = filename);
            undefined !== pagename && (this.__tmp.pagename = pagename);
            document.title = `${this.__tmp.change?'*':''}${this.__tmp.filename.length>0?this.__tmp.filename + ' - ': ''}${this.__tmp.pagename} - third`
        }
    }
};


new Vue({
    router,
    render: function (h) { return h(App) }
}).$mount('#app');

