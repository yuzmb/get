const fs = require('fs');
const path = require('path');
const uniq = require('lodash/uniq');
const logger = require('../../../util/logger')('service/eleme');
const Random = require('../../../util/random');
let {white = [], black = []} = require('./mobile-list.json');

// 定时存一下
// setInterval(() => {
//   white = uniq(white);
//   black = uniq(black);
//   logger.info(`当前 white ${white.length} 条，black ${black.length} 条`);
//   fs.writeFile(path.join(__dirname, 'mobile-list.json'), JSON.stringify({white, black}), () => {});
// }, 1000 * 60);

module.exports = {
  // 加入白名单，用于以后快速随机
  addWhite(value) {
    white.push(value);
  },
  // 加入黑名单，以后随机不用它
  addBlack(value) {
    black.push(value);
  },
  getOne(exclude) {
    let value;
    do {
      // TODO: 目前量不够多，所以概率使用白名单提取，这样还可以继续一边收集。如果量足够的话，建议全部白名单
      // 选择1. 从白名单中随机
      // 选择2. 从移动、联通号码中随机
      // 这个 1000 指的是白名单数量超过 1000 才使用，可自行修改判断
      value = white.length > 1000 && Math.random() >= 0.1 ? Random.array(white) : Random.phone(exclude);
      // 如果是黑名单内的手机号，继续随机
    } while (value === exclude || black.includes(value));
    return value;
  }
};
