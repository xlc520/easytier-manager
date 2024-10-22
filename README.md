<div align="center">  <img width="100" src="./public/logo.png"> <br> <br>
<h1>EasyTier 管理器 组网 内网穿透</h1>
<h3>Vue3 + Vite5 + Electron33 + Element-Plus</h3>
</div>

## 使用教程

**(重要) 1.设置页 检测内核是否存在，若不存在则下载内核，然后安装，再次检测内核是否存在**（仅首次使用需要，后续确认存在即可直接运行）

2.配置页新建组网配置，提供直接编辑代码的方式，和表单填写

3.工作台（首页）运行指定配置

(可选) 4.组网成功后，连接没有问题可退出管理器(托盘图标右键`退出`)

(可选) 5.在配置页面，安装指定配置为系统服务(经测试过Windows 11 22631.4317)

## 介绍

EasyTier 管理器 整合Vue3 + Vite5 + Electron33 + Element-Plus， 是一个基于 `element-plus` 免费开源的中后台模版。使用了最新的`vue3`，`vite5`，`TypeScript` 等主流技术开发，开箱即用的中后台前端解决方案，可以用来作为项目的启动模版，也可用于学习参考。并且时刻关注着最新技术动向，尽可能的第一时间更新。

## 特性

- **最新技术栈**：使用 Vue3/vite5 等前端前沿技术开发
- **TypeScript**: 应用程序级 JavaScript 的语言
- **主题**: 可配置的主题
- **国际化**：内置完善的国际化方案
- **自定义数据** 内置 Mock 数据方案
- **权限** 内置完善的动态路由权限生成方案
- **组件** 二次封装了多个常用的组件
- **示例** 内置丰富的示例

## 预览

## 文档

## 前序准备

- [node](http://nodejs.org/) 和 [git](https://git-scm.com/) - 项目开发环境
- [Vite4](https://vitejs.dev/) - 熟悉 vite 特性
- [Vue3](https://v3.vuejs.org/) - 熟悉 Vue 基础语法
- [TypeScript](https://www.typescriptlang.org/) - 熟悉 `TypeScript` 基本语法
- [Es6+](http://es6.ruanyifeng.com/) - 熟悉 es6 基本语法
- [Vue-Router-Next](https://next.router.vuejs.org/) - 熟悉 vue-router 基本使用
- [Element-Plus](https://element-plus.org/) - element-plus 基本使用
- [electron](https://www.electronjs.org/zh/)

## 安装和使用

- 获取代码

```bash
git clone
```

- 安装依赖

```bash
cd

pnpm install

```

- 运行

```bash
pnpm run dev
```

- 打包

  1.编译

  ```bash
  pnpm run build:compile
  ```

  2.打包各个平台

  ```bash
  pnpm run build:win
  pnpm run build:linux
  pnpm run build:mac
  ```

## 更新日志

## 如何贡献

你可以提一个 issue 或者提交一个 Pull Request。

**Pull Request:**

1. Fork 代码
2. 创建自己的分支: `git checkout -b feat/xxxx`
3. 提交你的修改: `git commit -am 'feat(function): add xxxxx'`
4. 推送您的分支: `git push origin feat/xxxx`
5. 提交 `pull request`

## Git 贡献提交规范

- `feat` 新功能
- `fix` 修补 bug
- `docs` 文档
- `style` 格式、样式(不影响代码运行的变动)
- `refactor` 重构(即不是新增功能，也不是修改 BUG 的代码)
- `perf` 优化相关，比如提升性能、体验
- `test` 添加测试
- `build` 编译相关的修改，对项目构建或者依赖的改动
- `ci` 持续集成修改
- `chore` 构建过程或辅助工具的变动
- `revert` 回滚到上一个版本
- `workflow` 工作流改进
- `mod` 不确定分类的修改
- `wip` 开发中
- `types` 类型

## 系统支持

理论支持Windows 10 、Windows 11、 Linux (桌面版)、MacOS(暂时无证书，无法打包测试)

## 许可证

[MIT](./LICENSE)
