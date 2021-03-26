<template>
    <div>
        <a-input
            v-model="load.key"
            placeholder="全文内容搜索，回车后搜索"
            @pressEnter="load_more(true)"
        />
        <!-- todo 根据标签筛选数据 -->
        <a-table
            :columns="table.columns"
            :data-source="table.list"
            :pagination="false"
            @change="table_change"
        >
            <!-- todo 点击标签后根据标签查找 -->
            <span
                slot="tag"
                slot-scope="tag,item"
            >
                <a-tag
                    v-for="t in tag"
                    :key="t"
                    closable
                    @close="delete_tag(item, t)"
                >
                    {{ t }}
                </a-tag>
                <a-input
                    v-if="item.create_new_tag"
                    :ref="item.id"
                    type="text"
                    size="small"
                    :style="{ width: '78px' }"
                    :value="item.new_tag_data"
                    @change="(e)=>{item.new_tag_data=e.target.value;}"
                    @blur="create_tag(item)"
                    @keyup.enter="create_tag(item)"
                />
                <a-tag
                    v-else
                    style="background: #fff; borderStyle: dashed;"
                    @click="show_new_tag_input(item)"
                >
                    <a-icon type="plus" />新标签
                </a-tag>
            </span>
        </a-table>
        <scroll-loader
            :loader-method="load_more"
            :loader-disable="load.loading||load.no_more"
        >
            <div>加载中，请稍后...</div>
        </scroll-loader>
    </div>
</template>

<script>
const type_map = {
    'webdav.directory': '文件夹',
    'webdav.text': '文本',
    'webdav.audio': '音频',
    'webdav.video': '视频',
    'webdav.empty': '空文件',
    'webdav.other': '其他',
    'link': '链接',
};

export default {
    data() {
        return {
            load: {
                loading: false,
                no_more: false,
                page: 1,
                page_size: 20,
                key: '',
                type: '',
            },
            table: {
                columns: [
                    {
                        title: '名称',
                        dataIndex: 'name',
                        key: 'name',
                    },
                    {
                        title: '类型',
                        dataIndex: 'type',
                        key: 'type',
                        filters: [
                            {
                                text: '文件夹',
                                value: 'webdav.directory'
                            },
                            {
                                text: '文本',
                                value: 'webdav.text',
                            },
                            {
                                text: '音频',
                                value: 'webdav.audio'
                            },
                            {
                                text: '图像',
                                value: 'webdav.image'
                            },
                            {
                                text: '视频',
                                value: 'webdav.video'
                            },
                            {
                                text: '空文件',
                                value: 'webdav.empty',
                            },
                            {
                                text: '其他',
                                value: 'webdav.other'
                            },
                            {
                                text: '链接',
                                value: 'link'
                            },
                        ]
                    },
                    {
                        title: '标签',
                        dataIndex: 'tag',
                        key: 'tag',
                        scopedSlots: { customRender: 'tag' },
                    },
                    {
                        title: '备注',
                        dataIndex: 'note',
                        key: 'note',
                    }
                ],
                list: [],
            }
        };
    },
    methods: {
        table_change(pagination, filters, sorter) {
            this.load.type = filters.type.join(',');
            this.load_more(true);
        },
        show_new_tag_input(item) {
            item.create_new_tag = true;
            this.$nextTick(function() {
                this.$refs[item.id].focus();
            });
        },
        create_tag(item) {
            item.create_new_tag = false;
            // todo 添加标签
            if(item.new_tag_data.length > 0) {
                this.$api.seed.add_tag({
                    seedid: item.id,
                    tag: item.new_tag_data
                }).then(res=>{
                    item.tag = res.data;
                });
            }
            item.new_tag_data = '';
        },
        delete_tag(item, tag) {
            // todo delete tag
            this.$api.seed.del_tag({
                seedid: item.id,
                tag: tag
            }).then(res=>{
                item.tag = res.data;
            });
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
            this.$api.seed.search({
                page: this.load.page,
                page_size: this.load.page_size,
                key: this.load.key,
                type: this.load.type
            }).then(async res=>{
                if (0 === res.data.list.length) {
                    this.load.no_more = true;
                    return;
                }
                for(let s of res.data.list) {
                    s.type = type_map[s.type];
                    s.create_new_tag = false;
                    s.new_tag_data = '';
                    this.table.list.push(s);
                }
                // this.table.list.sort((a,b)=>(a.meta.time.update.timestamp>b.meta.time.update.timestamp));
                this.load.page += 1;
            }).finally(()=>{this.load.loading=false;});
        },
    }
};
</script>

<style>

</style>