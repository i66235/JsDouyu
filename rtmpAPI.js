const { default: axios } = require('axios');
const cheerio = require('cheerio');
const vm = require('vm');
const CryptoJS = require('crypto-js');  // 引入 CryptoJS 模块


async function rtmpdouyu(rid) {
    try {
        const h = parseInt((new Date).getTime() / 1e3, 10);
        const did = await grtdid();
        const sw = await fetchAndExecuteMethod('https://www.douyu.com/'+String(rid), 'ub98484234', rid, did, h);
        const a = await fetchData(sw,rid)
        return  a
            
    } catch (error) {
        console.error('获取 did 失败:', error);
    }
}


async function fetchAndExecuteMethod(url, methodName, intParam1, strParam, intParam2) {
    try {
        // 获取 HTML 内容
        const response = await axios.get(url, { maxRedirects: 0 });
        const html = response.data;
        
        // 加载 HTML 到 cheerio
        const $ = cheerio.load(html);

        // 查找所有 <script> 标签
        const scripts = $('script[type="text/javascript"]');

        let scriptContent = null;

        // 遍历前 12 个 <script> 标签
        for (let i = 0; i < Math.min(scripts.length, 12); i++) {
            const currentScriptContent = scripts.eq(i).html();
            if (currentScriptContent.includes('vdwdae325w_64we')) {
                scriptContent = currentScriptContent;
                break; // 找到目标脚本后停止遍历
            }
        }

        if (scriptContent) {
            // 创建一个新的 VM 上下文
            const context = vm.createContext({
                CryptoJS  // 将 CryptoJS 暴露到 VM 上下文中
            });

            // 执行脚本
            const script = new vm.Script(scriptContent);
            script.runInContext(context);
            
            // 调用特定方法并传递参数
            if (typeof context[methodName] === 'function') {
                const result = context[methodName](intParam1, strParam, intParam2);
                //console.log(`生成sign:`, result);
                //console.log("==================================================================");
                
                return result; // 返回结果
            } else {
                console.log(`Method ${methodName} is not defined in the script.`);
                return null; // 方法未定义时返回 null
            }
        } else {
            console.log('未找到包含 "vdwdae325w_64we" 的脚本。');
            return null; // 如果未找到目标脚本，返回 null
        }
    } catch (error) {
        // 如果遇到重定向（status code 3xx），捕获错误并提取重定向 URL
        if (error.response && error.response.status >= 300 && error.response.status < 400) {
            const redirectUrl = error.response.headers.location;
            //console.log('重定向的URL:', 'https://www.douyu.com/' + redirectUrl);
            // 递归调用 fetchAndExecuteMethod 处理重定向后的 URL
            return await fetchAndExecuteMethod('https://www.douyu.com/' + redirectUrl, methodName, intParam1, strParam, intParam2);
        } else {
            console.error('Error fetching URL:', error);
            throw error; // 抛出错误以便调用者可以处理
        }
    }
}

// 发送POST请求
async function fetchData(p,rid) {
    try { 
        // 请求头信息
        const headers = {
            "accept": "application/json, text/plain, */*",
            "accept-language": "zh-CN,zh;q=0.9",
            "content-type": "application/x-www-form-urlencoded",
        };
        const url = "https://www.douyu.com/lapi/live/getH5Play/" + String(rid);
        const res = await axios.post(url,p,headers);
        if(res.data.msg === 'ok'){
            //console.log("rtmp直播流: ",res.data.data.rtmp_url + "/" + res.data.data.rtmp_live);
            //console.log("==================================================================");
            return res.data.data.rtmp_url + "/" + res.data.data.rtmp_live
        }else{
            return res.data.msg
            //console.log(res.data.msg);
        }

    } catch (error) {
        console.log(error);
    }
}

async function grtdid() {
    try{
        const headers = {"Referer": "https://www.douyu.com"}
        const randomnum = Math.floor(Math.random() * (1000000 - 0 + 1)) + 0
        const res = await axios.get("https://passport.douyu.com/lapi/did/api/get?client_id=1&callback=" + randomnum, {headers})
        
        const responseString = res.data.trim()
        const match = responseString.match(/^\d+\((.*)\)$/);       
        if (match) {
            // 提取 JSON 字符串
            const jsonString = match[1];
            try {
                // 解析 JSON
                const responseObject = JSON.parse(jsonString);
                //console.log("==================================================================");
                //console.log('生成did:',responseObject.data.did);
                //console.log("==================================================================");
                
                return responseObject.data.did;
            } catch (e) {
                console.error('JSON 解析错误:', e);
            }
        } else {
            console.error('无法匹配到 JSON 部分');
        }


    }catch(error){
        console.log(error);
        
    }
}



module.exports = rtmpdouyu;