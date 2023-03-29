"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const html_escaper_1 = __importDefault(require("html-escaper"));
const Chaturbate = (extension, callback, debug = false) => {
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
    if (extension.platform === 'Chaturbate') {
        extension.data.forEach((event) => {
            const parseData = event;
            try {
                if (parseData.name.match(/user:tip_alert|room:tip_alert/)) {
                    try {
                        easyData.events.isTokens = true;
                        easyData.tokenCount = parseData.data.amount;
                        if (parseData.data.is_anonymous_tip) {
                            easyData.isAnon = true;
                        }
                        else {
                            easyData.isUser = true;
                            easyData.username = parseData.data.from_username;
                        }
                        easyData.message = html_escaper_1.default.unescape(parseData.data.message);
                        isEasyData = true;
                    }
                    catch (error) {
                        debug && console.log('!!!!!!!!! room:tip_alert !!!!!!!!!');
                        debug && console.log(error);
                        debug && console.log(parseData);
                    }
                }
                if (event.name.match(/room:message/)) {
                    try {
                        easyData.events.isMessage = true;
                        easyData.message = unescape(parseData.data.message);
                        if (parseData.data.from_user.username === extension.modelUsername) {
                            easyData.isModel = true;
                        }
                        else {
                            easyData.isUser = true;
                        }
                        easyData.username = parseData.data.from_user.username;
                        isEasyData = true;
                    }
                    catch (error) {
                        debug && console.log('!!!!!!!!! room:message !!!!!!!!!');
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
        });
    }
};
exports.default = Chaturbate;
