import { Schema, model } from "mongoose";

const TagSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    color: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export const Tag = model("Tag", TagSchema);
