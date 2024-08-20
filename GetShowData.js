const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises; // 使用 fs.promises 处理异步文件操作
const http = require('http');

async function WriteShowData(showroomdata) {
    try {
        // 读取现有数据
        let existingData = [];
        try {
            const data = await fs.readFile('RoomData.json', 'utf8');
            existingData = JSON.parse(data);
        } catch (err) {
            // 如果文件不存在或读取失败，返回空数组
            console.warn('No existing data found or error reading file.');
        }

        // 查找要更新的对象
        const index = existingData.findIndex(item => item.rid === showroomdata.rid);

        if (index !== -1) {
            // 更新现有对象
            existingData[index] = showroomdata;
        } else {
            // 添加新对象
            existingData.push(showroomdata);
        }

        // 写入更新后的数据
        const w = JSON.stringify(existingData, null, 2);
        await fs.writeFile('RoomData.json', w, 'utf8');
        console.log('File has been updated!');
    } catch (err) {
        console.error('Error writing file:', err);
    }
}




async function ReadShowData() {
    try {
        // 读取文件
        const data = await fs.readFile('RoomData.json', 'utf8');
        const jsonData = JSON.parse(data);
        console.log('JSON data:', jsonData);
        return jsonData;
    } catch (err) {
        console.error('Error reading or parsing file:', err);
        return null;
    }
}

async function GetRoomData(rid) {
    for (let i = 0; i < rid.length; i++) {
        try {
            const response = await axios.get('https://m.douyu.com/' + rid[i]);
            const $ = cheerio.load(response.data);
            const content = $('#vike_pageContext').html();
            const parsedObject = JSON.parse(content);

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

            console.log(parsedObject.pageProps.room.roomInfo.roomInfo);
            await WriteShowData(data);
            const s = await ReadShowData();
            console.log("Updated Data:", s);
            await sendMail("1585543457@qq.com",'55','123')
            
        } catch (error) {
            console.error('There was a problem with the request or processing:', error);
        }
    }
}

function isShowLive(t) {
    const s = Math.floor(Date.now() / 1000);
    return s > t;
}

/*
 * 
 * @param {邮箱地址} mailTo 
 * @param {邮箱标题} subject 
 * @param {邮箱内容} content 
 * @returns 
 */
async function sendMail(mailTo, subject, content) {

    const data = JSON.stringify({
        mail_from: 'email@pliv.cc',
        password: 'Yuange123',
        mail_to: mailTo,
        subject: subject,
        content: content,
        subtype: null
    });

    const options = {
        hostname: '142.171.168.137',
        port: 41908,
        path: '/mail_sys/send_mail_http.json',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      };

      const req = http.request(options, (res) => {
        let responseBody = '';

        res.on('data', (chunk) => {
            responseBody += chunk;
          });

        res.on('end', () => {
        console.log('响应内容:', responseBody);
        });
        
      })
      // 发送请求数据
      req.write(data);
      req.end();
    
}

GetRoomData(['63136', '71415']);
