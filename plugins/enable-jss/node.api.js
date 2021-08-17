import React from "react";
import { JssProvider, SheetsRegistry } from "react-jss";

// Create the sheets registry
const registry = new SheetsRegistry();

// Define a function to generate class names
let counter = 0;
const myGenerateId = (rule, sheet) => {
  return `jss-${rule.key}-${counter++}`;
};

export default () => ({
  beforeRenderToElement:
    (App, { meta }) =>
    (props) => {
      return (
        <JssProvider registry={registry} generateId={myGenerateId}>
          <App {...props} />
        </JssProvider>
      );
    },
  headElements: (elements, { meta }) => [
    ...elements,
    <style id="jss-server-side" dangerouslySetInnerHTML={{ __html: registry.toString() }} />,
  ],
});
