import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import {
  Container,
  Col,
  Form,
  Button,
  Card,
  Row
} from 'react-bootstrap';

import Auth from '../utils/auth';
import { searchGoogleBooks } from '../utils/API';
import { saveBookIds, getSavedBookIds } from '../utils/localStorage';
import type { Book } from '../models/Book';
import type { GoogleAPIBook } from '../models/GoogleAPIBook';
import { SAVE_BOOK } from '../utils/mutations';
import { useMutation } from '@apollo/client';

const SearchBooks = () => {
  // Apollo mutation hook for saving a book to the database
  const [saveBookMutation] = useMutation(SAVE_BOOK);

  // State to hold the list of books returned from the Google Books API
  const [searchedBooks, setSearchedBooks] = useState<Book[]>([]);

  // State to hold the user's search input
  const [searchInput, setSearchInput] = useState('');

  // State to hold the list of saved book IDs (retrieved from localStorage)
  const [savedBookIds, setSavedBookIds] = useState(getSavedBookIds());

  // Effect to save the `savedBookIds` to localStorage when the component unmounts
  useEffect(() => {
    return () => saveBookIds(savedBookIds);
  }, [savedBookIds]);

  // Function to handle the form submission for searching books
  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // If the search input is empty, do nothing
    if (!searchInput) {
      return false;
    }

    try {
      // Call the Google Books API with the search input
      const response = await searchGoogleBooks(searchInput);

      // If the response is not OK, throw an error
      if (!response.ok) {
        throw new Error('something went wrong!');
      }

      // Parse the response JSON and extract book data
      const { items } = await response.json();

      const bookData = items.map((book: GoogleAPIBook) => ({
        bookId: book.id,
        authors: book.volumeInfo.authors || ['No author to display'],
        title: book.volumeInfo.title,
        description: book.volumeInfo.description,
        image: book.volumeInfo.imageLinks?.thumbnail || '',
      }));

      // Update the state with the searched books and clear the search input
      setSearchedBooks(bookData);
      setSearchInput('');
    } catch (err) {
      console.error(err);
    }
  };

  // Function to handle saving a book to the database
  const handleSaveBook = async (bookId: string) => {
    // Find the book in the `searchedBooks` state by its ID
    const bookToSave: Book = searchedBooks.find((book) => book.bookId === bookId)!;

    // Get the user's authentication token
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    // If no token is found, return early
    if (!token) {
      return false;
    }

    try {
      // Call the saveBookMutation to save the book to the database
      const { data } = await saveBookMutation({
        variables: { book: bookToSave },
      });

      // If the mutation is successful, update the savedBookIds state
      if (data) {
        setSavedBookIds([...savedBookIds, bookToSave.bookId]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Search form section */}
      <div className="text-light bg-dark p-5">
        <Container>
          <h1>Search for Books!</h1>
          <Form onSubmit={handleFormSubmit}>
            <Row>
              <Col xs={12} md={8}>
                <Form.Control
                  name='searchInput'
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type='text'
                  size='lg'
                  placeholder='Search for a book'
                />
              </Col>
              <Col xs={12} md={4}>
                <Button type='submit' variant='success' size='lg'>
                  Submit Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>

      {/* Display search results */}
      <Container>
        <h2 className='pt-5'>
          {searchedBooks.length
            ? `Viewing ${searchedBooks.length} results:`
            : 'Search for a book to begin'}
        </h2>
        <Row>
          {searchedBooks.map((book) => {
            return (
              <Col md="4" key={book.bookId}>
                <Card border='dark'>
                  {/* Display book image if available */}
                  {book.image ? (
                    <Card.Img src={book.image} alt={`The cover for ${book.title}`} variant='top' />
                  ) : null}
                  <Card.Body>
                    <Card.Title>{book.title}</Card.Title>
                    <p className='small'>Author(s): {book.authors.join(', ')}</p>
                    <Card.Text>{book.description}</Card.Text>
                    {/* Save book button (only visible if user is logged in) */}
                    {Auth.loggedIn() && (
                      <Button
                        disabled={savedBookIds?.some((savedBookId: string) => savedBookId === book.bookId)}
                        className='btn-block btn-info'
                        onClick={() => handleSaveBook(book.bookId)}>
                        {savedBookIds?.some((savedBookId: string) => savedBookId === book.bookId)
                          ? 'This book is on your saved list!'
                          : 'Save this Book'}
                      </Button>
                    )}
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

export default SearchBooks;