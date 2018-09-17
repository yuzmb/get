const querystring = require('querystring');
const cookie2sns = require('./core/cookie2sns');
const Request = require('./core/request');
const RequestByPhone = require('./core/requestByPhone');
const MobileList = require('./core/mobile-list');
const logger = require('../../util/logger')('service/eleme');
const checkCookieResponse = require('../check-cookie-response');

module.exports = async (req, res) => {
  let {cookie, userId} = req.body;
  // logger.info('userId', userId) java 传userId过来，如果为空则更新api的代码
  const response = checkCookieResponse(req, res);
  let request = null;
  let requestByPhone = null;
  let count = 0;
  let sns = cookie2sns(cookie);

  if (cookie.indexOf('snsInfo[wx2a416286e96100ed]=') === -1 && cookie.indexOf('snsInfo[101204453]=') === -1) {
    return response(4, 'cookie 不正确，请确保内容包含：\n\nsnsInfo[wx2a416286e96100ed] 或 snsInfo[101204453]');
  }

  if (!sns || !sns.openid) {
    return response(1, 'cookie 不正确，请按照教程一步一步获取');
  }

  request = new Request({sn: '29e47b57971c1c9d', cookie: cookie});
  requestByPhone = new RequestByPhone({cookie});

  function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  return (async function check() {
    try {
      // 可判断userId的值，限制管理员才能用,不包含SID
      if (userId && !~cookie.indexOf('SID=')) {
        const mobile = await requestByPhone.getPhone();
        logger.info('mobile', mobile);
        const _mobile = mobile.split('|')[1];
        // 如果出现400，说明需要图片验证码，释放手机号，重新获取
        let token = 0;
        try {
          token = await requestByPhone.getToken({mobile: _mobile});
        } catch (e) {
          logger.info('需要图形验证码，可以跳过，接下一个手机号');
          // 释放号码
          await requestByPhone.delPhone(_mobile);
          // return check(); 、// 不自动check，手动，正常来说不会400
          return response(3, '需要图形验证码，可以跳过，接下一个手机号');
        }
        if (token.validate_token) {
          // 用token去获取验证码
          let code = 0;
          (async function autoGetCode() {
            const getcode = await requestByPhone.getCode(_mobile);
            // 定时获取code 此处3001看接码平台api文档
            if (getcode + '' === '3001') {
              await timeout(5000);
              return autoGetCode();
            } else {
              code = getcode.split('验证码是')[1].split('，')[0];
              loginBind();
            }
          })();
          async function loginBind() {
            logger.info('code', code);
            const {data, headers} = await requestByPhone.loginByPhone({
              mobile: _mobile,
              validate_token: token.validate_token,
              validate_code: code
            });

            const track_id = headers['set-cookie'].find(c => c.split('; ')[0].indexOf('track_id') === 0).split('; ')[0];
            const USERID = headers['set-cookie'].find(c => c.split('; ')[0].indexOf('USERID') === 0).split('; ')[0];
            const sid = headers['set-cookie'].find(c => c.split('; ')[0].indexOf('SID') === 0).split('; ')[0];
            cookie = cookie + '; ' + track_id + '; ' + USERID + '; ' + sid;
            logger.info(sid);

            if (data.user_id) {
              await requestByPhone.bindPhone(_mobile, sns.eleme_key, sns.openid, sid);
              logger.info('绑定成功');
              request = new Request({sn: '29e47b57971c1c9d', cookie});
              awaitFun();
            } else {
              logger.info('短信验证码不正确或其它错误，可以跳过，接下一个手机号');
              // 释放号码
              await requestByPhone.delPhone(_mobile);
              // return check()
              return response(3, '短信验证码不正确或其它错误，可以跳过，接下一个手机号');
            }
          }
        } else {
          logger.info('需要图形验证码，可以跳过，接下一个手机号');
          // 释放号码
          await requestByPhone.delPhone(_mobile);
          return response(3, '需要图形验证码，可以跳过，接下一个手机号');
        }
      } else {
        awaitFun();
      }

      async function awaitFun() {
        try {
          // logger.info('hongbao->cookie', cookie);
          const data = await request.hongbao({
            // phone: MobileList.getOne(),
            phone: '',
            openid: sns.openid,
            sign: sns.eleme_key,
            platform: 4
          });
          if (data.name === 'SNS_UID_CHECK_FAILED') {
            return response(1, 'cookie 不正确，请按照教程一步一步获取');
          }

          if (data.ret_code === 5) {
            return response(2, '请换一个不领饿了么红包的小号来贡献');
          }

          response(0, 'cookie 验证通过', sns);
        } catch (e) {
          logger.error(e.message);
          if ([400, 500].includes((e.response || {}).status) && ++count < 3) {
            return check();
          }
          return response(3, 'cookie 不正确 或 网络繁忙');
        }
      }
    } catch (e) {
      logger.error(e.message);
      return response(3, '需要图形验证码 或 拿不到验证码 或 网络繁忙');
    }
  })();
};
