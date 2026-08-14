import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  githubId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  githubUrl: string;
  notifyEmail: string;
  profileSlug: string;
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    githubId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true },
    displayName: { type: String, required: true },
    avatarUrl: { type: String },
    githubUrl: { type: String, required: true },
    notifyEmail: { type: String, required: true },
    profileSlug: { type: String, required: true, unique: true, index: true },
    timezone: { type: String, default: "UTC" },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
