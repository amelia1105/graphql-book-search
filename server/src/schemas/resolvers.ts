import User, { UserDocument } from '../models/User.js';
import { signToken, AuthenticationError } from '../utils/auth.js';

interface AddBookArgs {
  bookId: string;
  authors: string[];
  title: string;
  description: string;
  image: string;
  link: string;
}

interface RemoveBookArgs {
  bookId: string;
}

interface Context {
  user?: UserDocument;
}

const resolvers = {
  Query: {
    me: async (_parent: any, _args: any, context: Context): Promise<any | null> => {
      if (context.user) {
        const user = await User.findById(context.user._id).select('-__v -password').populate('savedBooks');

        if (user) {
          return {
            ...user.toObject(),
            id: (user._id as unknown as string).toString(),
            savedBooks: user.savedBooks.map((book: any) => ({
              bookId: book.bookId,
              authors: book.authors,
              image: book.image,
              description: book.description,
              title: book.title,
              link: book.link,
            })),
          };
        }
      }
      throw new AuthenticationError('User not authenticated');
    },
  },
  Mutation: {
    addUser: async (_parent: any, args: any): Promise<{ token: string, user: UserDocument }> => {
      const existingUser = await User.findOne({ username: args.username });
      if (existingUser) {
        throw new AuthenticationError('Username already exists');
      }
      const user = await User.create(args);
      const token = signToken(user.username, user.email, user._id);
      return { token, user };
    },
    login: async (_parent: any, { email, password }: { email: string; password: string }): Promise<{ token: string; user: UserDocument }> => {
      const user = await User.findOne({ email });
      if (!user || !(await user.isCorrectPassword(password))) {
        throw new AuthenticationError('Invalid credentials');
      }
      const token = signToken(user.username, user.email, user._id);
      return { token, user };
    },
    saveBook: async (_parent: any, { book }: { book: AddBookArgs }, context: Context): Promise<UserDocument | null> => {
      if (context.user) {
        const user = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $push: { savedBooks: book } },
          { new: true }
        );
        return user;
      }
      throw new AuthenticationError('Not authenticated');
    },    
    removeBook: async (_parent: any, { bookId }: RemoveBookArgs, context: Context): Promise<any | null> => {
      if (context.user) {
        const user = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        ).populate('savedBooks');

        if (user) {
          return {
            ...user.toObject(),
            id: (user._id as any).toString(),  // Ensure _id is treated as a string
            savedBooks: user.savedBooks.map((book: any) => ({
              bookId: book.bookId,
              authors: book.authors,
              image: book.image,
              description: book.description,
              title: book.title,
              link: book.link,
            })),
          };
        }
      }
      throw new AuthenticationError('Not authenticated');
    },
  },
};

export default resolvers;
