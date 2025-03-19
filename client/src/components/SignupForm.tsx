import { useState } from 'react';
import { useMutation } from '@apollo/client';
import type { ChangeEvent, FormEvent } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';

import { ADD_USER } from '../utils/mutations';
import Auth from '../utils/auth';
import type { User } from '../models/User';

const SignupForm = ({}: { handleModalClose: () => void }) => {
  // State to manage form data
  const [userFormData, setUserFormData] = useState<User>({ username: '', email: '', password: '', savedBooks: [] });
  // State for form validation
  const [validated] = useState(false);
  // State to control the visibility of the alert
  const [showAlert, setShowAlert] = useState(false);
  // Mutation to add a new user
  const [addUser, { error }] = useMutation(ADD_USER);
  // Set error message
  const [errorMessage, setErrorMessage] = useState('');

  // Handle input changes and update the form data state
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setUserFormData({ ...userFormData, [name]: value });
  };

  // Handle form submission
  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Check if the form is valid (as per react-bootstrap docs)
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      // Execute the addUser mutation with the form data
      const { data } = await addUser({
        variables: { ...userFormData },
      });

      // If the mutation is successful, log the user in
      if (data) {
        Auth.login(data.addUser.token);
      }
    } catch (err) {
      // Log the error and show the alert
        console.error(err);
        setShowAlert(true);

        // Set the error message based on the error type
        if (err instanceof Error && (err as any)?.graphQLErrors?.length > 0) {
          const errorMessage = (err as any).graphQLErrors[0]?.message;
    
          if (errorMessage.includes('Username already exists')) {
            setErrorMessage('This username is already taken.');
          } else if (errorMessage.includes('Invalid email format')) {
            setErrorMessage('Please enter a valid email address.');
          } else {
            setErrorMessage('Something went wrong with your signup.');
          }
        } else {
          setErrorMessage('Something went wrong with your signup.');
        }
      }

    // Reset the form data after submission
    setUserFormData({
      username: '',
      email: '',
      password: '',
      savedBooks: [],
    });
  };

  return (
    <>
      {/* This is needed for the validation functionality */}
      <Form noValidate validated={validated} onSubmit={handleFormSubmit}>
        {/* Show alert if there is an error */}
        <Alert dismissible onClose={() => setShowAlert(false)} show={showAlert || !!error} variant='danger'>
          {errorMessage}
        </Alert>


        {/* Username input field */}
        <Form.Group className='mb-3'>
          <Form.Label htmlFor='username'>Username</Form.Label>
          <Form.Control
            type='text'
            placeholder='Your username'
            name='username'
            onChange={handleInputChange}
            value={userFormData.username || ''}
            required
          />
          <Form.Control.Feedback type='invalid'>Username is required!</Form.Control.Feedback>
        </Form.Group>

        {/* Email input field */}
        <Form.Group className='mb-3'>
          <Form.Label htmlFor='email'>Email</Form.Label>
          <Form.Control
            type='email'
            placeholder='Your email address'
            name='email'
            onChange={handleInputChange}
            value={userFormData.email || ''}
            required
          />
          <Form.Control.Feedback type='invalid'>Email is required!</Form.Control.Feedback>
        </Form.Group>

        {/* Password input field */}
        <Form.Group className='mb-3'>
          <Form.Label htmlFor='password'>Password</Form.Label>
          <Form.Control
            type='password'
            placeholder='Your password'
            name='password'
            onChange={handleInputChange}
            value={userFormData.password || ''}
            required
          />
          <Form.Control.Feedback type='invalid'>Password is required!</Form.Control.Feedback>
        </Form.Group>

        {/* Submit button */}
        <Button
          disabled={!(userFormData.username && userFormData.email && userFormData.password)}
          type='submit'
          variant='success'>
          Submit
        </Button>
      </Form>
    </>
  );
};

export default SignupForm;
