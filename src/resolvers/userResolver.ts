import { GraphQLError } from "graphql";
import { Response } from "express";
import jwt from "jsonwebtoken";
import User, { IUserType, IUser } from "../models/user.js";
import authWrapper from "../utils/auth.js";
import { setValue } from "../db/redisConnection.js";
import Token from "../models/token.js";
import sendEmail from "../api/email.js";
import crypto from "crypto";
import Friends from "src/models/friends.js";
import Activity from "src/models/activity.js";

const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

const signToken = (userId: string, expiresIn: string = JWT_EXPIRES_IN!) => {
  return jwt.sign({ userId }, JWT_SECRET!, { expiresIn });
};

interface IUserInput {
  email: string;
  password: string;
  passwordConfirm?: string;
}

const generateToken = () => crypto.randomBytes(32).toString("hex");

const USERS_PER_PAGE = 10;

const checkIfUserExists = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new GraphQLError("There is no such user", {
      extensions: {
        code: "NOT_FOUND",
        http: { status: 404 },
      },
    });
  }

  return user;
};

const removeFromFriends = async (
  currentUserId: string,
  anotherUserId: string
) => {
  await Promise.all([
    Friends.findOneAndRemove({
      recipient: anotherUserId,
      requester: currentUserId,
    }),
    Friends.findOneAndRemove({
      recipient: currentUserId,
      requester: anotherUserId,
    }),
    User.findOneAndUpdate(
      {
        _id: currentUserId,
      },
      {
        $pull: {
          friends: anotherUserId,
        },
      }
    ),
    User.findOneAndUpdate(
      {
        _id: anotherUserId,
      },
      {
        $pull: {
          friends: currentUserId,
        },
      }
    ),
  ]);
};

const userResolver = {
  getUser: authWrapper(
    async (_: any, args: { userId: string }, context: { user: IUserType }) => {
      const { userId } = args;
      const user = await User.findById(userId);

      if (!user) {
        throw new GraphQLError("There is no such user", {
          extensions: {
            code: "NOT_FOUND",
            http: { status: 404 },
          },
        });
      }

      return {
        id: user._id,
        name: user.name,
        email: context.user._id.equals(userId) ? user.email : undefined,
        role: context.user._id.equals(userId) ? user.role : undefined,
        pictures: user.pictures,
      };
    }
  ),
  getUsers: authWrapper(async (_: any, args: { page: number }) => {
    const { page = 1 } = args;
    const users = await User.find()
      .skip(USERS_PER_PAGE * (page - 1))
      .limit(USERS_PER_PAGE);

    if (users.length < 1) {
      throw new GraphQLError("There is no users left", {
        extensions: {
          code: "NOT_FOUND",
          http: { status: 404 },
        },
      });
    }

    const usersAmount = await User.countDocuments();

    return {
      users,
      amount: usersAmount,
    };
  }),
  register: async (_: any, { input }: { input: IUserInput }) => {
    const { email, password, passwordConfirm } = input;

    if (password !== passwordConfirm) {
      throw new GraphQLError("Passwords are not the same", {
        extensions: {
          code: "PASSWORD_ARE_NOT_THE_SAME",
          http: { status: 401 },
        },
      });
    }

    const user = await User.create({ email, password });

    const token = generateToken();

    await Token.create({ userId: user._id, token });

    await sendEmail(email, "Activate your account", "verification", {
      link: `/users/activate/${token}`,
      title: "Activate your account",
    });

    return true;
  },
  login: async (
    _: any,
    { input }: { input: IUserInput },
    context: { res: Response }
  ) => {
    const { email, password } = input;
    const { res } = context;
    const user = await User.findOne({ email });
    if (!user) {
      throw new GraphQLError("There is no such user", {
        extensions: {
          code: "NOT_FOUND",
          http: { status: 404 },
        },
      });
    }

    if (!user.isActive) {
      throw new GraphQLError("Your account is not activated", {
        extensions: {
          code: "AUTHENTICATION_FAILED",
          http: { status: 401 },
        },
      });
    }

    if (!(await user.comparePasswords(password))) {
      throw new GraphQLError("Password is incorrect", {
        extensions: {
          code: "AUTHENTICATION_FAILED",
          http: { status: 401 },
        },
      });
    }

    const token = signToken(user._id.toString());

    const refreshToken = signToken(user._id.toString(), "90d");
    res.cookie("refresh-token", refreshToken);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        pictures: user.pictures,
      },
      token,
    };
  },
  delete: authWrapper(
    async (
      _: any,
      { input }: { input: { password: string } },
      context: { user: IUserType; res: Response }
    ) => {
      const { user, res } = context;

      const { password } = input;

      if (!(await user.comparePasswords(password))) {
        throw new GraphQLError("Password is incorrect", {
          extensions: {
            code: "AUTHENTICATION_FAILED",
            http: { status: 401 },
          },
        });
      }

      await user.deleteOne();

      res.clearCookie("refresh-token");

      return true;
    }
  ),
  updatePassword: authWrapper(
    async (
      _: any,
      {
        input,
      }: {
        input: {
          password: string;
          newPassword: string;
          newPasswordConfirm: string;
        };
      },
      context: { user: IUserType }
    ) => {
      const { user } = context;
      const { password, newPassword, newPasswordConfirm } = input;

      if (!(await user.comparePasswords(password))) {
        throw new GraphQLError("Password is incorrect", {
          extensions: {
            code: "AUTHENTICATION_FAILED",
            http: { status: 401 },
          },
        });
      }

      if (await user.comparePasswords(newPassword)) {
        throw new GraphQLError("Passwords are the same", {
          extensions: {
            code: "PASSWORD_ARE_THE_SAME",
            http: { status: 400 },
          },
        });
      }

      if (newPassword !== newPasswordConfirm) {
        throw new GraphQLError("Passwords are not the same", {
          extensions: {
            code: "PASSWORD_ARE_NOT_THE_SAME",
            http: { status: 400 },
          },
        });
      }

      user.password = newPassword;

      const token = signToken(user._id.toString());

      await user.save();

      return token;
    }
  ),
  updateInfo: authWrapper(
    async (
      _: any,
      { input }: { input: { name: string } },
      context: { user: IUserType }
    ) => {
      const { user } = context;
      const { name } = input;

      if (name.trim().length < 4) {
        throw new GraphQLError("Name can't be shorter than 4 characters long", {
          extensions: {
            code: "VALIDATION_ERROR",
            http: { status: 400 },
          },
        });
      }

      user.name = name;

      await user.save();

      return true;
    }
  ),
  logout: authWrapper(
    async (
      _: any,
      __: any,
      context: { exp: any; token: string; res: Response }
    ) => {
      const { exp, token, res } = context;

      res.clearCookie("refresh-token");

      setValue(`bl-${token}`, token, { EX: exp });

      return true;
    }
  ),
  forgetPassword: async (
    _: any,
    { input }: { input: { email: string } },
    __: any
  ) => {
    const { email } = input;

    const user = await User.findOne({ email });

    if (!user) {
      throw new GraphQLError("There is no such email", {
        extensions: {
          code: "NOT_FOUND",
          http: { status: 404 },
        },
      });
    }

    const token = generateToken();

    await Token.create({ userId: user._id, token });

    await sendEmail(email, "Reset your password", "reset", {
      link: `/users/reset-password/${token}`,
      title: "Activate your account",
    });

    return "Check your email to reset your password";
  },
  sendRequestToFriends: authWrapper(
    async (
      _: any,
      { input }: { input: { userToAddId: string } },
      { user }: { user: IUserType }
    ) => {
      const { userToAddId } = input;

      const userToSendRequest = await checkIfUserExists(userToAddId);

      if (
        userToSendRequest.blockedUsers.find((blockedUser) =>
          blockedUser._id.equals(user._id)
        )
      ) {
        throw new GraphQLError(
          "You can't send request to this user as you are blocked by him",
          {
            extensions: {
              code: "VALIDATION_ERROR",
              http: { status: 400 },
            },
          }
        );
      }

      if (
        user.blockedUsers.find((blockedUser) =>
          blockedUser._id.equals(userToAddId)
        )
      ) {
        throw new GraphQLError(
          "You can't send request to this user as you blocked him. Unblock him first if you want to send him a request",
          {
            extensions: {
              code: "VALIDATION_ERROR",
              http: { status: 400 },
            },
          }
        );
      }

      await Promise.all([
        Friends.create(
          {
            recipient: userToAddId,
            requester: user._id,
          },
          { $set: { status: 1 } },
          { upsert: true, new: true }
        ),
        Friends.create(
          {
            recipient: user._id,
            requester: userToAddId,
          },
          { $set: { status: 2 } },
          { upsert: true, new: true }
        ),
        User.findOneAndUpdate(
          { _id: user._id },
          { $push: { friends: userToAddId } }
        ),
        User.findOneAndUpdate(
          {
            _id: userToAddId,
          },
          { $push: { friends: user._id } }
        ),
      ]);

      return true;
    }
  ),
  processFriendRequest: authWrapper(
    async (
      _: any,
      { input }: { input: { userToAddId: string; isAccepted: boolean } },
      { user }: { user: IUserType }
    ) => {
      const { userToAddId, isAccepted } = input;

      await checkIfUserExists(userToAddId);

      if (isAccepted) {
        await Promise.all([
          Friends.findOneAndUpdate(
            { recipient: user._id, requester: userToAddId },
            { $set: { status: 3 } }
          ),
          Friends.findOneAndUpdate(
            { recipient: userToAddId, requester: user._id },
            {
              $set: { status: 3 },
            }
          ),
          Activity.create({
            userId: user._id,
            activity: `added <link to='/users/${user._id}'>${user.name}</link> to friends`,
            date: Date.now(),
          }),
        ]);
      } else {
        removeFromFriends(user._id.toString(), userToAddId);
      }

      return true;
    }
  ),
  removeFromFriends: authWrapper(
    async (
      _: any,
      { input }: { input: { userId: string } },
      { user }: { user: IUserType }
    ) => {
      const { userId: userToRemoveId } = input;

      await checkIfUserExists(userToRemoveId);

      const foundFriend = user.friends.find((friend) =>
        friend._id.equals(user._id)
      );

      if (!foundFriend) {
        throw new GraphQLError("You are not friends with this user", {
          extensions: {
            code: "NOT_FOUND",
            http: { status: 404 },
          },
        });
      }

      await Promise.all([
        removeFromFriends(user._id.toString(), userToRemoveId),
        Activity.create({
          userId: user._id,
          activity: `removed <link to='/users/${user._id}'>${user.name}</link> to friends`,
          date: Date.now(),
        }),
      ]);

      return true;
    }
  ),
  blockUser: authWrapper(
    async (
      _: any,
      { input }: { input: { userId: string } },
      { user }: { user: IUserType }
    ) => {
      const { userId: userToBlockId } = input;

      await checkIfUserExists(userToBlockId);

      const userToBlockInFriendsList = user.friends.find((friend) =>
        friend._id.equals(userToBlockId)
      );

      if (userToBlockInFriendsList) {
        await removeFromFriends(user._id.toString(), userToBlockId);
      }

      await User.findByIdAndUpdate(user._id, {
        $push: { blockedUsers: userToBlockId },
      });

      return true;
    }
  ),
  unblockUser: authWrapper(
    async (
      _: any,
      { input }: { input: { userId: string } },
      { user }: { user: IUserType }
    ) => {
      const { userId: userToUnblockId } = input;

      const foundBlockedUser = user.blockedUsers.find((blockedUser) =>
        blockedUser._id.equals(userToUnblockId)
      );

      if (!foundBlockedUser) {
        throw new GraphQLError("Provided user is not blocked by you", {
          extensions: {
            code: "NOT_FOUND",
            http: { status: 404 },
          },
        });
      }

      await User.findByIdAndUpdate(user._id, {
        $pull: { blockedUsers: userToUnblockId },
      });

      return true;
    }
  ),
  getFriendsActivity: authWrapper(
    async (
      _: any,
      { input }: { input: { page: number } },
      { user }: { user: IUserType }
    ) => {
      const { page = 1 } = input;
      const limit = 10;

      const friendsList = await Friends.find({ recipient: user._id });

      const skip = limit * (page - 1);

      const activities = await Activity.find({
        userId: { $in: friendsList.map((friend) => friend.requester._id) },
      })
        .limit(limit)
        .skip(skip);

      activities.sort((act1, act2) => act1.date - act2.date);

      return activities;
    }
  ),
};

export default userResolver;
