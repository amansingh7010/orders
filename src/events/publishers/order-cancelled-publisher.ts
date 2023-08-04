import { Publisher, Subjects, OrderCancelledEvent } from '@asinghs/common';

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;
}
