import mongoose from 'mongoose';

import { Order, OrderStatus } from './order';

// Interface that describes the properties
// required to create a new Ticket
interface TicketAttrs {
  id: string;
  title: string;
  price: number;
}

// Interface that describes the properties
// that a Ticket Document has
export interface TicketDoc extends mongoose.Document {
  title: string;
  price: number;
  version: number;
  isReserved(): Promise<boolean>;
}

// Interface that describes the properties
// a Ticket model has
interface TicketModel extends mongoose.Model<TicketDoc> {
  build(attrs: TicketAttrs): TicketDoc;
  findByIdAndPreviousVersion(event: {
    id: string;
    version: number;
  }): Promise<TicketDoc | null>;
}

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

ticketSchema.set('versionKey', 'version');

// function keyword is required
// Optimistic concurrency control
// prevent previous versions of a document from being saved over the current version.
ticketSchema.pre('save', function (done) {
  this.$where = {
    version: this.get('version') - 1,
  };

  done();
});

ticketSchema.statics.build = (attrs: TicketAttrs) => {
  return new Ticket({
    _id: attrs.id,
    title: attrs.title,
    price: attrs.price,
  });
};

ticketSchema.statics.findByIdAndPreviousVersion = (event: {
  id: string;
  version: number;
}) => {
  return Ticket.findOne({
    _id: event.id,
    version: event.version - 1,
  });
};

// function keyword is required
ticketSchema.methods.isReserved = async function () {
  // Run query to look at all orders. Find an order where the
  // ticket is the ticket we just found and the order status is
  // not cancelled. If we find the order that means the ticket is reserved
  const existingOrder = await Order.findOne({
    // this === ticket document that we just called `isReserved` on.
    ticket: this,
    status: {
      $in: [
        OrderStatus.Created,
        OrderStatus.AwaitingPayment,
        OrderStatus.Complete,
      ],
    },
  });

  return !!existingOrder;
};

const Ticket = mongoose.model<TicketDoc, TicketModel>('Ticket', ticketSchema);

export { Ticket };
