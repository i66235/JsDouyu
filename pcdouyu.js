// 引入 axios 模块
const axios = require('axios');
const rtmpdouyu = require('./rtmpAPI.js')

const rids = ['63136','3168536','71415','6822146']

async function getdata(rid) {
    try{
        for (let i = 0; i < rid.length; i++) {
            // 定义请求的 URL
            const apiUrl = 'https://www.douyu.com/betard/' + rid[i];
            const res = await axios.get(apiUrl)
            //console.log(res.data.room);
            const rtmp = await rtmpdouyu(rid[i])
            
            const roomData ={
                roomName: res.data.room.room_name, //标题
                showTime: res.data.room.show_time, //开播时间
                endTime: res.data.room.end_time, //下播时间
                nickname: res.data.room.nickname, //名字
                nowtime: res.data.room.nowtime, //现在时间
                roompic: res.data.room.room_pic, //直播封面
                avatar: res.data.room.owner_avatar,//头像
                rtmp: rtmp,
            }

            console.log('[主播名称]:', roomData.nickname);
            console.log('[房间标题]:', roomData.roomName);
            console.log('[开播时间]:', roomData.showTime);
            console.log('[结束时间]:', roomData.endTime);
            console.log('[当前时间]:', roomData.nowtime);
            console.log('[是否直播]:', roomData.endTime > roomData.nowtime);
            console.log('[rtmp直播流]:', rtmp);
            console.log('------------------------------------------------------------------------');

        }
        

    }catch(error){
        console.log('获取失败：', error);
    }

}

getdata(rids)
