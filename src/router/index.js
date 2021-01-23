import Vue from 'vue';
import VueRouter from 'vue-router';
import list from '../views/list.vue';


Vue.use(VueRouter);


const routes = [
    {
        path: '/',
        component: list
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
        path: '/config',
        component(){
            return import('../views/config.vue');
        }
    }
];

const router = new VueRouter({
    routes
});

export default router;
