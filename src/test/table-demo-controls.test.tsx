import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TableDemoControls } from '@/components/table-demo-controls';
import { mockToast } from './utils/table-test-utils';
import { tableJSONFixtures } from './fixtures/table-api-responses';

// Test fails - need to write component first
describe('TableDemoControls Component', () => {
  const defaultProps = {
    tableRequestText: '',
    onTableRequestChange: vi.fn(),
    loading: false,
    calculationTime: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      // TDD: Write failing test first
      expect(() => {
        render(<TableDemoControls {...defaultProps} />);
      }).not.toThrow();
    });

    it('should display the main title', () => {
      render(<TableDemoControls {...defaultProps} />);
      
      expect(screen.getByText('Solvice Maps')).toBeInTheDocument();
    });

    it('should render the JSON textarea', () => {
      render(<TableDemoControls {...defaultProps} />);
      
      const textarea = screen.getByLabelText(/table request/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('should display documentation and help icons', () => {
      render(<TableDemoControls {...defaultProps} />);
      
      // Test for both documentation and help buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
      
      // Check for tooltips
      expect(screen.getByText('Table API Documentation')).toBeInTheDocument();
    });
  });

  describe('JSON Input Handling', () => {
    it('should display current table request text in textarea', () => {
      const testJSON = tableJSONFixtures.valid.simple;
      
      render(
        <TableDemoControls 
          {...defaultProps} 
          tableRequestText={testJSON}
        />
      );
      
      const textarea = screen.getByDisplayValue(testJSON);
      expect(textarea).toBeInTheDocument();
    });

    it('should call onTableRequestChange when textarea content changes', () => {
      const onTableRequestChange = vi.fn();
      const newJSON = tableJSONFixtures.valid.minimal;
      
      render(
        <TableDemoControls 
          {...defaultProps} 
          onTableRequestChange={onTableRequestChange}
        />
      );
      
      const textarea = screen.getByLabelText(/table request/i);
      fireEvent.change(textarea, { target: { value: newJSON } });
      
      expect(onTableRequestChange).toHaveBeenCalledWith(newJSON);
    });

    it('should show placeholder text when empty', () => {
      render(<TableDemoControls {...defaultProps} />);
      
      const textarea = screen.getByLabelText(/table request/i);
      expect(textarea).toHaveAttribute('placeholder');
      expect(textarea.getAttribute('placeholder')).toContain('coordinates');
    });
  });

  describe('Loading States', () => {
    it('should disable textarea when loading', () => {
      render(
        <TableDemoControls 
          {...defaultProps} 
          loading={true}
        />
      );
      
      const textarea = screen.getByLabelText(/table request/i);
      expect(textarea).toBeDisabled();
    });

    it('should show loading indicator when calculating', () => {
      render(
        <TableDemoControls 
          {...defaultProps} 
          loading={true}
        />
      );
      
      expect(screen.getByText(/calculating matrix/i)).toBeInTheDocument();
      
      // Check for spinning loader
      const loader = screen.getByRole('status', { hidden: true }) || 
                   screen.getByTestId('loading-spinner') ||
                   document.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });

    it('should not show loading indicator when not calculating', () => {
      render(
        <TableDemoControls 
          {...defaultProps} 
          loading={false}
        />
      );
      
      expect(screen.queryByText(/calculating matrix/i)).not.toBeInTheDocument();
    });
  });

  describe('Calculation Time Display', () => {
    it('should show calculation time when provided', () => {
      render(
        <TableDemoControls 
          {...defaultProps} 
          calculationTime={1500}
        />
      );
      
      expect(screen.getByText(/calculated in 1500ms/i)).toBeInTheDocument();
    });

    it('should not show calculation time when null', () => {
      render(
        <TableDemoControls 
          {...defaultProps} 
          calculationTime={null}
        />
      );
      
      expect(screen.queryByText(/calculated in/i)).not.toBeInTheDocument();
    });

    it('should format calculation time correctly', () => {
      render(
        <TableDemoControls 
          {...defaultProps} 
          calculationTime={2350}
        />
      );
      
      expect(screen.getByText(/2350ms/)).toBeInTheDocument();
    });
  });

  describe('Help System', () => {
    it('should open help popover when help icon is clicked', async () => {
      render(<TableDemoControls {...defaultProps} />);
      
      // Find the help button (HelpCircle icon)
      const helpButton = screen.getByRole('button', { name: /help/i }) ||
                        screen.getAllByRole('button').find(button => 
                          button.getAttribute('aria-label')?.includes('help') ||
                          button.querySelector('[data-testid="help-circle"]')
                        );
      
      expect(helpButton).toBeInTheDocument();
      
      fireEvent.click(helpButton!);
      
      // Check for help content in popover
      await waitFor(() => {
        expect(screen.getByText(/Table Sync Demo/i)).toBeInTheDocument();
        expect(screen.getByText(/Distance\/Duration Matrix/i)).toBeInTheDocument();
      });
    });

    it('should contain helpful usage instructions', async () => {
      render(<TableDemoControls {...defaultProps} />);
      
      const helpButton = screen.getAllByRole('button').find(button => 
        button.querySelector('[data-lucide="help-circle"]')
      );
      
      if (helpButton) {
        fireEvent.click(helpButton);
        
        await waitFor(() => {
          expect(screen.getByText(/Interactive Features/i)).toBeInTheDocument();
          expect(screen.getByText(/Request Format/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Documentation Links', () => {
    it('should have documentation button that opens external link', () => {
      const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
      
      render(<TableDemoControls {...defaultProps} />);
      
      // Find the documentation button (BookOpen icon)
      const docButton = screen.getAllByRole('button').find(button => 
        button.querySelector('[data-lucide="book-open"]')
      );
      
      expect(docButton).toBeInTheDocument();
      
      fireEvent.click(docButton!);
      
      expect(windowOpen).toHaveBeenCalledWith(
        'https://maps.solvice.io/table/intro', 
        '_blank'
      );
      
      windowOpen.mockRestore();
    });

    it('should have correct tooltip for documentation button', async () => {
      render(<TableDemoControls {...defaultProps} />);
      
      const docButton = screen.getAllByRole('button').find(button => 
        button.querySelector('[data-lucide="book-open"]')
      );
      
      expect(docButton).toBeInTheDocument();
      
      // Hover to show tooltip
      fireEvent.mouseEnter(docButton!);
      
      await waitFor(() => {
        expect(screen.getByText('Table API Documentation')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<TableDemoControls {...defaultProps} />);
      
      const textarea = screen.getByLabelText(/table request/i);
      expect(textarea).toHaveAttribute('id', 'table-request');
      
      const label = screen.getByText(/table request \(json format\)/i);
      expect(label).toHaveAttribute('for', 'table-request');
    });

    it('should be keyboard accessible', () => {
      render(<TableDemoControls {...defaultProps} />);
      
      const textarea = screen.getByLabelText(/table request/i);
      expect(textarea).toHaveAttribute('tabIndex');
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabIndex');
      });
    });

    it('should have proper focus management', () => {
      render(<TableDemoControls {...defaultProps} />);
      
      const textarea = screen.getByLabelText(/table request/i);
      
      // Focus should work correctly
      textarea.focus();
      expect(document.activeElement).toBe(textarea);
    });
  });

  describe('Error Boundaries', () => {
    it('should handle null props gracefully', () => {
      expect(() => {
        render(
          <TableDemoControls 
            tableRequestText={null as any}
            onTableRequestChange={null as any}
            loading={null as any}
            calculationTime={null}
          />
        );
      }).not.toThrow();
    });

    it('should handle undefined props gracefully', () => {
      expect(() => {
        render(
          <TableDemoControls 
            tableRequestText={undefined as any}
            onTableRequestChange={undefined as any}
            loading={undefined as any}
            calculationTime={undefined}
          />
        );
      }).not.toThrow();
    });
  });
});