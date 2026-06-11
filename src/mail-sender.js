/**
 * MailSender —— 邮件发送
 * 串联 GPT AI 角色回信 → SMTP 投递
 */
import { Config } from './config.js';

export class MailSender {
  /**
   * 发送邮件
   * @param {string} toEmail - 收件人邮箱
   * @param {string} roleName - 角色名（用作 system prompt）
   * @param {string} bodyText - 邮件正文
   * @param {string} otherAttachments - 礼物附件文本
   * @param {string} todayStr - 日期字符串
   * @returns {Promise<string>} AI 回复内容
   */
  async send(toEmail, roleName, bodyText, otherAttachments, todayStr) {
    const timeout = Config.get('limits.requestTimeout');

    // Step 1: 调用 GPT 生成回信
    const aiMsg = Qmsg.loading('正在突破次元壁！');
    let reply;
    try {
      const keyEncoded = await fetch('./baka1.txt', {
        signal: AbortSignal.timeout(timeout)
      }).then(r => r.text());
      const apiKey = window.stringDecodeFrom9(keyEncoded);

      const sysPrompt = `你是幻想乡的${roleName}，这里有一些来自外界的信需要你回复！可以适当使用颜文字！(补充设定:` +
        ((window.cs && window.cs[roleName]) || '') + ')';

      const resp = await fetch(Config.get('api.openai.endpoint'), {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: Config.get('api.openai.model'),
          messages: [
            { role: 'system', content: sysPrompt },
            { role: 'user', content: `[ ${todayStr} ]\n${bodyText}\n${otherAttachments}` }
          ]
        }),
        signal: AbortSignal.timeout(timeout)
      });

      if (!resp.ok) {
        throw new Error(`OpenAI API 返回 ${resp.status}`);
      }
      reply = await resp.json();
      aiMsg.close();
      Qmsg.success('信件已被幻想乡接收');
    } catch (err) {
      aiMsg.close();
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        throw new Error('突破次元壁超时了，请稍后重试');
      }
      throw new Error(`AI 回信失败: ${err.message}`);
    }

    // Step 2: 通过 SMTP 发送邮件
    const smtpMsg = Qmsg.loading('正在转接至邮箱！');
    try {
      const keyEncoded2 = await fetch('./baka2.txt', {
        signal: AbortSignal.timeout(timeout)
      }).then(r => r.text());
      const smtpPass = window.stringDecodeFrom9(keyEncoded2);

      const content = reply.choices[0].message.content +
        '\n\n\n本邮件来自开源项目: LoveKogasa/GensokyoMail\n' +
        '由于其无需注册的特点，可能会被不法人士滥用(比如推销VPN等)，滥用举报邮箱: 1983997053@qq.com\n' +
        '咱对此也没办法(悲';

      const resp = await fetch(Config.get('api.smtp.endpoint'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: Config.get('api.smtp.host'),
          from: Config.get('api.smtp.from'),
          pass: smtpPass,
          to: toEmail,
          title: `一封来自幻想乡 ${roleName} 的邮件`,
          content: content
        }),
        signal: AbortSignal.timeout(timeout)
      });

      const result = await resp.json();
      smtpMsg.close();

      if (result.msg === 'ok') {
        Qmsg.success('转接成功，请检查你的邮箱');
      } else {
        Qmsg.error('邮件发送失败，请检查邮箱是否正确');
      }
      return content;
    } catch (err) {
      smtpMsg.close();
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        throw new Error('邮件投递超时，请稍后重试');
      }
      throw new Error(`邮件发送失败: ${err.message}`);
    }
  }
}
