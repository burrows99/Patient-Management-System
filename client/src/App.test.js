import { render, screen } from '@testing-library/react';
import App from './App';

test('renders NHS MOA Triage header', () => {
  render(<App />);
  const heading = screen.getByText(/NHS MOA Triage/i);
  expect(heading).toBeInTheDocument();
});
