import { NotificationServiceConfiguration, INotificationPayload } from "./lib";

export class Notification {
  constructor(configuration: NotificationServiceConfiguration)
  publish(payload: INotificationPayload): Promise<void>;
}