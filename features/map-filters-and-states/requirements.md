# Map — Alert filters and page states

- Provide independently selectable severity filters for every severity rendered by the map. A filter change must immediately update the visible map markers and close details for a marker that is no longer visible.
- When a state is selected, use it as the consulted area: display only alerts whose UF matches that state. With no selected state, the consulted area is Brazil.
- Show a clear empty state when the consulted area has no alerts matching the enabled severities. If all severities are disabled, explain how to restore markers.
- While the alert request is pending, announce loading and expose the map canvas as busy.
- If the alert request fails, preserve a usable map, describe the data unavailability, and offer a retry action.
- Controls and state messages must be accessible by keyboard and announced to assistive technology.
