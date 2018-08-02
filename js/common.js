var avChatRoomId = '@TGS#aEWAKBLFM',
    sdkappid = 1400117704,
    accountType = 32646, // accounttype 还是在文档中会找到
    userId,
    commonUserSig,
    username,
    isMaster = false;

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