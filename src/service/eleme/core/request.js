const axios = require('axios-https-proxy-fix');
const proxyServer = require('../../proxy-server');
const logger = require('../../../util/logger')('service/eleme');

const origin = 'https://h5.ele.me';
const referer = `${origin}/hongbao/`;

module.exports = class Request {
  constructor({sn, cookie}) {
    this.sn = sn;
    this.cookie = cookie;
    this.http = axios.create({
      baseURL: origin,
      withCredentials: true,
      timeout: 10000,
      headers: {
        origin,
        referer,
        'content-type': 'text/plain;charset=UTF-8',
        'user-agent':
          'Mozilla/5.0 (Linux; Android 7.0; MIX Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/57.0.2987.132 MQQBrowser/6.2 TBS/044004 Mobile Safari/537.36 V1_AND_SQ_7.5.0_794_YYB_D QQ/7.5.0.3430 NetType/WIFI WebP/0.3.0 Pixel/1080',
        pragma: 'no-cache',
        cookie
      },
      transformRequest: [
        (data, headers) => {
          headers['X-Shard'] = `eosid=${parseInt(sn, 16)}`;
          return JSON.stringify(data);
        }
      ],
      proxy: proxyServer()
    });
  }

  async lucky({theme_id = '0'}) {
    const {data = {}} = await this.http.get(`/restapi/marketing/themes/${theme_id}/group_sns/${this.sn}`);
    return data;
  }

  async hongbao(options) {
    // logger.info('cookie', this.cookie);
    const {phone, check} = options;
    let count = 0;
    // 马上要领最佳了，先验证手机号是否成功绑定
    while (check) {
      const {account} = await this._hongbao({...options, sn: '29e47b57971c1c9d'});
      if (account === phone) {
        break;
      }
      if (++count > 3) {
        throw new Error('未能成功绑定您的手机号码。下一个是最大红包，别再点网站的领取按钮，请手动打开红包链接领取');
      }
    }
    return await this._hongbao(options);
  }

  async _hongbao({phone, openid, sign, platform, sn}) {
    try {
      // logger.info('绑定手机号', phone);
      // const data = await this.http.put(`/restapi/v1/weixin/${openid}/phone`, {sign, phone});
    } catch (e) {}

    // logger.info('openid', openid)
    // logger.info('使用 %s 领取', phone);

    const {data = {}} = await this.http.post(`/restapi/marketing/promotion/weixin/${openid}`, {
      device_id: '',
      group_sn: sn || this.sn,
      hardware_id: '',
      method: 'phone',
      phone: '',
      platform,
      sign,
      track_id: '',
      unionid: 'fuck', // 别问为什么传 fuck，饿了么前端就是这么传的
      weixin_avatar: '',
      weixin_username: ''
    });
    logger.info('饿了么响应 %j', data);

    data.promotion_records = data.promotion_records || [];
    return data;
  }
};
