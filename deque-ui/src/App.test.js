import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { rest } from "msw";
import { setupServer } from "msw/node";

// Mocking API
const server = setupServer(
  rest.get("http://localhost:3300/api/books", (req, res, ctx) => {
    const query = req.url.searchParams.get("q");
    const startIndex = parseInt(req.url.searchParams.get("startIndex"), 10);
    const maxResults = parseInt(req.url.searchParams.get("maxResults"), 10);

    if (query === "error") {
      return res(ctx.status(500), ctx.json({ message: "Internal Server Error" }));
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
        books: Array.from({ length: Math.min(maxResults, 50 - startIndex) }, (_, index) => ({
          id: index + startIndex,
          volumeInfo: {
            title: `Book ${index + startIndex}`,
            authors: ["Author A"],
            description: `Description for Book ${index + startIndex}`,
          },
        })),
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

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

  fireEvent.change(screen.getByPlaceholderText("Search for books"), {
    target: { value: "React" },
  });
  fireEvent.click(screen.getByText("Search"));

  await waitFor(() => {
    expect(screen.getByText("Total Results: 50")).toBeInTheDocument();
    expect(screen.getByText("Most Common Author: Author A")).toBeInTheDocument();
    expect(screen.getByText("Date Range: 2001 - 2023")).toBeInTheDocument();
  });
});


test("handles API errors", async () => {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );

  fireEvent.change(screen.getByPlaceholderText("Search for books"), {
    target: { value: "error" },
  });
  fireEvent.click(screen.getByText("Search"));

  await waitFor(() => {
    expect(screen.getByText("Error fetching data")).toBeInTheDocument();
  });
});


test("pagination works", async () => {
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

  await waitFor(() => {
    expect(screen.getByText("Book 0")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText("Next"));

  await waitFor(() => {
    expect(screen.getByText("Book 10")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText("Previous"));

  await waitFor(() => {
    expect(screen.getByText("Book 0")).toBeInTheDocument();
  });
});


test("updates results per page", async () => {
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

  await waitFor(() => {
    expect(screen.getAllByRole("listitem")).toHaveLength(10); // Default page size
  });

  fireEvent.change(screen.getByDisplayValue("10"), {
    target: { value: "20" },
  });

  await waitFor(() => {
    expect(screen.getAllByRole("listitem")).toHaveLength(20); // Updated page size
  });
});
