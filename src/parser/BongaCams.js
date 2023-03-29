"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const html_escaper_1 = __importDefault(require("html-escaper"));
const BongaCams = (extension, callback, debug = false) => {
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
    if (extension.platform === 'BongaCams') {
        try {
            const parseData = JSON.parse(extension.data);
            if (parseData.type === 'ServerMessageEvent:CHAT_INCOMING_MESSAGE') {
                try {
                    easyData.events.isMessage = true;
                    easyData.message = html_escaper_1.default.unescape(parseData.body.message);
                    if (parseData.body.author.username === extension.modelUsername) {
                        easyData.isModel = true;
                    }
                    else {
                        easyData.isUser = true;
                    }
                    easyData.username = parseData.body.author.username;
                    isEasyData = true;
                }
                catch (error) {
                    debug && console.log('!!!!!!!!! ServerMessageEvent:CHAT_INCOMING_MESSAGE !!!!!!!!!');
                    debug && console.log(error);
                    debug && console.log(parseData);
                }
            }
            if (parseData.type === 'ServerMessageEvent:INCOMING_TIP') {
                try {
                    easyData.events.isTokens = true;
                    easyData.tokenCount = parseData.body.a;
                    if (parseData.body.f.message) {
                        easyData.message = unescape(parseData.body.f.message);
                    }
                    if (parseData.body.f.hasProfile) {
                        if (parseData.body.f.username !== extension.modelUsername) {
                            easyData.isUser = true;
                        }
                        else {
                            easyData.isModel = true;
                        }
                        easyData.username = parseData.body.f.username;
                    }
                    else {
                        easyData.isAnon = true;
                    }
                    isEasyData = true;
                }
                catch (error) {
                    debug && console.log('!!!!!!!!! ServerMessageEvent:INCOMING_TIP !!!!!!!!!');
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
exports.default = BongaCams;
