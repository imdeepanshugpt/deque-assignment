// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

class BroadcastChannelMock {
  constructor() {
    this.onmessage = null;
  }

  postMessage() {}
  close() {}
}

global.BroadcastChannel = BroadcastChannelMock;

global.TransformStream =
  require("stream/web").TransformStream ||
  class {
    constructor() {
      throw new Error("TransformStream is not supported in this environment");
    }
  };

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        totalResults: 50,
        books: [],
      }),
  })
);
