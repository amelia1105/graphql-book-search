import User, { UserDocument } from '../models/User.js';
import { signToken, AuthenticationError } from '../utils/auth.js';

// Define the structure of arguments for adding a book
interface AddBookArgs {
  bookId: string;
  authors: string[];
  title: string;
  description: string;
  image: string;
  link: string;
}

// Define the structure of arguments for removing a book
interface RemoveBookArgs {
  bookId: string;
}

// Define the structure of the context, which includes the authenticated user
interface Context {
  user?: UserDocument;
}

const resolvers = {
  Query: {
    // Resolver for the "me" query, which returns the authenticated user's data
    me: async (_parent: any, _args: any, context: Context): Promise<any | null> => {
      if (context.user) {
        // Find the user by their ID, excluding sensitive fields and populating savedBooks
        const user = await User.findById(context.user._id).select('-__v -password').populate('savedBooks');

        if (user) {
          // Return the user object with additional formatting for savedBooks
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
      // Throw an error if the user is not authenticated
      throw new AuthenticationError('User not authenticated');
    },
  },
  Mutation: {
    // Resolver for adding a new user
    addUser: async (_parent: any, args: any): Promise<{ token: string, user: UserDocument }> => {
      // Check if the username already exists
      const existingUser = await User.findOne({ username: args.username });
      if (existingUser) {
       throw new AuthenticationError('Username already exists');
      }
      // Check if the email is valid
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(args.email)) {
        throw new AuthenticationError('Invalid email format');
      }
      // Create a new user and generate a token
      const user = await User.create(args);
      const token = signToken(user.username, user.email, user._id);
      return { token, user };
    },
    // Resolver for logging in a user
    login: async (_parent: any, { email, password }: { email: string; password: string }): Promise<{ token: string; user: UserDocument }> => {
      // Check if the email is valid
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new AuthenticationError('Invalid email format');
      }

      // Find the user by email and validate the password
      const user = await User.findOne({ email });
      if (!user || !(await user.isCorrectPassword(password))) {
        throw new AuthenticationError('Invalid credentials');
      }
      // Generate a token for the authenticated user
      const token = signToken(user.username, user.email, user._id);
      return { token, user };
    },
    // Resolver for saving a book to the user's savedBooks list
    saveBook: async (_parent: any, { book }: { book: AddBookArgs }, context: Context): Promise<UserDocument | null> => {
      if (context.user) {
        // Add the book to the user's savedBooks array
        const user = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $push: { savedBooks: book } },
          { new: true }
        );
        return user;
      }
      // Throw an error if the user is not authenticated
      throw new AuthenticationError('Not authenticated');
    },
    // Resolver for removing a book from the user's savedBooks list
    removeBook: async (_parent: any, { bookId }: RemoveBookArgs, context: Context): Promise<any | null> => {
      if (context.user) {
        // Remove the book from the user's savedBooks array
        const user = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        ).populate('savedBooks');

        if (user) {
          // Return the updated user object with formatted savedBooks
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
      // Throw an error if the user is not authenticated
      throw new AuthenticationError('Not authenticated');
    },
  },
};

export default resolvers;
