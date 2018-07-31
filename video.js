var FetchSigCgi = 'https://sxb.qcloud.com/sxb_dev/?svc=account&cmd=authPrivMap';
var sdkappid = 1400037025,
    userid = 10010,
    roomid = 111911,
    accountType = 14418,
    closeLocalMedia = false,
    userSig,
    privateMapKey;

$(function () {
    $.ajax({
        type: "POST",
        url: FetchSigCgi,
        dataType: 'json',
        data: JSON.stringify({
            pwd: "12345678",
            appid: parseInt(sdkappid),
            roomnum: parseInt(roomid),
            privMap: 255,
            identifier: userid,
            accounttype: accountType
        }),
        success: function (json) {
            if (json && json.errorCode === 0) {
                //一会儿进入房间要用到
                userSig = json.data.userSig;
                privateMapKey = json.data.privMapEncrypt;

                initRTC({
                    "userId": userid,
                    "userSig": userSig,
                    "privateMapKey": privateMapKey,
                    "sdkappid": sdkappid,
                    "accountType": accountType,
                    "closeLocalMedia": closeLocalMedia,
                    "roomid": roomid
                });

            } else {
                console.error(json);
            }
        },
        error: function (err) {
            console.error(err);
        }
    });


});

function initRTC(opts) {
    // 初始化
    window.RTC = new WebRTCAPI({
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


    //本地流 新增
    RTC.on("onLocalStreamAdd", function(data){
        if( data && data.stream){

            document.querySelector("#localVideo").srcObject = data.stream;
        }
    });
    //远端流 新增/更新
    RTC.on("onRemoteStreamUpdate", function(data){
        if( data && data.stream){
            document.querySelector("#remoteVideo").srcObject = data.stream;
        }
    });
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

