import { gql } from '@apollo/client';

export const GET_ME = gql`
  {
    me {
      id
      username
      email
      savedBooks {
        bookId
        authors
        image
        description
        title
        link
      }
    }
  }
`;