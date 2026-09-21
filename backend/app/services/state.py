import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.models.domain import (
    Event, Zone, ZoneTelemetry, OperationalIssue, Prediction,
    Recommendation, Action, SystemHealth
)
from app.realtime.connection import manager

class StateManager:
    def __init__(self):
        event_name = os.getenv("EVENT_NAME", "Development Seed Event")
        self.event: Optional[Event] = Event(
            id="seed-event",
            name=event_name,
            startTime=datetime.now(timezone.utc)
        )
        self.zones: Dict[str, Zone] = {}
        self.telemetry: Dict[str, ZoneTelemetry] = {}
        self.issues: Dict[str, OperationalIssue] = {}
        self.predictions: Dict[str, Prediction] = {}
        self.recommendations: Dict[str, Recommendation] = {}
        self.actions: Dict[str, Action] = {}
        self.system_health: Optional[SystemHealth] = None

    async def ingest_simulator_zones(self, raw_zones: List[Dict[str, Any]]):
        """
        Adapter logic: processes raw simulator zone definitions and telemetry,
        updating the canonical backend state.
        """
        for z_data in raw_zones:
            zone_id = z_data.get('id')
            if not zone_id:
                continue

            # Map legacy count/ratio to canonical occupancy/occupancyPercentage
            occupancy = z_data.get('count', 0)
            occupancy_percentage = z_data.get('ratio', 0.0)

            # Ensure the zone exists in state
            if zone_id not in self.zones:
                try:
                    new_zone = Zone(
                        id=zone_id,
                        name=z_data.get('name', ''),
                        capacity=z_data.get('capacity', 1000),
                        occupancy=occupancy,
                        occupancyPercentage=occupancy_percentage,
                        netFlow=z_data.get('netFlow', 0),
                        risk=z_data.get('risk', 'safe'),
                        lng=z_data.get('lng', 0.0),
                        lat=z_data.get('lat', 0.0),
                        w=z_data.get('w', 90),
                        h=z_data.get('h', 60),
                        neighbors=z_data.get('neighbors', [])
                    )
                    self.zones[zone_id] = new_zone
                    await manager.broadcast_event('zone.updated', zone_id, new_zone.model_dump())
                except Exception as e:
                    # Ignore malformed zone initialization
                    continue
            else:
                existing = self.zones[zone_id]
                changed = False
                changed_fields = {}

                # Check for incremental telemetry changes
                updates = {
                    'occupancy': occupancy,
                    'occupancyPercentage': occupancy_percentage,
                    'netFlow': z_data.get('netFlow', existing.netFlow),
                    'risk': z_data.get('risk', existing.risk)
                }

                for field, new_val in updates.items():
                    old_val = getattr(existing, field)
                    if new_val != old_val:
                        changed = True
                        changed_fields[field] = new_val
                        setattr(existing, field, new_val)

                if changed:
                    # Record a canonical ZoneTelemetry event and store it
                    telemetry = ZoneTelemetry(
                        zoneId=zone_id,
                        timestamp=datetime.now(timezone.utc),
                        occupancy=updates['occupancy'],
                        occupancyPercentage=updates['occupancyPercentage'],
                        netFlow=updates['netFlow'],
                        incoming=z_data.get('incoming', 0),
                        outgoing=z_data.get('outgoing', 0),
                        risk=updates['risk']
                    )
                    self.telemetry[zone_id] = telemetry

                    # We broadcast the incremental field updates under 'zone.updated'
                    # and potentially a 'telemetry.updated' event if needed.
                    await manager.broadcast_event('zone.updated', zone_id, changed_fields)
                    await manager.broadcast_event('telemetry.updated', zone_id, telemetry.model_dump())

state_manager = StateManager()
