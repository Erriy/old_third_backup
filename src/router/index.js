import Vue from 'vue';
import VueRouter from 'vue-router';
import list from '../views/list.vue';


Vue.use(VueRouter);


const routes = [
    {
        path: '/',
        name: 'list',
        component: list
    },
    {
        path: '/list',
        name: 'list',
        component: list
    },
    {
        path: '/seed',
        name: 'seed',
        component() {
            return import('../views/seed.vue');
        }
    },
    {
        path: '/config',
        name: 'config',
        component(){
            return import('../views/config.vue');
        }
    }
];

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
});

export default router;
