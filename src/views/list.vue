<template>
    <div>
        <a-card :bordered='false'>
            <a-row type="flex" :gutter="[10,0]">
                <a-col flex="auto">
                    <a-input
                        v-model="seed.search.key"
                        placeholder="在此键入内容进行搜索"
                        @pressEnter='load_more(true)'
                    >
                        <a-icon slot="prefix" type="search"/>
                    </a-input>
                </a-col>
                <a-col>
                    <a-range-picker
                        :show-time="{ format: 'HH:mm' }"
                        format="YYYY-MM-DD HH:mm"
                        :placeholder="['开始时间', '结束时间']"
                        @ok="change_search_date_range"
                    />
                </a-col>
            </a-row>
        </a-card>
        <a-card :bordered='false'>
            <a-list item-layout="vertical" size="large" :data-source="seed.list">
                <a-list-item slot="renderItem" key="item.meta.update.timestamp" slot-scope="item" @click='select_seed(item)'>
                    <template v-if='item.data.length>0'>
                        {{ item.data.substring(0,200) }}
                    </template>
                </a-list-item>
                <div slot="footer">
                    <scroll-loader :loader-method="load_more" :loader-disable="seed.loading||seed.no_more">
                        <div>加载中，请稍后...</div>
                    </scroll-loader>
                    <div v-show='seed.no_more && seed.list.length!==0' style='text-align:center;'>已加载全部数据</div>
                    <div v-show='seed.no_more && seed.list.length===0' style='text-align:center;'>没有数据，点击"节点->新建"来创建节点</div>
                </div>
            </a-list>
        </a-card>
    </div>
</template>

<script>
const {ipcRenderer} = window.require('electron');
export default {
    data() {
        return {
            seed: {
                search: {
                    key: "",
                    date_range: {
                        from: -1,
                        to: -1,
                    },
                },
                page: 1,
                page_size: 20,
                loading: false,
                no_more: false,
                list: [],
            },
        }
    },
    methods: {
        select_seed(s) {
            let seedid = s.meta.id;
            sessionStorage[seedid] = JSON.stringify(s);
            this.$router.push({path: '/seed', query:{id: seedid}});
        },
        load_more(refresh=false) {
            if(this.seed.loading) {
                return;
            }
            this.seed.loading = true;
            if(refresh) {
                this.seed.list = [];
                this.seed.page = 1;
                this.seed.no_more = false;
            }

            this.$api.seed.search({
                service: this.$common.service,
                key: this.seed.search.key,
                page: this.seed.page,
                page_size: this.seed.page_size,
                from_ts: this.seed.search.date_range.from > 0?this.seed.search.date_range.from/1000: '',
                to_ts: this.seed.search.date_range.to > 0?this.seed.search.date_range.to/1000: '',
            })
            .then(async (res)=>{
                if (0 === res.data.list.length) {
                    this.seed.no_more = true;
                    return;
                }
                for(let s of res.data.list) {
                    this.seed.list.push(s);
                }
                this.seed.list.sort((a,b)=>(a.meta.time.update.timestamp>b.meta.time.update.timestamp));
                this.seed.page += 1;
            })
            .finally(()=>this.seed.loading=false);
        },
        change_search_date_range(value) {
            this.seed.search.date_range.from = value[0].valueOf();
            this.seed.search.date_range.to = value[1].valueOf();
            this.load_more(true);
        },
        ipc_seed_listener(e, a) {
            if('refresh' === a.action) {
                this.refresh_result();
            }
            else if('new' === a.action) {
                this.$router.replace('/seed');
            }
        }
    },
    destroyed() {
        ipcRenderer.removeListener('seed', this.ipc_seed_listener);
    },
    mounted() {
        this.$api.menu.update().then();
        ipcRenderer.on('seed', this.ipc_seed_listener);
    }
}
</script>

<style>

</style>