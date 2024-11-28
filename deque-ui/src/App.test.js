import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { http } from "msw";
import { setupServer } from "msw/node";

jest.mock("axios");

let server;

beforeAll(async () => {
  server = setupServer(
    http.get("http://localhost:3300/api/books", (req, res, ctx) => {
      const query = req.url.searchParams.get("q");
      const startIndex = parseInt(req.url.searchParams.get("startIndex"), 10);
      const maxResults = parseInt(req.url.searchParams.get("maxResults"), 10);

      if (query === "error") {
        return res(
          ctx.status(500),
          ctx.json({ message: "Internal Server Error" })
        );
      }

      return res(
        ctx.json({
          totalResults: 50,
          statistics: {
            mostCommonAuthor: "Author A",
            earliestDate: "2001",
            latestDate: "2023",
          },
          responseTime: "200ms",
          books: Array.from(
            { length: Math.min(maxResults, 50 - startIndex) },
            (_, index) => ({
              id: index + startIndex,
              volumeInfo: {
                title: `Book ${index + startIndex}`,
                authors: ["Author A"],
                description: `Description for Book ${index + startIndex}`,
              },
            })
          ),
        })
      );
    })
  );
  await server.listen();
});
afterEach(() => {
  if (server) server.resetHandlers();
});

afterAll(() => {
  if (server) server.close();
});

test("renders the App component", () => {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
  expect(screen.getByPlaceholderText("Search for books")).toBeInTheDocument();
});

test("displays loading state during fetch", async () => {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );

  fireEvent.change(screen.getByPlaceholderText("Search for books"), {
    target: { value: "React" },
  });
  fireEvent.click(screen.getByText("Search"));

  expect(screen.getByText("Loading...")).toBeInTheDocument();
});

test("displays fetched data", async () => {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );

  fireEvent.change(screen.getByPlaceholderText(/search for books/i), {
    target: { value: "Book" },
  });
  fireEvent.click(screen.getByText(/search/i));
  const text = screen.queryByText("Error fetching data");
  expect(text).not.toBeInTheDocument();
});
