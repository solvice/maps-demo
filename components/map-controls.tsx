'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Palette } from 'lucide-react';

interface MapControlsProps {
  mapStyle: string;
  onMapStyleChange: (style: string) => void;
}

export function MapControls({ mapStyle, onMapStyleChange }: MapControlsProps) {

  const lightStyle = 'https://cdn.solvice.io/styles/grayscale.json';
  const darkStyle = 'https://cdn.solvice.io/styles/dark.json';

  const toggleMapStyle = () => {
    const newStyle = mapStyle === lightStyle ? darkStyle : lightStyle;
    onMapStyleChange(newStyle);
  };

  const isCurrentlyDark = () => {
    return mapStyle === darkStyle;
  };

  return (
    <TooltipProvider>
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Map Style Control */}
        <Card className="p-1 shadow-lg">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isCurrentlyDark() ? 'default' : 'outline'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={toggleMapStyle}
              >
                <Palette className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isCurrentlyDark() ? 'Switch to grayscale style' : 'Switch to dark style'}</p>
            </TooltipContent>
          </Tooltip>
        </Card>




      </div>
    </TooltipProvider>
  );
}