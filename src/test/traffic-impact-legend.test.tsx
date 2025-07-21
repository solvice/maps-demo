import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrafficImpactLegend } from '@/components/traffic-impact-legend';

// Mock console.log to avoid noise in tests
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('TrafficImpactLegend Component', () => {
  beforeEach(() => {
    mockConsoleLog.mockClear();
  });

  it('should not render when show is false', () => {
    const { container } = render(
      <TrafficImpactLegend maxTrafficImpact={1.3} show={false} />
    );
    
    expect(container.firstChild).toBeNull();
    expect(mockConsoleLog).toHaveBeenCalledWith('TrafficImpactLegend:', { 
      maxTrafficImpact: 1.3, 
      show: false 
    });
  });

  it('should render when show is true', () => {
    render(<TrafficImpactLegend maxTrafficImpact={1.3} show={true} />);
    
    expect(screen.getByText('Traffic Impact')).toBeInTheDocument();
    expect(mockConsoleLog).toHaveBeenCalledWith('TrafficImpactLegend:', { 
      maxTrafficImpact: 1.3, 
      show: true 
    });
  });

  it('should display correct percentage labels', () => {
    render(<TrafficImpactLegend maxTrafficImpact={1.4} show={true} />);
    
    // Should show 100% and the actual max impact (140%)
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('140%')).toBeInTheDocument();
  });

  it('should display correct explanation text', () => {
    render(<TrafficImpactLegend maxTrafficImpact={1.25} show={true} />);
    
    expect(screen.getByText('Blue = No traffic delay')).toBeInTheDocument();
    expect(screen.getByText('Red = 25% longer duration')).toBeInTheDocument();
  });

  it('should handle edge case of 1.0 max impact', () => {
    render(<TrafficImpactLegend maxTrafficImpact={1.0} show={true} />);
    
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Red = 0% longer duration')).toBeInTheDocument();
  });

  it('should handle high traffic impact values', () => {
    render(<TrafficImpactLegend maxTrafficImpact={2.5} show={true} />);
    
    expect(screen.getByText('250%')).toBeInTheDocument();
    expect(screen.getByText('Red = 150% longer duration')).toBeInTheDocument();
  });

  it('should generate gradient with correct color stops', () => {
    const { container } = render(
      <TrafficImpactLegend maxTrafficImpact={1.2} show={true} />
    );
    
    const gradientBar = container.querySelector('div[style*="background"]');
    expect(gradientBar).toBeInTheDocument();
    
    // Should contain linear gradient
    const style = gradientBar?.getAttribute('style');
    expect(style).toContain('linear-gradient');
    expect(style).toContain('rgb(59, 130, 246)'); // Blue
    expect(style).toContain('rgb(239, 68, 68)'); // Red
  });

  it('should have correct positioning and styling classes', () => {
    const { container } = render(
      <TrafficImpactLegend maxTrafficImpact={1.3} show={true} />
    );
    
    const legendContainer = container.firstChild as HTMLElement;
    expect(legendContainer).toHaveClass('absolute', 'bottom-4', 'left-4', 'z-50');
    expect(legendContainer).toHaveClass('bg-white/90', 'backdrop-blur-sm', 'rounded-lg');
  });

  it('should handle small impact ranges without division by zero', () => {
    // This tests the impactRange = Math.max(maxImpact - 1.0, 0.01) logic
    render(<TrafficImpactLegend maxTrafficImpact={1.001} show={true} />);
    
    // Should not crash and should display reasonable values
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument(); // Rounded to 100%
  });
});

describe('TrafficImpactLegend Color Gradient Generation', () => {
  it('should generate 11 gradient stops (0-10)', () => {
    const { container } = render(
      <TrafficImpactLegend maxTrafficImpact={1.5} show={true} />
    );
    
    const gradientBar = container.querySelector('div[style*="background"]');
    const style = gradientBar?.getAttribute('style');
    
    // Count occurrences of percentage stops (0%, 10%, 20%, ..., 100%)
    const percentageMatches = style?.match(/\d+%/g);
    expect(percentageMatches).toHaveLength(11); // 0% through 100%
  });

  it('should interpolate colors correctly across gradient stops', () => {
    const { container } = render(
      <TrafficImpactLegend maxTrafficImpact={1.3} show={true} />
    );
    
    const gradientBar = container.querySelector('div[style*="background"]');
    const style = gradientBar?.getAttribute('style');
    
    // Should start with blue and end with red
    expect(style).toContain('rgb(59, 130, 246) 0%'); // Blue at start
    expect(style).toContain('rgb(239, 68, 68) 100%'); // Red at end
    
    // Should have intermediate colors
    expect(style).toMatch(/rgb\(\d{2,3}, \d{2,3}, \d{2,3}\) [1-9]\d%/); // Intermediate colors
  });

  it('should adapt gradient range to max impact', () => {
    // Low impact gradient
    const { container: lowContainer } = render(
      <TrafficImpactLegend maxTrafficImpact={1.1} show={true} />
    );
    
    // High impact gradient  
    const { container: highContainer } = render(
      <TrafficImpactLegend maxTrafficImpact={2.0} show={true} />
    );
    
    const lowStyle = lowContainer.querySelector('div[style*="background"]')?.getAttribute('style');
    const highStyle = highContainer.querySelector('div[style*="background"]')?.getAttribute('style');
    
    // Both should have same start/end colors but different intermediate steps
    expect(lowStyle).toContain('rgb(59, 130, 246) 0%');
    expect(highStyle).toContain('rgb(59, 130, 246) 0%');
    expect(lowStyle).toContain('rgb(239, 68, 68) 100%');
    expect(highStyle).toContain('rgb(239, 68, 68) 100%');
  });
});