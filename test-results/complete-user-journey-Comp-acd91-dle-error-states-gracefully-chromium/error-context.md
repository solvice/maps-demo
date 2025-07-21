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
- textbox "Origin"
- text: "Belgium Confidence: 100% Brussels, Belgium Confidence: 90% Antwerp, Belgium Confidence: 80% Destination"
- textbox "Destination"
- text: "Error: Address not found"
- button "Share"
- button "JSON"
- button "Steps"
- region "Notifications alt+T"
- alert
```