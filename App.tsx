import { useState } from 'react';
import { SimulationProvider } from './context/SimulationContext';
import Landing from './pages/Landing';
import RiderLogin from './pages/RiderLogin';
import OpsLogin from './pages/OpsLogin';
import RiderApp from './pages/RiderApp';
import OpsApp from './pages/OpsApp';

type Screen = 'landing' | 'rider_login' | 'ops_login' | 'rider_app' | 'ops_app';

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [riderName, setRiderName] = useState('');

  return (
    <SimulationProvider>
      {screen === 'landing' && (
        <Landing
          onStartJourney={() => setScreen('rider_login')}
          onOperations={() => setScreen('ops_login')}
        />
      )}
      {screen === 'rider_login' && (
        <RiderLogin
          onLogin={name => { setRiderName(name); setScreen('rider_app'); }}
          onBack={() => setScreen('landing')}
        />
      )}
      {screen === 'ops_login' && (
        <OpsLogin
          onLogin={() => setScreen('ops_app')}
          onBack={() => setScreen('landing')}
        />
      )}
      {screen === 'rider_app' && (
        <RiderApp
          riderName={riderName}
          onLogout={() => setScreen('landing')}
        />
      )}
      {screen === 'ops_app' && (
        <OpsApp
          onLogout={() => setScreen('landing')}
        />
      )}
    </SimulationProvider>
  );
}
