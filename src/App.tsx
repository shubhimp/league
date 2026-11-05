import HackHubPage from './HackHubPage';

function App() {
  return (
    <HackHubPage
      onBackToMain={() => {
        window.location.href = 'https://www.nerdsroom.org';
      }}
    />
  );
}

export default App;
