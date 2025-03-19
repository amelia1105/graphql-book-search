import { useState } from 'react';
import { useMutation } from '@apollo/client';
import type { ChangeEvent, FormEvent } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';

import { LOGIN_USER } from '../utils/mutations';
import Auth from '../utils/auth';

// LoginForm component for handling user login
const LoginForm = ({}: { handleModalClose: () => void }) => {
  // State to manage form data (email and password)
  const [userFormData, setUserFormData] = useState({ email: '', password: '' });
  // State to manage form validation
  const [validated] = useState(false);
  // State to manage visibility of error alert
  const [showAlert, setShowAlert] = useState(false);
  // Apollo mutation hook for user login
  const [loginUser, { error }] = useMutation(LOGIN_USER);
  // Set error message
  const [errorMessage, setErrorMessage] = useState('');

  // Handler for input field changes
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setUserFormData({ ...userFormData, [name]: value });
  };

  // Handler for form submission
  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Check if form is valid (as per react-bootstrap docs)
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      // Execute login mutation with form data
      const { data } = await loginUser({
        variables: { email: userFormData.email, password: userFormData.password },
      });

      // If login is successful, save the token and log in the user
      if (data) {
        Auth.login(data.login.token);
      }
    } catch (err) {
      // Log error and show alert if login fails
        console.error('Login error:', err);
        setShowAlert(true);

      // Set error message based on error type
      if (err instanceof Error && (err as any)?.graphQLErrors?.length > 0) {
        const errorMessage = (err as any).graphQLErrors[0]?.message;
  
        if (errorMessage.includes('Invalid email format')) {
          setErrorMessage('Invalid email address.');
        } else {
          setErrorMessage('Invalid login.');
        }
      } else {
        setErrorMessage('Something went wrong with your login.');
      }
    }

    // Reset form data after submission
    setUserFormData({
      email: '',
      password: ''
    });
  };

  return (
    <>
      {/* Form for user login */}
      <Form noValidate validated={validated} onSubmit={handleFormSubmit}>
        {/* Alert for login errors */}
        <Alert dismissible onClose={() => setShowAlert(false)} show={showAlert || !!error} variant='danger'>
          {errorMessage}
        </Alert>
        {/* Email input field */}
        <Form.Group className='mb-3'>
          <Form.Label htmlFor='email'>Email</Form.Label>
          <Form.Control
            type='text'
            placeholder='Your email'
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
          disabled={!(userFormData.email && userFormData.password)} // Disable button if fields are empty
          type='submit'
          variant='success'>
          Submit
        </Button>
      </Form>
    </>
  );
};

export default LoginForm;
