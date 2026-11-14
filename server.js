const express = require('express');
const cors = require('cors');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const isValidId = (id) =>
    /^\d+$/.test(String(id)) && Number(id) > 0;

const handleError = (res, err) => {
    console.error(err.message);

    if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({
            error: 'Record already exists.'
        });
    }

    if (err.message.includes('FOREIGN KEY constraint failed')) {
        return res.status(409).json({
            error: 'Invalid relationship between records.'
        });
    }

    return res.status(500).json({
        error: 'Database operation failed.'
    });
};

// HOME
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to PageTurn Library API!'
    });
});

// HEALTH
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});


// ================= READERS =================

// ADD READER
app.post('/readers', (req, res) => {
    const { name, email } = req.body || {};

    if (
        typeof name !== 'string' ||
        !name.trim() ||
        typeof email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
        return res.status(400).json({
            error: 'Valid name and email are required.'
        });
    }

    db.run(
        'INSERT INTO readers (name, email) VALUES (?, ?)',
        [name.trim(), email.trim()],
        function (err) {
            if (err) return handleError(res, err);

            res.status(201).json({
                message: 'Reader created successfully.',
                id: this.lastID
            });
        }
    );
});

// GET ALL READERS
app.get('/readers', (req, res) => {
    db.all('SELECT * FROM readers ORDER BY id', [], (err, rows) => {
        if (err) return handleError(res, err);
        res.json(rows);
    });
});

// GET READER BY ID
app.get('/readers/:id', (req, res) => {
    if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid reader ID.' });
    }

    db.get(
        'SELECT * FROM readers WHERE id = ?',
        [req.params.id],
        (err, row) => {
            if (err) return handleError(res, err);

            if (!row) {
                return res.status(404).json({
                    error: 'Reader not found.'
                });
            }

            res.json(row);
        }
    );
});

// UPDATE READER
app.put('/readers/:id', (req, res) => {
    const { name, email } = req.body || {};

    if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid reader ID.' });
    }

    if (
        typeof name !== 'string' ||
        !name.trim() ||
        typeof email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
        return res.status(400).json({
            error: 'Valid name and email are required.'
        });
    }

    db.run(
        'UPDATE readers SET name = ?, email = ? WHERE id = ?',
        [name.trim(), email.trim(), req.params.id],
        function (err) {
            if (err) return handleError(res, err);

            if (!this.changes) {
                return res.status(404).json({
                    error: 'Reader not found.'
                });
            }

            res.json({ message: 'Reader updated successfully.' });
        }
    );
});

// DELETE READER
app.delete('/readers/:id', (req, res) => {
    if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid reader ID.' });
    }

    db.run(
        'DELETE FROM readers WHERE id = ?',
        [req.params.id],
        function (err) {
            if (err) return handleError(res, err);

            if (!this.changes) {
                return res.status(404).json({
                    error: 'Reader not found.'
                });
            }

            res.json({ message: 'Reader deleted successfully.' });
        }
    );
});


// ================= BOOKS =================

// ADD BOOK
app.post('/books', (req, res) => {
    const { name, genre } = req.body || {};

    if (
        typeof name !== 'string' || !name.trim() ||
        typeof genre !== 'string' || !genre.trim()
    ) {
        return res.status(400).json({
            error: 'Book name and genre are required.'
        });
    }

    db.run(
        'INSERT INTO books (name, genre) VALUES (?, ?)',
        [name.trim(), genre.trim()],
        function (err) {
            if (err) return handleError(res, err);

            res.status(201).json({
                message: 'Book added successfully.',
                id: this.lastID
            });
        }
    );
});

// GET BOOKS WITH SEARCH AND PAGINATION
app.get('/books', (req, res) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 5);
    const genre = typeof req.query.genre === 'string'
        ? req.query.genre.trim()
        : '';

    if (
        !Number.isInteger(page) || page < 1 ||
        !Number.isInteger(limit) || limit < 1 || limit > 100
    ) {
        return res.status(400).json({
            error: 'Invalid page or limit.'
        });
    }

    const where = genre
        ? 'WHERE LOWER(TRIM(genre)) LIKE LOWER(?)'
        : '';

    const params = genre ? [`%${genre}%`] : [];

    db.get(
        `SELECT COUNT(*) AS total FROM books ${where}`,
        params,
        (err, result) => {
            if (err) return handleError(res, err);

            db.all(
                `SELECT * FROM books ${where}
                 ORDER BY id LIMIT ? OFFSET ?`,
                [...params, limit, (page - 1) * limit],
                (err, books) => {
                    if (err) return handleError(res, err);

                    res.json({
                        total: result.total,
                        page,
                        limit,
                        totalPages: Math.ceil(result.total / limit),
                        data: books
                    });
                }
            );
        }
    );
});

// GET BOOK BY ID
app.get('/books/:id', (req, res) => {
    if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid book ID.' });
    }

    db.get(
        'SELECT * FROM books WHERE id = ?',
        [req.params.id],
        (err, book) => {
            if (err) return handleError(res, err);

            if (!book) {
                return res.status(404).json({
                    error: 'Book not found.'
                });
            }

            res.json(book);
        }
    );
});

// UPDATE BOOK
app.put('/books/:id', (req, res) => {
    const { name, genre } = req.body || {};

    if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid book ID.' });
    }

    if (
        typeof name !== 'string' || !name.trim() ||
        typeof genre !== 'string' || !genre.trim()
    ) {
        return res.status(400).json({
            error: 'Book name and genre are required.'
        });
    }

    db.run(
        'UPDATE books SET name = ?, genre = ? WHERE id = ?',
        [name.trim(), genre.trim(), req.params.id],
        function (err) {
            if (err) return handleError(res, err);

            if (!this.changes) {
                return res.status(404).json({
                    error: 'Book not found.'
                });
            }

            res.json({ message: 'Book updated successfully.' });
        }
    );
});

// DELETE BOOK
app.delete('/books/:id', (req, res) => {
    if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid book ID.' });
    }

    db.run(
        'DELETE FROM books WHERE id = ?',
        [req.params.id],
        function (err) {
            if (err) return handleError(res, err);

            if (!this.changes) {
                return res.status(404).json({
                    error: 'Book not found.'
                });
            }

            res.json({ message: 'Book deleted successfully.' });
        }
    );
});


// ================= LOANS =================

// ADD LOAN
app.post('/loans', (req, res) => {
    const {
        reader_id,
        book_id,
        loan_date,
        return_date = null,
        status = 'borrowed'
    } = req.body || {};

    if (
        !isValidId(reader_id) ||
        !isValidId(book_id) ||
        typeof loan_date !== 'string' ||
        !loan_date.trim() ||
        !['borrowed', 'returned'].includes(status)
    ) {
        return res.status(400).json({
            error: 'Valid reader_id, book_id, loan_date and status are required.'
        });
    }

    if (return_date !== null && typeof return_date !== 'string') {
        return res.status(400).json({
            error: 'Invalid return date.'
        });
    }

    // CHECK READER FIRST
    db.get(
        'SELECT id FROM readers WHERE id = ?',
        [reader_id],
        (err, reader) => {
            if (err) return handleError(res, err);

            if (!reader) {
                return res.status(404).json({
                    error: `Reader ID ${reader_id} does not exist.`
                });
            }

            // CHECK BOOK
            db.get(
                'SELECT id FROM books WHERE id = ?',
                [book_id],
                (err, book) => {
                    if (err) return handleError(res, err);

                    if (!book) {
                        return res.status(404).json({
                            error: `Book ID ${book_id} does not exist.`
                        });
                    }

                    // INSERT LOAN
                    db.run(
                        `INSERT INTO loans
                        (reader_id, book_id, loan_date, return_date, status)
                        VALUES (?, ?, ?, ?, ?)`,
                        [
                            Number(reader_id),
                            Number(book_id),
                            loan_date.trim(),
                            return_date,
                            status
                        ],
                        function (err) {
                            if (err) return handleError(res, err);

                            res.status(201).json({
                                message: 'Loan created successfully.',
                                id: this.lastID
                            });
                        }
                    );
                }
            );
        }
    );
});

// GET ALL LOANS
app.get('/loans', (req, res) => {
    db.all('SELECT * FROM loans ORDER BY id', [], (err, rows) => {
        if (err) return handleError(res, err);
        res.json(rows);
    });
});

// GET LOAN BY ID
app.get('/loans/:id', (req, res) => {
    if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid loan ID.' });
    }

    db.get(
        'SELECT * FROM loans WHERE id = ?',
        [req.params.id],
        (err, loan) => {
            if (err) return handleError(res, err);

            if (!loan) {
                return res.status(404).json({
                    error: 'Loan not found.'
                });
            }

            res.json(loan);
        }
    );
});

// UPDATE LOAN
app.put('/loans/:id', (req, res) => {
    const {
        reader_id,
        book_id,
        loan_date,
        return_date = null,
        status
    } = req.body || {};

    if (
        !isValidId(req.params.id) ||
        !isValidId(reader_id) ||
        !isValidId(book_id) ||
        typeof loan_date !== 'string' ||
        !loan_date.trim() ||
        !['borrowed', 'returned'].includes(status)
    ) {
        return res.status(400).json({
            error: 'Invalid loan details.'
        });
    }

    if (return_date !== null && typeof return_date !== 'string') {
        return res.status(400).json({
            error: 'Invalid return date.'
        });
    }

    db.run(
        `UPDATE loans
         SET reader_id = ?, book_id = ?, loan_date = ?,
             return_date = ?, status = ?
         WHERE id = ?`,
        [
            Number(reader_id),
            Number(book_id),
            loan_date.trim(),
            return_date,
            status,
            req.params.id
        ],
        function (err) {
            if (err) return handleError(res, err);

            if (!this.changes) {
                return res.status(404).json({
                    error: 'Loan not found.'
                });
            }

            res.json({ message: 'Loan updated successfully.' });
        }
    );
});

// DELETE LOAN
app.delete('/loans/:id', (req, res) => {
    if (!isValidId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid loan ID.' });
    }

    db.run(
        'DELETE FROM loans WHERE id = ?',
        [req.params.id],
        function (err) {
            if (err) return handleError(res, err);

            if (!this.changes) {
                return res.status(404).json({
                    error: 'Loan not found.'
                });
            }

            res.json({ message: 'Loan deleted successfully.' });
        }
    );
});


// ================= SQL JOIN =================

app.get('/loan-details', (req, res) => {
    const sql = `
        SELECT
            loans.id AS loan_id,
            readers.id AS reader_id,
            readers.name AS reader_name,
            readers.email AS reader_email,
            books.id AS book_id,
            books.name AS book_name,
            books.genre,
            loans.loan_date,
            loans.return_date,
            loans.status
        FROM loans
        INNER JOIN readers ON loans.reader_id = readers.id
        INNER JOIN books ON loans.book_id = books.id
        ORDER BY loans.id
    `;

    db.all(sql, [], (err, rows) => {
        if (err) return handleError(res, err);
        res.json(rows);
    });
});


// INVALID ROUTE
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found.'
    });
});

app.listen(PORT, () => {
    console.log(`PageTurn Library API running at http://localhost:${PORT}`);
});