import {
  Subjects,
  Listener,
  PaymentCreatedEvent,
  OrderStatus,
} from '@asinghs/common';
import { Message } from 'node-nats-streaming';

import { QUEUE_GROUP_NAME } from './queue-group-name';
import { Order } from '../../models/order';

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
  readonly subject = Subjects.PaymentCreated;
  queueGroupName = QUEUE_GROUP_NAME;

  async onMessage(data: PaymentCreatedEvent['data'], msg: Message) {
    const order = await Order.findById(data.orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    order.set({
      status: OrderStatus.Complete,
    });
    await order.save();

    // should emit order updated event and update version

    msg.ack();
  }
}
