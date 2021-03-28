# 页面设计


## 数据库存储内容

> tag与节点的区别：
>   1. 每个seed都是节点，同名节点可以相互区分，为不同实体，tag无法互相区分
>   2. tag无法配置与节点的关系，节点可以配置与节点的关系

// 公开发布数据必须携带签名
- seed: 数据存储相关
  // 通用杂项
  - id: 唯一索引id，使用uuid, 多人情况使用拥有者指纹+uuid进行区别
  - fulltext: 全文搜索内容保存字段，可手动修改
  - tag: 标签列表，弱关系索引，更强的是节点与节点之间的关系
  - owner: 文件拥有者
  - type: webdav.{directory/text/audio/image/video/empty/other},link,other 节点内容类型
  - note: 备注性信息
  - name: 节点名称
  - uri: 资源定位标识符，数据实际位置
  - create_ts: 创建时间
  - update_ts: 更新时间
  - delete_ts 删除时间，倒计时30天后再真正删除，可还原

// todo 后期修改为每个终端一个证书机制，通过信任证书来授权访问
- pubkey: 身份认证相关
  - fingerprint: 主key指纹，可等同于用户名使用
  - token: 可当密码使用
