"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Chaturbate_1 = __importDefault(require("./Chaturbate"));
const xHamsterLive_1 = __importDefault(require("./xHamsterLive"));
const Stripchat_1 = __importDefault(require("./Stripchat"));
const BongaCams_1 = __importDefault(require("./BongaCams"));
const available_platforms_1 = __importDefault(require("./available-platforms"));
module.exports = {
    availablePlatforms: available_platforms_1.default,
    Chaturbate: Chaturbate_1.default,
    xHamsterLive: xHamsterLive_1.default,
    Stripchat: Stripchat_1.default,
    BongaCams: BongaCams_1.default
};
