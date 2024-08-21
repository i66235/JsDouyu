const cheerio = require('cheerio');

// API 地址和房间 ID
const baseUrl = 'https://m.douyu.com/';
const rid = ['71415', '63136']; // 房间 ID 列表

// 存储每个房间的上次状态
let lastStatus = {}; 

// 存储最后一次提醒时间戳
let lastAlerts = {}; 

/*
 * 通过GET API接口 发送邮箱
 * @param {string} mailTo - 收件人邮箱地址
 * @param {string} subject - 邮件标题
 * @param {string} content - 邮件内容
 * @returns {Promise<void>} - 返回一个 Promise
 */
async function sendMail(mailTo, subject, content) {
    // 发送邮件的 API URL
    const url = `http://142.171.168.137:41908/mail_sys/send_mail_http.json?mail_from=email@pliv.cc&password=Yuange123&mail_to=${mailTo}&subject=${subject}&content=${content}&subtype=`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`网络响应不成功: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('邮箱状态:', data); // 打印邮箱发送状态
    } catch (error) {
        console.error('发送邮件失败:', error); // 打印发送邮件错误
    }
}

/*
 * 解析 HTML 页面中的 JSON 数据
 * @param {string} url - 要请求的 URL
 * @returns {Promise<string|null>} - 返回解析出的 JSON 数据字符串或 null
 */
async function ParseHtml(url) {
    try {
        // 发起网络请求
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`网络响应不成功: ${response.status} ${response.statusText}`);
        }
        // 获取 HTML 内容
        const html = await response.text();
        // 解析 HTML
        const $ = cheerio.load(html);
        // 查找指定 id 的 script 元素中的内容
        const scriptContent = $('#vike_pageContext[type="application/json"]').html();
        return scriptContent || null;
    } catch (error) {
        console.error('请求或解析错误:', error); // 打印请求或解析错误
    }
}

/*
 * 检查直播状态并发送提醒
 * @returns {Promise<void>} - 返回一个 Promise
 */
async function checkLiveStatus() {
    console.log('开始检查直播状态...');
    for (const id of rid) {
        try {
            const url = `${baseUrl}${id}`;
            const response = await ParseHtml(url);

            if (response) {
                // 解析 JSON 数据
                const parsedObject = JSON.parse(response); 
                const data = {
                    rid: parsedObject.pageProps.room.roomInfo.roomInfo.rid,
                    data: {
                        isLive: parsedObject.pageProps.room.roomInfo.roomInfo.isLive,
                        cate2Name: parsedObject.pageProps.room.roomInfo.roomInfo.cate2Name,
                        roomSrc: parsedObject.pageProps.room.roomInfo.roomInfo.roomSrc,
                        avatar: parsedObject.pageProps.room.roomInfo.roomInfo.avatar,
                        nickname: parsedObject.pageProps.room.roomInfo.roomInfo.nickname,
                        hn: parsedObject.pageProps.room.roomInfo.roomInfo.hn,
                        showTime: parsedObject.pageProps.room.roomInfo.roomInfo.showTime,
                        roomName: parsedObject.pageProps.room.roomInfo.roomInfo.roomName,
                    }
                };

                const { isLive, roomName, nickname } = data.data;

                console.log('===============================');
                console.log('主播:', nickname);
                console.log('房间标题：', roomName);
                console.log('直播状态：', isLive);
                console.log('上次状态：', lastStatus[id]);
                console.log('提醒时间戳：', lastAlerts[id]);
                

                // 如果是第一次检查此房间的状态，初始化 lastStatus 和 lastAlerts
                if (!lastStatus[id]) {
                    lastStatus[id] = { isLive: null, roomName: null };
                    lastAlerts[id] = { liveStarted: 0, titleChanged: 0, liveEnded: 0 };
                }

                const previousStatus = lastStatus[id];
                const currentStatus = { isLive, roomName };
                const currentTime = Date.now(); // 当前时间戳

                if (isLive) {
                    // 处理直播开始的提醒
                    if (previousStatus.isLive === 0 && (currentTime - lastAlerts[id].liveStarted > 15 * 1000)) { // 15秒
                        // 直播开始提醒
                        await sendMail('1585543457@qq.com', nickname + '开始直播', roomName);
                        lastAlerts[id].liveStarted = currentTime; // 更新最后一次直播开始提醒时间
                    } 
                } 
                // 处理直播结束的提醒
                else if (previousStatus.isLive === 1 && (currentTime - lastAlerts[id].liveEnded > 15 * 1000)) { // 15秒
                    // 直播结束提醒
                    await sendMail('1585543457@qq.com', nickname + '直播结束', roomName);
                    lastAlerts[id].liveEnded = currentTime; // 更新最后一次直播结束提醒时间
                }

                if (previousStatus.roomName !== roomName && (currentTime - lastAlerts[id].titleChanged > 15 * 1000)) { // 15秒
                    // 标题更改提醒
                    await sendMail('1585543457@qq.com', nickname + '更改标题', roomName);
                    lastAlerts[id].titleChanged = currentTime; // 更新最后一次标题更改提醒时间
                }

                // 更新房间的当前状态
                lastStatus[id] = currentStatus;
                console.log('===============================');
            } else {
                console.warn(`无法获取或解析页面内容: ${url}`);
            }
        } catch (error) {
            console.error('获取或处理直播状态错误:', error); // 打印获取或处理直播状态错误
        }
    }
}

// 每15秒检查一次直播状态
console.log('定时器开始...');
setInterval(() => {
    console.log('定时器触发...');
    checkLiveStatus();
}, 5 * 1000);
