import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';

const SpotPriceContext = createContext(null);

export const SpotPriceProvider = ({ children }) => {
  const [spots, setSpots] = useState(() => settingsService.getSpotPrices());
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refreshPrices = () => {
    // Slight simulated market tick for real-feel experience
    const jitter = (val, maxPct = 0.003) => {
      const delta = (Math.random() - 0.48) * (val * maxPct);
      return Math.round((val + delta) * 100) / 100;
    };

    setSpots(prev => {
      const updated = {
        gold: {
          ...prev.gold,
          price: jitter(prev.gold.price),
        },
        silver: {
          ...prev.silver,
          price: jitter(prev.silver.price),
        },
        platinum: {
          ...prev.platinum,
          price: jitter(prev.platinum.price),
        }
      };
      settingsService.updateSpotPrices(updated);
      return updated;
    });
    setLastUpdated(new Date());
  };

  return (
    <SpotPriceContext.Provider value={{ spots, refreshPrices, lastUpdated }}>
      {children}
    </SpotPriceContext.Provider>
  );
};

export const useSpotPrices = () => {
  const context = useContext(SpotPriceContext);
  if (!context) {
    throw new Error('useSpotPrices must be used within a SpotPriceProvider');
  }
  return context;
};

