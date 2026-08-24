import { model, models, Schema, Types, type HydratedDocument } from "mongoose";
import { Event } from "./event.model";

export interface Booking {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<Booking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  },
  { timestamps: true },
);

bookingSchema.index({ eventId: 1 });

bookingSchema.pre("save", async function (this: HydratedDocument<Booking>) {
  // Check the reference before saving so bookings cannot target missing events.
  const eventExists = await Event.exists({ _id: this.eventId });
  if (!eventExists) {
    throw new Error(`Event ${this.eventId.toString()} does not exist`);
  }
});

export const Booking = models.Booking ?? model<Booking>("Booking", bookingSchema);
