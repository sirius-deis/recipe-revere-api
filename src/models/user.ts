import { Schema, Types, model } from 'mongoose';

enum Roles {
  User = 'user',
  Admin = 'admin',
}

interface IUser {
  name: string;
  email: string;
  password: string;
  isActive: boolean;
  isBlocked: boolean;
  role: Roles;
  passwordChangedAt: Date;
  picture: [string];
}

const userSchema = new Schema<IUser>({
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
    type: Date,
    default: Date.now(),
  },
  picture: {
    type: [String],
  },
});

const User = model('User', userSchema);

export default User;
