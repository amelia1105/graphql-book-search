import User from '../models/User.js';
import { signToken, AuthenticationError } from '../utils/auth.js';

interface User {
  _id: string;
  username: string;
  email: string;
  bookCount: number;
  savedBooks: string[];
}

interface UserArgs {
  userId: string;
}

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
  user?: User;
}

const resolvers = {
  Query: {
    user: async (_parent: any, { userId }: UserArgs): Promise<User | null> => {
      return await User.findOne({ _id: userId });
    },
    me: async (_parent: any, _args: any, context: Context): Promise<User | null> => {
      if (context.user) {
        return await User.findOne({ _id: context.user._id });
      }
      throw new AuthenticationError('Not authenticated');
    },
  },
  Mutation: {
    createUser: async (_parent: any, { input }: AddUserArgs): Promise<{ token: string; user: User }> => {
      const user = await User.create({ ...input });
      const token = signToken(user);
      return { token, user };
    },
    login: async (_parent: any, { email, password }: { email: string; password: string }): Promise<{ token: string; user: User }> => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }
      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new AuthenticationError('Invalid credentials');
      }
      const token = signToken(user);
      return { token, user };
    },
    saveBook: async (_parent: any, { bookId }: AddBookArgs, context: Context): Promise<User | null> => {
      if (context.user) {
        return await User.findOneAndUpdate(
          { _id: context.user._id },
          {
            $addToSet: { savedBooks: { bookId } },
          },
          {
            new: true,
            runValidators: true,
          }
        );
      }
      throw new AuthenticationError('Not authenticated');
    },
    deleteBook: async (_parent: any, { bookId }: RemoveBookArgs, context: Context): Promise<User | null> => {
      if (context.user) {
        return await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        );
      }
      throw new AuthenticationError('Not authenticated');
    },
  },
};

export default resolvers;
