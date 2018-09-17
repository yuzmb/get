# get

[![GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)

**[mtdhb/eleme - 最新饿了么红包接口 Node.js 封装](https://github.com/mtdhb/eleme)**

https://www.mtdhb.com 红包核心领取逻辑，需配合 [mtdhb/api](https://github.com/mtdhb/api) 使用

基于 [mtdhb/old](https://github.com/mtdhb/old) 改造，代码比较乱，自行研究和部署吧

## 环境

Node.js 9.x

```bash
npm i -g yarn
```

## 代理

[src/service/proxy-server.js](src/service/proxy-server.js)

## 开发

```bash
yarn
yarn dev
```

## 生产

### 首次部署

```bash
git clone https://github.com/mtdhb/get.git mtdhb-get
cd mtdhb-get
yarn global add pm2
yarn
yarn start
```

### 代码更新

```bash
#!/bin/bash

cd mtdhb-get
export MOBILE_LIST=src/service/eleme/core/mobile-list.json
export MOBILE_LIST_BAK=$MOBILE_LIST.bak
cp $MOBILE_LIST $MOBILE_LIST_BAK
git fetch origin master
git reset --hard FETCH_HEAD
cp $MOBILE_LIST_BAK $MOBILE_LIST
yarn
yarn reload
```

将以上内容存为 `*.sh`，并设置脚本执行权限。可放在 webhook 中，当代码 push 到远程时自动更新

### 查看日志，内存信息等

请查看 pm2 文档 https://www.npmjs.com/package/pm2

另外在 `log/` 目录也将按照日期输出每天的日志
