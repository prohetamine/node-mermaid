"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const html = require('html-escaper');
const xHamsterLive = (extension, callback, debug = false) => {
    let isParseData = false, isEasyData = false;
    const easyData = {
        events: {
            isTokens: false,
            isMessage: false
        },
        isModel: false,
        isUser: false,
        isAnon: false,
        tokenCount: 0,
        message: '',
        username: '',
    };
    if (extension.platform === 'xHamsterLive') {
        try {
            const parseData = JSON.parse(extension.data);
            if (parseData.subscriptionKey.replace(/:\d+/, '') === 'newChatMessage') {
                try {
                    if (parseData.params.message.type === 'tip') {
                        try {
                            easyData.events.isTokens = true;
                            easyData.tokenCount = parseData.params.message.details.amount;
                            if (parseData.params.message.details.body) {
                                easyData.message = html.unescape(parseData.params.message.details.body);
                            }
                            if (parseData.params.message.details.isAnonymous) {
                                easyData.isAnon = true;
                            }
                            else {
                                easyData.isUser = true;
                                easyData.username = parseData.params.message.userData.username;
                            }
                            isEasyData = true;
                        }
                        catch (error) {
                            debug && console.log(`!!!!!!!!! tip !!!!!!!!!`);
                            debug && console.log(error);
                            debug && console.log(parseData);
                        }
                    }
                    if (parseData.params.message.type === 'privateTip') {
                        try {
                            easyData.events.isTokens = true;
                            easyData.tokenCount = parseData.params.message.details.amount;
                            if (parseData.params.message.details.body) {
                                easyData.message = unescape(parseData.params.message.details.body);
                            }
                            if (parseData.params.message.details.isAnonymous) {
                                easyData.isAnon = true;
                            }
                            else {
                                easyData.isUser = true;
                                easyData.username = parseData.params.message.userData.username;
                            }
                            isEasyData = true;
                        }
                        catch (error) {
                            debug && console.log(`!!!!!!!!! privateTip !!!!!!!!!`);
                            debug && console.log(error);
                            debug && console.log(parseData);
                        }
                    }
                    if (parseData.params.message.type === 'text') {
                        try {
                            easyData.events.isMessage = true;
                            if (parseData.params.message.userData.username === extension.modelUsername) {
                                easyData.isModel = true;
                            }
                            else {
                                easyData.isUser = true;
                            }
                            easyData.username = parseData.params.message.userData.username;
                            if (parseData.params.message.details.body) {
                                easyData.message = unescape(parseData.params.message.details.body);
                            }
                            isEasyData = true;
                        }
                        catch (error) {
                            debug && console.log(`!!!!!!!!! text !!!!!!!!!`);
                            debug && console.log(error);
                            debug && console.log(parseData);
                        }
                    }
                }
                catch (error) {
                    debug && console.log(`!!!!!!!!! ${parseData.subscriptionKey} !!!!!!!!!`);
                    debug && console.log(error);
                    debug && console.log(parseData);
                }
            }
            isParseData = true;
            callback({
                isParseData,
                isEasyData,
                easyData,
                parseData,
                extension
            });
        }
        catch (error) {
            callback({
                isParseData,
                isEasyData,
                extension
            });
            debug && console.log(error);
            debug && console.log(extension);
        }
    }
};
exports.default = xHamsterLive;
