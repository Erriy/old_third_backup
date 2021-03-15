# third

> third 没有任何意义，仅仅是因为喜欢这个名字罢了。本意最初的想法叫memories，后来想叫link&share，但是由于功能的逐步添加，感觉哪个名字都不够贴切。third没有意义，希望有一天third有其自身的含义。

## 软件简介

> 略，稍后进行补充

## 软件逻辑简介

### 数据存储逻辑

seedid = `${初始创作者证书指纹}.${seed.id}.${sha256(json_seed)}[-${编辑者证书指纹}]`

data(文件内容)

object格式seed(包括元信息+data内容)

传输中的json格式seed(json序列化后的数据)

对seedid进行批量签名




### seed 格式

> 当文件系统存储时保存路径名和相应关系
> 发布时删除路径相关信息

``` json
{
    "meta": {
        "uri": "",
        "filesystem": {
            "name": "", # entry name
            "type": null, # 文件类型，没有文件类型则为目录
        },
        "time": {
            "create": {
                "timestamp": 1111 # 创建时间戳
            },
            "update": {
                "timestamp": 111111 # 更新时间戳
            }
        }
    },
    "data": "" # 字符串数据，如果是对象，需要序列化为字符串
}
```

### 数据库字段

- ts_create
- ts_update
- fs_name
- fs_type
- seed_block # 原始数据
- search_fulltext # 全文索引字段

### 服务器选择

包括本机服务器、本地服务器和手动添加的服务器
选中服务器后修改配置则是修改服务器的配置
每个应用窗口可指定不同服务器

## 代码使用方法

### 安装环境

``` shell
npm install
```

### 调试启动

> 涉及到electron的api调用，不能使用浏览器调试
>
> 修改electron的窗口加载url在`app/moudles/window.js@create`中，
>
> - win.loadURL(`http://localhost:8080/#${path}`);

``` shell
# 启动vue调试服务
npm run vue:serve
# 调试启动electron，自动加载本地8080端口
npm run electron:serve
```

### 构建应用


``` shell
# 生成位置在dist目录下
npm run build
```


## todo

- [ ] git-hooks
  - [ ] eslint 语法检查
  - [x] 提交时修改版本则自动发布
  - [ ] commit message 规范
  - [ ] pre-commit 进行测试
- [ ] 使用jest做测试模块，编写单元测试代码

### 2020.01.20

- [x] 自动更新
- [x] 本地服务

### 2020.01.21

- [x] seed 接口
- [x] tray设置

### 2020.01.22

- [ ] 本地编辑器逻辑
- [x] 使用githooks


### 2020.01.23

- [ ] 添加标签以及与标签的关系
- [ ] 根据标签搜索
- [x] 修改本地服务配置
- [x] 重启本地服务
- [ ] 使用monaco-editor保存代码
- [ ] 剪贴板管理
- [ ] 使用neo4j-embedded（有必要么？）

### 2020.01.24

- [ ] 服务器间同步
- [ ] 本地配置加密存储(https://github.com/atom/node-keytar)

### 2020.01.25

- [ ] 侧边栏，编辑器可全屏，可隐藏侧边栏
  - [ ] 侧边栏管理上下有关联数据
- [ ] 搜索显示信息块列表
  - [ ] 内容搜索
  - [ ] 时间过滤
- [ ] 结果展示列表
- [ ] 创建新数据
- [ ] 结果展示页
  - [ ] 使用系统打开文件（写入临时文件并监听内容变动，进程退出后自动删除临时文件）
  - [ ] 删除
  - [ ] 添加关系

### 2020.01.26

- [ ] 新增数据
- [ ] 列表展示、筛选

### 2020.01.27

- [ ] 拖拽自动“上传”（上传到服务内部：本地服务则为拷贝到对应文件夹）
- [ ] 添加标签
- [ ] 根据标签查找
- [ ] 默认id为本服务内数据，否则为协议数据（比如url）

### 2020.01.30

- [ ] 区分文件类型
  - [ ] 包括内容的文件自动全文索引
  - [ ] 非文字内容存储为文件（文件名保存为sha256）
    - [ ] 预览生成（图片缩小预览图，视频提取关键帧）
    - [ ] 语音识别
    - [ ] 视频字幕提取
    - [ ] 物体识别
    - [ ] gps、时间等信息提取
  - [ ] 配置
    - [ ] 选择性开启功能
    - [ ] 配置文件存储位置
- [ ] 自动挂载webdav
- [ ] 本地私有文件不需要签名，发布时转换为seed格式进行签名
- [ ] 设备间同步仿照https概念，使用gpg证书交换对称加密密钥，证书指纹必须由自己的证书信任，否则拒绝

### 2020.02.06

- [ ] 多设备同步的webdav
  - [ ] 支持全文索引

- [ ] 提供接口服务
  - [ ] 接收浏览器插件等插件数据

### 2020.02.07

- [ ] webdav为前端接口
- [ ] 文件改变后触发同步
  - [ ] git同步到github
  - [ ] 本地同步到其他认可设备
- [ ] 使用prettier自动格式化
- [ ] eslint仅处理staged数据

## 版本计划

### v0.1

- 服务端（nodejs）
  - webdav支持
    - 支持全文搜索
  - gpg支持token
- 客户端
  - 登陆帐号（gpg体系）
  - 挂载本地webdav
- 客户端本地集成服务（需指定neo4j数据库）

### v0.2

- 节点相关关联
- url添加

###  v0.3

- 内网设备自动识别

### v0.4

- 节点关联关系

### v0.5

- 采集器（关注数据自动采集）
  - 剧集更新
  - 应用更新

## 版本计划（旧）

| 版本 | 功能                                                         |
| ---- | ------------------------------------------------------------ |
| v0.1 | 本地自带服务文本编辑器，任意节点关系建立，带关系索引         |
| v0.2 | 个人设备/服务器间同步，gpg加密身份体系                       |
| v0.3 | 剪贴板管理                                                   |
| v0.4 | 支持文件系统（本地文件指向、网络文件指向、图片/视频预览，使用webdav实现），通过文件系统兼容第三方应用编辑内容 |
| v0.5 | 自动采集（关注与自动追踪）                                   |
| v0.6 | 公开数据发布到github（或其他服务接口）                       |

## Q&A


### windows 系统下的0x800700DF错误

修改注册表'HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\WebClient\Parameters'中的FileSizeLimitInBytes大小，最大为16进制0xffffffff（即4g）,在任务管理器-服务标签页中重新启动webclient服务


## 自动压缩隧道

隧道中间根据出现频率自动生成字典，然后发送给对方。双方维护沟通字典，根据命中来缓存这个表，多少次未命中后则淘汰表项，持续命中则一直保持。
空间换时间还是时间换空间，其实就是压缩方法的一种变种。


