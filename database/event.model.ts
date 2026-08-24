import { model, models, Schema, type HydratedDocument } from "mongoose";

export interface Event {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const requiredText = {
  type: String,
  required: true,
  trim: true,
  validate: {
    validator: (value: string): boolean => value.length > 0,
    message: "Value must not be empty",
  },
} as const;

function createSlug(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeDate(value: string): string {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    throw new Error("Event date must be a valid date");
  }

  return new Date(timestamp).toISOString().slice(0, 10);
}

function normalizeTime(value: string): string {
  const twelveHour = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  const twentyFourHour = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  let hours: number;
  let minutes: number;

  if (twelveHour) {
    hours = Number(twelveHour[1]) % 12;
    minutes = Number(twelveHour[2]);
    if (twelveHour[3].toUpperCase() === "PM") hours += 12;
  } else if (twentyFourHour) {
    hours = Number(twentyFourHour[1]);
    minutes = Number(twentyFourHour[2]);
  } else {
    throw new Error("Event time must use HH:mm or h:mm AM/PM format");
  }

  if (hours > 23 || minutes > 59) {
    throw new Error("Event time must be valid");
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

const eventSchema = new Schema<Event>(
  {
    title: requiredText,
    slug: { type: String, trim: true },
    description: requiredText,
    overview: requiredText,
    image: requiredText,
    venue: requiredText,
    location: requiredText,
    date: requiredText,
    time: requiredText,
    mode: requiredText,
    audience: requiredText,
    agenda: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]): boolean => value.length > 0 && value.every((item) => item.trim().length > 0),
        message: "Agenda must contain at least one non-empty item",
      },
    },
    organizer: requiredText,
    tags: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]): boolean => value.length > 0 && value.every((item) => item.trim().length > 0),
        message: "Tags must contain at least one non-empty item",
      },
    },
  },
  { timestamps: true },
);

eventSchema.index({ slug: 1 }, { unique: true });

eventSchema.pre("save", function (this: HydratedDocument<Event>) {
  // Regenerate slugs only when the title changes, preserving stable URLs otherwise.
  if (this.isModified("title") || !this.slug) {
    this.slug = createSlug(this.title);
  }

  // Store dates and times in predictable formats for querying and display.
  this.date = normalizeDate(this.date);
  this.time = normalizeTime(this.time);
});

export const Event = models.Event ?? model<Event>("Event", eventSchema);
