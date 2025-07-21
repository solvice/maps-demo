'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HelpCircle, BookOpen } from 'lucide-react';

interface TableDemoControlsProps {
  tableRequestText: string;
  onTableRequestChange: (text: string) => void;
  loading: boolean;
  calculationTime: number | null;
}

export function TableDemoControls({
  tableRequestText,
  onTableRequestChange,
  loading,
  calculationTime,
}: TableDemoControlsProps) {
  const exampleRequest = `{
  "coordinates": [
    [4.9, 50.2],
    [4.8, 50.4], 
    [5.0, 50.9],
    [5.05, 50.9]
  ],
  "sources": [0, 1, 2, 3],
  "destinations": [0, 1, 2, 3],
  "annotations": ["duration", "distance"],
  "vehicleType": "CAR",
  "engine": "OSM"
}`;

  return (
    <TooltipProvider>
      <Card className="absolute top-4 left-4 w-72 z-10 shadow-lg" data-testid="table-control-panel">
        <CardContent className="p-3 space-y-3">
          {/* Icons in top-right corner */}
          <div className="absolute top-3 right-3 flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
                  onClick={() => window.open('https://maps.solvice.io/table/intro', '_blank')}
                >
                  <BookOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Table API Documentation</p>
              </TooltipContent>
            </Tooltip>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" side="right" align="start">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Table Sync Demo</h3>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div>
                        <strong>📊 Distance/Duration Matrix:</strong>
                        <ul className="ml-2 mt-1 space-y-1">
                          <li>• Calculate travel times between multiple points</li>
                          <li>• Paste JSON request with coordinates array</li>
                          <li>• View interactive blue markers on map</li>
                        </ul>
                      </div>
                      
                      <div>
                        <strong>🗺️ Interactive Features:</strong>
                        <ul className="ml-2 mt-1 space-y-1">
                          <li>• Hover over markers to see connections</li>
                          <li>• Tooltips show distance/duration to other points</li>
                          <li>• Real-time calculation performance tracking</li>
                        </ul>
                      </div>
                      
                      <div>
                        <strong>🚗 Request Format:</strong>
                        <ul className="ml-2 mt-1 space-y-1">
                          <li>• coordinates: Array of [lng, lat] points</li>
                          <li>• sources/destinations: Index arrays (optional)</li>
                          <li>• vehicleType: CAR, TRUCK, BIKE</li>
                          <li>• engine: OSM, TOMTOM, GOOGLE</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Header with Solvice Maps Logo */}
          <div className="text-center pb-2">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-xl font-extrabold text-black tracking-wide">
                Solvice Maps
              </h1>
            </div>
            <div className="text-xs text-muted-foreground">
              <a 
                href="https://www.tomtom.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                supported by TOMTOM
              </a>
            </div>
          </div>

          {/* Calculation Time Display */}
          {calculationTime && (
            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                Calculated in {calculationTime}ms
              </span>
            </div>
          )}
          
          {/* Table Request Input */}
          <div className="space-y-2">
            <label htmlFor="table-request" className="block text-sm font-medium">
              Table Request (JSON format)
            </label>
            <textarea
              id="table-request"
              value={tableRequestText}
              onChange={(e) => onTableRequestChange(e.target.value)}
              placeholder={exampleRequest}
              className="w-full h-32 p-3 border rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-primary focus:border-primary"
              disabled={loading}
            />
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                Calculating matrix...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}