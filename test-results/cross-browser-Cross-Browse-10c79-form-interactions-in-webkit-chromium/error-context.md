# Page snapshot

```yaml
- region "Map"
- link "/route":
  - /url: /route
- link "/table":
  - /url: /table
- button
- button
- button
- heading "Solvice Maps" [level=1]
- link "supported by TOMTOM":
  - /url: https://www.tomtom.com
- group:
  - radio "Car" [checked]
  - radio "Truck"
  - radio "Bike"
- text: Origin
- textbox "Origin": 4.357200100000001,50.84770289999999
- text: "Brussels, Belgium Confidence: 100% Brussels, Belgium Confidence: 90% Lombardenstraat 8, 2000 Antwerpen, Belgium Confidence: 80% Destination"
- textbox "Destination"
- text: Click on the map to place markers or enter addresses above
- region "Notifications alt+T"
- alert
```