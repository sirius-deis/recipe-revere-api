import { Schema, Model, model, Types } from "mongoose";
import bcrypt from "bcryptjs";

const { BCRYPT_SALT } = process.env;

enum Roles {
  User = "user",
  Admin = "admin",
}

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  isActive: boolean;
  isBlocked: boolean;
  role: Roles;
  passwordChangedAt: number;
  pictures: string[];
  friends: Types.ObjectId[];
  blockedUsers: Types.ObjectId[];
}

interface IUserMethods {
  comparePasswords: (assumedPassword: string) => Promise<boolean>;
  save: () => Promise<IUser | never>;
}

type IUserModal = Model<IUser, {}, IUserMethods>;

export type IUserType = IUser & IUserMethods & IUserModal;

const UserSchema = new Schema<IUser, IUserModal, IUserMethods>({
  name: {
    type: String,
    minlength: 4,
    maxlength: 28,
  },
  email: {
    type: String,
    lowercase: true,
    required: [true, "Email can't be empty please provide valid email"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "This field can't be empty"],
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: {
      values: Object.values(Roles),
    },
    default: Roles.User,
  },
  passwordChangedAt: {
    type: Number,
    default: Date.now(),
  },
  pictures: {
    type: [String],
  },
  friends: [
    {
      type: Schema.Types.ObjectId,
      ref: "Friend",
    },
  ],
  blockedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

UserSchema.pre("save", function (next) {
  if (this.isNew || !this.passwordChangedAt) {
    return next();
  }
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const hash = await bcrypt.hash(this.password, +BCRYPT_SALT!);
  this.password = hash;
  next();
});

UserSchema.methods.comparePasswords = async function (assumedPassword: string) {
  return await bcrypt.compare(assumedPassword, this.password);
};

const User = model<IUser, IUserModal>("User", UserSchema);

export default User;
