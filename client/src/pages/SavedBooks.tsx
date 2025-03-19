import { useQuery, useMutation } from '@apollo/client';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';

import { removeBookId } from '../utils/localStorage';
import { GET_ME } from '../utils/queries';
import { REMOVE_BOOK } from '../utils/mutations';
import type { User } from '../models/User';

import Auth from '../utils/auth';

const SavedBooks = () => {
  // Fetch user data using the GET_ME query
  const { loading, data } = useQuery(GET_ME);

  // Mutation to remove a book from the user's saved books
  const [removeBook] = useMutation(REMOVE_BOOK);

  // Extract user data from the query response or set it to an empty object
  const userData: User = data?.me || {}; 

  // Function to handle deleting a book by its ID
  const handleDeleteBook = async (bookId: string) => {
    // Check if the user is logged in and retrieve the token
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false; // Exit if no token is found
    }

    try {
      // Call the REMOVE_BOOK mutation with the book ID as a variable
      await removeBook({
        variables: { bookId }
      });

      // Remove the book ID from local storage
      removeBookId(bookId);
    } catch (err) {
      console.error(err); // Log any errors
    }
  };

  // Display a loading message while the query is in progress
  if (loading) {
    return <h2>LOADING...</h2>;
  }  

  return (
    <>
      {/* Header section */}
      <div className='text-light bg-dark p-5'>
        <Container>
          {userData.username ? (
            <h1>Viewing {userData.username}'s saved books!</h1>
          ) : (
            <h1>Viewing saved books!</h1>
          )}
        </Container>
      </div>

      {/* Main content section */}
      <Container>
        <h2 className='pt-5'>
          {userData.savedBooks?.length
            ? `Viewing ${userData.savedBooks.length} saved ${
                userData.savedBooks.length === 1 ? 'book' : 'books'
              }:`
            : 'You have no saved books!'}
        </h2>
        <Row>
          {/* Loop through the saved books and render each as a card */}
          {userData.savedBooks?.map((book) => {
            return (
              <Col key={book.bookId} md='4'>
                <Card border='dark'>
                  {/* Display the book's image if available */}
                  {book.image ? (
                    <Card.Img
                      src={book.image}
                      alt={`The cover for ${book.title}`}
                      variant='top'
                    />
                  ) : null}
                  <Card.Body>
                    {/* Display the book's title, authors, and description */}
                    <Card.Title>{book.title}</Card.Title>
                    <p className='small'>Author(s): {book.authors}</p>
                    <Card.Text>{book.description}</Card.Text>
                    {/* Button to delete the book */}
                    <Button
                      className='btn-block btn-danger'
                      onClick={() => handleDeleteBook(book.bookId)}
                    >
                      Delete this Book
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </>
  );
};

export default SavedBooks;
