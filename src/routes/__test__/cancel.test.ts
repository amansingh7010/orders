import request from 'supertest';

import { app } from '../../app';
import { Ticket } from '../../models/ticket';
import { Order, OrderStatus } from '../../models/order';
import { natsWrapper } from '../../nats-wrapper';

it('mark an order as cancelled', async () => {
  // Create a ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 200,
  });
  await ticket.save();

  const user = global.getAuthCookie();
  // make a request to create an order with this ticket
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({ ticketId: ticket.id })
    .expect(201);

  // make a request to cancel the order
  await request(app)
    .patch(`/api/orders/${order.id}`)
    .set('Cookie', user)
    .send()
    .expect(200);

  // make sure that the order status was updated to cancelled
  const updatedOrder = await Order.findById(order.id);
  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('returns an error if one user tries to cancel other user order', async () => {
  // Create a ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 200,
  });
  await ticket.save();

  const user = global.getAuthCookie();
  // make a request to build an order with this ticket
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({ ticketId: ticket.id })
    .expect(201);

  // make request to fetch the order
  await request(app)
    .patch(`/api/orders/${order.id}`)
    .set('Cookie', global.getAuthCookie())
    .send()
    .expect(401);
});

it('emits a order cancelled event', async () => {
  // Create a ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 200,
  });
  await ticket.save();

  const user = global.getAuthCookie();
  // make a request to create an order with this ticket
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', user)
    .send({ ticketId: ticket.id })
    .expect(201);

  // make a request to cancel the order
  await request(app)
    .patch(`/api/orders/${order.id}`)
    .set('Cookie', user)
    .send()
    .expect(200);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
