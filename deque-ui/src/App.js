import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import useDebounce from './helpers/useDebounce';

function App() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const debouncedSearch = useDebounce(query, 2000);

  const fetchBooks = async (query) => {
    console.log("query in api ", query);
    if (!query) return null;
    const response = await axios.get("http://localhost:3300/api/books", {
      params: {
        q: query,
        startIndex: page * pageSize,
        maxResults: pageSize,
      },
    });
    return response.data;
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["books", query, page, pageSize],
    queryFn: () => fetchBooks(debouncedSearch),
    keepPreviousData: true,
    enabled: !!query, // Only fetch if there's a query
  });

  console.log({error});

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0); // Reset to first page on new search
    console.log("changing search ", query);
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSearch} className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for books"
          className="border p-2 mr-2"
        />
        <button type="submit" className="bg-blue-500 text-white p-2">
          Search
        </button>
      </form>

      <div className="mb-4">
        <label>Results per page: </label>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="border p-2"
        >
          {[5, 10, 20].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error fetching data</p>
      ) : data ? (
        <div>
          <p>Total Results: {data.totalResults}</p>
          <p>Most Common Author: {data.statistics.mostCommonAuthor}</p>
          <p>
            Date Range: {data.statistics.earliestDate} -{" "}
            {data.statistics.latestDate}
          </p>
          <p>Response Time: {data.responseTime}</p>

          <ul>
            {data.books.map((book) => (
              <li key={book.id} className="border-b p-2">
                <p>
                  {book.volumeInfo.authors?.join(", ") || "Unknown Author"} -{" "}
                  {book.volumeInfo.title}
                </p>
                <details>
                  <summary>Details</summary>
                  <p>
                    {book.volumeInfo.description ||
                      "No description available for this book."}
                  </p>
                </details>
              </li>
            ))}
          </ul>

          <div className="flex justify-between mt-4">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              disabled={page === 0}
              className="bg-gray-500 text-white p-2"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={data.books.length < pageSize}
              className="bg-gray-500 text-white p-2"
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <p>Enter a search term to get started!</p>
      )}
    </div>
  );
}

export default App;
