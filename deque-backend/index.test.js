const request = require("supertest");
const express = require("express");
const index = require("./index"); 

jest.mock("axios"); // Mock axios
const axios = require("axios");

// Mock .env API_KEY
process.env.API_KEY = "fake_api_key";

describe("Express index - Google Books API", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/books with valid query", async () => {
    const mockBooks = [
      {
        volumeInfo: {
          title: "Book 1",
          authors: ["Author 1"],
          publishedDate: "2020-01-01",
        },
      },
      {
        volumeInfo: {
          title: "Book 2",
          authors: ["Author 1", "Author 2"],
          publishedDate: "2018-05-05",
        },
      },
    ];

    // Mock Axios response
    axios.get.mockResolvedValueOnce({
      data: {
        totalItems: 2,
        items: mockBooks,
      },
    });

    const response = await request(index).get("/api/books").query({ q: "test" });

    expect(response.status).toBe(200);
    expect(response.body.books).toHaveLength(2);
    expect(response.body.statistics.mostCommonAuthor).toBe("Author 1");
    expect(response.body.statistics.earliestDate).toBe("2018-05-05T00:00:00.000Z");
    expect(response.body.statistics.latestDate).toBe("2020-01-01T00:00:00.000Z");
    expect(response.body.responseTime).toBeDefined();
  });

  test("GET /api/books handles API errors", async () => {
    // Mock Axios error
    axios.get.mockRejectedValueOnce(new Error("Google Books API Error"));

    const response = await request(index).get("/api/books").query({ q: "test" });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe("Error fetching data from Google Books API");
  });

  test("GET /api/books with no results", async () => {
    // Mock Axios empty response
    axios.get.mockResolvedValueOnce({
      data: {
        totalItems: 0,
        items: [],
      },
    });

    const response = await request(index).get("/api/books").query({ q: "nonexistent" });

    expect(response.status).toBe(200);
    expect(response.body.books).toEqual([]);
    expect(response.body.totalResults).toBe(0);
    expect(response.body.statistics.mostCommonAuthor).toBe("");
  });
});
