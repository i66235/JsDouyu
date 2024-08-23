// 引入 axios 模块
const axios = require('axios');

const rids = ['63136','71415','3168536']

async function getdata(rid) {
    try{
        for (let i = 0; i < rid.length; i++) {
            // 定义请求的 URL
            const apiUrl = 'https://www.douyu.com/betard/' + rid[i];
            const res = await axios.get(apiUrl)
            console.log(res.data.room);
            
            const roomData ={
                roomName: res.data.room.room_name, //标题
                showTime: res.data.room.show_time, //开播时间
                endTime: res.data.room.end_time, //下播时间
                nickname: res.data.room.nickname, //名字
                nowtime: res.data.room.nowtime, //现在时间
                roompic: res.data.room.room_pic, //直播封面
                avatar: res.data.room.owner_avatar,//头像
            }

            console.log('Nickname:', roomData.nickname);
            console.log('Room Name:', roomData.roomName);
            console.log('Show Time:', roomData.showTime);
            console.log('End Time:', roomData.endTime);
            console.log('nowtime:', roomData.nowtime);
            console.log('islive:', roomData.endTime > roomData.nowtime);
            console.log('------------------------------------');
        }
        

    }catch(error){
        console.log('获取失败：', error);
    }

}

getdata(rids)