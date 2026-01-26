import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import WeeklyAgendaScreen from('../src/screens/WeeklyAgendaScreen');

// Mock dependencies
jest.mock('../services/itemService', () => ({
  getItems: jest.fn().mockResolvedValue([
    { id: 1, title: 'Task A', type: 'task', dueDate: new Date().toISOString(), userId: 'user-1' },
  ]),
}));

jest.mock('../services/aiService', () => ({
  enhanceWithAI: jest.fn().mockResolvedValue({ title: 'Weekly Plan', enhancedDescription: 'Summary...' }),
}));

describe('WeeklyAgendaScreen', () => {
  it('renders AI generated agenda after load', async () => {
    const { getByText } = render(<WeeklyAgendaScreen navigation={{}} route={{}} />);
    // wait for AI title to appear
    await waitFor(() => getByText(/Weekly Plan/i));
  });
});
