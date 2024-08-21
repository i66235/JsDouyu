//直播房间号
const rids = ['63136','71415'] 

const fs = require('fs').promises; 
const cheerio = require('cheerio');
const axios = require('axios');

//将内容写入文件
async function WriteShowData(showroomdata,path) {
    try {
        // 读取现有数据
        let existingData = [];
        try {
            const data = await fs.readFile(path, 'utf8');
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
        await fs.writeFile(path, w, 'utf8');
        //console.log('File has been updated!');
    } catch (err) {
        console.error('Error writing file:', err);
    }
}

//读取文件内容
async function ReadShowData(path) {
    try {
        // 读取文件
        const data = await fs.readFile(path, 'utf8');
        const jsonData = JSON.parse(data);
        //console.log('JSON data:', jsonData);
        return jsonData;
    } catch (err) {
        console.error('Error reading or parsing file:', err);
        return null;
    }
}

//获取房间信息
async function GetRoomData(rid) {
    for (let i = 0; i < rid.length; i++) {
        try {
            const response = await ParseHtml('https://m.douyu.com/' + rid[i]);
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
            
            const logs ={
                rid: parsedObject.pageProps.room.roomInfo.roomInfo.rid,
                sendtime:0
            }
            
            const re = await ReadShowData('MailLog.json');
            const inde = re.findIndex(item => item.rid === data.rid);
            if (inde === -1) {
                await WriteShowData(logs,'MailLog.json');
            }
            console.log('===============================');
            console.log('主播:', data.data.nickname);
            console.log('房间标题：', data.data.roomName);
            console.log('直播状态：', data.data.isLive);
            

            //判断标题是否有更新
            const s = await ReadShowData('RoomData.json');
            const index = s.findIndex(item => item.rid === data.rid);
            if (index !== -1) {
                if(s[index].data.roomName !== data.data.roomName){
                    await sendMail("1585543457@qq.com", data.data.nickname + `更换标题`, data.data.roomName)
                }
            } 

            //判断是否直播
            if(isShowLive(data.data.showTime)){
                if (data.data.isLive === 1) {
                    await sendShow(data.data.nickname,'开始直播',data.data.roomName,data.rid)
                }else{
                    await sendShow(data.data.nickname,'结束直播',data.data.roomName,data.rid)  
                }     
            }
            
            //更新房间数据
            await WriteShowData(data,'RoomData.json');
            console.log('===============================');

        } catch (error) {
            console.error('There was a problem with the request or processing:', error);
        }
    }
}

//发送邮箱提醒并记录发送时间戳至MailLog.json
async function sendShow(nickname,params,roomName,rid) {
    const st = Math.floor(Date.now() / 1000);
    const w = await ReadShowData('MailLog.json');
    const ind = w.findIndex(item => item.rid === rid);

    if (ind !== -1) {
        console.log('消息间隔：',st - w[ind].sendtime);
        //消息发送间隔 300秒
        if(st - w[ind].sendtime > 300 || w[ind].sendtime === 0){
            await sendMail("1585543457@qq.com",nickname + params, roomName)
            const updatedData = w.map(item => 
                item.rid === rid ? { ...item, sendtime: st } : item
            );

            const kw = JSON.stringify(updatedData, null, 2);
            await fs.writeFile('MailLog.json', kw, 'utf8');
        }
    } 
}

async function ParseHtml(url) {
    try {
      // 发起网络请求
      const response = await axios.get(url);
      const html = response.data;
      
      // 解析 HTML
      const $ = cheerio.load(html);
  
      // 使用 cheerio 查找指定 id 的 script 元素
      const scriptContent = $('#vike_pageContext[type="application/json"]').html();
      
      
      return scriptContent || null;
    } catch (error) {
      console.error('请求或解析错误:', error);
    }
  }


//判断开播时间戳是否小于30
function isShowLive(t) {
    const s = Math.floor(Date.now() / 1000);
    const result = formatTime(s - t);
    console.log(`开播时长：${result}`,);
    
    return s - t < 100
}

//时间转换
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    // 构建时间字符串
    let timeString = '';
    
    if (hours > 0) {
      timeString += `${hours}小时`;
    }
    
    if (minutes > 0 || hours > 0) { // 只有在小时存在时，分钟为0也要显示
      timeString += `${minutes}分钟`;
    }
    
    // 直接显示秒数
    timeString += `${remainingSeconds}秒`;
    
    return timeString.trim();
  }

/*
 * 通过GET API接口 发送邮箱
 * @param {邮箱地址} mailTo 
 * @param {邮箱标题} subject 
 * @param {邮箱内容} content 
 * @returns 
 */
async function sendMail(mailTo, subject, content) {
    const url = `http://142.171.168.137:41908/mail_sys/send_mail_http.json?mail_from=email@pliv.cc&password=Yuange123&mail_to=${mailTo}&subject=${subject}&content=${content}&subtype=`;
    fetch(url)
        .then(response => {
            if (!response.ok) {
            // 如果响应状态码不是 2xx，抛出错误
            throw new Error(`网络响应不成功: ${response.status} ${response.statusText}`);
            }
            return response.json(); // 解析 JSON 响应
        })
        .then(data => {
            console.log('邮箱状态:', data); // 处理获取的数据
        })
        .catch(error => {
            console.error('邮箱状态:', error); // 处理错误
        });

}


//房间数组
GetRoomData(rids);
