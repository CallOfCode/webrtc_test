var FetchSigCgi = 'https://sxb.qcloud.com/sxb_dev/?svc=account&cmd=authPrivMap';
var sdkappid,
    accountType = 14418, // accounttype 还是在文档中会找到
    userId,
    userSig,
    username,
    isMaster = false;


$("#userId").val("video_" + parseInt(Math.random() * 100000000));

Bom = {
    /**
     * @description 读取location.search
     *
     * @param {String} n 名称
     * @return {String} search值
     * @example
     * 		$.bom.query('mod');
     */
    query: function (n) {
        var m = window.location.search.match(new RegExp("(\\?|&)" + n + "=([^&]*)(&|$)"));
        return !m ? "" : decodeURIComponent(m[2]);
    },
    getHash: function (n) {
        var m = window.location.hash.match(new RegExp("(#|&)" + n + "=([^&]*)(&|$)"));
        return !m ? "" : decodeURIComponent(m[2]);
    }
};

function login(closeLocalMedia,ismaster) {
    isMaster = ismaster;
    sdkappid = Bom.query("sdkappid") || $("#sdkappid").val();
    userId = (isMaster?"master_":"joiner_")+$("#userId").val();
    //请使用英文半角/数字作为用户名
    $.ajax({
        type: "POST",
        url: FetchSigCgi,
        dataType: 'json',
        data: JSON.stringify({
            pwd: "12345678",
            appid: parseInt(sdkappid),
            roomnum: parseInt($("#roomid").val()),
            privMap: 255,
            identifier: userId,
            accounttype: accountType
        }),
        success: function (json) {
            if (json && json.errorCode === 0) {
                //一会儿进入房间要用到
                var userSig = json.data.userSig;
                var privateMapKey = json.data.privMapEncrypt;
                // 页面处理，显示视频流页面
                $("#video-section").show();
                $("#input-container").hide();

                initRTC({
                    "userId": userId,
                    "userSig": userSig,
                    "privateMapKey": privateMapKey,
                    "sdkappid": sdkappid,
                    "accountType": accountType,
                    "closeLocalMedia": closeLocalMedia,
                    "roomid": $("#roomid").val()
                });

            } else {
                console.error(json);
            }
        },
        error: function (err) {
            console.error(err);
        }
    })
}

function initRTC(opts) {
    window.RTC = new WebRTCAPI({
        useCloud: 1, //是否使用云上环境
        userId: opts.userId,
        userSig: opts.userSig,
        sdkAppId: opts.sdkappid,
        accountType: opts.accountType,
        wsRetryMaxTimes: 5, //最大重连次数
        wsRetryDist: 3000 //毫秒 ，首次间隔3000毫秒， 第N次重连间隔 为 N * DIST （ 2 * 3000）
    }, function () {
        RTC.createRoom({
            roomid: opts.roomid * 1,
            privateMapKey: opts.privateMapKey,
            role: "user"
        }, function (info) {
            console.warn("init succ", info)
        }, function (error) {
            console.error("init error", error)
        });
    }, function (error) {
        console.warn("init error", error)
    });

    // 远端流新增/更新
    RTC.on("onRemoteStreamUpdate", onRemoteStreamUpdate)
    // 本地流新增
    RTC.on("onLocalStreamAdd", onLocalStreamAdd)
    // 远端流断开
    RTC.on("onRemoteStreamRemove", onRemoteStreamRemove)
    // 重复登录被T
    RTC.on("onKickout", onKickout)
    // 服务器超时
    RTC.on("onRelayTimeout", onRelayTimeout)
    // just for debugging
    // RTC.on("*",function(e){
    //     console.debug(e)
    // });
    RTC.on("onErrorNotify", function (info) {
        console.warn(info)
    });
    RTC.on("onStreamNotify", function (info) {
        console.warn('onStreamNotify', info)
    });
    RTC.on("onWebSocketNotify", function (info) {
        console.warn('onWebSocketNotify', info)
    });
    RTC.on("onUserDefinedWebRTCEventNotice", function (info) {
        // console.error( 'onUserDefinedWebRTCEventNotice',info )
    });
}

function onLocalStreamAdd(info) {
    if($("#user"+userId).length<=0){
        $("#users").append("<li id='user"+userId+"'>"+userId+"</li>");
    }
    if (info.stream && info.stream.active === true) {
        if(isMaster){
            var id = 'master';
            videoHtml = '<video id="' + id + '" autoplay muted playsinline ></video>';
            $("#mVideo").html(videoHtml);
            var video = document.querySelector("#"+id);
            video.srcObject = info.stream;
        }else{
            for(var i=1;i<=4;i++){
                if($("#sVideo"+i).html()==''){
                    var id = 'joiner'+i;
                    videoHtml = '<video id="' + id + '" autoplay muted playsinline ></video>';
                    $("#sVideo"+i).html(videoHtml);
                    var video = document.querySelector("#"+id);
                    video.srcObject = info.stream;
                    video.muted = true
                    video.autoplay = true
                    video.playsinline = true
                    break;
                }else{
                    continue;
                }
            }
        }
    }
}

function onRemoteStreamUpdate(info){
    var userId = info.userId;
    if($("#user"+userId).length<=0){
        $("#users").append("<li id='user"+userId+"'>"+userId+"</li>");
    }

    if(info.userId.indexOf("master")!=-1){
        var id = 'master';
        videoHtml = '<video id="' + id + '" autoplay playsinline ></video>';
        $("#mVideo").html(videoHtml);
        var video = document.querySelector("#"+id);
        video.srcObject = info.stream;
    }else{
        if($("."+info.videoId).length>0){
            console.log(info.videoId+"已经存在")
        }else{
            for(var i=1;i<=4;i++){
                if($("#sVideo"+i).html()==''){
                    var id = 'joiner'+i;
                    videoHtml = '<video id="' + id + '" class="'+info.videoId+'" autoplay playsinline ></video>';
                    $("#sVideo"+i).html(videoHtml);
                    var video = document.querySelector("#"+id);
                    video.srcObject = info.stream;
                    break;
                }else{
                    continue;
                }
            }
        }
    }
}

function onRemoteStreamRemove(info) {
    if($("#user"+info.userId).length>0){
        $("#user"+info.userId).remove();
    }

    console.log(info.userId + ' 断开了连接');
    console.log(info.videoId +":" + info.userId);
}

function onKickout() {
    alert("on kick out!");
}

function onRelayTimeout(msg) {
    alert("onRelayTimeout!" + (msg ? JSON.stringify(msg) : ""));
}




