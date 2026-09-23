class ApiError extends Error {
    responseCode: number;

    constructor(message?: string) {
        super(message);
    }
}

function AuthMissingCredentialsError() {
    const err = new ApiError();
    err.name = 'AuthMissingCredentialsError';
    err.message = 'Missing credentials during authorization, please provide an email and password.';
    err.responseCode = 403;
    return err;
  }

  function AuthInvalidCredentialsError(): ApiError {
    const err = new ApiError();
    err.name = 'AuthInvalidCredentialsError';
    err.message = 'Invalid credentials during authorization, email or password incorrect.';
    err.responseCode = 403;
    return err;
  }
  
  