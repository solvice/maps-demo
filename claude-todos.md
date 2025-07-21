- top refactoring components
- multi point route
- always show speed profile pane
-


/plan-tdd  if traffic control button is enabled , you should do 2 requests instead of one. the second request is the
  traffic request where everything is the same besides routingEngine and departureTime. the goal is that we can compare
  the result (duration) of the traffic request. we should then show that in the result duration pane. for instance
  regular request is duration: 23 min and the traffic request (with engine TOMTOM and departuretime filled in) is 26
  minutes. that means there was an extra 3 minutes: +3. that should be highlighted. how would you go about it.
