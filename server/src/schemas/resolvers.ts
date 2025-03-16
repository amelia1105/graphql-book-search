import User, { UserDocument } from '../models/User.js';
import { signToken, AuthenticationError } from '../utils/auth.js';

interface AddBookArgs {
  bookId: string;
}

interface RemoveBookArgs {
  bookId: string;
}

interface Auth {
  token: string;
  user: UserDocument;
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
    addUser: async (_parent: any, { username, email, password }: { username: string, email: string, password: string }): Promise<Auth> => {
        // Check if the username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          throw new Error('Username is already taken');
        }
      const user = await User.create({ username, email, password });
      const token = signToken(user.username, user.email, (user as UserDocument).id.toString());
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

      const token = signToken(user.username, user.email, (user as UserDocument).id.toString());
      return { token, user };
    },
    saveBook: async (_parent: any, { bookId }: AddBookArgs, context: Context): Promise<UserDocument | null> => {
      if (context.user) {
        const user = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: bookId } },
          { new: true, runValidators: true }
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
          { $pull: { savedBooks: bookId } },
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
