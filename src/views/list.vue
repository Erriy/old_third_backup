<template>
    <div>
        <a-table
            :columns="table.columns"
            :data-source="table.list"
            @change="table_change"
        >
        </a-table>
        <scroll-loader :loader-method="load_more" :loader-disable="load.loading||load.no_more">
            <div>加载中，请稍后...</div>
        </scroll-loader>
    </div>
</template>

<script>
export default {
    data() {
        return {
            load: {
                loading: false,
                no_more: false,
                page: 1,
                page_size: 20,
            },
            table: {
                columns: [
                    {
                        title: '标题',
                        dataIndex: 'name',
                    },
                    {
                        title: '内容',
                        dataIndex: 'data'
                    },
                    {
                        title: '类型',
                        dataIndex: 'type',
                        filters: [
                            {
                                text: '文本',
                                value: 'text',
                            },
                            {
                                text: '音频',
                                value: 'audio'
                            },
                            {
                                text: '图像',
                                value: 'image'
                            },
                            {
                                text: '视频',
                                value: 'video'
                            },
                            {
                                text: '链接',
                                value: 'link'
                            }
                        ]
                    },
                    {
                        title: '更新时间',
                        dataIndex: 'update_ts',
                    }
                ],
                list: [],
            }
        }
    },
    methods: {
        table_change(pagination, filters, sorter) {

        },
        load_more(refresh=false) {
            if(this.load.loading) {
                return;
            }
            this.load.loading = true;
            if(refresh) {
                this.table.list = [];
                this.load.page = 1;
                this.load.no_more = false;
            }
            // fixme 请求错误处理
            this.$api.seed.search({
                service: this.$common.service,
                // key: this.load.search.key,
                page: this.load.page,
                page_size: this.load.page_size,
                // from_ts: this.load.search.date_range.from > 0?this.load.search.date_range.from/1000: '',
                // to_ts: this.load.search.date_range.to > 0?this.seed.search.date_range.to/1000: '',
            })
            .then(async (res)=>{
                if (0 === res.data.list.length) {
                    this.load.no_more = true;
                    return;
                }
                for(let s of res.data.list) {
                    this.table.list.push(s);
                }
                this.table.list.sort((a,b)=>(a.meta.time.update.timestamp>b.meta.time.update.timestamp));
                this.load.page += 1;
            })
            .finally(()=>this.load.loading=false);
        },
    }
}
</script>

<style>

</style>