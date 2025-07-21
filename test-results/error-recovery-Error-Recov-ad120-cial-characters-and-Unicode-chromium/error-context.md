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
- textbox "Origin" [disabled]
- text: Destination
- textbox "Destination" [disabled]
- text: Calculating route...
- button "Share"
- button "JSON"
- button "Steps"
- region "Notifications alt+T"
- alert
```