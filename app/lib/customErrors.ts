export class NotFoundError extends Error {
  constructor(message: string = "Not Found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(message: string = "Invalid data") {
    super(message);
    this.name = "ValidationError";
  }
}

export class DatabaseError extends Error {
  constructor(message: string = "Database error") {
    super(message);
    this.name = "DatabaseError";
  }
}

export class NotAuthorizedError extends Error {
  constructor(message: string = "Authentication error") {
    super(message);
    this.name = "NotAuthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = "You don't have permissions") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends Error {
  constructor(message: string = "Resource already exists") {
    super(message);
    this.name = "ConflictError";
  }
}
