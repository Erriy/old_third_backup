import Vue from 'vue';
import VueRouter from 'vue-router';
import list from '../views/list.vue';
import test from '@/views/test.vue';


Vue.use(VueRouter);


const routes = [
    {
        path: '/',
        component: test
    },
    {
        path: '/list',
        component: list
    },
    {
        path: '/seed',
        component() {
            return import('../views/seed.vue');
        }
    },
    {
        path: '/service_config',
        component(){
            return import('../views/service_config.vue');
        }
    }
];

const router = new VueRouter({
    routes
});

export default router;
