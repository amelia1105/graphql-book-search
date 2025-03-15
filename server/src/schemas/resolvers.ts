import User, { UserDocument } from '../models/User.js';
import { signToken, AuthenticationError } from '../utils/auth.js';

interface AddUserArgs {
  input:{
    username: string;
    email: string;
    password: string;
  }
}

interface AddBookArgs {
  bookId: string;
}

interface RemoveBookArgs {
  bookId: string;
}

interface Context {
  user?: UserDocument;
}

const resolvers = {
  Query: {
    me: async (_parent: any, _args: any, context: Context): Promise<UserDocument | null> => {
      if (context.user) {
        const user = await User.findOne({ _id: context.user._id });
        if (user) {
          user.id = user.id.toString();
        }
        return user;
      }
      throw new AuthenticationError('Not authenticated');
    },
  },
  Mutation: {
    addUser: async (_parent: any, { input }: AddUserArgs): Promise<{ token: string; user: UserDocument }> => {
      const user = await User.create({ ...input });
      user.id = user.id.toString();
      const token = signToken(user.username, user.password, user.id);
      return { token, user };
    },
    login: async (_parent: any, { email, password }: { email: string; password: string }): Promise<{ token: string; user: UserDocument }> => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }
      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new AuthenticationError('Invalid credentials');
      }
      user.id = user.id.toString();
      const token = signToken(user.username, user.password, user.id);
      return { token, user };
    },
    saveBook: async (_parent: any, { bookId }: AddBookArgs, context: Context): Promise<UserDocument | null> => {
      if (context.user) {
        const user = await User.findOneAndUpdate(
          { _id: context.user._id },
          {
            $addToSet: { savedBooks: { bookId } },
          },
          {
            new: true,
            runValidators: true,
          }
        );
        if (user) {
          user.id = user.id.toString();
        }
        return user;
      }
      throw new AuthenticationError('Not authenticated');
    },
    removeBook: async (_parent: any, { bookId }: RemoveBookArgs, context: Context): Promise<UserDocument | null> => {
      if (context.user) {
        const user = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        );
        if (user) {
          user.id = user.id.toString();
        }
        return user;
      }
      throw new AuthenticationError('Not authenticated');
    },
  },
};

export default resolvers;
