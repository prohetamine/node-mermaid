"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const express = require('express'), app = express(), http = require('http'), cors = require('cors'), server = http.createServer(app), { Server } = require('socket.io'), sleep = require('sleep-promise'), availablePlatforms = require('./parser/available-platforms');
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
let dataCallback = () => { }, statusCallback = () => { };
const sites = {};
let sitesTimeId = null;
const proxySites = new Proxy(sites, {
    set: (target, key, value) => {
        if (target[key] !== value) {
            target[key] = value;
            const sendStatus = () => {
                const normalizeStatus = Object.keys(target).map(key => ({
                    platform: key,
                    online: target[key]
                }));
                statusCallback(normalizeStatus);
            };
            sendStatus();
            if (sitesTimeId !== null) {
                clearInterval(sitesTimeId);
            }
            sitesTimeId = setInterval(sendStatus, 5000);
        }
        return true;
    }
});
io.on('connection', (socket) => {
    const platform = socket.handshake.query.platform;
    proxySites[platform] = true;
    socket.join('extension');
    socket.on('output', (data) => {
        const parsedData = JSON.parse(data);
        proxySites[parsedData.platform] = true;
        dataCallback(parsedData);
    });
    socket.on('disconnect', () => {
        proxySites[platform] = false;
    });
});
module.exports = {
    ready: () => new Promise(res => server.listen(6767, res)),
    on: (type, callback) => {
        if (type === 'status') {
            statusCallback = callback;
        }
        if (type === 'data') {
            dataCallback = callback;
        }
    },
    availablePlatforms,
    sendMessage: (platform, text, delay = 700) => __awaiter(void 0, void 0, void 0, function* () {
        yield sleep(delay);
        io.to('extension').emit('input', {
            platform,
            text
        });
    }),
    sendMessages: (platform, texts, delay = 700) => __awaiter(void 0, void 0, void 0, function* () {
        for (let i = 0; i < texts.length; i++) {
            yield sleep(delay);
            io.to('extension').emit('input', {
                platform,
                text: texts[i]
            });
        }
    })
};
