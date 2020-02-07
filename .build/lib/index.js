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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importStar(require("aws-sdk"));
const sleep = (time) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, time);
    });
};
class NotificationService {
    constructor(configuration) {
        this.region = configuration.region;
        this.topicArn = configuration.topicArn;
        this.endpoint = configuration.endpoint || "";
        this.source = configuration.source;
        if (!this.endpoint) {
            this.producer = new aws_sdk_1.SNS({
                region: this.region,
            });
        }
        else {
            setAWSCredentials();
            this.producer = new aws_sdk_1.SNS({
                region: this.region,
                endpoint: this.endpoint,
            });
        }
    }
    buildEvent(payload) {
        return {
            type: payload.type,
            created: (new Date()).toISOString(),
            source: this.source,
            payload,
            correlationId: payload.correlationId,
            version: 1
        };
    }
    publish(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            let isSent = false;
            const maxTries = 4;
            let tryCount = 0;
            while (!isSent && tryCount < maxTries) {
                try {
                    const messageId = yield this.producer.publish({
                        Message: JSON.stringify(this.buildEvent(payload)),
                        TopicArn: this.topicArn,
                        MessageAttributes: {
                            eventSource: {
                                DataType: "string",
                                StringValue: this.source,
                            },
                            eventType: {
                                DataType: "string",
                                StringValue: payload.type
                            }
                        }
                    }).promise();
                    isSent = true;
                }
                catch (err) {
                    tryCount += 1;
                    yield sleep(2000);
                    continue;
                }
            }
            throw new Error("Failed sending notification to messaging system.");
        });
    }
}
exports.NotificationService = NotificationService;
function setAWSCredentials() {
    // This is used in local dev only, as both in prod and uat the credentials are from the task definition
    aws_sdk_1.default.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
}
//# sourceMappingURL=index.js.map