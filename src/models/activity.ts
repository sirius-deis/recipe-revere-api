import { Schema, model, Model, Types } from "mongoose";

interface IActivity {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  activity: string;
  date: number;
}

type ActivityModel = Model<IActivity, {}>;

const ActivitySchema = new Schema<IActivity, ActivityModel>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  activity: {
    type: String,
    required: true,
  },
  date: {
    type: Number,
    required: true,
  },
});

const Activity = model<IActivity, ActivityModel>("Activity", ActivitySchema);

export default Activity;
