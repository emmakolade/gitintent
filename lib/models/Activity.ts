import { Schema, model, models, type Document, type Types } from "mongoose";

export interface IActivity extends Document {
  ownerId: Types.ObjectId;
  eventType: "PROFILE_VIEW" | "GITHUB_CLICK";
  source?: string;
  referrer?: string;
  location?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    eventType: { type: String, enum: ["PROFILE_VIEW", "GITHUB_CLICK"], required: true },
    source: { type: String },
    referrer: { type: String },
    location: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Activity = models.Activity || model<IActivity>("Activity", activitySchema);
