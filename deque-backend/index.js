require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 3300;
const API_KEY = process.env.API_KEY;

app.use(cors());
app.use(express.json());

// Endpoint to search books
app.get("/api/books", async (req, res) => {
  const { q, startIndex = 0, maxResults = 10 } = req.query;
//   console.log({ q });

  const startTime = new Date();
  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?key=${API_KEY}&q=${q}&startIndex=${startIndex}&maxResults=${maxResults}`
    );
    const endTime = new Date();

    const books = response.data.items || [];
    const statistics = calculateStatistics(books);

    res.json({
      books,
      totalResults: response.data.totalItems,
      statistics,
      responseTime: `${endTime - startTime}ms`,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching data from Google Books API" });
  }
});

// Utility to calculate statistics
function calculateStatistics(books) {
  const authorsCount = {};
  let earliestDate = new Date();
  let latestDate = new Date(0);

  books.forEach((book) => {
    const authors = book.volumeInfo.authors || [];
    authors.forEach((author) => {
      authorsCount[author] = (authorsCount[author] || 0) + 1;
    });

    const publishedDate = new Date(book.volumeInfo.publishedDate);
    if (!isNaN(publishedDate)) {
      if (publishedDate < earliestDate) earliestDate = publishedDate;
      if (publishedDate > latestDate) latestDate = publishedDate;
    }
  });

  const mostCommonAuthor = Object.entries(authorsCount).reduce(
    (a, b) => (b[1] > a[1] ? b : a),
    ["", 0]
  )[0];

  return {
    mostCommonAuthor,
    earliestDate: earliestDate.toISOString(),
    latestDate: latestDate.toISOString(),
  };
}

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);


module.exports = app;