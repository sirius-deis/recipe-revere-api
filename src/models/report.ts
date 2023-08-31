import { Schema, Model, model, Types } from 'mongoose';

interface IReport {
  _id: Types.ObjectId;
  reviewId: Types.ObjectId;
  senderId: Types.ObjectId;
  message: string;
}

type ReportModel = Model<IReport>;

const reportSchema = new Schema<IReport, ReportModel>(
  {
    reviewId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    message: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 256,
    },
  },
  { timestamps: true },
);

const Report = model('Report', reportSchema);

export default Report;
