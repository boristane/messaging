import AWS, { SNS } from "aws-sdk";

const sleep = (time: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time);
  });
}

export class Messaging {
  private region: string;
  private topicArn: string;
  private endpoint: string;
  private producer: SNS;
  private source: string;
  private static instance: Messaging;

  private constructor(configuration: MessagingConfiguration) {
    this.region = configuration.region;
    this.topicArn = configuration.topicArn;
    this.endpoint = configuration.endpoint || "";
    this.source = configuration.source;

    if (!this.endpoint) {
      this.producer = new SNS({
        region: this.region,
      });
    } else {
      setAWSCredentials();
      this.producer = new SNS({
       region: this.region,
        endpoint: this.endpoint,
      });
    }
  }

  public static getInstance(configuration?: MessagingConfiguration): Messaging {
    if (!Messaging.instance && configuration) {
      Messaging.instance = new Messaging(configuration);
    }
    return Messaging.instance;
}

  private buildEvent(payload: INotificationPayload): INotificationEvent {
    return {
      type: payload.type,
      created: (new Date()).toISOString(),
      source: this.source,
      payload,
      correlationId: payload.correlationId,
      version: 1
    }
  }

  async publish(payload: INotificationPayload) {
    let isSent = false;
    const maxTries = 4;
    let tryCount = 0;
    let error;
    while(!isSent && tryCount < maxTries) {
      try {
        const messageId = await this.producer.publish({
          Message: JSON.stringify(this.buildEvent(payload)),
          TopicArn: this.topicArn,
          MessageAttributes: {
            eventSource: {
              DataType: "String",
              StringValue: this.source,
            },
            eventType: {
              DataType: "String",
              StringValue: payload.type
            }
          }
        }).promise();
        isSent = true;
        if (isSent) return;
      } catch (err) {
        error = err;
        tryCount += 1;
        await sleep(2000);
        continue;
      }
    }
    const data = {
      region: this.region,
      topicArn: this.topicArn,
      endpoint: this.endpoint,
      source: this.source,
      payload,
    }
    throw new Error(`Failed sending notification to messaging system. data: ${JSON.stringify(data)}; error: ${error}`);
  }
}


function setAWSCredentials() {
  // This is used in local dev only, as both in prod and uat the credentials are from the task definition
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });
}

export interface INotificationPayload {
  type: string;
  data: object;
  correlationId: string;
}

export interface INotificationEvent {
  type: string,
  created: string,
  source: string,
  version: number,
  payload: object,
  correlationId: string,
}

export interface MessagingConfiguration {
  region: string,
  topicArn: string,
  source: string,
  endpoint?: string,
}