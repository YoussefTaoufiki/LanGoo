import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FocusSession {
  duration: number;
  timestamp: number;
}

interface FocusState {
  sessions: FocusSession[];
}

const initialState: FocusState = {
  sessions: [],
};

const focusSlice = createSlice({
  name: 'focus',
  initialState,
  reducers: {
    addFocusSession: (state, action: PayloadAction<FocusSession>) => {
      state.sessions.push(action.payload);
    },
    clearFocusSessions: (state) => {
      state.sessions = [];
    },
  },
});

export const { addFocusSession, clearFocusSessions } = focusSlice.actions;
export default focusSlice.reducer; 