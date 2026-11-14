# PageTurn Library

## Project Overview
PageTurn Library is a Library Management REST API developed using Node.js, Express.js, and SQLite. It manages readers, books, and book loans through CRUD operations.

## Technologies Used
- Node.js
- Express.js
- SQLite
- Postman
- JavaScript

## Features
- Manage reader records.
- Manage book records.
- Manage book loans.
- Create, read, update, and delete records.
- Search books by genre.
- Pagination for book listings.
- Retrieve loan details using SQL JOIN.
- Input validation and error handling.

## Project Structure

```text
PageTurn-Library/
│
├── database/
│   └── db.js
├── server.js
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

## Installation and Setup

1. Clone or download the repository.
2. Open the project folder in VS Code.
3. Install dependencies:

```bash
npm install
```

4. Start the server:

```bash
npm start
```

5. Open the API:

```text
http://localhost:3001
```

## API Endpoints

### Readers
- POST `/readers`
- GET `/readers`
- GET `/readers/:id`
- PUT `/readers/:id`
- DELETE `/readers/:id`

### Books
- POST `/books`
- GET `/books`
- GET `/books/:id`
- PUT `/books/:id`
- DELETE `/books/:id`

### Loans
- POST `/loans`
- GET `/loans`
- GET `/loans/:id`
- PUT `/loans/:id`
- DELETE `/loans/:id`

### Additional Endpoints
- GET `/loan-details`
- GET `/health`

## Testing
All API endpoints were tested using Postman. Testing included CRUD operations, pagination, genre filtering, invalid pagination input, and JOIN functionality.

## Database
The SQLite database contains three tables:
- readers
- books
- loans

## Team Project
**Project Name:** PageTurn Library  
**Assignment:** BDF Group Assignment