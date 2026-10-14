import React from 'react';

// Anti-pattern demo file with raw hex and pixel values to demonstrate Gate 1 Linter
export const BadButton = () => {
  return (
    <button
      style={{
        backgroundColor: '#4F46E5', // Hardcoded hex! Gate 1 will suggest var(--color-bg-action-primary-default)
        color: '#FFFFFF',           // Hardcoded hex! Gate 1 will suggest var(--color-fg-on-action)
        padding: '16px',            // Hardcoded px! Gate 1 will suggest var(--layout-padding-control-x-md)
        borderRadius: '8px',        // Hardcoded px! Gate 1 will suggest var(--radius-control)
        fontSize: '14px',           // Hardcoded px!
        zIndex: 100,                // Hardcoded zIndex!
      }}
    >
      Anti-pattern Example
    </button>
  );
};
