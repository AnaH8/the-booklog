DROP TABLE book, book_info, note

-- book

CREATE TABLE book(
	id SERIAL PRIMARY KEY,
	title TEXT NOT NULL,
	isbn TEXT NOT NULL UNIQUE
);

-- book_info

CREATE TABLE book_info(
	id INT REFERENCES book(id) ON DELETE CASCADE,
	date_read DATE,
	rating INT,
	summary TEXT
);

-- note

CREATE TABLE note(
	id SERIAL PRIMARY KEY,
	book_id INT REFERENCES book(id) ON DELETE CASCADE,
	notes TEXT
);




