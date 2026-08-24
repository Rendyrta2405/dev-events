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

async function validateEventReference(eventId: Types.ObjectId | undefined): Promise<void> {
  if (eventId === undefined) return;

  const eventExists = await Event.exists({ _id: eventId });
  if (!eventExists) {
    throw new Error(`Event ${eventId.toString()} does not exist`);
  }
}

bookingSchema.pre("save", async function (this: HydratedDocument<Booking>) {
  await validateEventReference(this.eventId);
});

bookingSchema.pre("insertMany", async function (docs: Array<Booking>) {
  await Promise.all(docs.map((doc) => validateEventReference(doc.eventId)));
});

function getEventIdFromUpdate(update: Record<string, unknown>): Types.ObjectId | undefined {
  const eventId =
    update.eventId ??
    (update.$set as Record<string, unknown> | undefined)?.eventId ??
    (update.$setOnInsert as Record<string, unknown> | undefined)?.eventId;
  return eventId as Types.ObjectId | undefined;
}

function getEventIdFromUpdateOrPipeline(
  update: Record<string, unknown> | Array<Record<string, unknown>>,
): Types.ObjectId | undefined {
  if (Array.isArray(update)) {
    let eventId: Types.ObjectId | undefined;
    for (const stage of update) {
      const stageEventId =
        (stage.$set as Record<string, unknown> | undefined)?.eventId ??
        (stage.$addFields as Record<string, unknown> | undefined)?.eventId;
      if (stageEventId !== undefined) eventId = stageEventId as Types.ObjectId;
    }
    return eventId;
  }

  return getEventIdFromUpdate(update);
}

function getEventIdFromFilter(filter: Record<string, unknown>): Types.ObjectId | undefined {
  return filter.eventId as Types.ObjectId | undefined;
}

bookingSchema.pre(
  ["findOneAndUpdate", "updateOne", "updateMany", "findOneAndReplace", "replaceOne"],
  async function () {
    const update = this.getUpdate();
    const updateEventId = update
      ? getEventIdFromUpdateOrPipeline(update as Record<string, unknown> | Array<Record<string, unknown>>)
      : undefined;
    const filterEventId = this.getOptions().upsert
      ? getEventIdFromFilter(this.getQuery() as Record<string, unknown>)
      : undefined;
    await validateEventReference(updateEventId ?? filterEventId);
  },
);

bookingSchema.pre("bulkWrite", async function (operations) {
  for (const operation of operations) {
    if ("insertOne" in operation) {
      await validateEventReference(operation.insertOne.document.eventId);
    } else if ("replaceOne" in operation) {
      const replacementEventId = operation.replaceOne.replacement.eventId;
      const filterEventId = operation.replaceOne.upsert
        ? getEventIdFromFilter(operation.replaceOne.filter as Record<string, unknown>)
        : undefined;
      await validateEventReference(replacementEventId ?? filterEventId);
    } else if ("updateOne" in operation || "updateMany" in operation) {
      const updateOperation = "updateOne" in operation ? operation.updateOne : operation.updateMany;
      const updateEventId = updateOperation.update
        ? getEventIdFromUpdateOrPipeline(
            updateOperation.update as Record<string, unknown> | Array<Record<string, unknown>>,
          )
        : undefined;
      const filterEventId = updateOperation.upsert
        ? getEventIdFromFilter(updateOperation.filter as Record<string, unknown>)
        : undefined;
      await validateEventReference(updateEventId ?? filterEventId);
    }
  }
});

export const Booking = models.Booking ?? model<Booking>("Booking", bookingSchema);
