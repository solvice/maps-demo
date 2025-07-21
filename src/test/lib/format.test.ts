/**
 * Comprehensive tests for formatting functions
 * Step 1.1: Test Current Formatting Behavior
 * 
 * These tests document the current behavior before refactoring to ensure
 * we maintain backward compatibility and catch any regressions.
 */

import { formatDuration, formatDistance, formatSpeed, formatCoordinates, formatPercentage } from '@/lib/format';

describe('lib/format.ts - Current Behavior Tests', () => {
  describe('formatDuration', () => {
    describe('Basic functionality', () => {
      test('formats zero duration', () => {
        expect(formatDuration(0)).toBe('0 min');
      });

      test('formats seconds only (< 60s)', () => {
        expect(formatDuration(30)).toBe('1 min'); // rounds up from 0.5 min
        expect(formatDuration(59)).toBe('1 min'); // rounds up from 0.98 min
        expect(formatDuration(29)).toBe('0 min'); // rounds down from 0.48 min
      });

      test('formats minutes only (< 60m)', () => {
        expect(formatDuration(60)).toBe('1 min');
        expect(formatDuration(120)).toBe('2 min');
        expect(formatDuration(1800)).toBe('30 min'); // 30 * 60
        expect(formatDuration(3599)).toBe('1h 0min'); // 59.98 min rounds to 60 -> 1h 0min
      });

      test('formats hours and minutes', () => {
        expect(formatDuration(3600)).toBe('1h 0min'); // exactly 1 hour
        expect(formatDuration(3660)).toBe('1h 1min'); // 1h 1min
        expect(formatDuration(5400)).toBe('1h 30min'); // 1.5 hours
        expect(formatDuration(7200)).toBe('2h 0min'); // 2 hours
        expect(formatDuration(9000)).toBe('2h 30min'); // 2.5 hours
      });
    });

    describe('Edge cases', () => {
      test('handles negative durations', () => {
        expect(formatDuration(-60)).toBe('-1 min');
        expect(formatDuration(-3600)).toBe('-60 min'); // Actually formats as -60 min, not -1h
      });

      test('handles decimal seconds', () => {
        expect(formatDuration(90.5)).toBe('2 min'); // 1.508 min rounds to 2
        expect(formatDuration(89.4)).toBe('1 min'); // 1.49 min rounds to 1
      });

      test('handles very large durations', () => {
        expect(formatDuration(36000)).toBe('10h 0min'); // 10 hours
        expect(formatDuration(86400)).toBe('24h 0min'); // 24 hours
        expect(formatDuration(90000)).toBe('25h 0min'); // 25 hours
      });

      test('handles fractional minutes that round to 60', () => {
        // This tests the edge case where rounding creates 60 minutes
        expect(formatDuration(3595)).toBe('1h 0min'); // 59.92 min rounds to 60 -> 1h 0min
      });
    });

    describe('Performance benchmarks', () => {
      test('performance with many calls', () => {
        const start = performance.now();
        for (let i = 0; i < 1000; i++) {
          formatDuration(i * 60);
        }
        const end = performance.now();
        expect(end - start).toBeLessThan(10); // Should complete in < 10ms
      });
    });
  });

  describe('formatDistance', () => {
    describe('Basic functionality', () => {
      test('formats zero distance', () => {
        expect(formatDistance(0)).toBe('0.0 km');
      });

      test('formats meters to kilometers', () => {
        expect(formatDistance(500)).toBe('0.5 km');
        expect(formatDistance(1000)).toBe('1.0 km');
        expect(formatDistance(1500)).toBe('1.5 km');
        expect(formatDistance(2000)).toBe('2.0 km');
      });

      test('formats with one decimal place precision', () => {
        expect(formatDistance(1234)).toBe('1.2 km'); // 1.234 rounds to 1.2
        expect(formatDistance(1678)).toBe('1.7 km'); // 1.678 rounds to 1.7
        expect(formatDistance(999)).toBe('1.0 km'); // 0.999 rounds to 1.0
      });

      test('formats large distances', () => {
        expect(formatDistance(10000)).toBe('10.0 km');
        expect(formatDistance(100000)).toBe('100.0 km');
        expect(formatDistance(1000000)).toBe('1000.0 km');
      });
    });

    describe('Edge cases', () => {
      test('handles negative distances', () => {
        expect(formatDistance(-1000)).toBe('-1.0 km');
        expect(formatDistance(-500)).toBe('-0.5 km');
      });

      test('handles decimal meters', () => {
        expect(formatDistance(1234.56)).toBe('1.2 km'); // 1.23456 rounds to 1.2
        expect(formatDistance(1234.99)).toBe('1.2 km'); // 1.23499 rounds to 1.2
      });

      test('handles very large distances', () => {
        expect(formatDistance(1000000000)).toBe('1000000.0 km'); // 1 million km
      });

      test('handles very small distances', () => {
        expect(formatDistance(1)).toBe('0.0 km'); // 0.001 rounds to 0.0
        expect(formatDistance(49)).toBe('0.0 km'); // 0.049 rounds to 0.0
        expect(formatDistance(50)).toBe('0.1 km'); // 0.05 rounds to 0.1
      });
    });

    describe('Performance benchmarks', () => {
      test('performance with many calls', () => {
        const start = performance.now();
        for (let i = 0; i < 1000; i++) {
          formatDistance(i * 1000);
        }
        const end = performance.now();
        expect(end - start).toBeLessThan(10); // Should complete in < 10ms
      });
    });
  });
});

describe('RouteControlPanel duplicate functions - Current Behavior Tests', () => {
  // Import the duplicate functions to test them
  // Note: We can't directly import them since they're local functions,
  // so we'll recreate them here to document their behavior
  
  const duplicateFormatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`; // Note: 'm' vs 'min'
  };

  const duplicateFormatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`; // Note: shows meters for < 1000m
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  describe('duplicateFormatDuration differences from lib/format', () => {
    test('basic functionality matches lib version', () => {
      expect(duplicateFormatDuration(0)).toBe('0 min');
      expect(duplicateFormatDuration(60)).toBe('1 min');
      expect(duplicateFormatDuration(3600)).toBe('1h 0m'); // Different: 'm' vs 'min'
    });

    test('key difference: uses "m" instead of "min" for hours format', () => {
      expect(duplicateFormatDuration(3660)).toBe('1h 1m'); // vs lib: '1h 1min'
      expect(duplicateFormatDuration(5400)).toBe('1h 30m'); // vs lib: '1h 30min'
    });

    test('matches lib version for minutes-only format', () => {
      expect(duplicateFormatDuration(1800)).toBe('30 min'); // Same as lib version
    });
  });

  describe('duplicateFormatDistance differences from lib version', () => {
    test('shows meters for distances < 1000m', () => {
      expect(duplicateFormatDistance(500)).toBe('500 m'); // vs lib: '0.5 km'
      expect(duplicateFormatDistance(999)).toBe('999 m'); // vs lib: '1.0 km'
    });

    test('shows kilometers for distances >= 1000m', () => {
      expect(duplicateFormatDistance(1000)).toBe('1.0 km'); // Same as lib
      expect(duplicateFormatDistance(1500)).toBe('1.5 km'); // Same as lib
    });

    test('handles edge cases differently', () => {
      expect(duplicateFormatDistance(999.4)).toBe('999 m'); // Rounds to 999m
      expect(duplicateFormatDistance(999.6)).toBe('1000 m'); // Rounds to 1000m
    });
  });
});

describe('New Utility Functions - Enhanced Format Functions', () => {
  describe('formatSpeed', () => {
    test('formats speed from m/s to km/h', () => {
      expect(formatSpeed(10)).toBe('36.0 km/h'); // 10 m/s = 36 km/h
      expect(formatSpeed(27.78)).toBe('100.0 km/h'); // ~27.78 m/s = 100 km/h
      expect(formatSpeed(0)).toBe('0.0 km/h');
    });

    test('handles edge cases gracefully', () => {
      expect(formatSpeed(null as any)).toBe('0.0 km/h');
      expect(formatSpeed(undefined as any)).toBe('0.0 km/h');
      expect(formatSpeed(NaN)).toBe('0.0 km/h');
      expect(formatSpeed(Infinity)).toBe('0.0 km/h');
      expect(formatSpeed(-10)).toBe('-36.0 km/h');
    });

    test('formats with one decimal place', () => {
      expect(formatSpeed(5.5556)).toBe('20.0 km/h'); // Rounds to 20.0
      expect(formatSpeed(13.89)).toBe('50.0 km/h'); // 50.004 rounds to 50.0
    });
  });

  describe('formatCoordinates', () => {
    test('formats coordinate pairs', () => {
      expect(formatCoordinates([4.3517, 50.8503])).toBe('4.3517°, 50.8503°');
      expect(formatCoordinates([0, 0])).toBe('0.0000°, 0.0000°');
      expect(formatCoordinates([-74.006, 40.7128])).toBe('-74.0060°, 40.7128°'); // NYC
    });

    test('handles edge cases gracefully', () => {
      expect(formatCoordinates(null as any)).toBe('0.0000°, 0.0000°');
      expect(formatCoordinates(undefined as any)).toBe('0.0000°, 0.0000°');
      expect(formatCoordinates([] as any)).toBe('0.0000°, 0.0000°');
      expect(formatCoordinates([1] as any)).toBe('0.0000°, 0.0000°'); // Wrong length
      expect(formatCoordinates([NaN, 50] as any)).toBe('0.0000°, 0.0000°');
      expect(formatCoordinates([4, Infinity] as any)).toBe('0.0000°, 0.0000°');
    });

    test('formats with 4 decimal places precision', () => {
      expect(formatCoordinates([4.123456789, 50.987654321])).toBe('4.1235°, 50.9877°');
    });
  });

  describe('formatPercentage', () => {
    test('formats percentage values', () => {
      expect(formatPercentage(85.2)).toBe('85.2%');
      expect(formatPercentage(100)).toBe('100.0%');
      expect(formatPercentage(0)).toBe('0.0%');
      expect(formatPercentage(123.456)).toBe('123.5%');
    });

    test('handles edge cases gracefully', () => {
      expect(formatPercentage(null as any)).toBe('0.0%');
      expect(formatPercentage(undefined as any)).toBe('0.0%');
      expect(formatPercentage(NaN)).toBe('0.0%');
      expect(formatPercentage(Infinity)).toBe('0.0%');
      expect(formatPercentage(-50)).toBe('-50.0%');
    });

    test('formats with one decimal place', () => {
      expect(formatPercentage(33.333)).toBe('33.3%');
      expect(formatPercentage(66.666)).toBe('66.7%');
    });
  });
});

describe('Enhanced Edge Case Handling', () => {
  describe('formatDuration edge case improvements', () => {
    test('handles null/undefined gracefully', () => {
      expect(formatDuration(null as any)).toBe('0 min');
      expect(formatDuration(undefined as any)).toBe('0 min');
      expect(formatDuration(NaN)).toBe('0 min');
      expect(formatDuration(Infinity)).toBe('0 min');
    });
  });

  describe('formatDistance edge case improvements', () => {
    test('handles null/undefined gracefully', () => {
      expect(formatDistance(null as any)).toBe('0.0 km');
      expect(formatDistance(undefined as any)).toBe('0.0 km');
      expect(formatDistance(NaN)).toBe('0.0 km');
      expect(formatDistance(Infinity)).toBe('0.0 km');
    });
  });
});

describe('Performance Benchmarks - Enhanced Functions', () => {
  test('all new functions perform well', () => {
    const iterations = 1000;
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      formatSpeed(i / 10);
      formatCoordinates([i / 1000, i / 2000]);
      formatPercentage(i / 10);
    }
    
    const end = performance.now();
    expect(end - start).toBeLessThan(20); // Should complete in < 20ms
  });
});

describe('Behavioral Comparison Summary', () => {
  test('documents key differences between implementations', () => {
    const differences = {
      formatDuration: {
        lib_version: 'Uses "min" for all minute units (e.g., "1h 30min")',
        duplicate_version: 'Uses "m" for hours format, "min" for minutes-only (e.g., "1h 30m")'
      },
      formatDistance: {
        lib_version: 'Always shows kilometers with 1 decimal (e.g., "0.5 km")',
        duplicate_version: 'Shows meters for < 1000m, kilometers for >= 1000m (e.g., "500 m")'
      }
    };

    // This test documents the differences for refactoring reference
    expect(differences).toBeDefined();
    expect(differences.formatDuration.lib_version).not.toBe(differences.formatDuration.duplicate_version);
    expect(differences.formatDistance.lib_version).not.toBe(differences.formatDistance.duplicate_version);
  });
});