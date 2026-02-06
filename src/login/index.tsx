/*-----------------------------------------------------------------------------
| Copyright (c) 2025-present, OpenTeams Inc.
|----------------------------------------------------------------------------*/
import type {
  ReactNode
} from 'react';

import {
  useState
} from 'react'

import * as auth from '@/auth';

import {
  Button
} from '@/components/ui/button';

import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card';

import {
  Field, FieldGroup, FieldLabel
} from '@/components/ui/field';

import {
  Input
} from '@/components/ui/input';

import {
  cn
} from '@/lib/utils';


/**
 * A react component that renders the login dialog.
 */
export
function Login(props: Login.Props): ReactNode {
  // Extract the props.
  const { onLogin } = props;

  // Create the state for the component.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Create the handler for submitting the value.
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    // Stop normal processing of the event.
    event.preventDefault();
    event.stopPropagation();

    // Clear the error state.
    setError(null);

    // Set the submitting state.
    setIsSubmitting(true);

    // Attempt to submit the login info.
    try {
      await onLogin({ username, password });
    } catch (e) {
      setError('Invalid username or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create the error content if an error is present.
  const errorContent = (
    error ?
    <CardDescription className='text-red-500'>
      { error }
    </CardDescription>
    : null
  );

  // Return the rendered component.
  return (
    <main className='grow flex items-center justify-center'>
      <Card className='max-w-md w-full rounded-md'>
        <CardHeader>
          <CardTitle className='text-xl'>
            <div className={ cn(
              'h-6 bg-[url(/assets/Nebari-Logo-Horizontal-Lockup.svg)]',
              'bg-[auto_100px] bg-center bg-no-repeat w-[100px]') } />
          </CardTitle>
          { errorContent }
        </CardHeader>
        <CardContent>
          <form id='login-form' onSubmit={ handleSubmit }>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor='login-username'>
                  Username
                </FieldLabel>
                <Input
                  required
                  id='login-username'
                  name='username'
                  value={ username }
                  onChange={ evt => { setUsername(evt.target.value); } }
                  className={ cn(
                    'rounded-sm focus-visible:ring-0',
                    'focus-visible:border-bd-brand-default'
                  ) } />
              </Field>
              <Field>
                <FieldLabel htmlFor='login-password'>
                  Password
                </FieldLabel>
                <Input
                  required
                  id='login-password'
                  name='password'
                  type='password'
                  value={ password }
                  onChange={ evt => { setPassword(evt.target.value); } }
                  className={ cn(
                    'rounded-sm focus-visible:ring-0',
                    'focus-visible:border-bd-brand-default'
                  ) } />
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Field>
            <Button
              type='submit'
              form='login-form'
              disabled={ isSubmitting }
              className={ cn(
                'bg-bd-brand-default text-white rounded-sm',
                'hover:bg-bd-brand-default/80 disabled:opacity-50',
              ) }>
              { isSubmitting ? 'Signing in...' : 'Sign In' }
            </Button>
          </Field>
        </CardFooter>
      </Card>
    </main>
  );
}


/**
 * The namespace for the `Login` statics.
 */
export
namespace Login {
  /**
   * A type alias for the `Login` props.
   */
  export
  type Props = {
    /**
     * A callback function to submit the UN/PW for login.
     */
    readonly onLogin: (options: auth.login.Options) => Promise<void>;
  };
}
