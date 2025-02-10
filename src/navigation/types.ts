export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  Dashboard: undefined;
  Reader: { bookId: string };
  Focus: undefined;
  Settings: undefined;
  FileManagement: undefined;
  // Add more screens here as needed
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 