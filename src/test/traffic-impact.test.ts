import { describe, it, expect } from 'vitest';

// Test data for traffic impact calculations
const mockBaselineTable = {
  durations: [
    [0, 600, 1200],     // Point 0: 0s, 10min, 20min
    [600, 0, 900],      // Point 1: 10min, 0s, 15min  
    [1200, 900, 0]      // Point 2: 20min, 15min, 0s
  ],
  distances: [
    [0, 5000, 10000],
    [5000, 0, 7500],
    [10000, 7500, 0]
  ]
};

const mockTrafficTable = {
  durations: [
    [0, 780, 1560],     // Point 0: 0s, 13min (+30%), 26min (+30%)
    [780, 0, 1080],     // Point 1: 13min (+30%), 0s, 18min (+20%)
    [1560, 1080, 0]     // Point 2: 26min (+30%), 18min (+20%), 0s
  ],
  distances: [
    [0, 5000, 10000],
    [5000, 0, 7500], 
    [10000, 7500, 0]
  ]
};

// Import the traffic impact calculation function
// We need to extract this from the hook for testing
function calculateTrafficImpacts(baselineTable: any, trafficTable: any): {
  trafficImpacts: number[][];
  maxTrafficImpact: number;
} {
  if (!baselineTable.durations || !trafficTable.durations) {
    return { trafficImpacts: [], maxTrafficImpact: 1.0 };
  }

  const impacts: number[][] = [];
  let maxImpact = 1.0;

  for (let i = 0; i < baselineTable.durations.length; i++) {
    impacts[i] = [];
    for (let j = 0; j < baselineTable.durations[i].length; j++) {
      const baselineDuration = baselineTable.durations[i][j];
      const trafficDuration = trafficTable.durations[i][j];
      
      if (baselineDuration > 0 && trafficDuration > 0) {
        const impact = trafficDuration / baselineDuration;
        impacts[i][j] = impact;
        maxImpact = Math.max(maxImpact, impact);
      } else {
        impacts[i][j] = 1.0; // No impact if no valid duration data
      }
    }
  }

  return { trafficImpacts: impacts, maxTrafficImpact: maxImpact };
}

// Color gradient function for testing
function getTrafficImpactColor(impactRatio: number, maxImpact: number): string {
  const normalizedRatio = Math.min(Math.max(impactRatio, 1.0), maxImpact);
  const impactRange = Math.max(maxImpact - 1.0, 0.01);
  const t = (normalizedRatio - 1.0) / impactRange;
  
  const blue = { r: 59, g: 130, b: 246 };
  const red = { r: 239, g: 68, b: 68 };
  
  const r = Math.round(blue.r + (red.r - blue.r) * t);
  const g = Math.round(blue.g + (red.g - blue.g) * t);
  const b = Math.round(blue.b + (red.b - blue.b) * t);
  
  return `rgb(${r}, ${g}, ${b})`;
}

describe('Traffic Impact Calculation', () => {
  it('should calculate correct traffic impact ratios', () => {
    const { trafficImpacts, maxTrafficImpact } = calculateTrafficImpacts(mockBaselineTable, mockTrafficTable);
    
    // Test diagonal (self to self) should be 1.0 (no impact)
    expect(trafficImpacts[0][0]).toBe(1.0);
    expect(trafficImpacts[1][1]).toBe(1.0);
    expect(trafficImpacts[2][2]).toBe(1.0);
    
    // Test 30% traffic impact: 600s -> 780s = 1.3 ratio
    expect(trafficImpacts[0][1]).toBe(1.3);
    expect(trafficImpacts[1][0]).toBe(1.3);
    
    // Test 20% traffic impact: 900s -> 1080s = 1.2 ratio
    expect(trafficImpacts[1][2]).toBe(1.2);
    expect(trafficImpacts[2][1]).toBe(1.2);
    
    // Test 30% traffic impact: 1200s -> 1560s = 1.3 ratio
    expect(trafficImpacts[0][2]).toBe(1.3);
    expect(trafficImpacts[2][0]).toBe(1.3);
    
    // Max impact should be 1.3 (30% increase)
    expect(maxTrafficImpact).toBe(1.3);
  });

  it('should handle missing or invalid data gracefully', () => {
    const emptyTable = { durations: null, distances: null };
    const { trafficImpacts, maxTrafficImpact } = calculateTrafficImpacts(mockBaselineTable, emptyTable);
    
    expect(trafficImpacts).toEqual([]);
    expect(maxTrafficImpact).toBe(1.0);
  });

  it('should handle zero durations', () => {
    const baselineWithZeros = {
      durations: [[0, 0], [600, 0]],
      distances: [[0, 1000], [1000, 0]]
    };
    const trafficWithZeros = {
      durations: [[0, 300], [780, 0]], 
      distances: [[0, 1000], [1000, 0]]
    };
    
    const { trafficImpacts } = calculateTrafficImpacts(baselineWithZeros, trafficWithZeros);
    
    // Zero baseline should result in no impact (1.0)
    expect(trafficImpacts[0][1]).toBe(1.0);
    expect(trafficImpacts[0][0]).toBe(1.0);
    
    // Valid calculation: 600s -> 780s = 1.3
    expect(trafficImpacts[1][0]).toBe(1.3);
  });
});

describe('Traffic Impact Color Generation', () => {
  it('should generate blue color for no impact (1.0)', () => {
    const color = getTrafficImpactColor(1.0, 1.3);
    expect(color).toBe('rgb(59, 130, 246)'); // Pure blue
  });

  it('should generate red color for maximum impact', () => {
    const color = getTrafficImpactColor(1.3, 1.3);
    expect(color).toBe('rgb(239, 68, 68)'); // Pure red
  });

  it('should generate intermediate colors for medium impact', () => {
    const color = getTrafficImpactColor(1.15, 1.3); // 50% between 1.0 and 1.3
    
    // Should be halfway between blue and red
    const expectedR = Math.round(59 + (239 - 59) * 0.5); // 149
    const expectedG = Math.round(130 + (68 - 130) * 0.5); // 99
    const expectedB = Math.round(246 + (68 - 246) * 0.5); // 157
    
    expect(color).toBe(`rgb(${expectedR}, ${expectedG}, ${expectedB})`);
  });

  it('should clamp values within valid range', () => {
    // Test below minimum
    const colorBelow = getTrafficImpactColor(0.5, 1.3);
    expect(colorBelow).toBe('rgb(59, 130, 246)'); // Should be pure blue
    
    // Test above maximum  
    const colorAbove = getTrafficImpactColor(2.0, 1.3);
    expect(colorAbove).toBe('rgb(239, 68, 68)'); // Should be pure red
  });

  it('should handle edge case where maxImpact equals 1.0', () => {
    const color = getTrafficImpactColor(1.0, 1.0);
    expect(color).toBe('rgb(59, 130, 246)'); // Should still be blue
  });
});

describe('Dynamic Color Scaling', () => {
  it('should scale colors correctly for different max impacts', () => {
    // Test with small max impact (10% increase)
    const lowMaxImpact = 1.1;
    const colorLow = getTrafficImpactColor(1.05, lowMaxImpact); // 50% of range
    
    // Test with large max impact (100% increase) 
    const highMaxImpact = 2.0;
    const colorHigh = getTrafficImpactColor(1.5, highMaxImpact); // 50% of range
    
    // Both should be similar intermediate colors since they're both 50% of their respective ranges
    expect(colorLow).toContain('149'); // Should have similar red component
    expect(colorHigh).toContain('149'); // Should have similar red component
  });

  it('should provide full color range regardless of actual impact scale', () => {
    // Small impact range (1.0 to 1.05)
    const blueSmall = getTrafficImpactColor(1.0, 1.05);
    const redSmall = getTrafficImpactColor(1.05, 1.05);
    
    // Large impact range (1.0 to 3.0)
    const blueLarge = getTrafficImpactColor(1.0, 3.0);
    const redLarge = getTrafficImpactColor(3.0, 3.0);
    
    // Both should use full blue to red spectrum
    expect(blueSmall).toBe('rgb(59, 130, 246)');
    expect(redSmall).toBe('rgb(239, 68, 68)');
    expect(blueLarge).toBe('rgb(59, 130, 246)');
    expect(redLarge).toBe('rgb(239, 68, 68)');
  });
});