# 页面设计


## 数据库存储内容

> tag与节点的区别：
>   1. 每个seed都是节点，同名节点可以相互区分，为不同实体，tag无法互相区分
>   2. tag无法配置与节点的关系，节点可以配置与节点的关系

- seed
  // 通用杂项
  - id: 唯一索引id，使用uuid, 多人情况使用拥有者指纹+uuid进行区别
  - fulltext: 全文搜索内容保存字段，可手动修改
  - delete_ts 删除时间，倒计时30天后再真正删除，可还原
  - tag: 标签列表，弱关系索引，更强的是节点与节点之间的关系
  - owner: 文件拥有者
  - type: text/audio/image/video/link/other 节点所指向的内容类型
  - note: 备注性信息
  // fs_ 开头为webdav相关
  - fs_type: file/directory 文件或目录类型
  - fs_name: 显示名称
  - fs_uri: 资源定位标识符
  - fs_create_ts: 创建时间
  - fs_update_ts: 更新时间
  // link_ 开头为链接相关
  - link_title: 标题
  - link_uri: 资源定位标识符
  - link_create_ts: 链接收录时间