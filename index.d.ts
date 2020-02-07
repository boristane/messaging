export class Messaging {
  constructor(configuration: MessagingConfiguration)
  publish(payload: INotificationPayload): Promise<void>;
  static getInstance(configuration?: MessagingConfiguration): Messaging;
}

export interface INotificationPayload {
  type: string;
  data: object;
  correlationId: string;
}

export interface MessagingConfiguration {
  region: string,
  topicArn: string,
  source: string,
  endpoint?: string,
}