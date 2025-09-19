import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import ErrorBoundary from "@/components/ErrorBoundary";

const BuggyComponent = () => {
  const [count, setCount] = useState(0);
  
  if (count > 2) {
    throw new Error("This is a test error to demonstrate Error Boundary functionality");
  }
  
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-medium mb-2">Test Component</h3>
      <p className="mb-4">Click the button to trigger an error after 3 clicks</p>
      <p className="mb-4">Current count: {count}</p>
      <Button onClick={() => setCount(count + 1)}>
        Increment Count
      </Button>
    </div>
  );
};

const TestErrorComponent = () => {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Error Boundary Test</h2>
      <p className="mb-6 text-muted-foreground">
        This page demonstrates how Error Boundaries catch and handle component errors.
      </p>
      
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    </div>
  );
};

export default TestErrorComponent;